namespace OHCP_BK.DTOs.Admin
{
    public class UserDTO
    {
        /// Unique user identifier
        public string Id { get; set; } = string.Empty;

        /// Username
        public string UserName { get; set; } = string.Empty;

        /// User email address
        public string Email { get; set; } = string.Empty;

        /// Phone number
        public string PhoneNumber { get; set; } = string.Empty;

        /// Is email confirmed
        public bool EmailConfirmed { get; set; }

        /// Is lockout enabled
        public bool LockoutEnabled { get; set; }

        /// Lockout end date/time
        public DateTimeOffset? LockoutEnd { get; set; }

        /// User creation date
        public DateTime? CreatedDate { get; set; }

        /// User status (Active, Inactive, Suspended, Banned)
        public string Status { get; set; } = "Inactive";

        /// List of roles assigned to the user
        public List<string> Roles { get; set; } = new List<string>();
    }
}
