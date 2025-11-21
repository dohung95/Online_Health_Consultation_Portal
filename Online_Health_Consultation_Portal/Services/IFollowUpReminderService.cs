namespace OHCP_BK.Services
{
    public interface IFollowUpReminderService
    {
        /// <summary>
        /// Kiểm tra tất cả phiên tư vấn và tạo thông báo nhắc nhở tái khám
        /// khi ngày tái khám còn ít hơn 7 ngày
        /// </summary>
        /// <returns>Số lượng thông báo được tạo</returns>
        Task<int> CheckAndCreateFollowUpRemindersAsync();
    }
}
