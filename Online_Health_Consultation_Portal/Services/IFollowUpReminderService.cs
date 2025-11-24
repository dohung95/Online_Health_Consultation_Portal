namespace OHCP_BK.Services
{
    public interface IFollowUpReminderService
    {
        /// <summary>
        /// Check all consultations and create follow-up reminders
        /// when follow-up date is less than 7 days away
        /// </summary>
        /// <returns>Number of notifications created</returns>
        Task<int> CheckAndCreateFollowUpRemindersAsync();
    }
}
