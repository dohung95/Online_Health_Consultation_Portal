using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Dtos
{
    public class InvoiceCreateDTO
    {
        [Required(ErrorMessage = "Appointment ID is required")]
        public int AppointmentID { get; set; }
    }
}
