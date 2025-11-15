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

        readonly UserManager<AppUser_dat> userManager;
        readonly SignInManager<AppUser_dat> signInManager;
        readonly ITokenService_dat tokenService;
        readonly ILogger<AuthController> logger;

        public AuthController(
            UserManager<AppUser_dat> userManager,
            SignInManager<AppUser_dat> signInManager,
            ITokenService_dat tokenService,
            ILogger<AuthController> logger)
        {
            this.userManager = userManager;
            this.signInManager = signInManager;
            this.tokenService = tokenService;
            this.logger = logger;
        }

        // Create a new patient account
        // POST: api/Auth/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel_dat model)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors)
                        .ToDictionary(e => "model", e => new[] { e.ErrorMessage });
                    throw new ValidationException("Invalid registration data", errors);
                }

                // Check if user already exists
                var existingUser = await userManager.FindByEmailAsync(model.Email);
                if (existingUser != null)
                {
                    throw new ConflictException($"User with email '{model.Email}' already exists");
                }

                var user = new AppUser_dat
                {
                    UserName = model.UserName,
                    Email = model.Email,
                    EmailConfirmed = false,
                    PhoneNumber = model.PhoneNumber
                };

                var result = await userManager.CreateAsync(user, model.Password);

                if (!result.Succeeded)
                {
                    var errors = result.Errors
                        .GroupBy(e => e.Code.Contains("UserName") ? "userName" : "password")
                        .ToDictionary(g => g.Key, g => g.Select(e => e.Description).ToArray());
                    throw new ValidationException("Registration failed", errors);
                }

                // Assign default "User" role
                await userManager.AddToRoleAsync(user, "patient");

                var tokenResponse = await tokenService.GenerateTokenAsync(user);
                logger.LogInformation($"User '{user.Email}' registered successfully");
                return Ok(tokenResponse);
            }
            catch (ConflictException ex)
            {
                logger.LogWarning($"Registration conflict: {ex.Message}");
                throw;
            }
            catch (ValidationException ex)
            {
                logger.LogWarning($"Registration validation error: {ex.Message}");
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError($"Registration error: {ex.Message}");
                throw new InternalServerException("Registration failed. Please try again later.");
            }
        }

        // Patient login
        // POST: api/Auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel_dat model)
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
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest_dat request)
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
        public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest_dat request)
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
    