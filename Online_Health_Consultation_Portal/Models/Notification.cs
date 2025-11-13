namespace OHCP_BK.Models
{
    public class Notification
    {
        public int NotificationID { get; set; }

        // Link to Identity User
        public string UserId { get; set; }

        public string Message { get; set; }
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual AppUser_dat User { get; set; }
    }
}
