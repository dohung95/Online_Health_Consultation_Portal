using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Dtos
{
    public class AppointmentCreateDTO
    {
        [Required(ErrorMessage = "Doctor ID is required")]
        public string DoctorID { get; set; } = null!;

        [Required(ErrorMessage = "Appointment time is required")]
        public DateTime AppointmentTime { get; set; }

        [Required(ErrorMessage = "Consultation type is required")]
        [RegularExpression("^(Video Call|Chat)$", ErrorMessage = "Consultation type must be either 'Video Call' or 'Chat'")]
        public string ConsultationType { get; set; } = null!;
    }
}
