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
    public class PatientController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<PatientController> _logger;

        public PatientController(OHCPContext context, ILogger<PatientController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Patient
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Patient>>> GetPatients()
        {
            try
            {
                var patients = await _context.Patients
                    .Include(p => p.User)
                    .ToListAsync();
                return Ok(patients);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting patients: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Patient/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Patient>> GetPatient(string id)
        {
            try
            {
                var patient = await _context.Patients
                    .Include(p => p.User)
                    .Include(p => p.Appointments)
                    .Include(p => p.Reviews)
                    .Include(p => p.HealthRecords)
                    .FirstOrDefaultAsync(p => p.PatientID == id);

                if (patient == null)
                {
                    return NotFound($"Patient with ID {id} not found");
                }

                return Ok(patient);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting patient {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Patient
        [HttpPost]
        public async Task<ActionResult<Patient>> CreatePatient([FromBody] Patient patient)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _context.Patients.Add(patient);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPatient), new { id = patient.PatientID }, patient);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating patient: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Patient/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePatient(string id, [FromBody] Patient patient)
        {
            try
            {
                if (id != patient.PatientID)
                {
                    return BadRequest("Patient ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingPatient = await _context.Patients.FindAsync(id);
                if (existingPatient == null)
                {
                    return NotFound($"Patient with ID {id} not found");
                }

                existingPatient.FullName = patient.FullName;
                existingPatient.DateOfBirth = patient.DateOfBirth;
                existingPatient.MedicalHistorySummary = patient.MedicalHistorySummary;
                existingPatient.InsuranceProvider = patient.InsuranceProvider;
                existingPatient.InsurancePolicyNumber = patient.InsurancePolicyNumber;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating patient {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Patient/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePatient(string id)
        {
            try
            {
                var patient = await _context.Patients.FindAsync(id);
                if (patient == null)
                {
                    return NotFound($"Patient with ID {id} not found");
                }

                _context.Patients.Remove(patient);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting patient {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
