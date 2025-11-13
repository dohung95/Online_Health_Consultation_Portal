using Microsoft.EntityFrameworkCore;

namespace OHCP_BK.Models
{
    public class Invoice
    {
        public int InvoiceID { get; set; }
        public int AppointmentID { get; set; }
        public int PatientID { get; set; }
        [Precision(10, 2)]
        public decimal Amount { get; set; }
        public DateTime IssueDate { get; set; } = DateTime.Now;
        public string Status { get; set; } = "Generated";

        public Appointment Appointment { get; set; }
        public Patient Patient { get; set; }
    }

}
