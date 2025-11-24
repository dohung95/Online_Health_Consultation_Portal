using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using OHCP_BK.Data;
using OHCP_BK.Models;
using OHCP_BK.Hubs;

namespace OHCP_BK.Services
{
    public class FollowUpReminderService : IFollowUpReminderService
    {
        private readonly OHCPContext _context;
        private readonly ILogger<FollowUpReminderService> _logger;
        private readonly IHubContext<NotificationHub> _hubContext;
        private const int FOLLOWUP_REMINDER_THRESHOLD_DAYS = 7;

        public FollowUpReminderService(
            OHCPContext context,
            ILogger<FollowUpReminderService> logger,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _logger = logger;
            _hubContext = hubContext;
        }

        public async Task<int> CheckAndCreateFollowUpRemindersAsync()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var notificationsCreated = 0;

                // Query all consultations with FollowUpDate
                var consultations = await _context.Consultations
                    .Where(c => c.FollowUpDate.HasValue)
                    .Include(c => c.Appointment)
                        .ThenInclude(a => a.Patient)
                    .ToListAsync();

                foreach (var consultation in consultations)
                {
                    if (!consultation.FollowUpDate.HasValue)
                        continue;

                    var followUpDate = consultation.FollowUpDate.Value.Date;
                    var daysUntilFollowUp = (followUpDate - today).Days;

                    // Check if below reminder threshold
                    if (daysUntilFollowUp <= FOLLOWUP_REMINDER_THRESHOLD_DAYS && daysUntilFollowUp >= 0)
                    {
                        // Check if notification already exists (avoid duplicates)
                        var existingNotification = await _context.Notifications
                            .AnyAsync(n => 
                                n.UserId == consultation.Appointment.Patient.PatientID &&
                                n.Message.Contains($"follow-up") &&
                                n.Message.Contains(followUpDate.ToString("MM/dd/yyyy")) &&
                                n.CreatedAt.Date == today);

                        if (!existingNotification)
                        {
                            // Create new notification
                            var notification = new Notification
                            {
                                UserId = consultation.Appointment.Patient.PatientID,
                                Message = $"You have a recommended follow-up appointment on {followUpDate:MM/dd/yyyy}. Please schedule an appointment.",
                                IsRead = false,
                                CreatedAt = DateTime.UtcNow
                            };

                            _context.Notifications.Add(notification);
                            await _context.SaveChangesAsync();
                            notificationsCreated++;

                            // Send realtime notification via SignalR
                            try
                            {
                                await _hubContext.Clients.User(consultation.Appointment.Patient.PatientID)
                                    .SendAsync("ReceiveNotification", new
                                    {
                                        notificationID = notification.NotificationID,
                                        message = notification.Message,
                                        isRead = notification.IsRead,
                                        createdAt = notification.CreatedAt,
                                        type = "follow_up"
                                    });

                                _logger.LogInformation(
                                    "Sent realtime notification to patient {PatientId}",
                                    consultation.Appointment.Patient.PatientID);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Error sending realtime notification to patient {PatientId}",
                                    consultation.Appointment.Patient.PatientID);
                            }

                            _logger.LogInformation(
                                "Created follow-up reminder for patient {PatientId}, follow-up date {FollowUpDate}, {DaysRemaining} days remaining",
                                consultation.Appointment.PatientID, followUpDate, daysUntilFollowUp);
                        }
                    }
                }

                _logger.LogInformation(
                    "Completed follow-up reminder check. Created {Count} new notifications",
                    notificationsCreated);

                return notificationsCreated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking and creating follow-up reminders");
                throw;
            }
        }
    }
}
