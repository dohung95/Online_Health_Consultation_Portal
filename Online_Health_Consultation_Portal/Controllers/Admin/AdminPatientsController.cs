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
                        Gender = p.Gender ?? "N/A",
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
                        Address = p.Address,
                        City = p.City,
                        Country = p.Country,
                        BloodType = p.BloodType,
                        EmergencyContactName = p.EmergencyContactName,
                        EmergencyContactPhone = p.EmergencyContactPhone,
                        EmergencyContactRelationship = p.EmergencyContactRelationship,
                        PreferredLanguage = p.PreferredLanguage,
                        PreferredContactMethod = p.PreferredContactMethod,
                        Occupation = p.Occupation,
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
                    Gender = patient.Gender ?? "N/A",
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
                    Address = patient.Address,
                    City = patient.City,
                    Country = patient.Country,
                    BloodType = patient.BloodType,
                    EmergencyContactName = patient.EmergencyContactName,
                    EmergencyContactPhone = patient.EmergencyContactPhone,
                    EmergencyContactRelationship = patient.EmergencyContactRelationship,
                    PreferredLanguage = patient.PreferredLanguage,
                    PreferredContactMethod = patient.PreferredContactMethod,
                    Occupation = patient.Occupation,
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

                // Normalize empty strings to null for nullable fields to avoid null vs "" comparison issues
                dto.Gender = string.IsNullOrWhiteSpace(dto.Gender) ? null : dto.Gender;
                dto.BloodType = string.IsNullOrWhiteSpace(dto.BloodType) ? null : dto.BloodType;
                dto.Occupation = string.IsNullOrWhiteSpace(dto.Occupation) ? null : dto.Occupation;
                dto.Address = string.IsNullOrWhiteSpace(dto.Address) ? null : dto.Address;
                dto.City = string.IsNullOrWhiteSpace(dto.City) ? null : dto.City;
                dto.Country = string.IsNullOrWhiteSpace(dto.Country) ? null : dto.Country;
                dto.EmergencyContactName = string.IsNullOrWhiteSpace(dto.EmergencyContactName) ? null : dto.EmergencyContactName;
                dto.EmergencyContactPhone = string.IsNullOrWhiteSpace(dto.EmergencyContactPhone) ? null : dto.EmergencyContactPhone;
                dto.EmergencyContactRelationship = string.IsNullOrWhiteSpace(dto.EmergencyContactRelationship) ? null : dto.EmergencyContactRelationship;
                dto.PreferredLanguage = string.IsNullOrWhiteSpace(dto.PreferredLanguage) ? null : dto.PreferredLanguage;
                dto.PreferredContactMethod = string.IsNullOrWhiteSpace(dto.PreferredContactMethod) ? null : dto.PreferredContactMethod;
                dto.MedicalHistorySummary = string.IsNullOrWhiteSpace(dto.MedicalHistorySummary) ? null : dto.MedicalHistorySummary;
                dto.InsuranceProvider = string.IsNullOrWhiteSpace(dto.InsuranceProvider) ? null : dto.InsuranceProvider;
                dto.InsurancePolicyNumber = string.IsNullOrWhiteSpace(dto.InsurancePolicyNumber) ? null : dto.InsurancePolicyNumber;

                // Track changes for debugging
                var changesMade = false;

                // Update patient info - always update even if null to allow clearing values
                if (!string.IsNullOrWhiteSpace(dto.FullName) && patient.FullName != dto.FullName)
                {
                    patient.FullName = dto.FullName;
                    changesMade = true;
                }

                if (dto.DateOfBirth.HasValue && patient.DateOfBirth != dto.DateOfBirth)
                {
                    patient.DateOfBirth = dto.DateOfBirth;
                    changesMade = true;
                }

                if (patient.Gender != dto.Gender)
                {
                    patient.Gender = dto.Gender;
                    changesMade = true;
                }

                if (patient.MedicalHistorySummary != dto.MedicalHistorySummary)
                {
                    patient.MedicalHistorySummary = dto.MedicalHistorySummary;
                    changesMade = true;
                }

                if (patient.InsuranceProvider != dto.InsuranceProvider)
                {
                    patient.InsuranceProvider = dto.InsuranceProvider;
                    changesMade = true;
                }

                if (patient.InsurancePolicyNumber != dto.InsurancePolicyNumber)
                {
                    patient.InsurancePolicyNumber = dto.InsurancePolicyNumber;
                    changesMade = true;
                }

                if (patient.Address != dto.Address)
                {
                    patient.Address = dto.Address;
                    changesMade = true;
                }

                if (patient.City != dto.City)
                {
                    patient.City = dto.City;
                    changesMade = true;
                }

                if (patient.Country != dto.Country)
                {
                    patient.Country = dto.Country;
                    changesMade = true;
                }

                if (patient.BloodType != dto.BloodType)
                {
                    patient.BloodType = dto.BloodType;
                    changesMade = true;
                }

                if (patient.EmergencyContactName != dto.EmergencyContactName)
                {
                    patient.EmergencyContactName = dto.EmergencyContactName;
                    changesMade = true;
                }

                if (patient.EmergencyContactPhone != dto.EmergencyContactPhone)
                {
                    patient.EmergencyContactPhone = dto.EmergencyContactPhone;
                    changesMade = true;
                }

                if (patient.EmergencyContactRelationship != dto.EmergencyContactRelationship)
                {
                    patient.EmergencyContactRelationship = dto.EmergencyContactRelationship;
                    changesMade = true;
                }

                if (patient.PreferredLanguage != dto.PreferredLanguage)
                {
                    patient.PreferredLanguage = dto.PreferredLanguage;
                    changesMade = true;
                }

                if (patient.PreferredContactMethod != dto.PreferredContactMethod)
                {
                    patient.PreferredContactMethod = dto.PreferredContactMethod;
                    changesMade = true;
                }

                if (patient.Occupation != dto.Occupation)
                {
                    patient.Occupation = dto.Occupation;
                    changesMade = true;
                }

                // Update user info
                if (!string.IsNullOrWhiteSpace(dto.PhoneNumber) && patient.User.PhoneNumber != dto.PhoneNumber)
                {
                    patient.User.PhoneNumber = dto.PhoneNumber;
                    changesMade = true;
                }

                if (!changesMade)
                {
                    return BadRequest(new {
                        error = "No changes detected",
                        details = "The data you submitted is identical to the current data in database"
                    });
                }

                // Explicitly mark as modified
                _context.Entry(patient).State = EntityState.Modified;

                var affectedRows = await _context.SaveChangesAsync();

                // Verify that changes were actually saved to database
                if (affectedRows == 0)
                {
                    return StatusCode(500, new {
                        error = "Update failed",
                        details = "No rows were affected. The data might not have been saved to the database.",
                        changesMade = true,
                        affectedRows = 0
                    });
                }

                return Ok(new {
                    message = "Patient updated successfully",
                    affectedRows,
                    changesMade = true
                });
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
