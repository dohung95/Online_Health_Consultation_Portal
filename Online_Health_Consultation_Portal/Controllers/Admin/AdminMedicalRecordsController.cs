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

        // GET: api/admin/adminmedicalrecords/patients
        [HttpGet("patients")]
        public async Task<ActionResult<MedicalRecordsPatientListResponseDto>> GetPatients(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null)
        {
            try
            {
                var query = _context.Patients
                    .Include(p => p.User)
                    .Include(p => p.HealthRecords)
                        .ThenInclude(hr => hr.MedicalDocuments)
                    .AsQueryable();

                // Search filter
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(p =>
                        p.FullName.Contains(searchTerm) ||
                        p.PatientID.Contains(searchTerm) ||
                        p.User.Email.Contains(searchTerm)
                    );
                }

                // Sort by last updated (most recent first)
                query = query.OrderByDescending(p => 
                    p.HealthRecords.Max(hr => (DateTime?)hr.LastUpdated) ?? DateTime.MinValue
                );

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var patients = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var patientDtos = patients.Select(p => new MedicalRecordsPatientDto
                {
                    PatientID = p.PatientID,
                    FullName = p.FullName,
                    Email = p.User.Email,
                    Gender = p.Gender,
                    DateOfBirth = p.DateOfBirth,
                    TotalRecords = p.HealthRecords.Count,
                    TotalDocuments = p.HealthRecords.Sum(hr => hr.MedicalDocuments.Count),
                    LastUpdated = p.HealthRecords.Max(hr => (DateTime?)hr.LastUpdated)
                }).ToList();

                return Ok(new MedicalRecordsPatientListResponseDto
                {
                    Patients = patientDtos,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalPages = totalPages
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching patients", details = ex.Message });
            }
        }

        // GET: api/admin/adminmedicalrecords/patient/{patientId}/details
        [HttpGet("patient/{patientId}/details")]
        public async Task<ActionResult<PatientMedicalHistoryDto>> GetPatientMedicalHistory(string patientId)
        {
            try
            {
                var patient = await _context.Patients
                    .Include(p => p.User)
                    .Include(p => p.HealthRecords)
                        .ThenInclude(hr => hr.MedicalDocuments)
                    .Include(p => p.Appointments)
                        .ThenInclude(a => a.Doctor)
                    .Include(p => p.Appointments)
                        .ThenInclude(a => a.Consultation)
                    .FirstOrDefaultAsync(p => p.PatientID == patientId);

                if (patient == null)
                {
                    return NotFound(new { error = "Patient not found" });
                }

                // Get all appointments with doctor info
                var appointments = patient.Appointments
                    .OrderByDescending(a => a.AppointmentTime)
                    .Select(a => new AppointmentHistoryDto
                    {
                        AppointmentID = a.AppointmentID,
                        AppointmentTime = a.AppointmentTime,
                        DoctorID = a.DoctorID,
                        DoctorName = a.Doctor.FullName,
                        DoctorSpecialty = a.Doctor.Specialty,
                        ConsultationType = a.ConsultationType,
                        Status = a.Status,
                        DoctorNotes = a.Consultation != null ? a.Consultation.DoctorNotes : null
                    })
                    .ToList();

                // Get all medical documents grouped by category
                var allDocuments = patient.HealthRecords
                    .SelectMany(hr => hr.MedicalDocuments.Select(md => new
                    {
                        Document = md,
                        HealthRecordID = hr.HealthRecordID
                    }))
                    .ToList();

                var documentsByCategory = allDocuments
                    .GroupBy(d => d.Document.Category ?? "Other")
                    .Select(g => new MedicalDocumentCategoryDto
                    {
                        Category = g.Key,
                        DocumentCount = g.Count(),
                        Documents = g.Select(d => new MedicalDocumentDetailDto
                        {
                            DocumentID = d.Document.DocumentID,
                            HealthRecordID = d.HealthRecordID,
                            DocumentName = d.Document.DocumentName,
                            DocumentType = d.Document.DocumentType,
                            FileLocation = d.Document.FileLocation,
                            Category = d.Document.Category,
                            Description = d.Document.Description,
                            TestResults = d.Document.TestResults,
                            ReferenceRange = d.Document.ReferenceRange,
                            TestStatus = d.Document.TestStatus,
                            DocumentDate = d.Document.DocumentDate,
                            PerformedBy = d.Document.PerformedBy,
                            UploadedAt = d.Document.UploadedAt
                        })
                        .OrderByDescending(d => d.UploadedAt)
                        .ToList()
                    })
                    .OrderByDescending(c => c.DocumentCount)
                    .ToList();

                var historyDto = new PatientMedicalHistoryDto
                {
                    PatientID = patient.PatientID,
                    FullName = patient.FullName,
                    Email = patient.User.Email,
                    DateOfBirth = patient.DateOfBirth,
                    Gender = patient.Gender,
                    BloodType = patient.BloodType,
                    MedicalHistorySummary = patient.MedicalHistorySummary,
                    Address = patient.Address,
                    City = patient.City,
                    Country = patient.Country,
                    PhoneNumber = patient.User.PhoneNumber,
                    Appointments = appointments,
                    DocumentsByCategory = documentsByCategory
                };

                return Ok(historyDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching patient medical history", details = ex.Message });
            }
        }

        // GET: api/admin/adminmedicalrecords/patient/{patientId}/prescriptions
        [HttpGet("patient/{patientId}/prescriptions")]
        public async Task<ActionResult<IEnumerable<Dtos.PrescriptionHeaderResponseDTO>>> GetPatientPrescriptions(string patientId)
        {
            try
            {
                var prescriptions = await _context.PrescriptionHeaders
                    .Where(ph => ph.PatientID == patientId)
                    .Include(ph => ph.PrescriptionItems)
                    .Include(ph => ph.Appointment)
                        .ThenInclude(a => a.Doctor)
                    .OrderByDescending(ph => ph.IssueDate)
                    .ToListAsync();

                var response = prescriptions.Select(h => new Dtos.PrescriptionHeaderResponseDTO
                {
                    PrescriptionHeaderID = h.PrescriptionHeaderID,
                    AppointmentID = h.AppointmentID,
                    PatientID = h.PatientID,
                    IssueDate = h.IssueDate,
                    DoctorName = h.Appointment?.Doctor?.FullName,
                    Specialty = h.Appointment?.Doctor?.Specialty,
                    Medications = h.PrescriptionItems.Select(pi => new Dtos.PrescriptionItemResponseDTO
                    {
                        PrescriptionItemID = pi.PrescriptionItemID,
                        MedicationName = pi.MedicationName,
                        Dosage = pi.Dosage,
                        Instructions = pi.Instructions,
                        TotalSupplyDays = pi.TotalSupplyDays
                    }).ToList()
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching patient prescriptions", details = ex.Message });
            }
        }
    }
}
