namespace OHCP_BK.Models
{
    public class Message
    {
        public int MessageID { get; set; }

        // FK to User.Id (Identity)
        public string SenderId { get; set; }
        public string ReceiverId { get; set; }

        public string Content { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public virtual AppUser_dat Sender { get; set; }
        public virtual AppUser_dat Receiver { get; set; }
    }
}
