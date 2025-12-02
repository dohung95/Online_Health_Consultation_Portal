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
}
