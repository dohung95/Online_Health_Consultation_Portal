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

                // Query all prescription items with TotalSupplyDays > 0
                var prescriptionItems = await _context.PrescriptionItems
                    .Include(pi => pi.PrescriptionHeader)
                        .ThenInclude(ph => ph.Patient)
                    .Where(pi => pi.TotalSupplyDays > 0)
                    .ToListAsync();

                foreach (var item in prescriptionItems)
                {
                    // Calculate medication end date
                    var medicationEndDate = item.PrescriptionHeader.IssueDate.AddDays(item.TotalSupplyDays);
                    var daysRemaining = (medicationEndDate - today).Days;

                    // Check if below reminder threshold
                    if (daysRemaining <= REFILL_REMINDER_THRESHOLD_DAYS && daysRemaining >= 0)
                    {
                        // Check if notification already exists (avoid duplicates)
                        var existingNotification = await _context.Notifications
                            .AnyAsync(n => 
                                n.UserId == item.PrescriptionHeader.PatientID &&
                                n.Message.Contains($"refill {item.MedicationName}") &&
                                n.CreatedAt.Date == today);

                        if (!existingNotification)
                        {
                            // Create new notification
                            var notification = new Notification
                            {
                                UserId = item.PrescriptionHeader.PatientID,
                                Message = $"Time to refill {item.MedicationName}. Medication will run out on {medicationEndDate:MM/dd/yyyy}.",
                                IsRead = false,
                                CreatedAt = DateTime.UtcNow
                            };

                            _context.Notifications.Add(notification);
                            await _context.SaveChangesAsync();
                            notificationsCreated++;

                            // Send realtime notification via SignalR
                            try
                            {
                                await _hubContext.Clients.User(item.PrescriptionHeader.PatientID)
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
                                    item.PrescriptionHeader.PatientID);
                            }
                            catch (Exception ex)
                            {
                                _logger.LogError(ex, "Error sending realtime notification to patient {PatientId}",
                                    item.PrescriptionHeader.PatientID);
                            }

                            _logger.LogInformation(
                                "Created medication refill reminder for patient {PatientId}, medication {MedicationName}, {DaysRemaining} days remaining",
                                item.PrescriptionHeader.PatientID, item.MedicationName, daysRemaining);
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
