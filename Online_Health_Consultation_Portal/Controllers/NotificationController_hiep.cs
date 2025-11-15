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
    public class NotificationController_hiep : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<NotificationController_hiep> _logger;

        public NotificationController_hiep(OHCPContext context, ILogger<NotificationController_hiep> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Notification
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications()
        {
            try
            {
                var notifications = await _context.Notifications
                    .Include(n => n.User)
                    .ToListAsync();
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting notifications: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Notification/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Notification>> GetNotification(int id)
        {
            try
            {
                var notification = await _context.Notifications
                    .Include(n => n.User)
                    .FirstOrDefaultAsync(n => n.NotificationID == id);

                if (notification == null)
                {
                    return NotFound($"Notification with ID {id} not found");
                }

                return Ok(notification);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting notification {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Notification
        [HttpPost]
        public async Task<ActionResult<Notification>> CreateNotification([FromBody] Notification notification)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetNotification), new { id = notification.NotificationID }, notification);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating notification: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Notification/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateNotification(int id, [FromBody] Notification notification)
        {
            try
            {
                if (id != notification.NotificationID)
                {
                    return BadRequest("Notification ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingNotification = await _context.Notifications.FindAsync(id);
                if (existingNotification == null)
                {
                    return NotFound($"Notification with ID {id} not found");
                }

                existingNotification.UserId = notification.UserId;
                existingNotification.Message = notification.Message;
                existingNotification.IsRead = notification.IsRead;
                existingNotification.CreatedAt = notification.CreatedAt;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating notification {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Notification/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(id);
                if (notification == null)
                {
                    return NotFound($"Notification with ID {id} not found");
                }

                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting notification {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
