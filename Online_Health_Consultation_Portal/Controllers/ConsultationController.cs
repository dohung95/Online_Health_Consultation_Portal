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
    public class ConsultationController_hiep : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<ConsultationController_hiep> _logger;

        public ConsultationController_hiep(OHCPContext context, ILogger<ConsultationController_hiep> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Consultation
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Consultation>>> GetConsultations()
        {
            try
            {
                var consultations = await _context.Consultations
                    .Include(c => c.Appointment)
                    .ToListAsync();
                return Ok(consultations);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting consultations: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Consultation/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Consultation>> GetConsultation(int id)
        {
            try
            {
                var consultation = await _context.Consultations
                    .Include(c => c.Appointment)
                        .ThenInclude(a => a.Patient)
                    .Include(c => c.Appointment)
                        .ThenInclude(a => a.Doctor)
                    .FirstOrDefaultAsync(c => c.ConsultationID == id);

                if (consultation == null)
                {
                    return NotFound($"Consultation with ID {id} not found");
                }

                return Ok(consultation);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting consultation {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Consultation
        [HttpPost]
        public async Task<ActionResult<Consultation>> CreateConsultation([FromBody] Consultation consultation)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _context.Consultations.Add(consultation);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetConsultation), new { id = consultation.ConsultationID }, consultation);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating consultation: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Consultation/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateConsultation(int id, [FromBody] Consultation consultation)
        {
            try
            {
                if (id != consultation.ConsultationID)
                {
                    return BadRequest("Consultation ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingConsultation = await _context.Consultations.FindAsync(id);
                if (existingConsultation == null)
                {
                    return NotFound($"Consultation with ID {id} not found");
                }

                existingConsultation.AppointmentID = consultation.AppointmentID;
                existingConsultation.StartTime = consultation.StartTime;
                existingConsultation.EndTime = consultation.EndTime;
                existingConsultation.DoctorNotes = consultation.DoctorNotes;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating consultation {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Consultation/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteConsultation(int id)
        {
            try
            {
                var consultation = await _context.Consultations.FindAsync(id);
                if (consultation == null)
                {
                    return NotFound($"Consultation with ID {id} not found");
                }

                _context.Consultations.Remove(consultation);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting consultation {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
