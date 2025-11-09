using OHCP_BK.Models;

namespace OHCP_BK.Services
{
    public interface ITokenService_dat
    {
        Task<TokenResponse_dat> GenerateTokenAsync(AppUser_dat user);
        Task<string> GenerateRefreshTokenAsync(AppUser_dat user);
        Task<TokenResponse_dat> RefreshTokenAsync(string refreshToken);
        Task RevokeRefreshTokenAsync(string refreshToken);
    }
}
