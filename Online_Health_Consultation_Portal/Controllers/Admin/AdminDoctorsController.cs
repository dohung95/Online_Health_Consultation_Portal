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
    public class AdminDoctorsController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly UserManager<AppUser> _userManager;

        public AdminDoctorsController(OHCPContext context, UserManager<AppUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        // GET: api/admin/admindoctors/stats
        [HttpGet("stats")]
        public async Task<ActionResult<DoctorStatsDto>> GetDoctorStats()
        {
            try
            {
                var totalDoctors = await _context.Doctors.CountAsync();
                var today = DateTime.Today;

                // Doctors with appointments today are considered "on duty"
                var onDutyToday = await _context.Doctors
                    .Where(d => d.Appointments.Any(a =>
                        a.AppointmentTime.Date == today &&
                        a.Status != "Cancelled"))
                    .CountAsync();

                // New doctors this month
                var startOfMonth = new DateTime(today.Year, today.Month, 1);
                var newThisMonth = await _context.Doctors
                    .Include(d => d.User)
                    .Where(d => d.User.CreatedDate >= startOfMonth)
                    .CountAsync();

                // Assume "on leave" as doctors with no appointments in the last 7 days
                var sevenDaysAgo = today.AddDays(-7);
                var onLeave = await _context.Doctors
                    .Where(d => !d.Appointments.Any(a =>
                        a.AppointmentTime >= sevenDaysAgo &&
                        a.Status != "Cancelled"))
                    .CountAsync();

                return Ok(new DoctorStatsDto
                {
                    TotalDoctors = totalDoctors,
                    OnDutyToday = onDutyToday,
                    OnLeave = onLeave,
                    NewThisMonth = newThisMonth
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching stats", details = ex.Message });
            }
        }

        // GET: api/admin/admindoctors
        [HttpGet]
        public async Task<ActionResult<DoctorListResponseDto>> GetDoctors(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? specialty = null,
            [FromQuery] string? status = null,
            [FromQuery] string? sortBy = "name")
        {
            try
            {
                var query = _context.Doctors
                    .Include(d => d.User)
                    .Include(d => d.Appointments)
                    .Include(d => d.Reviews)
                    .AsQueryable();

                // Search filter
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(d =>
                        d.FullName.Contains(searchTerm) ||
                        d.DoctorID.Contains(searchTerm) ||
                        d.Specialty.Contains(searchTerm) ||
                        d.User.Email.Contains(searchTerm)
                    );
                }

                // Specialty filter
                if (!string.IsNullOrWhiteSpace(specialty) && specialty != "All Departments")
                {
                    query = query.Where(d => d.Specialty == specialty);
                }

                // Status filter
                if (!string.IsNullOrWhiteSpace(status))
                {
                    var today = DateTime.Today;
                    var sevenDaysAgo = today.AddDays(-7);

                    if (status.ToLower() == "active")
                    {
                        query = query.Where(d => d.Appointments.Any(a =>
                            a.AppointmentTime >= sevenDaysAgo &&
                            a.Status != "Cancelled"));
                    }
                    else if (status.ToLower() == "on leave")
                    {
                        query = query.Where(d => !d.Appointments.Any(a =>
                            a.AppointmentTime >= sevenDaysAgo &&
                            a.Status != "Cancelled"));
                    }
                }

                // Sorting
                query = sortBy?.ToLower() switch
                {
                    "experience" => query.OrderByDescending(d => d.YearsOfExperience),
                    "rating" => query.OrderByDescending(d => d.Reviews.Any() ? d.Reviews.Average(r => r.Rating) : 0),
                    _ => query.OrderBy(d => d.FullName) // name
                };

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var doctors = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(d => new DoctorAdminDto
                    {
                        DoctorID = d.DoctorID,
                        FullName = d.FullName,
                        Email = d.User.Email ?? "N/A",
                        Phone = d.User.PhoneNumber ?? "N/A",
                        Specialty = d.Specialty,
                        Qualifications = d.Qualifications,
                        YearsOfExperience = d.YearsOfExperience,
                        LanguageSpoken = d.LanguageSpoken,
                        Location = d.Location,
                        Status = d.Appointments.Any(a =>
                            a.AppointmentTime >= DateTime.Today.AddDays(-7) &&
                            a.Status != "Cancelled")
                            ? "Active"
                            : "On Leave",
                        TotalPatients = d.Appointments
                            .Select(a => a.PatientID)
                            .Distinct()
                            .Count(),
                        AverageRating = d.Reviews.Any()
                            ? Math.Round(d.Reviews.Average(r => r.Rating), 1)
                            : 0,
                        TotalReviews = d.Reviews.Count,
                        CreatedDate = d.User.CreatedDate
                    })
                    .ToListAsync();

                return Ok(new DoctorListResponseDto
                {
                    Doctors = doctors,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalPages = totalPages
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching doctors", details = ex.Message });
            }
        }

        // GET: api/admin/admindoctors/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<DoctorAdminDto>> GetDoctor(string id)
        {
            try
            {
                var doctor = await _context.Doctors
                    .Include(d => d.User)
                    .Include(d => d.Appointments)
                    .Include(d => d.Reviews)
                    .FirstOrDefaultAsync(d => d.DoctorID == id);

                if (doctor == null)
                {
                    return NotFound(new { error = "Doctor not found" });
                }

                var doctorDto = new DoctorAdminDto
                {
                    DoctorID = doctor.DoctorID,
                    FullName = doctor.FullName,
                    Email = doctor.User.Email ?? "N/A",
                    Phone = doctor.User.PhoneNumber ?? "N/A",
                    Specialty = doctor.Specialty,
                    Qualifications = doctor.Qualifications,
                    YearsOfExperience = doctor.YearsOfExperience,
                    LanguageSpoken = doctor.LanguageSpoken,
                    Location = doctor.Location,
                    Status = doctor.Appointments.Any(a =>
                        a.AppointmentTime >= DateTime.Today.AddDays(-7) &&
                        a.Status != "Cancelled")
                        ? "Active"
                        : "On Leave",
                    TotalPatients = doctor.Appointments
                        .Select(a => a.PatientID)
                        .Distinct()
                        .Count(),
                    AverageRating = doctor.Reviews.Any()
                        ? Math.Round(doctor.Reviews.Average(r => r.Rating), 1)
                        : 0,
                    TotalReviews = doctor.Reviews.Count,
                    CreatedDate = doctor.User.CreatedDate
                };

                return Ok(doctorDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching doctor", details = ex.Message });
            }
        }

        // POST: api/admin/admindoctors
        [HttpPost]
        public async Task<ActionResult<DoctorAdminDto>> CreateDoctor(CreateDoctorAdminDto dto)
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

                // Assign doctor role
                await _userManager.AddToRoleAsync(user, "doctor");

                // Create doctor profile
                var doctor = new Doctor
                {
                    DoctorID = user.Id,
                    FullName = dto.FullName,
                    Specialty = dto.Specialty,
                    Qualifications = dto.Qualifications,
                    YearsOfExperience = dto.YearsOfExperience,
                    LanguageSpoken = dto.LanguageSpoken,
                    Location = dto.Location
                };

                _context.Doctors.Add(doctor);
                await _context.SaveChangesAsync();

                var doctorDto = new DoctorAdminDto
                {
                    DoctorID = doctor.DoctorID,
                    FullName = doctor.FullName,
                    Email = user.Email ?? "N/A",
                    Phone = user.PhoneNumber ?? "N/A",
                    Specialty = doctor.Specialty,
                    Qualifications = doctor.Qualifications,
                    YearsOfExperience = doctor.YearsOfExperience,
                    LanguageSpoken = doctor.LanguageSpoken,
                    Location = doctor.Location,
                    Status = "Active",
                    TotalPatients = 0,
                    AverageRating = 0,
                    TotalReviews = 0,
                    CreatedDate = user.CreatedDate
                };

                return CreatedAtAction(nameof(GetDoctor), new { id = doctor.DoctorID }, doctorDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while creating doctor", details = ex.Message });
            }
        }

        // PUT: api/admin/admindoctors/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDoctor(string id, UpdateDoctorAdminDto dto)
        {
            try
            {
                var doctor = await _context.Doctors
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(d => d.DoctorID == id);

                if (doctor == null)
                {
                    return NotFound(new { error = "Doctor not found" });
                }

                // Update doctor info
                doctor.FullName = dto.FullName;
                doctor.Specialty = dto.Specialty;
                doctor.Qualifications = dto.Qualifications;
                doctor.YearsOfExperience = dto.YearsOfExperience;
                doctor.LanguageSpoken = dto.LanguageSpoken;
                doctor.Location = dto.Location;

                // Update user info
                doctor.User.PhoneNumber = dto.PhoneNumber;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Doctor updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while updating doctor", details = ex.Message });
            }
        }

        // DELETE: api/admin/admindoctors/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDoctor(string id)
        {
            try
            {
                var doctor = await _context.Doctors
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(d => d.DoctorID == id);

                if (doctor == null)
                {
                    return NotFound(new { error = "Doctor not found" });
                }

                // Delete doctor
                _context.Doctors.Remove(doctor);

                // Delete user
                await _userManager.DeleteAsync(doctor.User);

                await _context.SaveChangesAsync();

                return Ok(new { message = "Doctor deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while deleting doctor", details = ex.Message });
            }
        }
    }
}
