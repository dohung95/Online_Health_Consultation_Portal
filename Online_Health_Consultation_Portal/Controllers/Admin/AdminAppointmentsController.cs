using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.DTOs.Admin;
using OHCP_BK.Models;

namespace OHCP_BK.Controllers.Admin
{
    [Route("api/admin/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminAppointmentsController : ControllerBase
    {
        private readonly OHCPContext _context;

        public AdminAppointmentsController(OHCPContext context)
        {
            _context = context;
        }

        // GET: api/admin/adminappointments/stats
        [HttpGet("stats")]
        public async Task<ActionResult<AppointmentStatsDto>> GetAppointmentStats()
        {
            try
            {
                var today = DateTime.Today;

                var todayAppointments = await _context.Appointments
                    .Where(a => a.AppointmentTime.Date == today)
                    .CountAsync();

                var pendingApproval = await _context.Appointments
                    .Where(a => a.Status == "Pending" || a.Status == "Scheduled")
                    .CountAsync();

                var completed = await _context.Appointments
                    .Where(a => a.Status == "Completed")
                    .CountAsync();

                var cancelled = await _context.Appointments
                    .Where(a => a.Status == "Cancelled")
                    .CountAsync();

                return Ok(new AppointmentStatsDto
                {
                    TodayAppointments = todayAppointments,
                    PendingApproval = pendingApproval,
                    Completed = completed,
                    Cancelled = cancelled
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching stats", details = ex.Message });
            }
        }

        // GET: api/admin/adminappointments
        [HttpGet]
        public async Task<ActionResult<AppointmentListResponseDto>> GetAppointments(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] DateTime? date = null,
            [FromQuery] string? status = null,
            [FromQuery] string? doctorId = null)
        {
            try
            {
                var query = _context.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Doctor)
                    .AsQueryable();

                // Search filter
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(a =>
                        a.Patient.FullName.Contains(searchTerm) ||
                        a.Doctor.FullName.Contains(searchTerm) ||
                        a.AppointmentID.ToString().Contains(searchTerm)
                    );
                }

                // Date filter
                if (date.HasValue)
                {
                    query = query.Where(a => a.AppointmentTime.Date == date.Value.Date);
                }

                // Status filter
                if (!string.IsNullOrWhiteSpace(status) && status != "All Status")
                {
                    query = query.Where(a => a.Status == status);
                }

                // Doctor filter
                if (!string.IsNullOrWhiteSpace(doctorId) && doctorId != "All Doctors")
                {
                    query = query.Where(a => a.DoctorID == doctorId);
                }

                // Sort by appointment time descending (newest first)
                query = query.OrderByDescending(a => a.AppointmentTime);

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var appointments = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(a => new AppointmentAdminDto
                    {
                        AppointmentID = a.AppointmentID,
                        PatientID = a.PatientID,
                        PatientName = a.Patient.FullName,
                        DoctorID = a.DoctorID,
                        DoctorName = a.Doctor.FullName,
                        Department = a.Doctor.Specialty,
                        AppointmentTime = a.AppointmentTime,
                        Date = a.AppointmentTime.ToString("yyyy-MM-dd"),
                        Time = a.AppointmentTime.ToString("HH:mm"),
                        ConsultationType = a.ConsultationType,
                        Status = a.Status
                    })
                    .ToListAsync();

                return Ok(new AppointmentListResponseDto
                {
                    Appointments = appointments,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalPages = totalPages
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching appointments", details = ex.Message });
            }
        }

        // GET: api/admin/adminappointments/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<AppointmentAdminDto>> GetAppointment(int id)
        {
            try
            {
                var appointment = await _context.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Doctor)
                    .FirstOrDefaultAsync(a => a.AppointmentID == id);

                if (appointment == null)
                {
                    return NotFound(new { error = "Appointment not found" });
                }

                var appointmentDto = new AppointmentAdminDto
                {
                    AppointmentID = appointment.AppointmentID,
                    PatientID = appointment.PatientID,
                    PatientName = appointment.Patient.FullName,
                    DoctorID = appointment.DoctorID,
                    DoctorName = appointment.Doctor.FullName,
                    Department = appointment.Doctor.Specialty,
                    AppointmentTime = appointment.AppointmentTime,
                    Date = appointment.AppointmentTime.ToString("yyyy-MM-dd"),
                    Time = appointment.AppointmentTime.ToString("HH:mm"),
                    ConsultationType = appointment.ConsultationType,
                    Status = appointment.Status
                };

                return Ok(appointmentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching appointment", details = ex.Message });
            }
        }

        // POST: api/admin/adminappointments
        [HttpPost]
        public async Task<ActionResult<AppointmentAdminDto>> CreateAppointment(CreateAppointmentAdminDto dto)
        {
            try
            {
                // Validate patient exists
                var patientExists = await _context.Patients.AnyAsync(p => p.PatientID == dto.PatientID);
                if (!patientExists)
                {
                    return BadRequest(new { error = "Patient not found" });
                }

                // Validate doctor exists
                var doctorExists = await _context.Doctors.AnyAsync(d => d.DoctorID == dto.DoctorID);
                if (!doctorExists)
                {
                    return BadRequest(new { error = "Doctor not found" });
                }

                // Check if doctor is available at that time
                var hasConflict = await _context.Appointments
                    .AnyAsync(a =>
                        a.DoctorID == dto.DoctorID &&
                        a.AppointmentTime == dto.AppointmentTime &&
                        a.Status != "Cancelled");

                if (hasConflict)
                {
                    return BadRequest(new { error = "Doctor is not available at this time" });
                }

                var appointment = new Appointment
                {
                    PatientID = dto.PatientID,
                    DoctorID = dto.DoctorID,
                    AppointmentTime = dto.AppointmentTime,
                    ConsultationType = dto.ConsultationType,
                    Status = dto.Status
                };

                _context.Appointments.Add(appointment);
                await _context.SaveChangesAsync();

                // Reload to get patient and doctor info
                var createdAppointment = await _context.Appointments
                    .Include(a => a.Patient)
                    .Include(a => a.Doctor)
                    .FirstOrDefaultAsync(a => a.AppointmentID == appointment.AppointmentID);

                var appointmentDto = new AppointmentAdminDto
                {
                    AppointmentID = createdAppointment!.AppointmentID,
                    PatientID = createdAppointment.PatientID,
                    PatientName = createdAppointment.Patient.FullName,
                    DoctorID = createdAppointment.DoctorID,
                    DoctorName = createdAppointment.Doctor.FullName,
                    Department = createdAppointment.Doctor.Specialty,
                    AppointmentTime = createdAppointment.AppointmentTime,
                    Date = createdAppointment.AppointmentTime.ToString("yyyy-MM-dd"),
                    Time = createdAppointment.AppointmentTime.ToString("HH:mm"),
                    ConsultationType = createdAppointment.ConsultationType,
                    Status = createdAppointment.Status
                };

                return CreatedAtAction(nameof(GetAppointment), new { id = appointment.AppointmentID }, appointmentDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while creating appointment", details = ex.Message });
            }
        }

        // PUT: api/admin/adminappointments/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAppointment(int id, UpdateAppointmentAdminDto dto)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(id);

                if (appointment == null)
                {
                    return NotFound(new { error = "Appointment not found" });
                }

                // Update fields if provided
                if (dto.AppointmentTime.HasValue)
                {
                    // Check for conflicts if changing time
                    var hasConflict = await _context.Appointments
                        .AnyAsync(a =>
                            a.AppointmentID != id &&
                            a.DoctorID == appointment.DoctorID &&
                            a.AppointmentTime == dto.AppointmentTime.Value &&
                            a.Status != "Cancelled");

                    if (hasConflict)
                    {
                        return BadRequest(new { error = "Doctor is not available at this time" });
                    }

                    appointment.AppointmentTime = dto.AppointmentTime.Value;
                }

                if (!string.IsNullOrWhiteSpace(dto.ConsultationType))
                {
                    appointment.ConsultationType = dto.ConsultationType;
                }

                if (!string.IsNullOrWhiteSpace(dto.Status))
                {
                    appointment.Status = dto.Status;
                }

                // Mark entity as modified to ensure EF Core tracks changes
                _context.Entry(appointment).State = EntityState.Modified;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Appointment updated successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while updating appointment", details = ex.Message });
            }
        }

        // DELETE: api/admin/adminappointments/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppointment(int id)
        {
            try
            {
                var appointment = await _context.Appointments.FindAsync(id);

                if (appointment == null)
                {
                    return NotFound(new { error = "Appointment not found" });
                }

                _context.Appointments.Remove(appointment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Appointment deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while deleting appointment", details = ex.Message });
            }
        }
    }
}
