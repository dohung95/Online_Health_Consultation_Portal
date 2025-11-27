using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Dtos;
using OHCP_BK.Models;

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

        // 1. PUBLIC API: SEARCH (pagination)
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<ActionResult<PagedResult<DoctorDetailDTO>>> SearchDoctors([FromQuery] DoctorFilterInputDTO search)
        {
            try
            {
                var result = await GetPagedDoctorsAsync(search);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error searching doctors: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // 2. PUBLIC API: GET DETAIL
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

        // GET: api/Doctor
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

        // 4. PRIVATE HELPER METHODS (Logic private)
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
                    Reviews = null // List reviews not need load
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

        // 5. PUBLIC API: GET ALL (no pagination)
        [HttpGet("all")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<DoctorDetailDTO>>> GetAllDoctorsForDropdown()
        {
            try
            {
                var doctors = await _context.Doctors
                    .Select(d => new DoctorDetailDTO
                    {
                        DoctorID = d.DoctorID,
                        FullName = d.FullName,
                        Specialty = d.Specialty,
                        // Location = d.Location 
                    })
                    .ToListAsync();

                return Ok(doctors);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting all doctors: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}