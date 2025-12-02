using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

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
            var userId = Context.UserIdentifier;
            _logger.LogInformation("User {UserId} connected to NotificationHub. ConnectionId: {ConnectionId}", 
                userId, Context.ConnectionId);
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            _logger.LogInformation("User {UserId} disconnected from NotificationHub. ConnectionId: {ConnectionId}", 
                userId, Context.ConnectionId);
            await base.OnDisconnectedAsync(exception);
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
