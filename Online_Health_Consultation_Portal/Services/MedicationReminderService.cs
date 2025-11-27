using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using OHCP_BK.Data;
using OHCP_BK.Models;
using OHCP_BK.Hubs;

namespace OHCP_BK.Services
{
    public class MedicationReminderService : IMedicationReminderService
    {
        private readonly OHCPContext _context;
        private readonly ILogger<MedicationReminderService> _logger;
        private readonly IHubContext<NotificationHub> _hubContext;
        private const int REFILL_REMINDER_THRESHOLD_DAYS = 5;

        public MedicationReminderService(
            OHCPContext context,
            ILogger<MedicationReminderService> logger,
            IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _logger = logger;
            _hubContext = hubContext;
        }

        public async Task<int> CheckAndCreateRefillRemindersAsync()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var notificationsCreated = 0;

                // Query all prescriptions with TotalSupplyDays > 0
                var prescriptions = await _context.Prescriptions
                    .Where(p => p.TotalSupplyDays > 0)
                    .Include(p => p.Patient)
                    .ToListAsync();

                foreach (var prescription in prescriptions)
                {
                    // Calculate medication end date
                    var medicationEndDate = prescription.IssueDate.AddDays(prescription.TotalSupplyDays);
                    var daysRemaining = (medicationEndDate - today).Days;

                    // Check if below reminder threshold
                    if (daysRemaining <= REFILL_REMINDER_THRESHOLD_DAYS && daysRemaining >= 0)
                    {
                        // Check if notification already exists (avoid duplicates)
                        var existingNotification = await _context.Notifications
                            .AnyAsync(n => 
                                n.UserId == prescription.Patient.PatientID &&
                                n.Message.Contains($"refill {prescription.MedicationName}") &&
                                n.CreatedAt.Date == today);

                        if (!existingNotification)
                        {
                            // Create new notification
                            var notification = new Notification
                            {
                                UserId = prescription.Patient.PatientID,
                                Message = $"Time to refill {prescription.MedicationName}. Medication will run out on {medicationEndDate:MM/dd/yyyy}.",
                                IsRead = false,
                                CreatedAt = DateTime.UtcNow
                            };

                            _context.Notifications.Add(notification);
                            await _context.SaveChangesAsync();
                            notificationsCreated++;

                            // Send realtime notification via SignalR
                            try
                            {
                                await _hubContext.Clients.User(prescription.Patient.PatientID)
                                    .SendAsync("ReceiveNotification", new
                                    {
                                        notificationID = notification.NotificationID,
                                        message = notification.Message,
                                        isRead = notification.IsRead,
                                        createdAt = notification.CreatedAt,
                                        type = "medication_refill"
                                    });

                                _logger.LogInformation(
                                    "Sent realtime notification to patient {PatientId}",
                                    prescription.Patient.PatientID);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Error sending realtime notification to patient {PatientId}",
                                    prescription.Patient.PatientID);
                            }

                            _logger.LogInformation(
                                "Created medication refill reminder for patient {PatientId}, medication {MedicationName}, {DaysRemaining} days remaining",
                                prescription.PatientID, prescription.MedicationName, daysRemaining);
                        }
                    }
                }

                _logger.LogInformation(
                    "Completed medication refill reminder check. Created {Count} new notifications",
                    notificationsCreated);

                return notificationsCreated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking and creating medication refill reminders");
                throw;
            }
        }
    }
}
