using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Dtos
{
    public class PatientCreateDTO
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

        public DateTime? DateOfBirth { get; set; }

        [MaxLength(1000, ErrorMessage = "Medical history summary must not exceed 1000 characters")]
        public string? MedicalHistorySummary { get; set; }

        [MaxLength(100, ErrorMessage = "Insurance provider must not exceed 100 characters")]
        public string? InsuranceProvider { get; set; }

        [MaxLength(50, ErrorMessage = "Insurance policy number must not exceed 50 characters")]
        public string? InsurancePolicyNumber { get; set; }
    }
}
