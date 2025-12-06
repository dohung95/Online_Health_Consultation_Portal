namespace OHCP_BK.DTOs.Admin
{
    public class PatientMedicalHistoryDto
    {
        public string PatientID { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? BloodType { get; set; }
        public string? MedicalHistorySummary { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public string? PhoneNumber { get; set; }
        public List<AppointmentHistoryDto> Appointments { get; set; } = new();
        public List<MedicalDocumentCategoryDto> DocumentsByCategory { get; set; } = new();
    }

    public class AppointmentHistoryDto
    {
        public int AppointmentID { get; set; }
        public DateTime AppointmentTime { get; set; }
        public string DoctorID { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string DoctorSpecialty { get; set; } = string.Empty;
        public string ConsultationType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? DoctorNotes { get; set; }
    }

    public class MedicalDocumentCategoryDto
    {
        public string Category { get; set; } = string.Empty;
        public int DocumentCount { get; set; }
        public List<MedicalDocumentDetailDto> Documents { get; set; } = new();
    }

    public class MedicalDocumentDetailDto
    {
        public int DocumentID { get; set; }
        public int HealthRecordID { get; set; }
        public string DocumentName { get; set; } = string.Empty;
        public string DocumentType { get; set; } = string.Empty;
        public string FileLocation { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Description { get; set; }
        public string? TestResults { get; set; }
        public string? ReferenceRange { get; set; }
        public string? TestStatus { get; set; }
        public DateTime? DocumentDate { get; set; }
        public string? PerformedBy { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    // For Medical Records patient list view
    public class MedicalRecordsPatientDto
    {
        public string PatientID { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int TotalRecords { get; set; }
        public int TotalDocuments { get; set; }
        public DateTime? LastUpdated { get; set; }
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
    }

    public class MedicalRecordsPatientListResponseDto
    {
        public List<MedicalRecordsPatientDto> Patients { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}

