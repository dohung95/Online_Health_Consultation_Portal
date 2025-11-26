using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.DTOs.Admin;
using OHCP_BK.Models;

namespace OHCP_BK.Controllers.Admin
{
    [Route("api/admin/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminPatientsController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly UserManager<AppUser> _userManager;

        public AdminPatientsController(OHCPContext context, UserManager<AppUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/admin/adminpatients
        [HttpGet]
        public async Task<ActionResult<PatientListResponseDto>> GetPatients(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? status = null,
            [FromQuery] string? sortBy = "newest")
        {
            try
            {
                var query = _context.Patients
                    .Include(p => p.User)
                    .Include(p => p.Appointments)
                    .AsQueryable();

                // Search filter
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(p =>
                        p.FullName.Contains(searchTerm) ||
                        p.PatientID.Contains(searchTerm) ||
                        p.User.PhoneNumber.Contains(searchTerm) ||
                        p.User.Email.Contains(searchTerm)
                    );
                }

                // Status filter (assuming active means has recent appointments)
                if (!string.IsNullOrWhiteSpace(status))
                {
                    if (status.ToLower() == "active")
                    {
                        query = query.Where(p => p.Appointments.Any(a => a.AppointmentTime > DateTime.Now.AddMonths(-3)));
                    }
                    else if (status.ToLower() == "inactive")
                    {
                        query = query.Where(p => !p.Appointments.Any(a => a.AppointmentTime > DateTime.Now.AddMonths(-3)));
                    }
                }

                // Sorting
                query = sortBy?.ToLower() switch
                {
                    "oldest" => query.OrderBy(p => p.User.CreatedDate),
                    "name-asc" => query.OrderBy(p => p.FullName),
                    "name-desc" => query.OrderByDescending(p => p.FullName),
                    _ => query.OrderByDescending(p => p.User.CreatedDate) // newest
                };

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var patients = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(p => new PatientAdminDto
                    {
                        PatientID = p.PatientID,
                        FullName = p.FullName,
                        Age = p.DateOfBirth.HasValue
                            ? DateTime.Now.Year - p.DateOfBirth.Value.Year
                            : 0,
                        Gender = "N/A", // You can add Gender field to Patient model if needed
                        Phone = p.User.PhoneNumber ?? "N/A",
                        Email = p.User.Email ?? "N/A",
                        DateOfBirth = p.DateOfBirth,
                        LastVisit = p.Appointments
                            .Where(a => a.Status == "Completed")
                            .OrderByDescending(a => a.AppointmentTime)
                            .Select(a => a.AppointmentTime.ToString("yyyy-MM-dd"))
                            .FirstOrDefault(),
                        Status = p.Appointments.Any(a => a.AppointmentTime > DateTime.Now.AddMonths(-3))
                            ? "Active"
                            : "Inactive",
                        MedicalHistorySummary = p.MedicalHistorySummary,
                        InsuranceProvider = p.InsuranceProvider,
                        InsurancePolicyNumber = p.InsurancePolicyNumber,
                        CreatedDate = p.User.CreatedDate
                    })
                    .ToListAsync();

                return Ok(new PatientListResponseDto
                {
                    Patients = patients,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalPages = totalPages
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching patients", details = ex.Message });
            }
        }

        // GET: api/admin/adminpatients/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PatientAdminDto>> GetPatient(string id)
        {
            try
            {
                var patient = await _context.Patients
                    .Include(p => p.User)
                    .Include(p => p.Appointments)
                    .FirstOrDefaultAsync(p => p.PatientID == id);

                if (patient == null)
                {
                    return NotFound(new { error = "Patient not found" });
                }

                var patientDto = new PatientAdminDto
                {
                    PatientID = patient.PatientID,
                    FullName = patient.FullName,
                    Age = patient.DateOfBirth.HasValue
                        ? DateTime.Now.Year - patient.DateOfBirth.Value.Year
                        : 0,
                    Gender = "N/A",
                    Phone = patient.User.PhoneNumber ?? "N/A",
                    Email = patient.User.Email ?? "N/A",
                    DateOfBirth = patient.DateOfBirth,
                    LastVisit = patient.Appointments
                        .Where(a => a.Status == "Completed")
                        .OrderByDescending(a => a.AppointmentTime)
                        .Select(a => a.AppointmentTime.ToString("yyyy-MM-dd"))
                        .FirstOrDefault(),
                    Status = patient.Appointments.Any(a => a.AppointmentTime > DateTime.Now.AddMonths(-3))
                        ? "Active"
                        : "Inactive",
                    MedicalHistorySummary = patient.MedicalHistorySummary,
                    InsuranceProvider = patient.InsuranceProvider,
                    InsurancePolicyNumber = patient.InsurancePolicyNumber,
                    CreatedDate = patient.User.CreatedDate
                };

                return Ok(patientDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching patient", details = ex.Message });
            }
        }

        // POST: api/admin/adminpatients
        [HttpPost]
        public async Task<ActionResult<PatientAdminDto>> CreatePatient(CreatePatientAdminDto dto)
        {
            try
            {
                // Check if email already exists
                var existingUser = await _userManager.FindByEmailAsync(dto.Email);
                if (existingUser != null)
                {
                    return BadRequest(new { error = "Email already exists" });
                }

                // Create user
                var user = new AppUser
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    PhoneNumber = dto.PhoneNumber,
                    EmailConfirmed = true,
                    PhoneNumberConfirmed = true,
                    CreatedDate = DateTime.Now
                };

                var result = await _userManager.CreateAsync(user, dto.Password);

                if (!result.Succeeded)
                {
                    return BadRequest(new { error = "Failed to create user", details = result.Errors });
                }

                // Assign patient role
                await _userManager.AddToRoleAsync(user, "patient");

                // Create patient profile
                var patient = new Patient
                {
                    PatientID = user.Id,
                    FullName = dto.FullName,
                    DateOfBirth = dto.DateOfBirth,
                    MedicalHistorySummary = dto.MedicalHistorySummary,
                    InsuranceProvider = dto.InsuranceProvider,
                    InsurancePolicyNumber = dto.InsurancePolicyNumber
                };

                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();

                var patientDto = new PatientAdminDto
                {
                    PatientID = patient.PatientID,
                    FullName = patient.FullName,
                    Age = patient.DateOfBirth.HasValue
                        ? DateTime.Now.Year - patient.DateOfBirth.Value.Year
                        : 0,
                    Gender = "N/A",
                    Phone = user.PhoneNumber ?? "N/A",
                    Email = user.Email ?? "N/A",
                    DateOfBirth = patient.DateOfBirth,
                    Status = "Active",
                    MedicalHistorySummary = patient.MedicalHistorySummary,
                    InsuranceProvider = patient.InsuranceProvider,
                    InsurancePolicyNumber = patient.InsurancePolicyNumber,
                    CreatedDate = user.CreatedDate
                };

                return CreatedAtAction(nameof(GetPatient), new { id = patient.PatientID }, patientDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while creating patient", details = ex.Message });
            }
        }

        // PUT: api/admin/adminpatients/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePatient(string id, UpdatePatientAdminDto dto)
        {
            try
            {
                var patient = await _context.Patients
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.PatientID == id);

                if (patient == null)
                {
                    return NotFound(new { error = "Patient not found" });
                }

                // Update patient info
                patient.FullName = dto.FullName;
                patient.DateOfBirth = dto.DateOfBirth;
                patient.MedicalHistorySummary = dto.MedicalHistorySummary;
                patient.InsuranceProvider = dto.InsuranceProvider;
                patient.InsurancePolicyNumber = dto.InsurancePolicyNumber;

                // Update user info
                patient.User.PhoneNumber = dto.PhoneNumber;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Patient updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while updating patient", details = ex.Message });
            }
        }

        // DELETE: api/admin/adminpatients/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePatient(string id)
        {
            try
            {
                var patient = await _context.Patients
                    .Include(p => p.User)
                    .FirstOrDefaultAsync(p => p.PatientID == id);

                if (patient == null)
                {
                    return NotFound(new { error = "Patient not found" });
                }

                // Delete related records first to avoid foreign key constraint violations
                // Delete health records
                var healthRecords = await _context.HealthRecords
                    .Where(hr => hr.PatientID == id)
                    .ToListAsync();
                _context.HealthRecords.RemoveRange(healthRecords);

                // Delete invoices
                var invoices = await _context.Invoices
                    .Where(i => i.PatientID == id)
                    .ToListAsync();
                _context.Invoices.RemoveRange(invoices);

                // Delete appointments
                var appointments = await _context.Appointments
                    .Where(a => a.PatientID == id)
                    .ToListAsync();
                _context.Appointments.RemoveRange(appointments);

                // Delete reviews
                var reviews = await _context.Reviews
                    .Where(r => r.PatientID == id)
                    .ToListAsync();
                _context.Reviews.RemoveRange(reviews);

                // Now delete patient
                _context.Patients.Remove(patient);

                // Save changes before deleting user
                await _context.SaveChangesAsync();

                // Delete user account
                if (patient.User != null)
                {
                    await _userManager.DeleteAsync(patient.User);
                }

                return Ok(new { message = "Patient deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while deleting patient", details = ex.Message });
            }
        }
    }
}
