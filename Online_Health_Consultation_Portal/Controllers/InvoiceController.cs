using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Dtos;
using OHCP_BK.Models;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InvoiceController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<InvoiceController> _logger;

        public InvoiceController(OHCPContext context, ILogger<InvoiceController> logger)
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

        /// <summary>
        /// POST /api/Invoice
        /// Generate invoice automatically after consultation completion
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "admin,doctor")]
        public async Task<ActionResult<Invoice>> CreateInvoice([FromBody] InvoiceCreateDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Load appointment with patient info
                var appointment = await _context.Appointments
                    .Include(a => a.Patient)
                    .FirstOrDefaultAsync(a => a.AppointmentID == dto.AppointmentID);

                if (appointment == null)
                {
                    return NotFound("Appointment not found");
                }

                // Validate appointment status is Completed
                if (appointment.Status != "Completed")
                {
                    return BadRequest("Invoice can only be generated for completed appointments");
                }

                // Check if invoice already exists for this appointment
                var existingInvoice = await _context.Invoices
                    .AnyAsync(i => i.AppointmentID == dto.AppointmentID);

                if (existingInvoice)
                {
                    return Conflict(new { message = "Invoice already exists for this appointment" });
                }

                // Calculate amount based on consultation type
                decimal amount = appointment.ConsultationType.ToLower() switch
                {
                    "video" => 100m,
                    "chat" => 50m,
                    _ => 75m // default fallback
                };

                // Check if patient has insurance
                var hasInsurance = !string.IsNullOrWhiteSpace(appointment.Patient.InsurancePolicyNumber);

                // Apply 50% discount if patient has insurance
                if (hasInsurance)
                {
                    amount *= 0.5m;
                }

                // Create invoice
                var invoice = new Invoice
                {
                    AppointmentID = appointment.AppointmentID,
                    PatientID = appointment.PatientID,
                    Amount = amount,
                    IssueDate = DateTime.UtcNow,
                    Status = hasInsurance ? "Pending" : "Generated" // Pending if insurance processing needed
                };

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetInvoice), new { id = invoice.InvoiceID }, new
                {
                    invoiceID = invoice.InvoiceID,
                    appointmentID = invoice.AppointmentID,
                    patientID = invoice.PatientID,
                    amount = invoice.Amount,
                    status = invoice.Status,
                    hasInsurance = hasInsurance,
                    insurancePolicyNumber = hasInsurance ? appointment.Patient.InsurancePolicyNumber : null
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating invoice: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// PUT /api/Invoice/{id}/status
        /// Update payment status of an invoice (admin only)
        /// </summary>
        [HttpPut("{id}/status")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UpdateInvoiceStatus(int id, [FromBody] InvoiceStatusUpdateDTO dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var invoice = await _context.Invoices.FindAsync(id);
                if (invoice == null)
                {
                    return NotFound($"Invoice with ID {id} not found");
                }

                // Update status
                var oldStatus = invoice.Status;
                invoice.Status = dto.NewStatus;

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Invoice {id} status updated from '{oldStatus}' to '{dto.NewStatus}' by admin");

                return Ok(new
                {
                    message = "Invoice status updated successfully",
                    invoiceID = invoice.InvoiceID,
                    oldStatus = oldStatus,
                    newStatus = invoice.Status,
                    amount = invoice.Amount,
                    patientID = invoice.PatientID
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating invoice status {id}: {ex.Message}");
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
