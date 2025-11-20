using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Dtos
{
    public class DoctorCreateDTO
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address format")]
        [MaxLength(255, ErrorMessage = "Email must not exceed 255 characters")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        [MaxLength(255, ErrorMessage = "Password must not exceed 255 characters")]
        [DataType(DataType.Password)]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(100, ErrorMessage = "Full name must not exceed 100 characters")]
        public string FullName { get; set; } = null!;

        [Required(ErrorMessage = "Specialty is required")]
        [MaxLength(100, ErrorMessage = "Specialty must not exceed 100 characters")]
        public string Specialty { get; set; } = null!;

        [Required(ErrorMessage = "Qualifications are required")]
        [MaxLength(500, ErrorMessage = "Qualifications must not exceed 500 characters")]
        public string Qualifications { get; set; } = null!;

        [Range(0, 100, ErrorMessage = "Years of experience must be between 0 and 100")]
        public int? YearsOfExperience { get; set; }

        [MaxLength(200, ErrorMessage = "Language spoken must not exceed 200 characters")]
        public string? LanguageSpoken { get; set; }

        [MaxLength(200, ErrorMessage = "Location must not exceed 200 characters")]
        public string? Location { get; set; }
    }
}
