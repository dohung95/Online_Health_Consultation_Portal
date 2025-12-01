using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class MedicalDocument
    {
        [Key]
        public int DocumentID { get; set; }

        [Required]
        [ForeignKey(nameof(HealthRecord))]
        public int HealthRecordID { get; set; }

        [Required]
        public string DocumentName { get; set; } = null!;

        [Required]
        public string DocumentType { get; set; } = null!;

        [Required]
        public string FileLocation { get; set; } = null!;

        // Document categorization
        public string? Category { get; set; }
        // Options: "X-Ray", "CT-Scan", "MRI", "Ultrasound", "Lab-Report", 
        //          "Blood-Test", "Prescription", "Consultation-Notes", "Other"
        // Patient's description when uploading
        public string? Description { get; set; }
        // For lab results
        public string? TestResults { get; set; } // ket qua xet nghiem
        public string? ReferenceRange { get; set; } // gia tri tham chieu
        public string? TestStatus { get; set; } // "Normal", "Abnormal", "Critical"
        // Document metadata
        public DateTime? DocumentDate { get; set; } // ngay thuc hien test
        public string? PerformedBy { get; set; } // bac si thuc hien

        public DateTime UploadedAt { get; set; } = DateTime.Now;

        public virtual HealthRecord HealthRecord { get; set; } = null!;
    }
}
