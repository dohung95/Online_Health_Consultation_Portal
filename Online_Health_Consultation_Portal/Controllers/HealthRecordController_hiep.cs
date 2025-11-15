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
    public class HealthRecordController_hiep : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<HealthRecordController_hiep> _logger;

        public HealthRecordController_hiep(OHCPContext context, ILogger<HealthRecordController_hiep> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/HealthRecord
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HealthRecord>>> GetHealthRecords()
        {
            try
            {
                var healthRecords = await _context.HealthRecords
                    .Include(h => h.Patient)
                    .Include(h => h.Documents)
                    .ToListAsync();
                return Ok(healthRecords);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting health records: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/HealthRecord/5
        [HttpGet("{id}")]
        public async Task<ActionResult<HealthRecord>> GetHealthRecord(int id)
        {
            try
            {
                var healthRecord = await _context.HealthRecords
                    .Include(h => h.Patient)
                    .Include(h => h.Documents)
                    .FirstOrDefaultAsync(h => h.HealthRecordID == id);

                if (healthRecord == null)
                {
                    return NotFound($"HealthRecord with ID {id} not found");
                }

                return Ok(healthRecord);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting health record {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/HealthRecord
        [HttpPost]
        public async Task<ActionResult<HealthRecord>> CreateHealthRecord([FromBody] HealthRecord healthRecord)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _context.HealthRecords.Add(healthRecord);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetHealthRecord), new { id = healthRecord.HealthRecordID }, healthRecord);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating health record: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/HealthRecord/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHealthRecord(int id, [FromBody] HealthRecord healthRecord)
        {
            try
            {
                if (id != healthRecord.HealthRecordID)
                {
                    return BadRequest("HealthRecord ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingHealthRecord = await _context.HealthRecords.FindAsync(id);
                if (existingHealthRecord == null)
                {
                    return NotFound($"HealthRecord with ID {id} not found");
                }

                existingHealthRecord.PatientID = healthRecord.PatientID;
                existingHealthRecord.LastUpdated = healthRecord.LastUpdated;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating health record {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/HealthRecord/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHealthRecord(int id)
        {
            try
            {
                var healthRecord = await _context.HealthRecords.FindAsync(id);
                if (healthRecord == null)
                {
                    return NotFound($"HealthRecord with ID {id} not found");
                }

                _context.HealthRecords.Remove(healthRecord);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting health record {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
