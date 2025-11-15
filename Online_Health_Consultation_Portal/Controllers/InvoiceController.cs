using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Models;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InvoiceController_hiep : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<InvoiceController_hiep> _logger;

        public InvoiceController_hiep(OHCPContext context, ILogger<InvoiceController_hiep> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Invoice
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Invoice>>> GetInvoices()
        {
            try
            {
                var invoices = await _context.Invoices
                    .Include(i => i.Appointment)
                    .Include(i => i.Patient)
                    .ToListAsync();
                return Ok(invoices);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting invoices: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Invoice/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Invoice>> GetInvoice(int id)
        {
            try
            {
                var invoice = await _context.Invoices
                    .Include(i => i.Appointment)
                    .Include(i => i.Patient)
                    .FirstOrDefaultAsync(i => i.InvoiceID == id);

                if (invoice == null)
                {
                    return NotFound($"Invoice with ID {id} not found");
                }

                return Ok(invoice);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting invoice {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Invoice
        [HttpPost]
        public async Task<ActionResult<Invoice>> CreateInvoice([FromBody] Invoice invoice)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.InvoiceID }, invoice);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating invoice: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Invoice/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInvoice(int id, [FromBody] Invoice invoice)
        {
            try
            {
                if (id != invoice.InvoiceID)
                {
                    return BadRequest("Invoice ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingInvoice = await _context.Invoices.FindAsync(id);
                if (existingInvoice == null)
                {
                    return NotFound($"Invoice with ID {id} not found");
                }

                existingInvoice.AppointmentID = invoice.AppointmentID;
                existingInvoice.PatientID = invoice.PatientID;
                existingInvoice.Amount = invoice.Amount;
                existingInvoice.IssueDate = invoice.IssueDate;
                existingInvoice.Status = invoice.Status;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating invoice {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Invoice/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(int id)
        {
            try
            {
                var invoice = await _context.Invoices.FindAsync(id);
                if (invoice == null)
                {
                    return NotFound($"Invoice with ID {id} not found");
                }

                _context.Invoices.Remove(invoice);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting invoice {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
