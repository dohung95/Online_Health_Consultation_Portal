using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Models;
using OHCP_BK.Dtos;
using System.Security.Claims;
using System.Text.Json;
namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class HealthRecordShareController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<HealthRecordShareController> _logger;
        public HealthRecordShareController(OHCPContext context, ILogger<HealthRecordShareController> logger)
        {
            _context = context;
            _logger = logger;
        }
        // POST: api/HealthRecordShare - Share health record (entire or specific documents) with doctor
        [HttpPost]
        [Authorize(Roles = "patient")]
        public async Task<ActionResult> ShareHealthRecord([FromBody] ShareRequestDTO request)
        {
            try
            {
                var patientId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                // Verify health record belongs to patient
                var healthRecord = await _context.HealthRecords
                    .Include(hr => hr.MedicalDocuments)
                    .FirstOrDefaultAsync(hr => hr.HealthRecordID == request.HealthRecordID
                                            && hr.PatientID == patientId);
                if (healthRecord == null)
                {
                    return NotFound("Health record not found or access denied");
                }
                // Verify doctor exists
                var doctor = await _context.Doctors.FindAsync(request.DoctorID);
                if (doctor == null)
                {
                    return NotFound("Doctor not found");
                }
                // VALIDATE DOCUMENT IDs if provided
                string? sharedDocumentIds = null;
                if (request.DocumentIDs != null && request.DocumentIDs.Any())
                {
                    var recordDocumentIds = healthRecord.MedicalDocuments
                        .Select(d => d.DocumentID)
                        .ToList();
                    var invalidDocIds = request.DocumentIDs
                        .Except(recordDocumentIds)
                        .ToList();
                    if (invalidDocIds.Any())
                    {
                        return BadRequest($"Documents {string.Join(", ", invalidDocIds)} do not belong to this health record");
                    }
                    // Serialize document IDs to JSON
                    sharedDocumentIds = JsonSerializer.Serialize(request.DocumentIDs);
                }
                // Check if already shared (and not revoked)
                var existingShare = await _context.HealthRecordShares
                    .FirstOrDefaultAsync(s => s.HealthRecordID == request.HealthRecordID
                                           && s.SharedWithDoctorID == request.DoctorID
                                           && !s.IsRevoked);
                if (existingShare != null)
                {
                    return BadRequest("This health record is already shared with this doctor");
                }
                // Create new share
                var share = new HealthRecordShare
                {
                    HealthRecordID = request.HealthRecordID,
                    SharedDocumentIDs = sharedDocumentIds,  // Can be null (entire record) or JSON array
                    SharedWithDoctorID = request.DoctorID,
                    SharedByPatientID = patientId,
                    PermissionLevel = request.PermissionLevel,
                    ExpiryDate = request.ExpiryDate,
                    ConsentGivenAt = DateTime.Now
                };
                _context.HealthRecordShares.Add(share);
                await _context.SaveChangesAsync();
                return Ok(new
                {
                    message = "Health record shared successfully",
                    shareId = share.ShareID,
                    sharedDocuments = request.DocumentIDs?.Count ?? 0,
                    shareType = sharedDocumentIds == null ? "entire_record" : "specific_documents"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sharing health record: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
        // GET: api/HealthRecordShare/my-shares - Get all shares for current patient
        [HttpGet("my-shares")]
        [Authorize(Roles = "patient")]
        public async Task<ActionResult<IEnumerable<ShareResponseDTO>>> GetMyShares()
        {
            try
            {
                var patientId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var sharesData = await _context.HealthRecordShares
                    .Include(s => s.SharedWithDoctor)
                    .Include(s => s.HealthRecord)
                    .Where(s => s.SharedByPatientID == patientId && !s.IsRevoked)
                    .ToListAsync();
                var shares = sharesData.Select(s => new ShareResponseDTO
                {
                    ShareID = s.ShareID,
                    HealthRecordID = s.HealthRecordID,
                    SharedDocumentIDs = s.SharedDocumentIDs != null ?
                        JsonSerializer.Deserialize<List<int>>(s.SharedDocumentIDs) : null,
                    DoctorName = s.SharedWithDoctor.FullName,
                    DoctorSpecialty = s.SharedWithDoctor.Specialty,
                    PermissionLevel = s.PermissionLevel,
                    ConsentGivenAt = s.ConsentGivenAt,
                    ExpiryDate = s.ExpiryDate,
                    IsRevoked = s.IsRevoked
                }).ToList();
                return Ok(shares);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting shares: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
        // GET: api/HealthRecordShare/shared-with-me - Doctor gets records shared with them
        [HttpGet("shared-with-me")]
        [Authorize(Roles = "doctor")]
        public async Task<ActionResult> GetRecordsSharedWithMe()
        {
            try
            {
                var doctorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var sharedRecordsData = await _context.HealthRecordShares
                    .Include(s => s.HealthRecord)
                        .ThenInclude(hr => hr.MedicalDocuments)
                    .Include(s => s.SharedByPatient)
                    .Where(s => s.SharedWithDoctorID == doctorId
                             && !s.IsRevoked
                             && (s.ExpiryDate == null || s.ExpiryDate > DateTime.Now))
                    .ToListAsync();
                var sharedRecords = sharedRecordsData.Select(s =>
                {
                    var sharedDocIds = s.SharedDocumentIDs != null ?
                        JsonSerializer.Deserialize<List<int>>(s.SharedDocumentIDs) : null;
                    return new
                    {
                        s.ShareID,
                        s.HealthRecordID,
                        SharedDocumentIDs = sharedDocIds,
                        PatientName = s.SharedByPatient.FullName,
                        s.PermissionLevel,
                        s.ConsentGivenAt,
                        s.ExpiryDate,
                        // Filter documents if specific IDs are shared
                        Documents = sharedDocIds != null ?
                            s.HealthRecord.MedicalDocuments
                                .Where(d => sharedDocIds.Contains(d.DocumentID))
                                .ToList() :
                            s.HealthRecord.MedicalDocuments.ToList()
                    };
                }).ToList();
                return Ok(sharedRecords);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting shared records: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
        // DELETE: api/HealthRecordShare/{shareId} - Revoke access
        [HttpDelete("{shareId}")]
        [Authorize(Roles = "patient")]
        public async Task<IActionResult> RevokeShare(int shareId, [FromBody] RevokeShareDTO? dto)
        {
            try
            {
                var patientId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var share = await _context.HealthRecordShares
                    .FirstOrDefaultAsync(s => s.ShareID == shareId
                                           && s.SharedByPatientID == patientId);
                if (share == null)
                {
                    return NotFound("Share not found or access denied");
                }
                if (share.IsRevoked)
                {
                    return BadRequest("This share is already revoked");
                }
                // Revoke share
                share.IsRevoked = true;
                share.RevokedAt = DateTime.Now;
                share.RevokeReason = dto?.Reason;
                await _context.SaveChangesAsync();
                return Ok(new { message = "Access revoked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error revoking share: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
        // GET: api/HealthRecordShare/can-access/{healthRecordId} - Check if current doctor can access
        [HttpGet("can-access/{healthRecordId}")]
        [Authorize(Roles = "doctor")]
        public async Task<ActionResult<bool>> CanAccessHealthRecord(int healthRecordId)
        {
            try
            {
                var doctorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var hasAccess = await _context.HealthRecordShares
                    .AnyAsync(s => s.HealthRecordID == healthRecordId
                                && s.SharedWithDoctorID == doctorId
                                && !s.IsRevoked
                                && (s.ExpiryDate == null || s.ExpiryDate > DateTime.Now));
                return Ok(new { canAccess = hasAccess });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error checking access: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}