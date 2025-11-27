namespace OHCP_BK.Dtos
{
    // DTO recieve file upload
    public class CreateHealthRecordDTO
    {
        public List<IFormFile>? Documents { get; set; }
    }

    // DTO show list
    public class HealthRecordDTO
    {
        public int HealthRecordID { get; set; }
        public DateTime LastUpdated { get; set; }
        public List<MedicalDocumentDTO> Documents { get; set; }
    }

    // DTO show file
    public class MedicalDocumentDTO
    {
        public int DocumentID { get; set; }
        public string DocumentName { get; set; }
        public string DocumentType { get; set; }
        public string FileUrl { get; set; }
        public DateTime UploadedAt { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
        public DateTime? DocumentDate { get; set; }
        public string? TestResults { get; set; }
        public string? ReferenceRange { get; set; }
        public string? TestStatus { get; set; }
        public string? PerformedBy { get; set; }
    }
}