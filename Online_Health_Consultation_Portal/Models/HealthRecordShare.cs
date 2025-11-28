using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
namespace OHCP_BK.Models
{
    public class HealthRecordShare
    {
        [Key]
        public int ShareID { get; set; }

        [Required]
        [ForeignKey(nameof(HealthRecord))]
        public int HealthRecordID { get; set; }

        public string? SharedDocumentIDs { get; set; }

        [Required]
        public string SharedWithDoctorID { get; set; } = null!;

        [Required]
        public string SharedByPatientID { get; set; } = null!;

        [Required]
        public string PermissionLevel { get; set; } = "View"; // "View" or "ViewAndEdit"

        public DateTime ConsentGivenAt { get; set; } = DateTime.Now;
        public DateTime? ExpiryDate { get; set; }

        // Status
        public bool IsRevoked { get; set; } = false;
        public DateTime? RevokedAt { get; set; }
        public string? RevokeReason { get; set; }

        // Navigation properties
        public virtual HealthRecord HealthRecord { get; set; } = null!;
        public virtual Doctor SharedWithDoctor { get; set; } = null!;
        public virtual Patient SharedByPatient { get; set; } = null!;
    }
}