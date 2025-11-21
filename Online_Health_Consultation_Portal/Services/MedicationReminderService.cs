using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Models;

namespace OHCP_BK.Services
{
    public class MedicationReminderService : IMedicationReminderService
    {
        private readonly OHCPContext _context;
        private readonly ILogger<MedicationReminderService> _logger;
        private const int REFILL_REMINDER_THRESHOLD_DAYS = 5;

        public MedicationReminderService(
            OHCPContext context,
            ILogger<MedicationReminderService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> CheckAndCreateRefillRemindersAsync()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var notificationsCreated = 0;

                // Truy vấn tất cả đơn thuốc có TotalSupplyDays > 0
                var prescriptions = await _context.Prescriptions
                    .Where(p => p.TotalSupplyDays > 0)
                    .Include(p => p.Patient)
                    .ToListAsync();

                foreach (var prescription in prescriptions)
                {
                    // Tính ngày hết thuốc
                    var medicationEndDate = prescription.IssueDate.AddDays(prescription.TotalSupplyDays);
                    var daysRemaining = (medicationEndDate - today).Days;

                    // Kiểm tra nếu còn dưới ngưỡng nhắc nhở
                    if (daysRemaining <= REFILL_REMINDER_THRESHOLD_DAYS && daysRemaining >= 0)
                    {
                        // Kiểm tra xem đã có thông báo chưa (tránh tạo trùng)
                        var existingNotification = await _context.Notifications
                            .AnyAsync(n => 
                                n.UserId == prescription.Patient.PatientID &&
                                n.Message.Contains($"nạp lại thuốc {prescription.MedicationName}") &&
                                n.CreatedAt.Date == today);

                        if (!existingNotification)
                        {
                            // Tạo thông báo mới
                            var notification = new Notification
                            {
                                UserId = prescription.Patient.PatientID,
                                Message = $"Đã đến lúc nạp lại thuốc {prescription.MedicationName}. Thuốc sẽ hết vào {medicationEndDate:dd/MM/yyyy}.",
                                IsRead = false,
                                CreatedAt = DateTime.UtcNow
                            };

                            _context.Notifications.Add(notification);
                            notificationsCreated++;

                            _logger.LogInformation(
                                "Tạo thông báo nhắc nhở nạp thuốc cho bệnh nhân {PatientId}, thuốc {MedicationName}, còn {DaysRemaining} ngày",
                                prescription.PatientID, prescription.MedicationName, daysRemaining);
                        }
                    }
                }

                if (notificationsCreated > 0)
                {
                    await _context.SaveChangesAsync();
                }

                _logger.LogInformation(
                    "Hoàn thành kiểm tra nhắc nhở nạp thuốc. Đã tạo {Count} thông báo mới",
                    notificationsCreated);

                return notificationsCreated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi khi kiểm tra và tạo thông báo nhắc nhở nạp thuốc");
                throw;
            }
        }
    }
}
