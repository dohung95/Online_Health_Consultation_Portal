using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OHCP_BK.Exceptions;
using OHCP_BK.Models;
using OHCP_BK.Services;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {

        readonly UserManager<AppUser> userManager;
        readonly SignInManager<AppUser> signInManager;
        readonly ITokenService tokenService;
        readonly ILogger<AuthController> logger;

        public AuthController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            ITokenService tokenService,
            ILogger<AuthController> logger)
        {
            this.userManager = userManager;
            this.signInManager = signInManager;
            this.tokenService = tokenService;
            this.logger = logger;
        }

        

        // Patient login
        // POST: api/Auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors)
                        .ToDictionary(e => "model", e => new[] { e.ErrorMessage });
                    throw new ValidationException("Invalid login data", errors);
                }

                var user = await userManager.FindByEmailAsync(model.Email);
                if (user == null)
                {
                    logger.LogWarning($"Login failed: User '{model.Email}' not found");
                    throw new UnauthorizedException("Invalid email or password");
                }

                var passwordValid = await userManager.CheckPasswordAsync(user, model.Password);
                if (!passwordValid)
                {
                    logger.LogWarning($"Login failed: Invalid password for user '{model.Email}'");
                    throw new UnauthorizedException("Invalid email or password");
                }

                var tokenResponse = await tokenService.GenerateTokenAsync(user);
                logger.LogInformation($"User '{user.Email}' logged in successfully");
                return Ok(tokenResponse);
            }
            catch (UnauthorizedException ex)
            {
                logger.LogWarning($"Login unauthorized: {ex.Message}");
                throw;
            }
            catch (ValidationException ex)
            {
                logger.LogWarning($"Login validation error: {ex.Message}");
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError($"Login error: {ex.Message}");
                throw new InternalServerException("Login failed. Please try again later.");
            }
        }

        // Refresh access token using refresh token
        // POST: api/Auth/refresh-token
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    throw new ValidationException("Invalid refresh token request");
                }

                if (string.IsNullOrWhiteSpace(request.RefreshToken))
                {
                    throw new ValidationException("Refresh token cannot be empty");
                }

                var tokenResponse = await tokenService.RefreshTokenAsync(request.RefreshToken);
                logger.LogInformation("Token refreshed successfully");
                return Ok(tokenResponse);
            }
            catch (UnauthorizedException ex)
            {
                logger.LogWarning($"Token refresh unauthorized: {ex.Message}");
                throw;
            }
            catch (ValidationException ex)
            {
                logger.LogWarning($"Token refresh validation error: {ex.Message}");
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError($"Token refresh error: {ex.Message}");
                throw new InternalServerException("Token refresh failed. Please login again.");
            }
        }

        // Logout and revoke refresh token
        // POST: api/Auth/logout
        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.RefreshToken))
                {
                    throw new ValidationException("Refresh token cannot be empty");
                }

                await tokenService.RevokeRefreshTokenAsync(request.RefreshToken);
                logger.LogInformation("User logged out successfully");
                return Ok(new { message = "Logged out successfully" });
            }
            catch (ValidationException ex)
            {
                logger.LogWarning($"Logout validation error: {ex.Message}");
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError($"Logout error: {ex.Message}");
                throw new InternalServerException("Logout failed");
            }
        }
    }
}
    