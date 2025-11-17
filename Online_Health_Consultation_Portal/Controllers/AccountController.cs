using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using OHCP_BK.Data;
using OHCP_BK.Dtos;
using OHCP_BK.Exceptions;
using OHCP_BK.Models;
using OHCP_BK.Services;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly ITokenService _tokenService;
        private readonly UserManager<AppUser> _userManager;
        private readonly ILogger<AccountController> _logger;

        public AccountController(
            IAccountService accountService,
            ITokenService tokenService,
            UserManager<AppUser> userManager,
            ILogger<AccountController> logger)
        {
            _accountService = accountService;
            _tokenService = tokenService;
            _userManager = userManager;
            _logger = logger;
        }

        /// <summary>
        /// Register a new patient account
        /// </summary>
        /// <param name="dto">Patient registration data</param>
        /// <returns>Token and patient ID</returns>
        [AllowAnonymous]
        [HttpPost("register/patient")]
        public async Task<IActionResult> RegisterPatient([FromBody] PatientCreateDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _accountService.CreatePatientAsync(dto, isAdminCreated: false);

            if (!result.Succeeded)
            {
                if (result.ErrorCode == "USER_EXISTS")
                {
                    return Conflict(new { message = "Email already exists", errors = result.Errors, errorCode = result.ErrorCode });
                }

                return BadRequest(new { message = "Registration failed", errors = result.Errors, errorCode = result.ErrorCode });
            }

            // Load the user and generate token
            var user = await _userManager.FindByIdAsync(result.UserId!);
            if (user == null)
            {
                return StatusCode(500, new { message = "User created but could not be retrieved" });
            }

            var tokenResponse = await _tokenService.GenerateTokenAsync(user);

            return Ok(new
            {
                message = "Patient account created successfully",
                token = tokenResponse.AccessToken,
                refreshToken = tokenResponse.RefreshToken,
                expiresIn = tokenResponse.ExpiresIn,
                patientId = result.ProfileId
            });
        }

        // NOTE: Doctor account creation has been moved to:
        // - Admin creation: POST /api/Admin/create/doctor [Authorize(Roles="admin")]
        // Only patients can self-register through this controller
    }
}
