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
    public class AppointmentController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<AppointmentController> _logger;

        public AppointmentController(OHCPContext context, ILogger<AppointmentController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Appointment
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Appointment>>> GetAppointments()
        {
            try
            {
                var appointments = await _context.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Doctor)
                    .ToListAsync();
                return Ok(appointments);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting appointments: {ex.Message}");
                return StatusCode(500, "Internal server error");
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
            // Working hours: Morning 7am-11am, Afternoon 1pm-5pm
            var startHours = new[] { 7, 8, 9, 10, 13, 14, 15, 16 };
            var resultSlots = new List<TimeSlotDTO>();

            // Get the doctor's BOOKED appointments for that day
            var bookedTimes = await _context.Appointments
                .Where(a => a.DoctorID == doctorId
                            && a.AppointmentTime.Date == date.Date
                            && a.Status != AppointmentConstants.StatusCancelled) // Ignore canceled appointments
                .Select(a => a.AppointmentTime.Hour)
                .ToListAsync();

            foreach (var hour in startHours)
            {
                var slotTime = date.Date.AddHours(hour);

                // Past test logic: If the selected date is today, only show future time
                if (date.Date == DateTime.UtcNow.Date && slotTime <= DateTime.UtcNow.AddHours(7)) // +7 for VN timezone
                {
                    continue;
                }

                resultSlots.Add(new TimeSlotDTO
                {
                    StartTime = slotTime,
                    EndTime = slotTime.AddHours(1),
                    IsAvailable = !bookedTimes.Contains(hour)
                });
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

                // Validate work hour (7h-11h, 13h-17h)
                var hour = dto.AppointmentTime.Hour;
                var isValidTimeSlot = (hour >= 7 && hour <= 11) || (hour >= 13 && hour <= 17);
                if (!isValidTimeSlot)
                {
                    return BadRequest("Appointment time must be within working hours (7-11 AM or 1-5 PM)");
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
                    ConsultationType = dto.ConsultationType, // Video Call/Audio Call/Chat
                    Status = AppointmentConstants.StatusScheduled // Constant: "Scheduled"
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                // ---------------------------------------------------------
                // TODO: Integration with calendar system (Yêu c?u ?? bài)
                // You can Notification ho?c send Email confirm
                // Ex: _emailService.SendBookingConfirmation(userId, appointment);
                // ---------------------------------------------------------

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
    }
}
