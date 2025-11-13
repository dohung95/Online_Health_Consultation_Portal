using Microsoft.AspNetCore.Identity;

namespace OHCP_BK.Models
{
    public class AppUser_dat : IdentityUser
    {
        public DateTime? CreatedDate { get; set; }

        public virtual ICollection<RefreshToken_dat> RefreshTokens { get; set; } = new List<RefreshToken_dat>();
    }
}
