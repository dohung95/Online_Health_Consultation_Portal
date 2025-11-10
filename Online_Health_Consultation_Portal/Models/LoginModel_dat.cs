using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Models
{
    public class LoginModel_dat
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address format")]
        [MaxLength(255, ErrorMessage = "Email must not exceed 255 characters")]
        public required string Email { get; set; }

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        [MaxLength(255, ErrorMessage = "Password must not exceed 255 characters")]
        [DataType(DataType.Password)]
        public required string Password { get; set; }
    }
}
