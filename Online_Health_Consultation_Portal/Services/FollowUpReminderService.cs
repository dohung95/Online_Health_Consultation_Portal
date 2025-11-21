using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;

using OHCP_BK.Models;

namespace OHCP_BK.Services
{
    public class FollowUpReminderService : IFollowUpReminderService
    {
        private readonly OHCPContext _context;
        private readonly ILogger<FollowUpReminderService> _logger;
        private const int FOLLOWUP_REMINDER_THRESHOLD_DAYS = 7;

        public FollowUpReminderService(
            OHCPContext context,
            ILogger<FollowUpReminderService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> CheckAndCreateFollowUpRemindersAsync()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var notificationsCreated = 0;

                // Truy vấn tất cả phiên tư vấn có FollowUpDate
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

                    // Kiểm tra nếu còn dưới ngưỡng nhắc nhở
                    if (daysUntilFollowUp <= FOLLOWUP_REMINDER_THRESHOLD_DAYS && daysUntilFollowUp >= 0)
                    {
                        // Kiểm tra xem đã có thông báo chưa (tránh tạo trùng)
                        var existingNotification = await _context.Notifications
                            .AnyAsync(n => 
                                n.UserId == consultation.Appointment.Patient.PatientID &&
                                n.Message.Contains($"tái khám") &&
                                n.Message.Contains(followUpDate.ToString("dd/MM/yyyy")) &&
                                n.CreatedAt.Date == today);

                        if (!existingNotification)
                        {
                            // Tạo thông báo mới
                            var notification = new Notification
                            {
                                UserId = consultation.Appointment.Patient.PatientID,
                                Message = $"Bạn có lịch tái khám được đề xuất vào {followUpDate:dd/MM/yyyy}. Vui lòng đặt lịch hẹn.",
                                IsRead = false,
                                CreatedAt = DateTime.UtcNow
                            };

                            _context.Notifications.Add(notification);
                            notificationsCreated++;

                            _logger.LogInformation(
                                "Tạo thông báo nhắc nhở tái khám cho bệnh nhân {PatientId}, ngày tái khám {FollowUpDate}, còn {DaysRemaining} ngày",
                                consultation.Appointment.PatientID, followUpDate, daysUntilFollowUp);
                        }
                    }
                }

                if (notificationsCreated > 0)
                {
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation(
                    "Hoàn thành kiểm tra nhắc nhở tái khám. Đã tạo {Count} thông báo mới",
                    notificationsCreated);

                return notificationsCreated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi kiểm tra và tạo thông báo nhắc nhở tái khám");
                throw;
            }
        }
    }
}
