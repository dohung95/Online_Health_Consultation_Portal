namespace OHCP_BK.DTOs.Admin
{
    public class InvoiceAdminDto
    {
        public int InvoiceID { get; set; }
        public int AppointmentID { get; set; }
        public string PatientID { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime IssueDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? ConsultationType { get; set; }
        public string? AppointmentStatus { get; set; }
    }

    public class InvoiceListResponseDto
    {
        public List<InvoiceAdminDto> Invoices { get; set; } = new List<InvoiceAdminDto>();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class InvoiceStatsDto
    {
        public int TotalInvoices { get; set; }
        public decimal TotalRevenue { get; set; }
        public int Paid { get; set; }
        public int Pending { get; set; }
        public int Generated { get; set; }
        public int Cancelled { get; set; }
    }

    public class UpdateInvoiceStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
