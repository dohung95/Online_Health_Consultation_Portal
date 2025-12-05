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
    public class ConsultationController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<ConsultationController> _logger;

        public ConsultationController(OHCPContext context, ILogger<ConsultationController> logger)
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

                // Check if consultation already exists for this appointment
                var existingConsultation = await _context.Consultations
                    .AsNoTracking()
                    .FirstOrDefaultAsync(c => c.AppointmentID == consultation.AppointmentID);

                if (existingConsultation != null)
                {
                    // Update existing consultation - need to fetch with tracking
                    var consultationToUpdate = await _context.Consultations
                        .FirstOrDefaultAsync(c => c.ConsultationID == existingConsultation.ConsultationID);

                    if (consultationToUpdate != null)
                    {
                        consultationToUpdate.StartTime = consultation.StartTime;
                        consultationToUpdate.EndTime = consultation.EndTime;
                        consultationToUpdate.DoctorNotes = consultation.DoctorNotes;
                        consultationToUpdate.FollowUpDate = consultation.FollowUpDate;

                        await _context.SaveChangesAsync();
                        
                        _logger.LogInformation($"Updated existing consultation {consultationToUpdate.ConsultationID} for appointment {consultation.AppointmentID}");
                        return Ok(consultationToUpdate);
                    }
                }

                // Create new consultation
                _context.Consultations.Add(consultation);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Created new consultation {consultation.ConsultationID} for appointment {consultation.AppointmentID}");
                return CreatedAtAction(nameof(GetConsultation), new { id = consultation.ConsultationID }, consultation);
            }
            catch (DbUpdateException dbEx)
            {
                // Handle duplicate key error specifically
                if (dbEx.InnerException?.Message.Contains("duplicate key") == true)
                {
                    _logger.LogWarning($"Duplicate consultation detected for appointment {consultation.AppointmentID}. Attempting to update instead.");
                    
                    // Try to get and update the existing one
                    var existing = await _context.Consultations
                        .FirstOrDefaultAsync(c => c.AppointmentID == consultation.AppointmentID);
                    
                    if (existing != null)
                    {
                        existing.DoctorNotes = consultation.DoctorNotes;
                        existing.StartTime = consultation.StartTime;
                        existing.EndTime = consultation.EndTime;
                        existing.FollowUpDate = consultation.FollowUpDate;
                        
                        await _context.SaveChangesAsync();
                        return Ok(existing);
                    }
                    
                    return Conflict("Consultation already exists for this appointment but could not be updated.");
                }
                
                _logger.LogError($"Database error creating consultation: {dbEx.Message}");
                _logger.LogError($"Inner exception: {dbEx.InnerException?.Message}");
                return StatusCode(500, $"Database error: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating consultation: {ex.Message}");
                _logger.LogError($"Exception details: {ex.InnerException?.Message}");
                return StatusCode(500, $"Internal server error: {ex.Message}");
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
