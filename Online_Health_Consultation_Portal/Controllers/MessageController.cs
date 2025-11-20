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
    public class MessageController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<MessageController> _logger;

        public MessageController(OHCPContext context, ILogger<MessageController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Message
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Message>>> GetMessages()
        {
            try
            {
                var messages = await _context.Messages
                    .Include(m => m.Sender)
                    .Include(m => m.Receiver)
                    .ToListAsync();
                return Ok(messages);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting messages: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Message/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Message>> GetMessage(int id)
        {
            try
            {
                var message = await _context.Messages
                    .Include(m => m.Sender)
                    .Include(m => m.Receiver)
                    .FirstOrDefaultAsync(m => m.MessageID == id);

                if (message == null)
                {
                    return NotFound($"Message with ID {id} not found");
                }

                return Ok(message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting message {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Message
        [HttpPost]
        public async Task<ActionResult<Message>> CreateMessage([FromBody] Message message)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _context.Messages.Add(message);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetMessage), new { id = message.MessageID }, message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating message: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Message/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMessage(int id, [FromBody] Message message)
        {
            try
            {
                if (id != message.MessageID)
                {
                    return BadRequest("Message ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingMessage = await _context.Messages.FindAsync(id);
                if (existingMessage == null)
                {
                    return NotFound($"Message with ID {id} not found");
                }

                existingMessage.SenderId = message.SenderId;
                existingMessage.ReceiverId = message.ReceiverId;
                existingMessage.Content = message.Content;
                existingMessage.Timestamp = message.Timestamp;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating message {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Message/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMessage(int id)
        {
            try
            {
                var message = await _context.Messages.FindAsync(id);
                if (message == null)
                {
                    return NotFound($"Message with ID {id} not found");
                }

                _context.Messages.Remove(message);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting message {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
