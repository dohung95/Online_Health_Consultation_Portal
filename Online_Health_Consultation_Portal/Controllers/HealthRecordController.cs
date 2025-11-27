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
    [Authorize]
    public class HealthRecordController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<HealthRecordController> _logger;
        private IWebHostEnvironment _environment;

        public HealthRecordController(OHCPContext context, ILogger<HealthRecordController> logger, IWebHostEnvironment environment)
        {
            _context = context;
            _logger = logger;
            _environment = environment;
        }

        // GET: api/HealthRecord
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HealthRecord>>> GetHealthRecords()
        {
            try
            {
                var healthRecords = await _context.HealthRecords
                    .Include(h => h.Patient)
                    .Include(h => h.MedicalDocuments)
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
                    .Include(h => h.MedicalDocuments)
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

        [HttpGet("my-records")]
        public async Task<ActionResult<List<HealthRecordDTO>>> GetMyRecords()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var healthRecords = await _context.HealthRecords
                .Include(hr => hr.MedicalDocuments)
                .Where(hr => hr.PatientID == userId)
                .Select(hr => new HealthRecordDTO
                {
                    HealthRecordID = hr.HealthRecordID,
                    LastUpdated = hr.LastUpdated,
                    Documents = hr.MedicalDocuments.Select(doc => new MedicalDocumentDTO
                    {
                        DocumentID = doc.DocumentID,
                        DocumentName = doc.DocumentName,
                        DocumentType = doc.DocumentType,
                        FileUrl = doc.FileLocation,
                        UploadedAt = doc.UploadedAt,
                        Category = doc.Category,
                        Description = doc.Description,
                        DocumentDate = doc.DocumentDate,
                        TestResults = doc.TestResults,
                        ReferenceRange = doc.ReferenceRange,
                        TestStatus = doc.TestStatus,
                        PerformedBy = doc.PerformedBy
                    }).ToList()
                })
                .ToListAsync();

            return Ok(healthRecords);
        }

        // POST: api/MedicalDocument
        [HttpPost]
        public async Task<ActionResult<MedicalDocument>> CreateMedicalDocument(
            [FromForm] List<IFormFile> Documents,
            [FromForm] string? Category,
            [FromForm] string? Description,
            [FromForm] string? DocumentDate,
            [FromForm] string? TestResults,
            [FromForm] string? ReferenceRange,
            [FromForm] string? TestStatus,
            [FromForm] string? PerformedBy)
        {
            try
            {
                if (Documents == null || Documents.Count == 0)
                {
                    return BadRequest("No files uploaded");
                }
                var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

                // T�m ho?c t?o HealthRecord cho patient
                var healthRecord = await _context.HealthRecords
                    .FirstOrDefaultAsync(hr => hr.PatientID == userId);

                if (healthRecord == null)
                {
                    // T?o m?i health record n?u ch?a c�
                    healthRecord = new HealthRecord
                    {
                        PatientID = userId,
                        LastUpdated = DateTime.Now
                    };
                    _context.HealthRecords.Add(healthRecord);
                    await _context.SaveChangesAsync();
                }
                var createdDocuments = new List<MedicalDocument>();
                foreach (var file in Documents)
                {
                    if (file.Length > 0)
                    {
                        // Save file (your implementation - local storage or cloud)
                        var fileName = $"{Guid.NewGuid()}_{file.FileName}";
                        var filePath = Path.Combine("wwwroot", "uploads", "medical-documents", fileName);

                        // Create directory if not exists
                        Directory.CreateDirectory(Path.GetDirectoryName(filePath));

                        using (var stream = new FileStream(filePath, FileMode.Create))
                        {
                            await file.CopyToAsync(stream);
                        }
                        // Create document record
                        var document = new MedicalDocument
                        {
                            HealthRecordID = healthRecord.HealthRecordID,
                            DocumentName = file.FileName,
                            DocumentType = file.ContentType,
                            FileLocation = $"/uploads/medical-documents/{fileName}",
                            Category = Category,
                            Description = Description,
                            TestResults = TestResults,
                            ReferenceRange = ReferenceRange,
                            TestStatus = TestStatus,
                            PerformedBy = PerformedBy,
                            DocumentDate = !string.IsNullOrEmpty(DocumentDate)
                                ? DateTime.Parse(DocumentDate)
                                : (DateTime?)null,
                            UploadedAt = DateTime.Now
                        };
                        _context.MedicalDocuments.Add(document);
                        createdDocuments.Add(document);
                    }
                }
                // Update HealthRecord LastUpdated
                healthRecord.LastUpdated = DateTime.Now;

                await _context.SaveChangesAsync();
                return Ok(new
                {
                    message = "Documents uploaded successfully",
                    count = createdDocuments.Count,
                    healthRecordId = healthRecord.HealthRecordID
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating medical document: {ex.Message}");
                _logger.LogError($"Inner Exception: {ex.InnerException?.Message}");
                return StatusCode(500, "Internal server error: " + ex.Message);
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
