using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class Consultation
    {
        [Key]
        public int ConsultationID { get; set; }
        
        [Required]
        [ForeignKey(nameof(Appointment))]
        public int AppointmentID { get; set; }
        
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? DoctorNotes { get; set; }
        
        // Recommended follow-up date set by the doctor
        public DateTime? FollowUpDate { get; set; }

        public virtual Appointment Appointment { get; set; } = null!;
    }

}
