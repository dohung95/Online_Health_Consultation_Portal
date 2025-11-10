using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Models
{
    public class RefreshTokenRequest_dat
    {
        [Required(ErrorMessage = "Refresh token is required")]
        [MinLength(1, ErrorMessage = "Refresh token cannot be empty")]
        public required string RefreshToken { get; set; }
    }
}
