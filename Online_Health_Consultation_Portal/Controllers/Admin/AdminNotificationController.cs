using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Dtos.Admin;
using OHCP_BK.Models;

namespace OHCP_BK.Controllers.Admin
{
    [Route("api/admin/notifications")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminNotificationController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly UserManager<AppUser> _userManager;
        private readonly ILogger<AdminNotificationController> _logger;

        public AdminNotificationController(
            OHCPContext context,
            UserManager<AppUser> userManager,
            ILogger<AdminNotificationController> logger)
        {
            _context = context;
            _userManager = userManager;
            _logger = logger;
        }

        // POST: api/admin/notifications/user-registered
        // Create notification for all admins when a new user registers
        [HttpPost("user-registered")]
        [AllowAnonymous] // Allow AccountController to call this
        public async Task<IActionResult> NotifyUserRegistered([FromBody] UserRegisteredNotificationDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Get all admin users
                var adminUsers = await _userManager.GetUsersInRoleAsync("admin");

                if (!adminUsers.Any())
                {
                    _logger.LogWarning("No admin users found to notify");
                    return Ok(new { message = "No admin users to notify" });
                }

                // Create notification message
                var message = $"New {dto.UserRole} registered: {dto.UserName} ({dto.Email})";

                // Create notification for each admin
                var notifications = adminUsers.Select(admin => new Notification
                {
                    UserId = admin.Id,
                    Message = message,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.Notifications.AddRange(notifications);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created {Count} notifications for new {Role} registration: {UserName}",
                    notifications.Count, dto.UserRole, dto.UserName);

                return Ok(new
                {
                    message = "Admin notifications created successfully",
                    notificationCount = notifications.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user registration notifications");
                return StatusCode(500, new { error = "Failed to create notifications", details = ex.Message });
            }
        }

        // POST: api/admin/notifications/appointment-created
        // Create notification for all admins when a new appointment is created
        [HttpPost("appointment-created")]
        [AllowAnonymous] // Allow AppointmentController to call this
        public async Task<IActionResult> NotifyAppointmentCreated([FromBody] AppointmentCreatedNotificationDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Get all admin users
                var adminUsers = await _userManager.GetUsersInRoleAsync("admin");

                if (!adminUsers.Any())
                {
                    _logger.LogWarning("No admin users found to notify");
                    return Ok(new { message = "No admin users to notify" });
                }

                // Create notification message
                var message = $"New appointment created: {dto.PatientName} with Dr. {dto.DoctorName} on {dto.AppointmentTime:MMM dd, yyyy h:mm tt} ({dto.ConsultationType})";

                // Create notification for each admin
                var notifications = adminUsers.Select(admin => new Notification
                {
                    UserId = admin.Id,
                    Message = message,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                _context.Notifications.AddRange(notifications);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created {Count} notifications for new appointment: ID {AppointmentId}",
                    notifications.Count, dto.AppointmentId);

                return Ok(new
                {
                    message = "Admin notifications created successfully",
                    notificationCount = notifications.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating appointment notifications");
                return StatusCode(500, new { error = "Failed to create notifications", details = ex.Message });
            }
        }

        // GET: api/admin/notifications
        // Get all notifications for the current admin user
        [HttpGet]
        public async Task<ActionResult<AdminNotificationListResponseDto>> GetAdminNotifications(
            [FromQuery] int? limit = null)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found");
                }

                var query = _context.Notifications
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt);

                // Apply limit only if specified
                var notificationsQuery = limit.HasValue ? query.Take(limit.Value) : query;

                var notifications = await notificationsQuery
                    .Select(n => new AdminNotificationDto
                    {
                        NotificationID = n.NotificationID,
                        Message = n.Message,
                        IsRead = n.IsRead,
                        CreatedAt = n.CreatedAt,
                        NotificationType = n.Message.Contains("registered") ? "UserRegistration" : "AppointmentCreated"
                    })
                    .ToListAsync();

                var totalCount = await _context.Notifications
                    .CountAsync(n => n.UserId == userId);

                var unreadCount = await _context.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);

                return Ok(new AdminNotificationListResponseDto
                {
                    Notifications = notifications,
                    TotalCount = totalCount,
                    UnreadCount = unreadCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting admin notifications");
                return StatusCode(500, new { error = "Failed to get notifications", details = ex.Message });
            }
        }

        // GET: api/admin/notifications/unread-count
        // Get count of unread notifications for current admin
        [HttpGet("unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount()
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
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
                _logger.LogError(ex, "Error getting unread count");
                return StatusCode(500, new { error = "Failed to get unread count", details = ex.Message });
            }
        }

        // PUT: api/admin/notifications/mark-all-read
        // Mark all notifications as read for current admin
        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
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

                return Ok(new
                {
                    message = $"{unreadNotifications.Count} notifications marked as read"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notifications as read");
                return StatusCode(500, new { error = "Failed to mark notifications as read", details = ex.Message });
            }
        }

        // PUT: api/admin/notifications/{id}/mark-read
        // Mark a specific notification as read
        [HttpPut("{id}/mark-read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found");
                }

                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.NotificationID == id && n.UserId == userId);

                if (notification == null)
                {
                    return NotFound("Notification not found");
                }

                notification.IsRead = true;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Notification marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification as read");
                return StatusCode(500, new { error = "Failed to mark notification as read", details = ex.Message });
            }
        }

        // DELETE: api/admin/notifications/{id}
        // Delete a specific notification
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found");
                }

                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.NotificationID == id && n.UserId == userId);

                if (notification == null)
                {
                    return NotFound("Notification not found");
                }

                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Notification {Id} deleted by user {UserId}", id, userId);

                return Ok(new { message = "Notification deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification {Id}", id);
                return StatusCode(500, new { error = "Failed to delete notification", details = ex.Message });
            }
        }
    }
}
