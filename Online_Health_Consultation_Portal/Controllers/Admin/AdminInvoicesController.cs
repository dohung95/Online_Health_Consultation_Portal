using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.DTOs.Admin;

namespace OHCP_BK.Controllers.Admin
{
    [Route("api/admin/[controller]")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminInvoicesController : ControllerBase
    {
        private readonly OHCPContext _context;

        public AdminInvoicesController(OHCPContext context)
        {
            _context = context;
        }

        // GET: api/admin/admininvoices/stats
        [HttpGet("stats")]
        public async Task<ActionResult<InvoiceStatsDto>> GetInvoiceStats()
        {
            try
            {
                var totalInvoices = await _context.Invoices.CountAsync();
                var totalRevenue = await _context.Invoices.SumAsync(i => i.Amount);
                var paid = await _context.Invoices.CountAsync(i => i.Status.ToLower() == "paid");
                var pending = await _context.Invoices.CountAsync(i => i.Status.ToLower() == "pending");
                var generated = await _context.Invoices.CountAsync(i => i.Status.ToLower() == "generated");
                var cancelled = await _context.Invoices.CountAsync(i => i.Status.ToLower() == "cancelled");

                return Ok(new InvoiceStatsDto
                {
                    TotalInvoices = totalInvoices,
                    TotalRevenue = totalRevenue,
                    Paid = paid,
                    Pending = pending,
                    Generated = generated,
                    Cancelled = cancelled
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching stats", details = ex.Message });
            }
        }

        // GET: api/admin/admininvoices
        [HttpGet]
        public async Task<ActionResult<InvoiceListResponseDto>> GetInvoices(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? searchTerm = null,
            [FromQuery] string? status = null,
            [FromQuery] string? sortBy = "newest")
        {
            try
            {
                var query = _context.Invoices
                    .Include(i => i.Patient)
                    .Include(i => i.Appointment)
                    .AsQueryable();

                // Search filter
                if (!string.IsNullOrWhiteSpace(searchTerm))
                {
                    query = query.Where(i =>
                        i.Patient.FullName.Contains(searchTerm) ||
                        i.InvoiceID.ToString().Contains(searchTerm) ||
                        i.AppointmentID.ToString().Contains(searchTerm)
                    );
                }

                // Status filter
                if (!string.IsNullOrWhiteSpace(status))
                {
                    query = query.Where(i => i.Status.ToLower() == status.ToLower());
                }

                // Sorting
                query = sortBy.ToLower() switch
                {
                    "oldest" => query.OrderBy(i => i.IssueDate),
                    "amount-asc" => query.OrderBy(i => i.Amount),
                    "amount-desc" => query.OrderByDescending(i => i.Amount),
                    _ => query.OrderByDescending(i => i.IssueDate) // newest
                };

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

                var invoices = await query
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .Select(i => new InvoiceAdminDto
                    {
                        InvoiceID = i.InvoiceID,
                        AppointmentID = i.AppointmentID,
                        PatientID = i.PatientID,
                        PatientName = i.Patient.FullName,
                        Amount = i.Amount,
                        IssueDate = i.IssueDate,
                        Status = i.Status,
                        ConsultationType = i.Appointment.ConsultationType,
                        AppointmentStatus = i.Appointment.Status
                    })
                    .ToListAsync();

                return Ok(new InvoiceListResponseDto
                {
                    Invoices = invoices,
                    TotalCount = totalCount,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalPages = totalPages
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching invoices", details = ex.Message });
            }
        }

        // GET: api/admin/admininvoices/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<InvoiceAdminDto>> GetInvoice(int id)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Patient)
                    .Include(i => i.Appointment)
                    .FirstOrDefaultAsync(i => i.InvoiceID == id);

                if (invoice == null)
                {
                    return NotFound(new { error = "Invoice not found" });
                }

                var invoiceDto = new InvoiceAdminDto
                {
                    InvoiceID = invoice.InvoiceID,
                    AppointmentID = invoice.AppointmentID,
                    PatientID = invoice.PatientID,
                    PatientName = invoice.Patient.FullName,
                    Amount = invoice.Amount,
                    IssueDate = invoice.IssueDate,
                    Status = invoice.Status,
                    ConsultationType = invoice.Appointment.ConsultationType,
                    AppointmentStatus = invoice.Appointment.Status
                };

                return Ok(invoiceDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while fetching invoice", details = ex.Message });
            }
        }

        // PUT: api/admin/admininvoices/{id}/status
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateInvoiceStatus(int id, [FromBody] UpdateInvoiceStatusDto dto)
        {
            try
            {
                var invoice = await _context.Invoices.FindAsync(id);

                if (invoice == null)
                {
                    return NotFound(new { error = "Invoice not found" });
                }

                invoice.Status = dto.Status;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Invoice status updated successfully", invoiceID = invoice.InvoiceID, newStatus = invoice.Status });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while updating invoice status", details = ex.Message });
            }
        }

        // DELETE: api/admin/admininvoices/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            try
            {
                var invoice = await _context.Invoices.FindAsync(id);

                if (invoice == null)
                {
                    return NotFound(new { error = "Invoice not found" });
                }

                _context.Invoices.Remove(invoice);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Invoice deleted successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "An error occurred while deleting invoice", details = ex.Message });
            }
        }
    }
}
