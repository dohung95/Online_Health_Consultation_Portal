namespace OHCP_BK.Dtos
{
    public class ShareRequestDTO
    {
        public int HealthRecordID { get; set; }
        public List<int>? DocumentIDs { get; set; }
        public string DoctorID { get; set; } = null!;
        public string PermissionLevel { get; set; } = "View";
        public DateTime? ExpiryDate { get; set; }
    }

    public class ShareResponseDTO
    {
        public int ShareID { get; set; }
        public int HealthRecordID { get; set; }
        public List<int>? SharedDocumentIDs { get; set; }
        public string DoctorName { get; set; } = null!;
        public string DoctorSpecialty { get; set; } = null!;
        public string PermissionLevel { get; set; } = null!;
        public DateTime ConsentGivenAt { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public bool IsRevoked { get; set; }
    }

    public class RevokeShareDTO
    {
        public int ShareID { get; set; }
        public string? Reason { get; set; }
    }
}