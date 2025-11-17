using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using OHCP_BK.Data;
using OHCP_BK.Exceptions;
using OHCP_BK.Models;
using System;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ValidationException = OHCP_BK.Exceptions.ValidationException;

namespace OHCP_BK.Services
{
    public class TokenService : ITokenService
    {
        readonly IConfiguration config;
        readonly UserManager<AppUser> userManager;
        readonly OHCPContext dbContext;
        readonly ILogger<TokenService> logger;

        public TokenService(IConfiguration config, UserManager<AppUser> userManager, OHCPContext dbContext, ILogger<TokenService> logger)
        {
            this.config = config;
            this.userManager = userManager;
            this.dbContext = dbContext;
            this.logger = logger;
        }

        public async Task<TokenResponse> GenerateTokenAsync(AppUser user)
        {
            try
            {
                if (user == null)
                    throw new ValidationException("User cannot be null");

                var accessToken = await GenerateAccessTokenAsync(user);
                var refreshToken = await GenerateRefreshTokenAsync(user);

                var expiryHours = int.Parse(config["Jwt:ExpiryHours"] ?? "1");

                return new TokenResponse
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    TokenType = "Bearer",
                    ExpiresIn = expiryHours * 3600, // Convert hours to seconds
                    ExpiresAt = DateTime.UtcNow.AddHours(expiryHours)
                };
            }
            catch (Exception ex)
            {
                logger.LogError($"Error generating token for user: {ex.Message}");
                throw;
            }
        }

