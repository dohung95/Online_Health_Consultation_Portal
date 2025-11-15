using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class Message
    {
        [Key]
        public int MessageID { get; set; }

        // FK to User.Id (Identity)
        [Required]
        [ForeignKey(nameof(Sender))]
        public string SenderId { get; set; } = null!;
        
        [Required]
        [ForeignKey(nameof(Receiver))]
        public string ReceiverId { get; set; } = null!;

        [Required]
        public string Content { get; set; } = null!;
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public virtual AppUser_dat Sender { get; set; } = null!;
        public virtual AppUser_dat Receiver { get; set; } = null!;
    }
}
