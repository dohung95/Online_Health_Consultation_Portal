namespace OHCP_BK.DTOs.Admin
{
    public class MedicalRecordAdminDto
    {
        public int HealthRecordID { get; set; }
        public string PatientID { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string? DoctorName { get; set; }
        public DateTime? Date { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Diagnosis { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public DateTime LastUpdated { get; set; }
    }

    public class MedicalRecordListResponseDto
    {
        public List<MedicalRecordAdminDto> Records { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class MedicalRecordStatsDto
    {
        public int TotalRecords { get; set; }
        public int RecentUpdates { get; set; }
        public int PendingReview { get; set; }
        public int Archived { get; set; }
    }
}
