using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Dtos
{
    public class DoctorProfileDTO
    {
        public string DoctorID { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string Specialty { get; set; } = null!;
        public string Qualifications { get; set; } = null!;
        public int? YearsOfExperience { get; set; }
        public string LanguageSpoken { get; set; } = null!;
        public string Location { get; set; } = null!;
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
    }
}
