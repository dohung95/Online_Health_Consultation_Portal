using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.DTOs.Admin
{
    public class DoctorAdminDto
    {
        public string DoctorID { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Specialty { get; set; } = string.Empty;
        public string Qualifications { get; set; } = string.Empty;
        public int? YearsOfExperience { get; set; }
        public string LanguageSpoken { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Status { get; set; } = "Inactive";
        public int TotalAppointments { get; set; }
        public double? AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public DateTime? CreatedDate { get; set; }
    }

    public class DoctorListResponseDto
    {
        public List<DoctorAdminDto> Doctors { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class UpdateDoctorAdminDto
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Specialty { get; set; } = string.Empty;
        public string Qualifications { get; set; } = string.Empty;
        public int? YearsOfExperience { get; set; }
        public string LanguageSpoken { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
    }

    public class UpdateDoctorStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class CreateDoctorAdminDto
    {
        [Required(ErrorMessage = "Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        [MaxLength(255, ErrorMessage = "Email must not exceed 255 characters")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Password is required")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
        [MaxLength(255, ErrorMessage = "Password must not exceed 255 characters")]
        [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$",
            ErrorMessage = "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Full name is required")]
        [MaxLength(100, ErrorMessage = "Full name must not exceed 100 characters")]
        public string FullName { get; set; } = string.Empty;

        [Phone(ErrorMessage = "Invalid phone number format")]
        [MaxLength(20, ErrorMessage = "Phone number must not exceed 20 characters")]
        public string PhoneNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Specialty is required")]
        [MaxLength(100, ErrorMessage = "Specialty must not exceed 100 characters")]
        public string Specialty { get; set; } = string.Empty;

        [Required(ErrorMessage = "Qualifications are required")]
        [MaxLength(500, ErrorMessage = "Qualifications must not exceed 500 characters")]
        public string Qualifications { get; set; } = string.Empty;

        [Range(0, 100, ErrorMessage = "Years of experience must be between 0 and 100")]
        public int? YearsOfExperience { get; set; }

        [MaxLength(200, ErrorMessage = "Languages spoken must not exceed 200 characters")]
        public string LanguageSpoken { get; set; } = string.Empty;

        [MaxLength(200, ErrorMessage = "Location must not exceed 200 characters")]
        public string Location { get; set; } = string.Empty;
    }
}
