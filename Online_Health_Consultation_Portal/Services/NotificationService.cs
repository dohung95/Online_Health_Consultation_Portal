using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Hubs;
using OHCP_BK.Models;

namespace OHCP_BK.Services
{
    public interface INotificationService
    {
        Task SendMedicationReminderAsync(string patientId, MedicationReminderDto reminder);
        Task SendPrescriptionReminderAsync(string patientId, List<MedicationReminderDto> medications, int prescriptionId, DateTime issueDate);
        Task SendAppointmentNotificationAsync(string patientId, AppointmentNotificationDto notification);
        Task SendAppointmentNotificationAsync(string doctorId, int appointmentId, string patientName, DateTime appointmentTime, string consultationType);
        Task<bool> CheckIfReminderExistsAsync(string userId, string message, DateTime date);
        Task<bool> CheckIfAppointmentReminderExistsAsync(int appointmentId, string userId);
    }

    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<NotificationService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public NotificationService(
            IHubContext<NotificationHub> hubContext,
            ILogger<NotificationService> logger,
            IServiceScopeFactory scopeFactory)
        {
            _hubContext = hubContext;
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        public async Task SendMedicationReminderAsync(string patientId, MedicationReminderDto reminder)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<OHCPContext>();

                // Create message
                var remainingDays = CalculateRemainingDays(reminder.IssueDate, reminder.TotalSupplyDays);
                var message = $"{reminder.MedicationName} - {reminder.Dosage}: use {reminder.Instructions}. {remainingDays} days remaining.";

                // Save to database
                var notification = new Notification
                {
                    UserId = patientId,
                    Message = message,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                context.Notifications.Add(notification);
                await context.SaveChangesAsync();

                // Send realtime via SignalR
                await _hubContext.Clients.User(patientId).SendAsync("ReceiveMedicationReminder", reminder);
                
                _logger.LogInformation("Medication reminder sent and saved for patient {PatientId}, prescription {PrescriptionId}", 
                    patientId, reminder.PrescriptionId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending medication reminder to patient {PatientId}", patientId);
                throw;
            }
        }

        public async Task SendPrescriptionReminderAsync(string patientId, List<MedicationReminderDto> medications, int prescriptionId, DateTime issueDate)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<OHCPContext>();

                // Calculate remaining days (use the longest supply period)
                var maxSupplyDays = medications.Max(m => m.TotalSupplyDays);
                var remainingDays = CalculateRemainingDays(issueDate, maxSupplyDays);

                // Simple message for prescription reminder
                var message = $"You have a prescription #{prescriptionId} with {medications.Count} medication(s). {remainingDays} day(s) remaining.";

                // Save to database
                var notification = new Notification
                {
                    UserId = patientId,
                    Message = message,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };

                context.Notifications.Add(notification);
                await context.SaveChangesAsync();

                // Send realtime via SignalR with prescription-level data
                await _hubContext.Clients.User(patientId).SendAsync("ReceiveMedicationReminder", new
                {
                    prescriptionId = prescriptionId,
                    medicationCount = medications.Count,
                    remainingDays = remainingDays,
                    message = message
                });
                
                _logger.LogInformation("Prescription reminder sent and saved for patient {PatientId}, prescription {PrescriptionId} with {Count} medications", 
                    patientId, prescriptionId, medications.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending prescription reminder to patient {PatientId}", patientId);
                throw;
            }
        }

        public async Task SendAppointmentNotificationAsync(string patientId, AppointmentNotificationDto notification)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<OHCPContext>();

                // Create message
                var timeUntil = notification.AppointmentDateTime - DateTime.UtcNow;
                string timeMessage;
                
                if (timeUntil.TotalHours < 1)
                {
                    timeMessage = $"in {(int)timeUntil.TotalMinutes} minutes";
                }
                else if (timeUntil.TotalHours < 2)
                {
                    timeMessage = $"in about 1 hour";
                }
                else if (timeUntil.TotalHours < 24)
                {
                    timeMessage = $"in {(int)timeUntil.TotalHours} hours";
                }
                else if (timeUntil.TotalHours >= 23 && timeUntil.TotalHours <= 25)
                {
                    timeMessage = $"in 1 day";
                }
                else if (timeUntil.TotalDays < 1)
                {
                    timeMessage = $"today";
                }
                else
                {
                    timeMessage = $"in {(int)timeUntil.TotalDays} days";
                }

