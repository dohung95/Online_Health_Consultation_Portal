using Microsoft.AspNetCore.Identity;
using System.Numerics;

namespace OHCP_BK.Models
{
    public class AppUser_dat : IdentityUser
    {
        public DateTime? CreatedDate { get; set; }

        // Navigation properties to domain entities
        public virtual Patient Patient { get; set; }
        public virtual Doctor Doctor { get; set; }

        public virtual ICollection<Message> MessagesSent { get; set; }
        public virtual ICollection<Message> MessagesReceived { get; set; }

        public virtual ICollection<RefreshToken_dat> RefreshTokens { get; set; } = new List<RefreshToken_dat>();
    }
}
