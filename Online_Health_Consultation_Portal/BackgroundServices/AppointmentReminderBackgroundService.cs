using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Services;

namespace OHCP_BK.BackgroundServices
{
    public class AppointmentReminderBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AppointmentReminderBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(5); // Check every 5 minutes

        public AppointmentReminderBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<AppointmentReminderBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Appointment Reminder Background Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Appointment Reminder Service checking at: {time}", DateTimeOffset.Now);
                    await ProcessAppointmentReminders(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred in Appointment Reminder Background Service.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("Appointment Reminder Background Service is stopping.");
        }

        private async Task ProcessAppointmentReminders(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<OHCPContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var now = DateTime.UtcNow;

            // Find appointments exactly 1 day ahead (for 1-day advance reminder)
            var oneDayAhead = now.AddHours(24);
            var upcomingAppointments1Day = await context.Appointments
                .Include(a => a.Doctor)
                .Include(a => a.Patient)
                .Where(a => a.Status == "Scheduled" 
                    && a.AppointmentTime >= now.AddHours(23.5)
                    && a.AppointmentTime <= oneDayAhead.AddHours(0.5))
                .ToListAsync(stoppingToken);

            // Find appointments happening today (same date reminder)
            // Only send at the start of the day (between midnight and 10 AM)
            var currentHour = DateTime.UtcNow.Hour;
            var todayStart = DateTime.UtcNow.Date;
            var todayEnd = todayStart.AddDays(1);
            
            List<OHCP_BK.Models.Appointment> appointmentsToday = new List<OHCP_BK.Models.Appointment>();
            
            // Only check for today's appointments during morning hours (0-10 AM)
            if (currentHour >= 0 && currentHour < 10)
            {
                appointmentsToday = await context.Appointments
                    .Include(a => a.Doctor)
                    .Include(a => a.Patient)
                    .Where(a => a.Status == "Scheduled" 
                        && a.AppointmentTime >= todayStart
                        && a.AppointmentTime < todayEnd
                        && a.AppointmentTime > now) // Only future appointments today
                    .ToListAsync(stoppingToken);
            }

            // Find appointments in the next 30 minutes (for urgent reminder)
            var urgentTime = now.AddMinutes(30);
            var upcomingAppointments30min = await context.Appointments
                .Include(a => a.Doctor)
                .Include(a => a.Patient)
                .Where(a => a.Status == "Scheduled" 
                    && a.AppointmentTime >= now.AddMinutes(25)
                    && a.AppointmentTime <= urgentTime)
                .ToListAsync(stoppingToken);

            _logger.LogInformation("Found {count1Day} appointments in 1 day, {countToday} today, {count30min} in next 30 minutes",
                upcomingAppointments1Day.Count, appointmentsToday.Count, upcomingAppointments30min.Count);

            // Process 1-day advance reminders
            foreach (var appointment in upcomingAppointments1Day)
            {
                if (stoppingToken.IsCancellationRequested) break;

                // Check if ANY reminder was sent today for this appointment
                var reminderExists = await CheckReminderSentToday(
                    context,
                    appointment.AppointmentID,
                    appointment.PatientID
                );

                if (!reminderExists)
                {
                    var notification = new AppointmentNotificationDto
                    {
                        AppointmentId = appointment.AppointmentID,
                        DoctorName = appointment.Doctor.FullName,
                        Specialty = appointment.Doctor.Specialty,
                        AppointmentDateTime = appointment.AppointmentTime,
                        Location = appointment.ConsultationType == "Online" 
                            ? "Online Consultation" 
                            : "Clinic"
                    };

                    await notificationService.SendAppointmentNotificationAsync(
                        appointment.PatientID,
                        notification
                    );

                    _logger.LogInformation("Sent 1-day advance reminder to patient {PatientId} for appointment {AppointmentId}",
                        appointment.PatientID, appointment.AppointmentID);
                }
                else
                {
                    _logger.LogDebug("Skipped 1-day reminder for appointment {AppointmentId} - already sent today",
                        appointment.AppointmentID);
                }
            }

            // Process same-day reminders (morning reminder for appointments today)
            foreach (var appointment in appointmentsToday)
            {
                if (stoppingToken.IsCancellationRequested) break;

                // Check if ANY reminder was sent today for this appointment
                var reminderExists = await CheckReminderSentToday(
                    context,
                    appointment.AppointmentID,
                    appointment.PatientID
                );

                if (!reminderExists)
                {
                    var notification = new AppointmentNotificationDto
                    {
                        AppointmentId = appointment.AppointmentID,
                        DoctorName = appointment.Doctor.FullName,
                        Specialty = appointment.Doctor.Specialty,
                        AppointmentDateTime = appointment.AppointmentTime,
                        Location = appointment.ConsultationType == "Online" 
                            ? "Online Consultation" 
                            : "Clinic"
                    };

                    await notificationService.SendAppointmentNotificationAsync(
                        appointment.PatientID,
                        notification
                    );

                    _logger.LogInformation("Sent same-day reminder to patient {PatientId} for appointment {AppointmentId}",
                        appointment.PatientID, appointment.AppointmentID);
                }
                else
                {
                    _logger.LogDebug("Skipped same-day reminder for appointment {AppointmentId} - already sent today",
                        appointment.AppointmentID);
                }
            }

            // Process 30-minute urgent reminders
            foreach (var appointment in upcomingAppointments30min)
            {
                if (stoppingToken.IsCancellationRequested) break;

                // Check if ANY reminder was sent today for this appointment
                var reminderExists = await CheckReminderSentToday(
                    context,
                    appointment.AppointmentID,
                    appointment.PatientID
                );

                if (!reminderExists)
                {
                    var notification = new AppointmentNotificationDto
                    {
                        AppointmentId = appointment.AppointmentID,
                        DoctorName = appointment.Doctor.FullName,
                        Specialty = appointment.Doctor.Specialty,
                        AppointmentDateTime = appointment.AppointmentTime,
                        Location = appointment.ConsultationType == "Online" 
                            ? "Online Consultation" 
                            : "Clinic"
                    };

                    await notificationService.SendAppointmentNotificationAsync(
                        appointment.PatientID,
                        notification
                    );

                    _logger.LogInformation("Sent URGENT 30min reminder to patient {PatientId} for appointment {AppointmentId}",
                        appointment.PatientID, appointment.AppointmentID);
                }
                else
                {
                    _logger.LogDebug("Skipped 30min reminder for appointment {AppointmentId} - already sent today",
                        appointment.AppointmentID);
                }
            }
        }

        private async Task<bool> CheckReminderSentToday(
            OHCPContext context,
            int appointmentId,
            string patientId)
        {
            // Check if ANY reminder was already sent TODAY for this specific appointment
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            return await context.Notifications
                .AnyAsync(n => n.UserId == patientId
                    && n.AppointmentId == appointmentId
                    && n.CreatedAt >= today
                    && n.CreatedAt < tomorrow);
        }
    }
}
