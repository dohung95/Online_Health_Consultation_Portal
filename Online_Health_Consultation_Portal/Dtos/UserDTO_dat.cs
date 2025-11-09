namespace OHCP_BK.Dtos
{
    public class UserDTO_dat
    {        
        /// Unique user identifier
        public string Id { get; set; }

        /// Username        
        public string UserName { get; set; }

        /// User email address        
        public string Email { get; set; }
        
        /// Phone number        
        public string PhoneNumber { get; set; }
        
        /// Is email confirmed        
        public bool EmailConfirmed { get; set; }
        
        /// Is lockout enabled        
        public bool LockoutEnabled { get; set; }
        
        /// Lockout end date/time        
        public DateTimeOffset? LockoutEnd { get; set; }
        
        /// User creation date        
        public DateTime CreatedDate { get; set; }
        
        /// List of roles assigned to the user        
        public List<string> Roles { get; set; } = new List<string>();
    }
}
