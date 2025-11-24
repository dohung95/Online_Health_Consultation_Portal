using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace OHCP_BK.Hubs
{
    [Authorize]
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
    }
}
