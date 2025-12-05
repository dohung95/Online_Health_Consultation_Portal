using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Models;
using System.Security.Claims;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(OHCPContext context, ILogger<NotificationController> logger)
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

        // GET: api/Notification/my
        // Get notifications for the current authenticated user
        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<object>>> GetMyNotifications()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("Unauthorized access attempt - User ID not found");
                    return Unauthorized("User ID not found");
                }

                _logger.LogInformation("Fetching notifications for user: {UserId}", userId);

                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Select(n => new
                    {
                        notificationId = n.NotificationID,
                        message = n.Message,
                        isRead = n.IsRead,
                        createdAt = n.CreatedAt,
                        appointmentId = n.AppointmentId
                    })
                    .ToListAsync();

                _logger.LogInformation("Found {Count} notifications for user {UserId}", notifications.Count, userId);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user notifications");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Notification/my/unread-count
        // Get count of unread notifications for current user
        [HttpGet("my/unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found");
                }

                var count = await _context.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);

                return Ok(new { unreadCount = count });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting unread count: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Notification/{id}/mark-read
        // Mark a specific notification as read
        [HttpPut("{id}/mark-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found");
                }

                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.NotificationID == id && n.UserId == userId);

                if (notification == null)
                {
                    return NotFound($"Notification with ID {id} not found");
                }

                notification.IsRead = true;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error marking notification as read: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Notification/mark-all-read
        // Mark all notifications as read for current user
        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found");
                }

                var unreadNotifications = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .ToListAsync();

                foreach (var notification in unreadNotifications)
                {
                    notification.IsRead = true;
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = $"{unreadNotifications.Count} notifications marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error marking all notifications as read: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
