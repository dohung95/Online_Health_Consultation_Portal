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
                    .Include(hr => hr.MedicalDocuments)
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
                    .ToListAsync();

                // Get doctor names from most recent appointments
                var recordDtos = new List<MedicalRecordAdminDto>();
                foreach (var hr in records)
                {
                    var latestAppointment = await _context.Appointments
                        .Include(a => a.Doctor)
                        .Where(a => a.PatientID == hr.PatientID)
                        .OrderByDescending(a => a.AppointmentTime)
                        .FirstOrDefaultAsync();

                    var categoryFromDocuments = hr.MedicalDocuments
                        .OrderByDescending(md => md.UploadedAt)
                        .Select(md => md.Category)
                        .FirstOrDefault() ?? "General";

                    recordDtos.Add(new MedicalRecordAdminDto
                    {
                        HealthRecordID = hr.HealthRecordID,
                        PatientID = hr.PatientID,
                        PatientName = hr.Patient.FullName,
                        DoctorName = latestAppointment?.Doctor.FullName ?? "N/A",
                        Date = hr.LastUpdated,
                        Category = categoryFromDocuments,
                        Diagnosis = hr.Patient.MedicalHistorySummary ?? "No diagnosis recorded",
                        Status = "Active",
                        LastUpdated = hr.LastUpdated
                    });
                }

                return Ok(new MedicalRecordListResponseDto
                {
                    Records = recordDtos,
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
                    .Include(hr => hr.MedicalDocuments)
                    .FirstOrDefaultAsync(hr => hr.HealthRecordID == id);

                if (record == null)
                {
                    return NotFound(new { error = "Medical record not found" });
                }

                // Get doctor from most recent appointment
                var latestAppointment = await _context.Appointments
                    .Include(a => a.Doctor)
                    .Where(a => a.PatientID == record.PatientID)
                    .OrderByDescending(a => a.AppointmentTime)
                    .FirstOrDefaultAsync();

                var categoryFromDocuments = record.MedicalDocuments
                    .OrderByDescending(md => md.UploadedAt)
                    .Select(md => md.Category)
                    .FirstOrDefault() ?? "General";

                var recordDto = new MedicalRecordAdminDto
                {
                    HealthRecordID = record.HealthRecordID,
                    PatientID = record.PatientID,
                    PatientName = record.Patient.FullName,
                    DoctorName = latestAppointment?.Doctor.FullName ?? "N/A",
                    Date = record.LastUpdated,
                    Category = categoryFromDocuments,
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
                    .Include(hr => hr.MedicalDocuments)
                    .Where(hr => hr.PatientID == patientId)
                    .OrderByDescending(hr => hr.LastUpdated)
                    .ToListAsync();

                // Get doctor from most recent appointment
                var latestAppointment = await _context.Appointments
                    .Include(a => a.Doctor)
                    .Where(a => a.PatientID == patientId)
                    .OrderByDescending(a => a.AppointmentTime)
                    .FirstOrDefaultAsync();

                var recordDtos = records.Select(hr => new MedicalRecordAdminDto
                {
                    HealthRecordID = hr.HealthRecordID,
                    PatientID = hr.PatientID,
                    PatientName = hr.Patient.FullName,
                    DoctorName = latestAppointment?.Doctor.FullName ?? "N/A",
                    Date = hr.LastUpdated,
                    Category = hr.MedicalDocuments
                        .OrderByDescending(md => md.UploadedAt)
                        .Select(md => md.Category)
                        .FirstOrDefault() ?? "General",
                    Diagnosis = hr.Patient.MedicalHistorySummary ?? "No diagnosis recorded",
                    Status = "Active",
                    LastUpdated = hr.LastUpdated
                }).ToList();

                return Ok(recordDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching patient medical records", details = ex.Message });
            }
        }
    }
}
