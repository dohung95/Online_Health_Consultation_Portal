using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class Prescription
    {
        [Key]
        public int PrescriptionID { get; set; }
        
        [Required]
        [ForeignKey(nameof(Consultation))]
        public int ConsultationID { get; set; }
        
        [Required]
        [ForeignKey(nameof(Patient))]
        public string PatientID { get; set; } = null!;
        
        [Required]
        public string MedicationName { get; set; } = null!;
        
        [Required]
        public string Dosage { get; set; } = null!;
        
        [Required]
        public string Instructions { get; set; } = null!;
        public DateTime IssueDate { get; set; } = DateTime.Now;
        
        // Total number of days the medication supply will last
        public int TotalSupplyDays { get; set; }

        public virtual Consultation Consultation { get; set; } = null!;
        public virtual Patient Patient { get; set; } = null!;
    }

}