        private async Task<string> GenerateAccessTokenAsync(AppUser user)
        {
            try
            {
                if (user == null)
                    throw new ValidationException("User cannot be null");

                if (string.IsNullOrWhiteSpace(user.Id))
                    throw new ValidationException("User ID cannot be empty");

                var claims = new List<Claim>
                {
                    new Claim(JwtRegisteredClaimNames.Sub, user.Id),
                    new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),
                    new Claim(JwtRegisteredClaimNames.PreferredUsername, user.UserName ?? "User"),
                    new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                    new Claim(ClaimTypes.Role, "User")  // default role
                };

                // Add user roles
                var roles = await userManager.GetRolesAsync(user);
                if (roles != null)
                {
                    foreach (var role in roles)
                    {
                        claims.Add(new Claim(ClaimTypes.Role, role));
                    }
                }

                var secretKey = config["Jwt:SecretKey"];
                if (string.IsNullOrWhiteSpace(secretKey))
                    throw new InternalServerException("JWT secret key is not configured");

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var expiryHours = int.Parse(config["Jwt:ExpiryHours"] ?? "1");

                var token = new JwtSecurityToken(
                    issuer: config["Jwt:Issuer"],
                    audience: config["Jwt:Audience"],
                    claims: claims,
                    expires: DateTime.UtcNow.AddHours(expiryHours),
                    signingCredentials: creds);

                return new JwtSecurityTokenHandler().WriteToken(token);
            }
            catch (ValidationException)
            {
                throw;
            }
            catch (InternalServerException)
            {
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError($"Error generating access token: {ex.Message}");
                throw new InternalServerException("Failed to generate access token");
            }
        }

        public async Task<string> GenerateRefreshTokenAsync(AppUser user)
        {
            try
            {
                if (user == null)
                    throw new ValidationException("User cannot be null");

                if (string.IsNullOrWhiteSpace(user.Id))
                    throw new ValidationException("User ID cannot be empty");

                // Generate random refresh token
                var randomNumber = new byte[64];
                using (var rng = RandomNumberGenerator.Create())
                {
                    rng.GetBytes(randomNumber);
                }
                var refreshToken = Convert.ToBase64String(randomNumber);

                // Save to database
                var refreshTokenEntity = new RefreshToken
                {
                    UserId = user.Id,
                    Token = refreshToken,
                    ExpiryDate = DateTime.UtcNow.AddDays(7), // 7 days expiry
                    IsRevoked = false,
                    CreatedDate = DateTime.UtcNow
                };

                dbContext.RefreshTokens.Add(refreshTokenEntity);
                await dbContext.SaveChangesAsync();

                logger.LogInformation($"Refresh token generated for user '{user.Email}'");
                return refreshToken;
            }
            catch (ValidationException)
            {
                throw;
            }
            catch (DbUpdateException ex)
            {
                logger.LogError($"Database error while generating refresh token: {ex.Message}");
                throw new InternalServerException("Failed to save refresh token");
            }
            catch (Exception ex)
            {
                logger.LogError($"Error generating refresh token: {ex.Message}");
                throw new InternalServerException("Failed to generate refresh token");
            }
        }

        public async Task<TokenResponse> RefreshTokenAsync(string refreshToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(refreshToken))
                    throw new ValidationException("Refresh token cannot be empty");

                // Find the refresh token in database
                var storedToken = await dbContext.RefreshTokens
                    .Include(rt => rt.AppUser)
                    .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

                if (storedToken == null)
                {
                    logger.LogWarning("Refresh token not found in database");
                    throw new UnauthorizedException("Invalid refresh token");
                }

                if (storedToken.IsRevoked)
                {
                    logger.LogWarning($"Refresh token has been revoked for user '{storedToken.AppUser?.Email}'");
                    throw new UnauthorizedException("Refresh token has been revoked");
                }

                if (storedToken.ExpiryDate < DateTime.UtcNow)
                {
                    logger.LogWarning($"Refresh token has expired for user '{storedToken.AppUser?.Email}'");
                    throw new UnauthorizedException("Refresh token has expired");
                }

                // Generate new tokens
                var user = storedToken.AppUser;
                if (user == null)
                    throw new InternalServerException("User associated with token not found");

                var newAccessToken = await GenerateAccessTokenAsync(user);
                var newRefreshToken = await GenerateRefreshTokenAsync(user);

                // Revoke old refresh token
                storedToken.IsRevoked = true;
                dbContext.RefreshTokens.Update(storedToken);
                await dbContext.SaveChangesAsync();

                var expiryHours = int.Parse(config["Jwt:ExpiryHours"] ?? "1");

                logger.LogInformation($"Token refreshed successfully for user '{user.Email}'");
                return new TokenResponse
                {
                    AccessToken = newAccessToken,
                    RefreshToken = newRefreshToken,
                    TokenType = "Bearer",
                    ExpiresIn = expiryHours * 3600,
                    ExpiresAt = DateTime.UtcNow.AddHours(expiryHours)
                };
            }
            catch (UnauthorizedException)
            {
                throw;
            }
            catch (ValidationException)
            {
                throw;
            }
            catch (InternalServerException)
            {
                throw;
            }
            catch (DbUpdateException ex)
            {
                logger.LogError($"Database error while refreshing token: {ex.Message}");
                throw new InternalServerException("Failed to refresh token");
            }
            catch (Exception ex)
            {
                logger.LogError($"Error refreshing token: {ex.Message}");
                throw new InternalServerException("Token refresh failed");
            }
        }

        public async Task RevokeRefreshTokenAsync(string refreshToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(refreshToken))
                    throw new ValidationException("Refresh token cannot be empty");

                var token = await dbContext.RefreshTokens
                    .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

                if (token != null)
                {
                    token.IsRevoked = true;
                    dbContext.RefreshTokens.Update(token);
                    await dbContext.SaveChangesAsync();
                    logger.LogInformation("Refresh token revoked successfully");
                }
            }
            catch (ValidationException)
            {
                throw;
            }
            catch (DbUpdateException ex)
            {
                logger.LogError($"Database error while revoking token: {ex.Message}");
                throw new InternalServerException("Failed to revoke token");
            }
            catch (Exception ex)
            {
                logger.LogError($"Error revoking token: {ex.Message}");
                throw new InternalServerException("Token revocation failed");
            }
        }

        // Keep old method for backward compatibility
        [Obsolete("Use GenerateTokenAsync instead")]
        public async Task<string> GenerateToken(AppUser user)
        {
            return (await GenerateTokenAsync(user)).AccessToken;
        }
    }
}
