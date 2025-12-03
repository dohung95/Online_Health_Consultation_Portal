using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OHCP_BK.Exceptions;
using OHCP_BK.Models;
using OHCP_BK.Services;
using OHCP_BK.Constants;

using FirebaseAdmin.Auth;
using System.Security.Claims;

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
        readonly IConfiguration configuration;

        public AuthController(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            ITokenService tokenService,
            ILogger<AuthController> logger,
            IConfiguration configuration)
        {
            this.userManager = userManager;
            this.signInManager = signInManager;
            this.tokenService = tokenService;
            this.logger = logger;
            this.configuration = configuration;
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

                // Check if email is confirmed
                if (!user.EmailConfirmed)
                {
                    logger.LogWarning($"Login failed: Email not confirmed for user '{model.Email}'");
                    throw new UnauthorizedException("Please confirm your email address before logging in. Check your inbox for the confirmation link or contact support.");
                }

                // Check user status for Patient and Doctor roles
                var roles = await userManager.GetRolesAsync(user);
                if (roles.Contains("patient") || roles.Contains("doctor"))
                {
                    if (user.Status != UserStatusConstants.Active)
                    {
                        logger.LogWarning($"Login failed: User '{model.Email}' has status '{user.Status}'");

                        string message = user.Status switch
                        {
                            UserStatusConstants.Inactive => "Your account is inactive. Please click on the confirmation link in the registered email.",
                            UserStatusConstants.Suspended => "Your account has been suspended. Please contact support.",
                            UserStatusConstants.Banned => "Your account has been banned. Please contact support for more details.",
                            _ => "Your account is not active. Please contact support."
                        };

                        throw new UnauthorizedException(message);
                    }
                }
                // Admin role: no status check (original logic)

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

        /// GET: api/auth/firebase-token
        [HttpGet("firebase-token")]
        [Authorize] // <-- RẤT QUAN TRỌNG: Chỉ user đã login C# mới được gọi
        public async Task<IActionResult> GetFirebaseToken()
        {

            logger.LogWarning(">>> [DEBUG] Đã TRUY CẬP HÀM GetFirebaseToken!");
            // 1. Lấy ID của user (từ C# accessToken mà React gửi lên)
            // Đây là claim "sub" (subject)
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (userId == null)
            {
                return Unauthorized("C# Token không hợp lệ hoặc thiếu User ID");
            }

            // 2. Dùng Firebase Admin SDK để tạo Custom Token
            try
            {
                var firebaseUserId = userId.Substring(0, 32);
                logger.LogWarning($">>> [DEBUG] Đang tạo token cho Firebase UID: {firebaseUserId}");
                // (Quan trọng: Nếu bạn đã cắt ID (substring(0, 32)) ở Zego, 
                // bạn cũng phải cắt ở đây để 2 User ID khớp nhau)


                // Tạo một token Firebase cho chính user ID đó
                string firebaseToken = await FirebaseAuth.DefaultInstance
                    .CreateCustomTokenAsync(firebaseUserId);

                // 3. Trả token Firebase về cho React
                return Ok(new { FirebaseToken = firebaseToken });
            }
            catch (Exception ex)
            {
                logger.LogError(ex, ">>> [DEBUG] LỖI TỪ FIREBASE ADMIN SDK: {ErrorMessage}", ex.Message);
                logger.LogError(ex, "Không thể tạo Firebase token cho user {UserId}", userId);
                return StatusCode(500, "Không thể tạo Firebase token: " + ex.Message);
            }
        }

        // Confirm email address
        // GET: api/Auth/confirm-email?userId={userId}&token={token}
        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail([FromQuery] string userId, [FromQuery] string token)
        {
            try
            {
                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(token))
                {
                    logger.LogWarning("Email confirmation failed: Missing userId or token");
                    throw new ValidationException("Invalid confirmation link");
                }

                var user = await userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    logger.LogWarning($"Email confirmation failed: User '{userId}' not found");
                    throw new NotFoundException("User not found");
                }

                // Check if already confirmed
                if (user.EmailConfirmed)
                {
                    logger.LogInformation($"Email already confirmed for user '{user.Email}'");
                    return Ok(new { message = "Email already confirmed. You can now log in." });
                }

                // Confirm email using UserManager
                var result = await userManager.ConfirmEmailAsync(user, token);
                if (!result.Succeeded)
                {
                    logger.LogWarning($"Email confirmation failed for user '{user.Email}': {string.Join(", ", result.Errors.Select(e => e.Description))}");
                    throw new ValidationException("Invalid or expired confirmation link");
                }

                // Update user status to Active after email confirmation
                user.Status = UserStatusConstants.Active;
                await userManager.UpdateAsync(user);

                logger.LogInformation($"Email confirmed successfully for user '{user.Email}'");
                return Ok(new { message = "Email confirmed successfully! You can now log in to your account." });
            }
            catch (ValidationException ex)
            {
                logger.LogWarning($"Email confirmation validation error: {ex.Message}");
                throw;
            }
            catch (NotFoundException ex)
            {
                logger.LogWarning($"Email confirmation error: {ex.Message}");
                throw;
            }
            catch (Exception ex)
            {
                logger.LogError($"Email confirmation error: {ex.Message}");
                throw new InternalServerException("Email confirmation failed. Please try again later.");
            }
        }

    }
}
