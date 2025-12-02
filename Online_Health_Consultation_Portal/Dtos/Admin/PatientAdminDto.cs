namespace OHCP_BK.DTOs.Admin
{
    public class PatientAdminDto
    {
        public string PatientID { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public int Age { get; set; }
        public string Gender { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string? LastVisit { get; set; }
        public string Status { get; set; } = "Inactive";
        public string? MedicalHistorySummary { get; set; }
        public string? InsuranceProvider { get; set; }
        public string? InsurancePolicyNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? BloodType { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public string? EmergencyContactRelationship { get; set; }
        public string? PreferredLanguage { get; set; }
        public string? PreferredContactMethod { get; set; }
        public string? Occupation { get; set; }
        public DateTime? CreatedDate { get; set; }
    }

    public class PatientListResponseDto
    {
        public List<PatientAdminDto> Patients { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class UpdatePatientAdminDto
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? MedicalHistorySummary { get; set; }
        public string? InsuranceProvider { get; set; }
        public string? InsurancePolicyNumber { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? BloodType { get; set; }
        public string? EmergencyContactName { get; set; }
        public string? EmergencyContactPhone { get; set; }
        public string? EmergencyContactRelationship { get; set; }
        public string? PreferredLanguage { get; set; }
        public string? PreferredContactMethod { get; set; }
        public string? Occupation { get; set; }
    }

    public class UpdatePatientStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
