using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace OHCP_BK.Hubs
{
    // [Authorize] // Temporarily disabled for testing
    public class NotificationHub : Hub
    {
        private readonly ILogger<NotificationHub> _logger;

        public NotificationHub(ILogger<NotificationHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("User {UserId} connected to NotificationHub. ConnectionId: {ConnectionId}", 
                userId, Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogInformation("User {UserId} disconnected from NotificationHub. ConnectionId: {ConnectionId}", 
                userId, Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
        }

        // === VIDEO CALL METHODS ===

        /// <summary>
        /// Bác sĩ gọi cho bệnh nhân (hoặc ngược lại)
        /// </summary>
        public async Task InitiateCall(string targetUserId, string roomId)
        {
            try
            {
                var callerId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var callerName = Context.User?.FindFirst(ClaimTypes.Name)?.Value 
                    ?? Context.User?.FindFirst("preferred_username")?.Value 
                    ?? "User";

                _logger.LogInformation("User {CallerId} initiating call to {TargetUserId} in room {RoomId}", 
                    callerId, targetUserId, roomId);

                // Gửi thông báo đến target user
                await Clients.User(targetUserId).SendAsync("IncomingCall", callerId, callerName, roomId);
                
                _logger.LogInformation("Call notification sent to {TargetUserId}", targetUserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in InitiateCall");
                throw;
            }
        }

        /// <summary>
        /// Bệnh nhân chấp nhận cuộc gọi
        /// </summary>
        public async Task AcceptCall(string callerId, string roomId)
        {
            try
            {
                var receiverId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                _logger.LogInformation("User {ReceiverId} accepted call from {CallerId} in room {RoomId}", 
                    receiverId, callerId, roomId);

                // Thông báo cho caller biết receiver đã chấp nhận
                await Clients.User(callerId).SendAsync("CallAccepted", receiverId, roomId);
                
                _logger.LogInformation("CallAccepted notification sent to {CallerId}", callerId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AcceptCall");
                throw;
            }
        }

        /// <summary>
        /// Từ chối cuộc gọi
        /// </summary>
        public async Task DeclineCall(string callerId)
        {
            try
            {
                var receiverId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                
                _logger.LogInformation("User {ReceiverId} declined call from {CallerId}", receiverId, callerId);

                // Thông báo cho caller biết receiver đã từ chối
                await Clients.User(callerId).SendAsync("CallDeclined");
                
                _logger.LogInformation("CallDeclined notification sent to {CallerId}", callerId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DeclineCall");
                throw;
            }
        }

        // Optional: clients can call this to test connection
        public async Task Echo(string message)
        {
            await Clients.Caller.SendAsync("Echo", $"Server received: {message}");
        }

        // Send medication reminder to a specific patient
        public async Task SendMedicationReminder(string patientId, object reminderData)
        {
            await Clients.User(patientId).SendAsync("ReceiveMedicationReminder", reminderData);
            _logger.LogInformation("Medication reminder sent to patient {PatientId}", patientId);
        }

        // Send medication reminder to all patients
        public async Task SendMedicationReminderToAll(object reminderData)
        {
            await Clients.All.SendAsync("ReceiveMedicationReminder", reminderData);
            _logger.LogInformation("Medication reminder sent to all patients");
        }

        // Send appointment notification to a specific patient
        public async Task SendAppointmentNotification(string patientId, object notificationData)
        {
            await Clients.User(patientId).SendAsync("ReceiveAppointmentNotification", notificationData);
            _logger.LogInformation("Appointment notification sent to patient {PatientId}", patientId);
        }

        // Send appointment notification to all patients
        public async Task SendAppointmentNotificationToAll(object notificationData)
        {
            await Clients.All.SendAsync("ReceiveAppointmentNotification", notificationData);
            _logger.LogInformation("Appointment notification sent to all patients");
        }

        // Send general notification to a specific user
        public async Task SendNotification(string userId, string message, string type)
        {
            var notification = new
            {
                Message = message,
                Type = type,
                Timestamp = DateTime.UtcNow
            };
            await Clients.User(userId).SendAsync("ReceiveNotification", notification);
            _logger.LogInformation("Notification sent to user {UserId}: {Message}", userId, message);
        }
    }
}