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

        /// <summary>
        /// POST /api/Appointment
        /// Create a new appointment (patient only)
        /// </summary>
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

                // Verify doctor exists
                var doctorExists = await _context.Doctors.AnyAsync(d => d.DoctorID == dto.DoctorID);
                if (!doctorExists)
                {
                    return NotFound("Doctor not found");
                }

                // Validate appointment time is in the future
                if (dto.AppointmentTime <= DateTime.UtcNow)
                {
                    return BadRequest("Appointment time must be in the future");
                }

                // Validate appointment time is within standard time slots
                var hour = dto.AppointmentTime.Hour;
                var isValidTimeSlot = (hour >= 7 && hour <= 11) || (hour >= 13 && hour <= 17);
                if (!isValidTimeSlot)
                {
                    return BadRequest("Appointment time must be within working hours (7-11 AM or 1-5 PM)");
                }

                // Check if the time slot is already booked for this doctor
                var isTimeSlotTaken = await _context.Appointments
                    .AnyAsync(a => a.DoctorID == dto.DoctorID 
                        && a.AppointmentTime.Date == dto.AppointmentTime.Date
                        && a.AppointmentTime.Hour == dto.AppointmentTime.Hour
                        && a.Status == "Scheduled");

                if (isTimeSlotTaken)
                {
                    return Conflict(new { message = "This time slot is already booked for the selected doctor" });
                }

                // Create appointment with auto-populated PatientID
                var appointment = new Appointment
                {
                    PatientID = userId,
                    DoctorID = dto.DoctorID,
                    AppointmentTime = dto.AppointmentTime,
                    ConsultationType = dto.ConsultationType,
                    Status = "Scheduled"
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetAppointment), new { id = appointment.AppointmentID }, new
                {
                    appointmentID = appointment.AppointmentID,
                    status = appointment.Status,
                    appointmentTime = appointment.AppointmentTime,
                    doctorID = appointment.DoctorID
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

        // DELETE: api/Appointment/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(id);
                if (appointment == null)
                {
                    return NotFound($"Appointment with ID {id} not found");
                }

                _context.Appointments.Remove(appointment);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting appointment {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
