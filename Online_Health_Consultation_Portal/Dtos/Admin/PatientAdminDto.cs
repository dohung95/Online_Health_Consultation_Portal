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
        public string Status { get; set; } = "Active";
        public string? MedicalHistorySummary { get; set; }
        public string? InsuranceProvider { get; set; }
        public string? InsurancePolicyNumber { get; set; }
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

    public class CreatePatientAdminDto
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string? MedicalHistorySummary { get; set; }
        public string? InsuranceProvider { get; set; }
        public string? InsurancePolicyNumber { get; set; }
        public string Password { get; set; } = "Patient@123!#"; // Default password
    }

    public class UpdatePatientAdminDto
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string? MedicalHistorySummary { get; set; }
        public string? InsuranceProvider { get; set; }
        public string? InsurancePolicyNumber { get; set; }
        public string Status { get; set; } = "Active";
    }
}
