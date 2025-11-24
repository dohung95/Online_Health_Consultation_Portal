namespace OHCP_BK.Services
{
    public interface IMedicationReminderService
    {
        /// <summary>
        /// Check all prescriptions and create medication refill reminders
        /// when remaining medication days are less than 5 days
        /// </summary>
        /// <returns>Number of notifications created</returns>
        Task<int> CheckAndCreateRefillRemindersAsync();
    }
}
