namespace OHCP_BK.Constants
{
    public static class UserStatusConstants
    {
        public const string Active = "Active";
        public const string Inactive = "Inactive";
        public const string Suspended = "Suspended";
        public const string Banned = "Banned";

        public static readonly string[] AllStatuses = new[]
        {
            Active,
            Inactive,
            Suspended,
            Banned
        };

        public static bool IsValidStatus(string status)
        {
            return Array.Exists(AllStatuses, s => s.Equals(status, StringComparison.OrdinalIgnoreCase));
        }
    }
}
