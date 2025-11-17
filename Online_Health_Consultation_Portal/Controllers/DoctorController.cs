using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Models;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DoctorController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<DoctorController> _logger;

        public DoctorController(OHCPContext context, ILogger<DoctorController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Doctor
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Doctor>>> GetDoctors()
        {
            try
            {
                var doctors = await _context.Doctors
                    .Include(d => d.User)
                    .ToListAsync();
                return Ok(doctors);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting doctors: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Doctor/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Doctor>> GetDoctor(string id)
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
                    return NotFound($"Doctor with ID {id} not found");
                }

                return Ok(doctor);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting doctor {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // NOTE: Doctor account creation is handled by admin only:
        // - Admin creation: POST /api/Admin/create/doctor [Authorize(Roles="admin")]
        // This controller only handles CRUD operations on existing doctor profiles

        // PUT: api/Doctor/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDoctor(string id, [FromBody] Doctor doctor)
        {
            try
            {
                if (id != doctor.DoctorID)
                {
                    return BadRequest("Doctor ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingDoctor = await _context.Doctors.FindAsync(id);
                if (existingDoctor == null)
                {
                    return NotFound($"Doctor with ID {id} not found");
                }

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
                if (doctor == null)
                {
                    return NotFound($"Doctor with ID {id} not found");
                }

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
    }
}
