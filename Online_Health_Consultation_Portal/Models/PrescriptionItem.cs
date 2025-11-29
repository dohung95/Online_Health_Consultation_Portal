using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class PrescriptionItem
    {
        [Key]
        public int PrescriptionItemID { get; set; }
        
        [Required]
        [ForeignKey(nameof(PrescriptionHeader))]
        public int PrescriptionHeaderID { get; set; }
        
        [Required]
        [StringLength(200)]
        public string MedicationName { get; set; } = null!;
        
        [Required]
        [StringLength(100)]
        public string Dosage { get; set; } = null!;
        
        [Required]
        [StringLength(500)]
        public string Instructions { get; set; } = null!;
        
        [Required]
        public int TotalSupplyDays { get; set; }

        // Navigation property
        public virtual PrescriptionHeader PrescriptionHeader { get; set; } = null!;
    }
}
