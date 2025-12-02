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

            // Find appointments in the next 24 hours (for 24-hour reminder)
            var tomorrow = now.AddHours(24);
            var upcomingAppointments24h = await context.Appointments
                .Include(a => a.Doctor)
                .Include(a => a.Patient)
                .Where(a => a.Status == "Scheduled" 
                    && a.AppointmentTime >= now.AddHours(23.5)
                    && a.AppointmentTime <= tomorrow)
                .ToListAsync(stoppingToken);

            // Find appointments in the next 30 minutes (for urgent reminder)
            var urgentTime = now.AddMinutes(30);
            var upcomingAppointments30min = await context.Appointments
                .Include(a => a.Doctor)
                .Include(a => a.Patient)
                .Where(a => a.Status == "Scheduled" 
                    && a.AppointmentTime >= now.AddMinutes(25)
                    && a.AppointmentTime <= urgentTime)
                .ToListAsync(stoppingToken);

            _logger.LogInformation("Found {count24h} appointments in next 24h, {count30min} in next 30 minutes",
                upcomingAppointments24h.Count, upcomingAppointments30min.Count);

            // Process 24-hour reminders
            foreach (var appointment in upcomingAppointments24h)
            {
                if (stoppingToken.IsCancellationRequested) break;

                var reminderExists = await notificationService.CheckIfAppointmentReminderExistsAsync(
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

                    _logger.LogInformation("Sent 24h reminder to patient {PatientId} for appointment {AppointmentId}",
                        appointment.PatientID, appointment.AppointmentID);
                }
            }

            // Process 30-minute urgent reminders
            foreach (var appointment in upcomingAppointments30min)
            {
                if (stoppingToken.IsCancellationRequested) break;

                // Check if urgent reminder already sent in the last hour
                var recentReminder = await CheckRecentUrgentReminder(
                    context,
                    appointment.AppointmentID,
                    appointment.PatientID
                );

                if (!recentReminder)
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
            }
        }

        private async Task<bool> CheckRecentUrgentReminder(
            OHCPContext context,
            int appointmentId,
            string patientId)
        {
            var oneHourAgo = DateTime.UtcNow.AddHours(-1);

            return await context.Notifications
                .AnyAsync(n => n.UserId == patientId
                    && n.Message.Contains("appointment")
                    && n.CreatedAt >= oneHourAgo);
        }
    }
}
