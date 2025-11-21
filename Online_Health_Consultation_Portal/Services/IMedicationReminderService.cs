namespace OHCP_BK.Services
{
    public interface IMedicationReminderService
    {
        /// <summary>
        /// Kiểm tra tất cả đơn thuốc và tạo thông báo nhắc nhở nạp lại thuốc
        /// khi số ngày thuốc còn lại ít hơn 5 ngày
        /// </summary>
        /// <returns>Số lượng thông báo được tạo</returns>
        Task<int> CheckAndCreateRefillRemindersAsync();
    }
}
