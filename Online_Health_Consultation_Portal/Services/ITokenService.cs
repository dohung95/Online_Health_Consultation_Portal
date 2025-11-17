using OHCP_BK.Models;

namespace OHCP_BK.Services
{
    public interface ITokenService
    {
        Task<TokenResponse> GenerateTokenAsync(AppUser user);
        Task<string> GenerateRefreshTokenAsync(AppUser user);
        Task<TokenResponse> RefreshTokenAsync(string refreshToken);
        Task RevokeRefreshTokenAsync(string refreshToken);
    }
}
