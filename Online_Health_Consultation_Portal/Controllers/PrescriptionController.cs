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
    public class PrescriptionController_hiep : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<PrescriptionController_hiep> _logger;

        public PrescriptionController_hiep(OHCPContext context, ILogger<PrescriptionController_hiep> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Prescription
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Prescription>>> GetPrescriptions()
        {
            try
            {
                var prescriptions = await _context.Prescriptions
                    .Include(p => p.Consultation)
                    .Include(p => p.Patient)
                    .ToListAsync();
                return Ok(prescriptions);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting prescriptions: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Prescription/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Prescription>> GetPrescription(int id)
        {
            try
            {
                var prescription = await _context.Prescriptions
                    .Include(p => p.Consultation)
                    .Include(p => p.Patient)
                    .FirstOrDefaultAsync(p => p.PrescriptionID == id);

                if (prescription == null)
                {
                    return NotFound($"Prescription with ID {id} not found");
                }

                return Ok(prescription);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting prescription {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Prescription
        [HttpPost]
        public async Task<ActionResult<Prescription>> CreatePrescription([FromBody] Prescription prescription)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _context.Prescriptions.Add(prescription);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPrescription), new { id = prescription.PrescriptionID }, prescription);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating prescription: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Prescription/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePrescription(int id, [FromBody] Prescription prescription)
        {
            try
            {
                if (id != prescription.PrescriptionID)
                {
                    return BadRequest("Prescription ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingPrescription = await _context.Prescriptions.FindAsync(id);
                if (existingPrescription == null)
                {
                    return NotFound($"Prescription with ID {id} not found");
                }

                existingPrescription.ConsultationID = prescription.ConsultationID;
                existingPrescription.PatientID = prescription.PatientID;
                existingPrescription.MedicationName = prescription.MedicationName;
                existingPrescription.Dosage = prescription.Dosage;
                existingPrescription.Instructions = prescription.Instructions;
                existingPrescription.IssueDate = prescription.IssueDate;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating prescription {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Prescription/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePrescription(int id)
        {
            try
            {
                var prescription = await _context.Prescriptions.FindAsync(id);
                if (prescription == null)
                {
                    return NotFound($"Prescription with ID {id} not found");
                }

                _context.Prescriptions.Remove(prescription);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting prescription {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
