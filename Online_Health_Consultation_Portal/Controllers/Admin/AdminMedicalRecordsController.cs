using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.DTOs.Admin;

namespace OHCP_BK.Controllers.Admin
{
    [Route("api/admin/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminMedicalRecordsController : ControllerBase
    {
        private readonly OHCPContext _context;

        public AdminMedicalRecordsController(OHCPContext context)
        {
            _context = context;
        }

        // GET: api/admin/adminmedicalrecords/stats
        [HttpGet("stats")]
        public async Task<ActionResult<MedicalRecordStatsDto>> GetMedicalRecordStats()
        {
            try
            {
                var totalRecords = await _context.HealthRecords.CountAsync();

                var thirtyDaysAgo = DateTime.Now.AddDays(-30);
                var recentUpdates = await _context.HealthRecords
                    .Where(hr => hr.LastUpdated >= thirtyDaysAgo)
                    .CountAsync();

                // For demo purposes, we'll set these to 0 since we don't have these fields yet
                var pendingReview = 0;
                var archived = 0;

                return Ok(new MedicalRecordStatsDto
                {
                    TotalRecords = totalRecords,
                    RecentUpdates = recentUpdates,
                    PendingReview = pendingReview,
                    Archived = archived
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching stats", details = ex.Message });
            }
        }

        // GET: api/admin/adminmedicalrecords
        [HttpGet]
        public async Task<ActionResult<MedicalRecordListResponseDto>> GetMedicalRecords(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] string? category = null)
        {
            try
            {
                var query = _context.HealthRecords
                    .Include(hr => hr.Patient)
                    .AsQueryable();

                // Search filter
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(hr =>
                        hr.Patient.FullName.Contains(searchTerm) ||
                        hr.PatientID.Contains(searchTerm) ||
                        hr.HealthRecordID.ToString().Contains(searchTerm)
                    );
                }

                // Date range filter
                if (fromDate.HasValue)
                {
                    query = query.Where(hr => hr.LastUpdated >= fromDate.Value);
                }

                if (toDate.HasValue)
                {
                    query = query.Where(hr => hr.LastUpdated <= toDate.Value.AddDays(1));
                }

                // Sort by LastUpdated descending (newest first)
                query = query.OrderByDescending(hr => hr.LastUpdated);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var records = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(hr => new MedicalRecordAdminDto
                    {
                        HealthRecordID = hr.HealthRecordID,
                        PatientID = hr.PatientID,
                        PatientName = hr.Patient.FullName,
                        DoctorName = null, // Can be enhanced if you link appointments
                        Date = hr.LastUpdated,
                        Category = "General", // Can be enhanced with actual categories
                        Diagnosis = hr.Patient.MedicalHistorySummary ?? "No diagnosis recorded",
                        Status = "Active",
                        LastUpdated = hr.LastUpdated
                    })
                    .ToListAsync();

                return Ok(new MedicalRecordListResponseDto
                {
                    Records = records,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalPages = totalPages
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching medical records", details = ex.Message });
            }
        }

        // GET: api/admin/adminmedicalrecords/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MedicalRecordAdminDto>> GetMedicalRecord(int id)
        {
            try
            {
                var record = await _context.HealthRecords
                    .Include(hr => hr.Patient)
                    .FirstOrDefaultAsync(hr => hr.HealthRecordID == id);

                if (record == null)
                {
                    return NotFound(new { error = "Medical record not found" });
                }

                var recordDto = new MedicalRecordAdminDto
                {
                    HealthRecordID = record.HealthRecordID,
                    PatientID = record.PatientID,
                    PatientName = record.Patient.FullName,
                    DoctorName = null,
                    Date = record.LastUpdated,
                    Category = "General",
                    Diagnosis = record.Patient.MedicalHistorySummary ?? "No diagnosis recorded",
                    Status = "Active",
                    LastUpdated = record.LastUpdated
                };

                return Ok(recordDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching medical record", details = ex.Message });
            }
        }

        // GET: api/admin/adminmedicalrecords/patient/{patientId}
        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<List<MedicalRecordAdminDto>>> GetPatientMedicalRecords(string patientId)
        {
            try
            {
                var records = await _context.HealthRecords
                    .Include(hr => hr.Patient)
                    .Where(hr => hr.PatientID == patientId)
                    .OrderByDescending(hr => hr.LastUpdated)
                    .Select(hr => new MedicalRecordAdminDto
                    {
                        HealthRecordID = hr.HealthRecordID,
                        PatientID = hr.PatientID,
                        PatientName = hr.Patient.FullName,
                        DoctorName = null,
                        Date = hr.LastUpdated,
                        Category = "General",
                        Diagnosis = hr.Patient.MedicalHistorySummary ?? "No diagnosis recorded",
                        Status = "Active",
                        LastUpdated = hr.LastUpdated
                    })
                    .ToListAsync();

                return Ok(records);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching patient medical records", details = ex.Message });
            }
        }

        // PUT: api/admin/adminmedicalrecords/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMedicalRecord(int id)
        {
            try
            {
                var record = await _context.HealthRecords.FindAsync(id);

                if (record == null)
                {
                    return NotFound(new { error = "Medical record not found" });
                }

                // Update the LastUpdated timestamp
                record.LastUpdated = DateTime.Now;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Medical record updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while updating medical record", details = ex.Message });
            }
        }

        // DELETE: api/admin/adminmedicalrecords/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMedicalRecord(int id)
        {
            try
            {
                var record = await _context.HealthRecords.FindAsync(id);

                if (record == null)
                {
                    return NotFound(new { error = "Medical record not found" });
                }

                _context.HealthRecords.Remove(record);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Medical record deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while deleting medical record", details = ex.Message });
            }
        }
    }
}
