using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Constants;
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

        // GET: api/admin/admindoctors
        [HttpGet]
        public async Task<ActionResult<DoctorListResponseDto>> GetDoctors(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? status = null,
            [FromQuery] string? specialty = null,
            [FromQuery] string? sortBy = "newest")
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
                        d.User.PhoneNumber.Contains(searchTerm) ||
                        d.User.Email.Contains(searchTerm)
                    );
                }

                // Status filter - using real Status field from User table
                if (!string.IsNullOrWhiteSpace(status))
                {
                    query = query.Where(d => d.User.Status == status);
                }

                // Specialty filter
                if (!string.IsNullOrWhiteSpace(specialty))
                {
                    query = query.Where(d => d.Specialty.Contains(specialty));
                }

                // Sorting
                query = sortBy?.ToLower() switch
                {
                    "oldest" => query.OrderBy(d => d.User.CreatedDate),
                    "name-asc" => query.OrderBy(d => d.FullName),
                    "name-desc" => query.OrderByDescending(d => d.FullName),
                    "rating" => query.OrderByDescending(d => d.Reviews.Any() ? d.Reviews.Average(r => r.Rating) : 0),
                    _ => query.OrderByDescending(d => d.User.CreatedDate) // newest
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
                        Specialty = d.Specialty,
                        Qualifications = d.Qualifications,
                        YearsOfExperience = d.YearsOfExperience,
                        LanguageSpoken = d.LanguageSpoken,
                        Location = d.Location,
                        Phone = d.User.PhoneNumber ?? "N/A",
                        Email = d.User.Email ?? "N/A",
                        Status = d.User.Status,
                        TotalAppointments = d.Appointments.Count,
                        AverageRating = d.Reviews.Any() ? d.Reviews.Average(r => r.Rating) : null,
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
                    Specialty = doctor.Specialty,
                    Qualifications = doctor.Qualifications,
                    YearsOfExperience = doctor.YearsOfExperience,
                    LanguageSpoken = doctor.LanguageSpoken,
                    Location = doctor.Location,
                    Phone = doctor.User.PhoneNumber ?? "N/A",
                    Email = doctor.User.Email ?? "N/A",
                    Status = doctor.User.Status,
                    TotalAppointments = doctor.Appointments.Count,
                    AverageRating = doctor.Reviews.Any() ? doctor.Reviews.Average(r => r.Rating) : null,
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

                // Track changes
                var changesMade = false;

                if (!string.IsNullOrWhiteSpace(dto.FullName) && doctor.FullName != dto.FullName)
                {
                    doctor.FullName = dto.FullName;
                    changesMade = true;
                }

                if (!string.IsNullOrWhiteSpace(dto.Specialty) && doctor.Specialty != dto.Specialty)
                {
                    doctor.Specialty = dto.Specialty;
                    changesMade = true;
                }

                if (!string.IsNullOrWhiteSpace(dto.Qualifications) && doctor.Qualifications != dto.Qualifications)
                {
                    doctor.Qualifications = dto.Qualifications;
                    changesMade = true;
                }

                if (dto.YearsOfExperience.HasValue && doctor.YearsOfExperience != dto.YearsOfExperience)
                {
                    doctor.YearsOfExperience = dto.YearsOfExperience;
                    changesMade = true;
                }

                if (!string.IsNullOrWhiteSpace(dto.LanguageSpoken) && doctor.LanguageSpoken != dto.LanguageSpoken)
                {
                    doctor.LanguageSpoken = dto.LanguageSpoken;
                    changesMade = true;
                }

                if (!string.IsNullOrWhiteSpace(dto.Location) && doctor.Location != dto.Location)
                {
                    doctor.Location = dto.Location;
                    changesMade = true;
                }

                if (!string.IsNullOrWhiteSpace(dto.PhoneNumber) && doctor.User.PhoneNumber != dto.PhoneNumber)
                {
                    doctor.User.PhoneNumber = dto.PhoneNumber;
                    changesMade = true;
                }

                if (!changesMade)
                {
                    return BadRequest(new
                    {
                        error = "No changes detected",
                        details = "The data you submitted is identical to the current data in database"
                    });
                }

                _context.Entry(doctor).State = EntityState.Modified;
                var affectedRows = await _context.SaveChangesAsync();

                if (affectedRows == 0)
                {
                    return StatusCode(500, new
                    {
                        error = "Update failed",
                        details = "No rows were affected. The data might not have been saved to the database."
                    });
                }

                return Ok(new
                {
                    message = "Doctor updated successfully",
                    affectedRows,
                    changesMade = true
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while updating doctor", details = ex.Message });
            }
        }

        // PUT: api/admin/admindoctors/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateDoctorStatus(string id, [FromBody] UpdateDoctorStatusDto dto)
        {
            try
            {
                // Validate status value
                if (!UserStatusConstants.IsValidStatus(dto.Status))
                {
                    return BadRequest(new
                    {
                        error = "Invalid status value",
                        details = $"Status must be one of: {string.Join(", ", UserStatusConstants.AllStatuses)}"
                    });
                }

                var doctor = await _context.Doctors
                    .Include(d => d.User)
                    .FirstOrDefaultAsync(d => d.DoctorID == id);

                if (doctor == null)
                {
                    return NotFound(new { error = "Doctor not found" });
                }

                // Update status
                doctor.User.Status = dto.Status;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Doctor status updated successfully",
                    status = dto.Status
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while updating doctor status", details = ex.Message });
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

                // Delete related records first
                var appointments = await _context.Appointments
                    .Where(a => a.DoctorID == id)
                    .ToListAsync();
                _context.Appointments.RemoveRange(appointments);

                var reviews = await _context.Reviews
                    .Where(r => r.DoctorID == id)
                    .ToListAsync();
                _context.Reviews.RemoveRange(reviews);

                // Delete doctor
                _context.Doctors.Remove(doctor);
                await _context.SaveChangesAsync();

                // Delete user account
                if (doctor.User != null)
                {
                    await _userManager.DeleteAsync(doctor.User);
                }

                return Ok(new { message = "Doctor deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while deleting doctor", details = ex.Message });
            }
        }
    }
}
