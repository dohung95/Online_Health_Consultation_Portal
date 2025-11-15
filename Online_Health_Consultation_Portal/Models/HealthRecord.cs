using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class HealthRecord
    {
        [Key]
        public int HealthRecordID { get; set; }
        
        [Required]
        [ForeignKey(nameof(Patient))]
        public string PatientID { get; set; } = null!;
        
        public DateTime LastUpdated { get; set; } = DateTime.Now;

        public virtual Patient Patient { get; set; } = null!;
        public ICollection<MedicalDocument> Documents { get; set; } = new List<MedicalDocument>();
    }

}
