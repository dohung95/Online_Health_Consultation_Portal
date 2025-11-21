using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace OHCP_BK.Hubs
{
    [Authorize]
    public class NotificationCalling : Hub
    {
        // Khi Bác sĩ bấm "Gọi"
        public async Task InitiateCall(string targetUserId, string roomId)
        {
            // Lấy ID của người đang gọi (Bác sĩ)
            var callerId = Context.UserIdentifier;
            var callerName = Context.User.FindFirstValue("preferred_username") ?? "Unknown Caller";

            // Gửi tin nhắn "IncomingCall" CHỈ cho người nhận (Bệnh nhân)
            await Clients.User(targetUserId).SendAsync("IncomingCall", callerId, callerName, roomId);
        }

        // Khi Bệnh nhân bấm "Bắt máy"
        public async Task AcceptCall(string callerId, string roomId)
        {
            // Lấy ID của người nhận (Bệnh nhân)
            var receiverId = Context.UserIdentifier;

            // Gửi tin nhắn "CallAccepted" ngược lại cho Bác sĩ
            await Clients.User(callerId).SendAsync("CallAccepted", receiverId, roomId);
        }

        // Khi Bệnh nhân bấm "Từ chối"
        public async Task DeclineCall(string callerId)
        {
            // Gửi tin nhắn "CallDeclined" ngược lại cho Bác sĩ
            await Clients.User(callerId).SendAsync("CallDeclined");
        }
    }
}
