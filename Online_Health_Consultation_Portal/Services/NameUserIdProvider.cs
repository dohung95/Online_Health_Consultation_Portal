using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace OHCP_BK.Services
{
    public class NameUserIdProvider : IUserIdProvider
    {
        public virtual string? GetUserId(HubConnectionContext connection)
        {
            return connection.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }
}
