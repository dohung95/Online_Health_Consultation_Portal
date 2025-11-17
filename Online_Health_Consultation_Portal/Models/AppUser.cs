using Microsoft.AspNetCore.Identity;
using System.Numerics;

namespace OHCP_BK.Models
{
    public class AppUser : IdentityUser
    {
        public DateTime? CreatedDate { get; set; }

        // Navigation properties to domain entities (nullable vì user có thể không phải doctor/patient)
        public virtual Patient? Patient { get; set; }
        public virtual Doctor? Doctor { get; set; }

        public virtual ICollection<Message> MessagesSent { get; set; } = new List<Message>();
        public virtual ICollection<Message> MessagesReceived { get; set; } = new List<Message>();

        public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}
