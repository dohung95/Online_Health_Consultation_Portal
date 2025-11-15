using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class Invoice
    {
        [Key]
        public int InvoiceID { get; set; }
        
        [Required]
        [ForeignKey(nameof(Appointment))]
        public int AppointmentID { get; set; }
        
        [Required]
        [ForeignKey(nameof(Patient))]
        public string PatientID { get; set; } = null!;
        
        [Required]
        [Precision(10, 2)]
        public decimal Amount { get; set; }
        public DateTime IssueDate { get; set; } = DateTime.Now;
        
        [Required]
        public string Status { get; set; } = "Generated";

        public virtual Appointment Appointment { get; set; } = null!;
        public virtual Patient Patient { get; set; } = null!;
    }

}
