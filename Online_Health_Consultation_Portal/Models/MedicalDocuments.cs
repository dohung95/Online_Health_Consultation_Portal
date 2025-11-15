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
        public DateTime UploadedAt { get; set; } = DateTime.Now;

        public virtual HealthRecord HealthRecord { get; set; } = null!;
    }

}
