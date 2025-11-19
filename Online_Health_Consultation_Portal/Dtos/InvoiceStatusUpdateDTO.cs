using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Dtos
{
    public class InvoiceStatusUpdateDTO
    {
        [Required(ErrorMessage = "New status is required")]
        [RegularExpression("^(Pending|Generated|Paid|Cancelled)$", ErrorMessage = "Status must be one of: Pending, Generated, Paid, Cancelled")]
        public string NewStatus { get; set; } = null!;
    }
}
