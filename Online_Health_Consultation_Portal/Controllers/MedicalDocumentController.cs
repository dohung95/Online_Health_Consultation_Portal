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
    public class MedicalDocumentController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<MedicalDocumentController> _logger;

        public MedicalDocumentController(OHCPContext context, ILogger<MedicalDocumentController> logger)
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

        // GET: api/MedicalDocument/file/5
        [HttpGet("file/{id}")]
        public async Task<IActionResult> GetDocumentFile(int id)
        {
            try
            {
                var document = await _context.MedicalDocuments.FindAsync(id);
                
                if (document == null)
                {
                    _logger.LogWarning($"Document with ID {id} not found");
                    return NotFound(new { error = $"Document with ID {id} not found" });
                }

                if (string.IsNullOrEmpty(document.FileLocation))
                {
                    _logger.LogWarning($"Document {id} has no file location");
                    return NotFound(new { error = "File location not specified" });
                }

                // Get the full file path - files should be in wwwroot
                var webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var filePath = Path.Combine(webRootPath, document.FileLocation.TrimStart('/', '\\'));
                
                _logger.LogInformation($"WebRoot: {webRootPath}");
                _logger.LogInformation($"Document FileLocation: {document.FileLocation}");
                _logger.LogInformation($"Full file path: {filePath}");

                if (!System.IO.File.Exists(filePath))
                {
                    _logger.LogWarning($"File not found at path: {filePath}");
                    return NotFound(new { error = "File not found on server", path = document.FileLocation, fullPath = filePath });
                }

                // Determine content type based on file extension
                var extension = Path.GetExtension(filePath).ToLowerInvariant();
                var contentType = extension switch
                {
                    ".pdf" => "application/pdf",
                    ".jpg" or ".jpeg" => "image/jpeg",
                    ".png" => "image/png",
                    ".gif" => "image/gif",
                    ".bmp" => "image/bmp",
                    ".webp" => "image/webp",
                    ".svg" => "image/svg+xml",
                    ".doc" => "application/msword",
                    ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    ".xls" => "application/vnd.ms-excel",
                    ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    ".ppt" => "application/vnd.ms-powerpoint",
                    ".pptx" => "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    ".txt" => "text/plain",
                    ".mp4" => "video/mp4",
                    ".avi" => "video/x-msvideo",
                    ".mov" => "video/quicktime",
                    ".webm" => "video/webm",
                    ".mkv" => "video/x-matroska",
                    ".mp3" => "audio/mpeg",
                    ".wav" => "audio/wav",
                    ".ogg" => "audio/ogg",
                    ".m4a" => "audio/mp4",
                    ".zip" => "application/zip",
                    ".rar" => "application/x-rar-compressed",
                    ".7z" => "application/x-7z-compressed",
                    _ => "application/octet-stream"
                };

                _logger.LogInformation($"Serving file {document.DocumentName} with content type {contentType}");

                return PhysicalFile(filePath, contentType, document.DocumentName);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error serving document file {id}: {ex.Message}");
                return StatusCode(500, new { error = "Internal server error", message = ex.Message });
            }
        }
    }
}
