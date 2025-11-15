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
    public class MedicalDocumentController_hiep : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<MedicalDocumentController_hiep> _logger;

        public MedicalDocumentController_hiep(OHCPContext context, ILogger<MedicalDocumentController_hiep> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/MedicalDocument
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MedicalDocument>>> GetMedicalDocuments()
        {
            try
            {
                var documents = await _context.MedicalDocuments
                    .Include(d => d.HealthRecord)
                    .ToListAsync();
                return Ok(documents);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting medical documents: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/MedicalDocument/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MedicalDocument>> GetMedicalDocument(int id)
        {
            try
            {
                var document = await _context.MedicalDocuments
                    .Include(d => d.HealthRecord)
                    .FirstOrDefaultAsync(d => d.DocumentID == id);

                if (document == null)
                {
                    return NotFound($"MedicalDocument with ID {id} not found");
                }

                return Ok(document);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting medical document {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/MedicalDocument
        [HttpPost]
        public async Task<ActionResult<MedicalDocument>> CreateMedicalDocument([FromBody] MedicalDocument document)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _context.MedicalDocuments.Add(document);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetMedicalDocument), new { id = document.DocumentID }, document);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating medical document: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/MedicalDocument/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMedicalDocument(int id, [FromBody] MedicalDocument document)
        {
            try
            {
                if (id != document.DocumentID)
                {
                    return BadRequest("MedicalDocument ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingDocument = await _context.MedicalDocuments.FindAsync(id);
                if (existingDocument == null)
                {
                    return NotFound($"MedicalDocument with ID {id} not found");
                }

                existingDocument.HealthRecordID = document.HealthRecordID;
                existingDocument.DocumentName = document.DocumentName;
                existingDocument.DocumentType = document.DocumentType;
                existingDocument.FileLocation = document.FileLocation;
                existingDocument.UploadedAt = document.UploadedAt;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating medical document {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/MedicalDocument/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMedicalDocument(int id)
        {
            try
            {
                var document = await _context.MedicalDocuments.FindAsync(id);
                if (document == null)
                {
                    return NotFound($"MedicalDocument with ID {id} not found");
                }

                _context.MedicalDocuments.Remove(document);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting medical document {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
