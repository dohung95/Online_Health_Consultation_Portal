using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Dtos;
using OHCP_BK.Models;
using OHCP_BK.Services;
using System.Security.Claims;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AppointmentController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<AppointmentController> _logger;
        private readonly INotificationService _notificationService;
        private readonly IHttpClientFactory _httpClientFactory;

        public AppointmentController(
            OHCPContext context, 
            ILogger<AppointmentController> logger,
            INotificationService notificationService,
            IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _logger = logger;
            _notificationService = notificationService;
            _httpClientFactory = httpClientFactory;
        }

        // GET: api/Appointment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAppointments()
        {
            try
            {
                // 1. Lấy user ID từ JWT token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("GetAppointments called without valid user ID in token");
                    return Unauthorized(new { message = "User not authenticated" });
                }

                _logger.LogInformation($"GetAppointments called by user: {userId}");

                // 2. Lấy role của user
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value?.ToLower();
                _logger.LogInformation($"User role: {userRole}");

                IEnumerable<Appointment> appointments;

                // 3. Filter theo role
                if (userRole == "patient")
                {
                    // Nếu là bệnh nhân → Lấy appointments mà họ là patient
                    appointments = await _context.Appointments
                        .Include(a => a.Patient)
                        .Include(a => a.Doctor)
                        .Where(a => a.PatientID == userId)
                        .OrderByDescending(a => a.AppointmentTime)
                        .ToListAsync();

                    _logger.LogInformation($"Found {appointments.Count()} appointments for patient {userId}");
                }
                else if (userRole == "doctor")
                {
                    // Nếu là bác sĩ → Lấy appointments mà họ là doctor
                    appointments = await _context.Appointments
                        .Include(a => a.Patient)
                        .Include(a => a.Doctor)
                        .Where(a => a.DoctorID == userId)
                        .OrderByDescending(a => a.AppointmentTime)
                        .ToListAsync();

                    _logger.LogInformation($"Found {appointments.Count()} appointments for doctor {userId}");
                }
                else if (userRole == "admin")
                {
                    // Nếu là admin → Lấy tất cả (optional, có thể bỏ nếu không cần)
                    appointments = await _context.Appointments
                        .Include(a => a.Patient)
                        .Include(a => a.Doctor)
                        .OrderByDescending(a => a.AppointmentTime)
                        .ToListAsync();

                    _logger.LogInformation($"Found {appointments.Count()} appointments for admin");
                }
                else
                {
                    _logger.LogWarning($"Unknown role: {userRole}");
                    return Forbid();
                }

                // 4. Map sang anonymous object để tránh circular reference
                var result = appointments.Select(a => new
                {
                    appointmentID = a.AppointmentID,
                    patientID = a.PatientID,
                    doctorID = a.DoctorID,
                    appointmentTime = a.AppointmentTime,
                    consultationType = a.ConsultationType,
                    status = a.Status,
                    doctor = a.Doctor != null ? new
                    {
                        doctorID = a.Doctor.DoctorID,
                        fullName = a.Doctor.FullName,
                        specialty = a.Doctor.Specialty,
                        qualifications = a.Doctor.Qualifications,
                        yearsOfExperience = a.Doctor.YearsOfExperience,
                        languageSpoken = a.Doctor.LanguageSpoken,
                        location = a.Doctor.Location
                    } : null,
                    patient = a.Patient != null ? new
                    {
                        patientID = a.Patient.PatientID,
                        fullName = a.Patient.FullName,
                        dateOfBirth = a.Patient.DateOfBirth,
                        medicalHistorySummary = a.Patient.MedicalHistorySummary,
                        insuranceProvider = a.Patient.InsuranceProvider,
                        insurancePolicyNumber = a.Patient.InsurancePolicyNumber
                    } : null
                }).ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting appointments: {ex.Message}");
                return StatusCode(500, new { message = "Internal server error", detail = ex.Message });
            }
        }

        // GET: api/Appointment/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Appointment>> GetAppointment(int id)
        {
            try
            {
                var appointment = await _context.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Doctor)
                    .Include(a => a.Consultation)
                    .Include(a => a.Invoice)
                    .FirstOrDefaultAsync(a => a.AppointmentID == id);

                if (appointment == null)
                {
                    return NotFound($"Appointment with ID {id} not found");
                }

                return Ok(appointment);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting appointment {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // 1. API Get list of free hours (For Calendar Frontend)
            [HttpGet("available-slots")]
            public async Task<ActionResult<IEnumerable<TimeSlotDTO>>> GetAvailableSlots(string doctorId, DateTime date)
            {
                var startWork = new TimeSpan(8, 0, 0);
                var endWork = new TimeSpan(20, 0, 0);
                var slotDuration = TimeSpan.FromMinutes(30);

                var resultSlots = new List<TimeSlotDTO>();

            // 2. Get BOOKED schedule
            // IMPORTANT: Must get TimeOfDay (hour:minute) instead of Hour (only get hour) to compare 30p accurately
            var bookedTimes = await _context.Appointments
                    .Where(a => a.DoctorID == doctorId
                                && a.AppointmentTime.Date == date.Date
                                && a.Status != AppointmentConstants.StatusCancelled)
                    .Select(a => a.AppointmentTime.TimeOfDay)
                    .ToListAsync();

            // 3. Loop to create slot (Replaces old int array foreach)
            var currentSlot = startWork;
                while (currentSlot < endWork)
                {
                    var slotDateTime = date.Date.Add(currentSlot);

                // Past check logic: Keep the same as the old code
                // Note: DateTime.UtcNow.AddHours(7) is Vietnam time
                if (date.Date == DateTime.UtcNow.Date && slotDateTime <= DateTime.UtcNow.AddHours(7))
                    {
                        currentSlot = currentSlot.Add(slotDuration);
                        continue;
                    }

                // Create DTO that returns the correct format FE is using
                resultSlots.Add(new TimeSlotDTO
                    {
                        StartTime = slotDateTime,
                    // Ends in 30 minutes
                    EndTime = slotDateTime.Add(slotDuration),
                    // Duplicate check: compare exact TimeOfDay
                    IsAvailable = !bookedTimes.Contains(currentSlot)
                    });

                // Add 30p to the next loop
                currentSlot = currentSlot.Add(slotDuration);
                }

                return Ok(resultSlots);
            }

        // POST: api/Appointment
        [HttpPost]
        [Authorize(Roles = "patient")]
        public async Task<ActionResult<Appointment>> CreateAppointment([FromBody] AppointmentCreateDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                var doctorExists = await _context.Doctors.AnyAsync(d => d.DoctorID == dto.DoctorID);
                if (!doctorExists)
                {
                    return NotFound("Doctor not found");
                }

                // Validate time: must be future time
                if (dto.AppointmentTime <= DateTime.UtcNow)
                {
                    return BadRequest("Appointment time must be in the future");
                }

                // Conflict Check
                // Logic: A slot is considered busy if there is an appointment at the same time AND the status is NOT "Cancelled"
                // (Avoid the case where the user re-booked the canceled slot but the old code still reports busy)
                var isTimeSlotTaken = await _context.Appointments
                    .AnyAsync(a => a.DoctorID == dto.DoctorID
                        && a.AppointmentTime.Date == dto.AppointmentTime.Date
                        && a.AppointmentTime.Hour == dto.AppointmentTime.Hour
                        && a.Status != AppointmentConstants.StatusCancelled);

                if (isTimeSlotTaken)
                {
                    return Conflict(new { message = "This time slot is already booked for the selected doctor" });
                }

                // Create Appointment
                var appointment = new Appointment
                {
                    PatientID = userId,
                    DoctorID = dto.DoctorID,
                    AppointmentTime = dto.AppointmentTime,
                    ConsultationType = dto.ConsultationType, // Video Call/Chat
                    Status = AppointmentConstants.StatusScheduled // Constant: "Scheduled"
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                // Send real-time notification to doctor about new appointment
                try
                {
                    var doctor = await _context.Doctors.FindAsync(dto.DoctorID);
                    var patient = await _context.Patients.FindAsync(userId);
                    
                    if (doctor != null && patient != null)
                    {
                        await _notificationService.SendAppointmentNotificationAsync(
                            doctor.DoctorID,
                            appointment.AppointmentID,
                            patient.FullName,
                            appointment.AppointmentTime,
                            appointment.ConsultationType
                        );
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending real-time appointment notification to doctor");
                }

                // Notify admins about new appointment
                try
                {
                    // Get patient and doctor names for notification
                    var patient = await _context.Patients.FindAsync(userId);
                    var doctor = await _context.Doctors.FindAsync(dto.DoctorID);

                    if (patient != null && doctor != null)
                    {
                        using var httpClient = _httpClientFactory.CreateClient();
                        var notificationDto = new
                        {
                            appointmentId = appointment.AppointmentID,
                            patientName = patient.FullName,
                            doctorName = doctor.FullName,
                            appointmentTime = appointment.AppointmentTime,
                            consultationType = appointment.ConsultationType
                        };

                        var response = await httpClient.PostAsJsonAsync(
                            "https://localhost:7267/api/admin/notifications/appointment-created",
                            notificationDto);

                        if (!response.IsSuccessStatusCode)
                        {
                            _logger.LogWarning("Failed to send admin notification for new appointment");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error sending admin notification for appointment creation");
                    // Don't fail the appointment creation if notification fails
                }

                // Return result (call GetAppointment to return full details with join tables)
                return CreatedAtAction(nameof(GetAppointment), new { id = appointment.AppointmentID }, new
                {
                    appointmentID = appointment.AppointmentID,
                    status = appointment.Status,
                    appointmentTime = appointment.AppointmentTime,
                    doctorID = appointment.DoctorID,
                    consultationType = appointment.ConsultationType
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating appointment: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Appointment/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAppointment(int id, [FromBody] Appointment appointment)
        {
            try
            {
                if (id != appointment.AppointmentID)
                {
                    return BadRequest("Appointment ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingAppointment = await _context.Appointments.FindAsync(id);
                if (existingAppointment == null)
                {
                    return NotFound($"Appointment with ID {id} not found");
                }

                existingAppointment.PatientID = appointment.PatientID;
                existingAppointment.DoctorID = appointment.DoctorID;
                existingAppointment.AppointmentTime = appointment.AppointmentTime;
                existingAppointment.ConsultationType = appointment.ConsultationType;
                existingAppointment.Status = appointment.Status;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating appointment {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // 3. Cancel Appointment
        [HttpPut("{id}/cancel")]
        public async Task<IActionResult> CancelAppointment(int id, [FromBody] CancelAppointmentDTO cancelDto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null) return NotFound();

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            // Only owner or Admin/Doctor can cancel
            if (appointment.PatientID != userId && !User.IsInRole("doctor"))
                return Forbid();

            // Must cancel at least 2 hours in advance
            if (appointment.AppointmentTime < DateTime.UtcNow.AddHours(7).AddHours(2))
            {
                return BadRequest("Appointments can only be cancelled at least 2 hours in advance.");
            }

            appointment.Status = AppointmentConstants.StatusCancelled;
            // Save the cancellation reason if desired (Add a ReasonCancel column to the Appointment Model if needed)

            await _context.SaveChangesAsync();
            return Ok(new { message = "Appointment cancelled successfully." });
        }

        // GET: api/Appointment/doctor/{doctorId}
        [HttpGet("doctor/{doctorId}")]
        [Authorize(Roles = "doctor,admin")]
        public async Task<ActionResult<IEnumerable<object>>> GetAppointmentsByDoctor(string doctorId)
        {
            try
            {
                var appointments = await _context.Appointments
                    .Where(a => a.DoctorID == doctorId)
                    .Include(a => a.Patient)
                    .OrderByDescending(a => a.AppointmentTime)
                    .Select(a => new
                    {
                        appointmentID = a.AppointmentID,
                        doctorID = a.DoctorID,
                        patient = new
                        {
                            patientID = a.Patient.PatientID,
                            fullName = a.Patient.FullName
                        },
                        appointmentTime = a.AppointmentTime,
                        status = a.Status,
                        consultationType = a.ConsultationType
                    })
                    .ToListAsync();

                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting appointments for doctor {doctorId}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Appointment/{id}/send-notification
        // Example endpoint to demonstrate sending appointment notifications
        [HttpPost("{id}/send-notification")]
        public async Task<IActionResult> SendAppointmentNotification(int id)
        {
            try
            {
                var appointment = await _context.Appointments
                    .Include(a => a.Doctor)
                    .Include(a => a.Patient)
                    .FirstOrDefaultAsync(a => a.AppointmentID == id);

                if (appointment == null)
                {
                    return NotFound("Appointment not found");
                }

                var notification = new AppointmentNotificationDto
                {
                    AppointmentId = appointment.AppointmentID,
                    DoctorName = appointment.Doctor.FullName,
                    Specialty = appointment.Doctor.Specialty,
                    AppointmentDateTime = appointment.AppointmentTime,
                    Location = "Online Consultation" // You can customize this based on ConsultationType
                };

                await _notificationService.SendAppointmentNotificationAsync(appointment.PatientID, notification);

                return Ok(new { message = "Appointment notification sent successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error sending appointment notification: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("medical-history")]
        [Authorize(Roles = "patient")]
        public async Task<ActionResult<MedicalHistoryDTO>> GetMedicalHistory()
        {
            try
            {
                // 1. Get PatientID from JWT token
                var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(patientId))
                {
                    return Unauthorized(new { message = "Patient not authenticated" });
                }
                // 2. Get info patient
                var patient = await _context.Patients
                    .FirstOrDefaultAsync(p => p.PatientID == patientId);
                if (patient == null)
                {
                    return NotFound(new { message = "Patient not found" });
                }
                // 3. Get all appointments for this patient (with related data)
                var appointments = await _context.Appointments
                    .Include(a => a.Doctor)
                    .Include(a => a.Consultation)
                    .Include(a => a.Invoice)
                    .Where(a => a.PatientID == patientId)
                    .OrderByDescending(a => a.AppointmentTime)
                    .ToListAsync();
                // 4. Get all prescriptions related to these appointments
                var appointmentIds = appointments.Select(a => a.AppointmentID).ToList();
                var prescriptions = await _context.PrescriptionHeaders
                    .Include(ph => ph.PrescriptionItems)
                    .Where(ph => appointmentIds.Contains(ph.AppointmentID))
                    .ToListAsync();
                // 5. Map to DTO
                var appointmentHistories = appointments.Select(a =>
                {
                    var prescription = prescriptions.FirstOrDefault(p => p.AppointmentID == a.AppointmentID);

                    return new AppointmentHistoryDTO
                    {
                        AppointmentID = a.AppointmentID,
                        AppointmentTime = a.AppointmentTime,
                        ConsultationType = a.ConsultationType,
                        Status = a.Status,
                        DoctorID = a.DoctorID,
                        DoctorName = a.Doctor?.FullName ?? "Unknown",
                        DoctorSpecialty = a.Doctor?.Specialty ?? "N/A",

                        // Consultation details
                        Consultation = a.Consultation != null ? new ConsultationDetailsDTO
                        {
                            ConsultationID = a.Consultation.ConsultationID,
                            StartTime = a.Consultation.StartTime,
                            EndTime = a.Consultation.EndTime,
                            DoctorNotes = a.Consultation.DoctorNotes,
                            FollowUpDate = a.Consultation.FollowUpDate
                        } : null,

                        // Prescription summary
                        Prescription = prescription != null ? new PrescriptionSummaryDTO
                        {
                            PrescriptionHeaderID = prescription.PrescriptionHeaderID,
                            IssueDate = prescription.IssueDate,
                            MedicationCount = prescription.PrescriptionItems.Count,
                            MedicationNames = prescription.PrescriptionItems
                                .Select(pi => pi.MedicationName)
                                .ToList()
                        } : null,

                        // Invoice summary
                        Invoice = a.Invoice != null ? new InvoiceSummaryDTO
                        {
                            InvoiceID = a.Invoice.InvoiceID,
                            TotalAmount = a.Invoice.Amount,
                            PaymentStatus = a.Invoice.Status,
                            PaymentDate = a.Invoice.IssueDate
                        } : null
                    };
                }).ToList();
                // 6. Calculate doctor visit summary
                var doctorVisits = appointments
                    .Where(a => a.Doctor != null && a.Status == "Completed")
                    .GroupBy(a => new { a.DoctorID, a.Doctor!.FullName, a.Doctor.Specialty })
                    .Select(g => new DoctorVisitSummaryDTO
                    {
                        DoctorID = g.Key.DoctorID,
                        DoctorName = g.Key.FullName,
                        DoctorSpecialty = g.Key.Specialty,
                        VisitCount = g.Count(),
                        LastVisit = g.Max(a => a.AppointmentTime),
                        FirstVisit = g.Min(a => a.AppointmentTime)
                    })
                    .OrderByDescending(d => d.VisitCount)
                    .ToList();
                // 7. Create response
                var result = new MedicalHistoryDTO
                {
                    PatientID = patientId,
                    PatientName = patient.FullName,
                    TotalAppointments = appointments.Count,
                    Appointments = appointmentHistories,
                    DoctorVisits = doctorVisits
                };
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting medical history");
                return StatusCode(500, new { message = "Error retrieving medical history", detail = ex.Message });
            }
        }

        [HttpGet("medical-history/{appointmentId}")]
        [Authorize(Roles = "patient")]
        public async Task<ActionResult<AppointmentHistoryDTO>> GetAppointmentDetail(int appointmentId)
        {
            try
            {
                var patientId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(patientId))
                {
                    return Unauthorized(new { message = "Patient not authenticated" });
                }
                // Get appointment
                var appointment = await _context.Appointments
                    .Include(a => a.Doctor)
                    .Include(a => a.Consultation)
                    .Include(a => a.Invoice)
                    .FirstOrDefaultAsync(a => a.AppointmentID == appointmentId && a.PatientID == patientId);
                if (appointment == null)
                {
                    return NotFound(new { message = "Appointment not found" });
                }
                // Lấy prescription nếu có
                var prescription = await _context.PrescriptionHeaders
                    .Include(ph => ph.PrescriptionItems)
                    .FirstOrDefaultAsync(ph => ph.AppointmentID == appointmentId);
                // Map sang DTO
                var result = new AppointmentHistoryDTO
                {
                    AppointmentID = appointment.AppointmentID,
                    AppointmentTime = appointment.AppointmentTime,
                    ConsultationType = appointment.ConsultationType,
                    Status = appointment.Status,
                    DoctorID = appointment.DoctorID,
                    DoctorName = appointment.Doctor?.FullName ?? "Unknown",
                    DoctorSpecialty = appointment.Doctor?.Specialty ?? "N/A",

                    Consultation = appointment.Consultation != null ? new ConsultationDetailsDTO
                    {
                        ConsultationID = appointment.Consultation.ConsultationID,
                        StartTime = appointment.Consultation.StartTime,
                        EndTime = appointment.Consultation.EndTime,
                        DoctorNotes = appointment.Consultation.DoctorNotes,
                        FollowUpDate = appointment.Consultation.FollowUpDate
                    } : null,

                    Prescription = prescription != null ? new PrescriptionSummaryDTO
                    {
                        PrescriptionHeaderID = prescription.PrescriptionHeaderID,
                        IssueDate = prescription.IssueDate,
                        MedicationCount = prescription.PrescriptionItems.Count,
                        MedicationNames = prescription.PrescriptionItems
                            .Select(pi => pi.MedicationName)
                            .ToList()
                    } : null,

                    Invoice = appointment.Invoice != null ? new InvoiceSummaryDTO
                    {
                        InvoiceID = appointment.Invoice.InvoiceID,
                        TotalAmount = appointment.Invoice.Amount,
                        PaymentStatus = appointment.Invoice.Status,
                        PaymentDate = appointment.Invoice.IssueDate
                    } : null
                };
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointment detail");
                return StatusCode(500, new { message = "Error retrieving appointment detail", detail = ex.Message });
            }
        }
    }
}
