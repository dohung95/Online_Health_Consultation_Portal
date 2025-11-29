using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class PrescriptionHeader
    {
        [Key]
        public int PrescriptionHeaderID { get; set; }
        
        [Required]
        [ForeignKey(nameof(Appointment))]
        public int AppointmentID { get; set; }
        
        [Required]
        [ForeignKey(nameof(Patient))]
        public string PatientID { get; set; } = null!;
        
        [Required]
        public DateTime IssueDate { get; set; } = DateTime.Now;

        // Navigation properties
        public virtual Appointment Appointment { get; set; } = null!;
        public virtual Patient Patient { get; set; } = null!;
        public virtual ICollection<PrescriptionItem> PrescriptionItems { get; set; } = new List<PrescriptionItem>();
    }
}