                var message = $"You have an appointment with Dr. {notification.DoctorName} " +
                             $"({notification.Specialty}) {timeMessage} at {notification.AppointmentDateTime:MMM dd, yyyy h:mm tt}.";

                // Save to database
                var dbNotification = new Notification
                {
                    UserId = patientId,
                    Message = message,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    AppointmentId = notification.AppointmentId
                };

                context.Notifications.Add(dbNotification);
                await context.SaveChangesAsync();

                // Send realtime via SignalR with full data including message
                var signalRData = new
                {
                    appointmentId = notification.AppointmentId,
                    doctorName = notification.DoctorName,
                    specialty = notification.Specialty,
                    appointmentDateTime = notification.AppointmentDateTime,
                    location = notification.Location,
                    message = message
                };
                
                await _hubContext.Clients.User(patientId).SendAsync("ReceiveAppointmentNotification", signalRData);
                
                _logger.LogInformation("Appointment notification sent and saved for patient {PatientId}, appointment {AppointmentId}", 
                    patientId, notification.AppointmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending appointment notification to patient {PatientId}", patientId);
                throw;
            }
        }

        public async Task SendAppointmentNotificationAsync(string doctorId, int appointmentId, string patientName, DateTime appointmentTime, string consultationType)
        {
            try
            {
                _logger.LogInformation("📤 Attempting to send appointment notification to doctorId: {DoctorId} for appointmentId: {AppointmentId}", 
                    doctorId, appointmentId);
                
                var notification = new Notification
                {
                    UserId = doctorId,
                    Message = $"New appointment from {patientName} - {consultationType} at {appointmentTime:MMM dd, yyyy h:mm tt}",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow,
                    AppointmentId = appointmentId
                };

                using (var scope = _scopeFactory.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<OHCPContext>();
                    context.Notifications.Add(notification);
                    await context.SaveChangesAsync();
                    _logger.LogInformation("✅ Notification saved to database for doctor {DoctorId}", doctorId);
                }

                // Send real-time notification via SignalR
                var notificationData = new
                {
                    appointmentId = appointmentId,
                    patientName = patientName,
                    appointmentTime = appointmentTime,
                    consultationType = consultationType,
                    message = notification.Message
                };
                
                _logger.LogInformation("📡 Sending SignalR notification to User({DoctorId}) with data: {@NotificationData}", 
                    doctorId, notificationData);
                
                await _hubContext.Clients.User(doctorId).SendAsync("ReceiveAppointmentNotification", notificationData);

                _logger.LogInformation("✅ SignalR notification sent successfully to doctor {DoctorId} for appointment {AppointmentId}", 
                    doctorId, appointmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Error sending appointment notification to doctor {DoctorId}", doctorId);
            }
        }

        public async Task<bool> CheckIfReminderExistsAsync(string userId, string medicationName, DateTime date)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<OHCPContext>();

            var today = date.Date;
            var tomorrow = today.AddDays(1);

            return await context.Notifications
                .AnyAsync(n => n.UserId == userId 
                    && n.Message.Contains(medicationName)
                    && n.CreatedAt >= today 
                    && n.CreatedAt < tomorrow);
        }

        public async Task<bool> CheckIfAppointmentReminderExistsAsync(int appointmentId, string userId)
        {
            using var scope = _scopeFactory.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<OHCPContext>();

            // Check if notification exists for this specific appointment TODAY
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);

            return await context.Notifications
                .AnyAsync(n => n.UserId == userId 
                    && n.AppointmentId == appointmentId
                    && n.CreatedAt >= today
                    && n.CreatedAt < tomorrow);
        }

        private int CalculateRemainingDays(DateTime issueDate, int totalSupplyDays)
        {
            var endDate = issueDate.AddDays(totalSupplyDays);
            var remaining = (endDate - DateTime.UtcNow).Days;
            return Math.Max(0, remaining);
        }
    }

    // DTOs for notifications
    public class MedicationReminderDto
    {
        public int PrescriptionId { get; set; }
        public string MedicationName { get; set; } = string.Empty;
        public string Dosage { get; set; } = string.Empty;
        public string Instructions { get; set; } = string.Empty;
        public DateTime IssueDate { get; set; }
        public int TotalSupplyDays { get; set; }
    }

    public class AppointmentNotificationDto
    {
        public int AppointmentId { get; set; }
        public string DoctorName { get; set; } = string.Empty;
        public string? Specialty { get; set; }
        public DateTime AppointmentDateTime { get; set; }
        public string? Location { get; set; }
    }
}
