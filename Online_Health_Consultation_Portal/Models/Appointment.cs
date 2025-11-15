using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class Appointment
    {
        [Key]
        public int AppointmentID { get; set; }

        [Required]
        [ForeignKey(nameof(Patient))]
        public string PatientID { get; set; } = null!;

        [Required]
        [ForeignKey(nameof(Doctor))]
        public string DoctorID { get; set; } = null!;
        
        public DateTime AppointmentTime { get; set; }
        
        [Required]
        public string ConsultationType { get; set; } = null!;
        
        [Required]
        public string Status { get; set; } = "Scheduled";

        public virtual Patient Patient { get; set; } = null!;
        public virtual Doctor Doctor { get; set; } = null!;

        public virtual Consultation? Consultation { get; set; }
        public virtual Invoice? Invoice { get; set; }
    }

}
