using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using OHCP_BK.Data;
using OHCP_BK.Models;
using OHCP_BK.Dtos;
using OHCP_BK.Hubs;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PrescriptionController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<PrescriptionController> _logger;
        private readonly IHubContext<NotificationHub> _hubContext;

        public PrescriptionController(
            OHCPContext context, 
            ILogger<PrescriptionController> logger,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _logger = logger;
            _hubContext = hubContext;
        }

        // GET: api/Prescription
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PrescriptionHeaderResponseDTO>>> GetPrescriptions()
        {
            try
            {
                var headers = await _context.PrescriptionHeaders
                    .Include(ph => ph.PrescriptionItems)
                    .Include(ph => ph.Appointment)
                    .Include(ph => ph.Patient)
                    .ToListAsync();

                var response = headers.Select(h => new PrescriptionHeaderResponseDTO
                {
                    PrescriptionHeaderID = h.PrescriptionHeaderID,
                    AppointmentID = h.AppointmentID,
                    PatientID = h.PatientID,
                    IssueDate = h.IssueDate,
                    Medications = h.PrescriptionItems.Select(pi => new PrescriptionItemResponseDTO
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
                _logger.LogError($"Error getting prescriptions: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Prescription/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PrescriptionHeaderResponseDTO>> GetPrescription(int id)
        {
            try
            {
                var header = await _context.PrescriptionHeaders
                    .Include(ph => ph.PrescriptionItems)
                    .Include(ph => ph.Appointment)
                    .Include(ph => ph.Patient)
                    .FirstOrDefaultAsync(ph => ph.PrescriptionHeaderID == id);

                if (header == null)
                {
                    return NotFound($"Prescription with ID {id} not found");
                }

                var response = new PrescriptionHeaderResponseDTO
                {
                    PrescriptionHeaderID = header.PrescriptionHeaderID,
                    AppointmentID = header.AppointmentID,
                    PatientID = header.PatientID,
                    IssueDate = header.IssueDate,
                    Medications = header.PrescriptionItems.Select(pi => new PrescriptionItemResponseDTO
                    {
                        PrescriptionItemID = pi.PrescriptionItemID,
                        MedicationName = pi.MedicationName,
                        Dosage = pi.Dosage,
                        Instructions = pi.Instructions,
                        TotalSupplyDays = pi.TotalSupplyDays
                    }).ToList()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting prescription {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Prescription/create
        [HttpPost("create")]
        [Authorize(Roles = "doctor")]
        public async Task<ActionResult<PrescriptionHeaderResponseDTO>> CreatePrescriptionWithItems([FromBody] CreatePrescriptionDTO request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Validate medications list
                if (request.Medications == null || !request.Medications.Any())
                {
                    return BadRequest("At least one medication is required");
                }

                // Verify appointment exists and belongs to requesting doctor
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found");
                }

                var doctor = await _context.Doctors
                    .FirstOrDefaultAsync(d => d.DoctorID == userId);
                
                if (doctor == null)
                {
                    return Unauthorized("Doctor profile not found");
                }

                var appointment = await _context.Appointments
                    .FirstOrDefaultAsync(a => a.AppointmentID == request.AppointmentID && a.DoctorID == userId);

                if (appointment == null)
                {
                    return BadRequest("Appointment not found or does not belong to this doctor");
                }

                // Verify patient exists
                var patient = await _context.Patients.FindAsync(request.PatientID);
                if (patient == null)
                {
                    return BadRequest("Patient not found");
                }

                // Create PrescriptionHeader
                var prescriptionHeader = new PrescriptionHeader
                {
                    AppointmentID = request.AppointmentID,
                    PatientID = request.PatientID,
                    IssueDate = DateTime.Now
                };

                _context.PrescriptionHeaders.Add(prescriptionHeader);
                await _context.SaveChangesAsync();

                // Create PrescriptionItems
                var prescriptionItems = new List<PrescriptionItem>();
                foreach (var medication in request.Medications)
                {
                    var item = new PrescriptionItem
                    {
                        PrescriptionHeaderID = prescriptionHeader.PrescriptionHeaderID,
                        MedicationName = medication.MedicationName,
                        Dosage = medication.Dosage,
                        Instructions = medication.Instructions,
                        TotalSupplyDays = medication.TotalSupplyDays
                    };
                    prescriptionItems.Add(item);
                    _context.PrescriptionItems.Add(item);
                }

                await _context.SaveChangesAsync();

                // Create notification for patient
                var notification = new Notification
                {
                    UserId = request.PatientID,
                    Message = "Your doctor has created a new prescription. Please check your records.",
                    IsRead = false,
                    CreatedAt = DateTime.Now
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                // Commit transaction
                await transaction.CommitAsync();

                // Send real-time notification via SignalR
                try
                {
                    await _hubContext.Clients.User(request.PatientID).SendAsync("ReceiveNotification", new
                    {
                        notificationId = notification.NotificationID,
                        eventType = "PRESCRIPTION_CREATED",
                        message = notification.Message,
                        prescriptionHeaderId = prescriptionHeader.PrescriptionHeaderID,
                        timestamp = notification.CreatedAt
                    });
                }
                catch (Exception signalREx)
                {
                    _logger.LogWarning($"Failed to send SignalR notification: {signalREx.Message}");
                    // Don't fail the request if SignalR fails
                }

                // Prepare response DTO
                var response = new PrescriptionHeaderResponseDTO
                {
                    PrescriptionHeaderID = prescriptionHeader.PrescriptionHeaderID,
                    AppointmentID = request.AppointmentID,
                    PatientID = prescriptionHeader.PatientID,
                    IssueDate = prescriptionHeader.IssueDate,
                    Medications = prescriptionItems.Select(pi => new PrescriptionItemResponseDTO
                    {
                        PrescriptionItemID = pi.PrescriptionItemID,
                        MedicationName = pi.MedicationName,
                        Dosage = pi.Dosage,
                        Instructions = pi.Instructions,
                        TotalSupplyDays = pi.TotalSupplyDays
                    }).ToList()
                };

                return CreatedAtAction(nameof(GetPrescriptionHeader), 
                    new { id = prescriptionHeader.PrescriptionHeaderID }, response);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError($"Error creating prescription: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Prescription/header/5
        [HttpGet("header/{id}")]
        public async Task<ActionResult<PrescriptionHeaderResponseDTO>> GetPrescriptionHeader(int id)
        {
            try
            {
                var header = await _context.PrescriptionHeaders
                    .Include(ph => ph.PrescriptionItems)
                    .Include(ph => ph.Appointment)
                    .Include(ph => ph.Patient)
                    .FirstOrDefaultAsync(ph => ph.PrescriptionHeaderID == id);

                if (header == null)
                {
                    return NotFound($"Prescription header with ID {id} not found");
                }

                var response = new PrescriptionHeaderResponseDTO
                {
                    PrescriptionHeaderID = header.PrescriptionHeaderID,
                    AppointmentID = header.AppointmentID,
                    PatientID = header.PatientID,
                    IssueDate = header.IssueDate,
                    Medications = header.PrescriptionItems.Select(pi => new PrescriptionItemResponseDTO
                    {
                        PrescriptionItemID = pi.PrescriptionItemID,
                        MedicationName = pi.MedicationName,
                        Dosage = pi.Dosage,
                        Instructions = pi.Instructions,
                        TotalSupplyDays = pi.TotalSupplyDays
                    }).ToList()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting prescription header {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Prescription/header/{id}
        // PUT: api/Prescription/header/{id}
        [HttpPut("header/{id}")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> UpdatePrescription(int id, [FromBody] CreatePrescriptionDTO request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingHeader = await _context.PrescriptionHeaders
                    .Include(ph => ph.PrescriptionItems)
                    .FirstOrDefaultAsync(ph => ph.PrescriptionHeaderID == id);

                if (existingHeader == null)
                {
                    return NotFound($"Prescription with ID {id} not found");
                }

                // Update header
                existingHeader.AppointmentID = request.AppointmentID;
                existingHeader.PatientID = request.PatientID;

                // Remove old items
                _context.PrescriptionItems.RemoveRange(existingHeader.PrescriptionItems);

                // Add new items
                foreach (var medication in request.Medications)
                {
                    var item = new PrescriptionItem
                    {
                        PrescriptionHeaderID = existingHeader.PrescriptionHeaderID,
                        MedicationName = medication.MedicationName,
                        Dosage = medication.Dosage,
                        Instructions = medication.Instructions,
                        TotalSupplyDays = medication.TotalSupplyDays
                    };
                    _context.PrescriptionItems.Add(item);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError($"Error updating prescription {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Prescription/header/{id}
        [HttpDelete("header/{id}")]
        [Authorize(Roles = "Doctor,Admin")]
        public async Task<IActionResult> DeletePrescription(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var header = await _context.PrescriptionHeaders
                    .Include(ph => ph.PrescriptionItems)
                    .FirstOrDefaultAsync(ph => ph.PrescriptionHeaderID == id);

                if (header == null)
                {
                    return NotFound($"Prescription with ID {id} not found");
                }

                // Remove all items first
                _context.PrescriptionItems.RemoveRange(header.PrescriptionItems);
                
                // Remove header
                _context.PrescriptionHeaders.Remove(header);
                
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError($"Error deleting prescription {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
