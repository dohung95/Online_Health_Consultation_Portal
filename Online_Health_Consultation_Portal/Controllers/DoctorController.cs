using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Dtos;
using OHCP_BK.Models;
using System.Security.Claims;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DoctorController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<DoctorController> _logger;

        public DoctorController(OHCPContext context, ILogger<DoctorController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // =============================================================
        // 1. PUBLIC API: SEARCH (?� s?a ?? d�ng logic Ph�n trang)
        // =============================================================
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResult<DoctorDetailDTO>>> SearchDoctors([FromQuery] DoctorFilterInputDTO search)
        {
            try
            {
                // G?i h�m ri�ng (private method) ? d??i ?? x? l�
                var result = await GetPagedDoctorsAsync(search);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error searching doctors: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // =============================================================
        // 2. PUBLIC API: GET DETAIL
        // =============================================================
        [HttpGet("{id}")]
        public async Task<ActionResult<DoctorDetailDTO>> GetDoctor(string id)
        {
            var doctor = await _context.Doctors
                .Include(d => d.Reviews).ThenInclude(r => r.Patient)
                .FirstOrDefaultAsync(d => d.DoctorID == id);

            if (doctor == null) return NotFound();

            return Ok(new DoctorDetailDTO
            {
                DoctorID = doctor.DoctorID,
                FullName = doctor.FullName,
                Specialty = doctor.Specialty,
                Qualifications = doctor.Qualifications,
                YearsOfExperience = doctor.YearsOfExperience,
                LanguageSpoken = doctor.LanguageSpoken,
                Location = doctor.Location,
                AverageRating = doctor.Reviews.Any() ? doctor.Reviews.Average(r => r.Rating) : 0,
                TotalReviews = doctor.Reviews.Count,
                Reviews = doctor.Reviews.Select(r => new ReviewDTO
                {
                    ReviewID = r.ReviewID,
                    PatientName = r.Patient?.FullName ?? "Hidden",
                    Rating = r.Rating,
                    Comment = r.Comment,
                    ReviewDate = r.ReviewDate
                }).ToList()
            });
        }

        // =============================================================
        // 2.1. AUTHENTICATED API: GET CURRENT DOCTOR
        // =============================================================
        [HttpGet("current")]
        [Authorize(Roles = "doctor")]
        public async Task<ActionResult<DoctorProfileDTO>> GetCurrentDoctor()
        {
            try
            {
                // Get user ID from claims
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                // Find doctor by user ID
                var doctor = await _context.Doctors
                    .Include(d => d.User)
                    .Include(d => d.Reviews)
                    .FirstOrDefaultAsync(d => d.DoctorID == userId);

                if (doctor == null)
                {
                    return NotFound("Doctor profile not found");
                }

                return Ok(new DoctorProfileDTO
                {
                    DoctorID = doctor.DoctorID,
                    FullName = doctor.FullName,
                    Email = doctor.User?.Email ?? "",
                    PhoneNumber = doctor.User?.PhoneNumber ?? "",
                    Specialty = doctor.Specialty,
                    Qualifications = doctor.Qualifications,
                    YearsOfExperience = doctor.YearsOfExperience,
                    LanguageSpoken = doctor.LanguageSpoken,
                    Location = doctor.Location,
                    AverageRating = doctor.Reviews.Any() ? doctor.Reviews.Average(r => r.Rating) : 0,
                    TotalReviews = doctor.Reviews.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting current doctor: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // =============================================================
        // 3. ADMIN API: CRUD (Gi? nguy�n cho Admin qu?n l�)
        // =============================================================

        // GET: api/Doctor (Danh s�ch th� cho Admin)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Doctor>>> GetDoctors()
        {
            try
            {
                var doctors = await _context.Doctors.Include(d => d.User).ToListAsync();
                return Ok(doctors);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting doctors: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Doctor/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDoctor(string id, [FromBody] Doctor doctor)
        {
            try
            {
                if (id != doctor.DoctorID) return BadRequest("Doctor ID mismatch");

                var existingDoctor = await _context.Doctors.FindAsync(id);
                if (existingDoctor == null) return NotFound($"Doctor with ID {id} not found");

                existingDoctor.FullName = doctor.FullName;
                existingDoctor.Qualifications = doctor.Qualifications;
                existingDoctor.Specialty = doctor.Specialty;
                existingDoctor.YearsOfExperience = doctor.YearsOfExperience;
                existingDoctor.LanguageSpoken = doctor.LanguageSpoken;
                existingDoctor.Location = doctor.Location;

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating doctor {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Doctor/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDoctor(string id)
        {
            try
            {
                var doctor = await _context.Doctors.FindAsync(id);
                if (doctor == null) return NotFound($"Doctor with ID {id} not found");

                _context.Doctors.Remove(doctor);
                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting doctor {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // =============================================================
        // 4. PRIVATE HELPER METHODS (Logic x? l� t�ch bi?t)
        // =============================================================
        private async Task<PagedResult<DoctorDetailDTO>> GetPagedDoctorsAsync(DoctorFilterInputDTO search)
        {
            var query = _context.Doctors.Include(d => d.Reviews).AsQueryable();

            // 1. Filter
            if (!string.IsNullOrEmpty(search.Specialty)) query = query.Where(d => d.Specialty.Contains(search.Specialty));
            if (!string.IsNullOrEmpty(search.Name)) query = query.Where(d => d.FullName.Contains(search.Name));
            if (!string.IsNullOrEmpty(search.Location)) query = query.Where(d => d.Location.Contains(search.Location));
            if (!string.IsNullOrEmpty(search.Language)) query = query.Where(d => d.LanguageSpoken.Contains(search.Language));

            // 2. Pagination
            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((search.Page - 1) * search.PageSize)
                .Take(search.PageSize)
                .Select(d => new DoctorDetailDTO
                {
                    DoctorID = d.DoctorID,
                    FullName = d.FullName,
                    Specialty = d.Specialty,
                    Qualifications = d.Qualifications,
                    YearsOfExperience = d.YearsOfExperience,
                    LanguageSpoken = d.LanguageSpoken,
                    Location = d.Location,
                    AverageRating = d.Reviews.Any() ? d.Reviews.Average(r => r.Rating) : 0,
                    TotalReviews = d.Reviews.Count,
                    Reviews = null // Danh s�ch t?ng qu�t kh�ng c?n load t?ng review
                }).ToListAsync();

            return new PagedResult<DoctorDetailDTO>
            {
                Items = items,
                TotalItems = totalCount,
                Page = search.Page,
                PageSize = search.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)search.PageSize)
            };
        }

        // =============================================================
        // 5. PUBLIC API: GET ALL (D�nh cho Dropdown ??t l?ch)
        // Kh�ng ph�n trang, ch? l?y ID, Name, Specialty ?? nh? d? li?u
        // =============================================================
        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<DoctorDetailDTO>>> GetAllDoctorsForDropdown()
        {
            try
            {
                var doctors = await _context.Doctors
                    .Select(d => new DoctorDetailDTO // Ch? l?y th�ng tin c?n thi?t
                    {
                        DoctorID = d.DoctorID,
                        FullName = d.FullName,
                        Specialty = d.Specialty,
                        // C�c tr??ng kh�c c� th? ?? null ho?c default cho nh?
                        // Location = d.Location 
                    })
                    .ToListAsync();

                return Ok(doctors); // Tr? v? M?ng [] tr?c ti?p, kh�ng b?c PagedResult
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all doctors: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}