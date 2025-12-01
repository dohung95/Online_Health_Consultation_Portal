using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Dtos;
using OHCP_BK.Exceptions;
using OHCP_BK.Models;
using OHCP_BK.Services;
using System.Security.Claims;

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
        private readonly OHCPContext _context;

        public AccountController(
            IAccountService accountService,
            ITokenService tokenService,
            UserManager<AppUser> userManager,
            ILogger<AccountController> logger,
            OHCPContext context)
        {
            _accountService = accountService;
            _tokenService = tokenService;
            _userManager = userManager;
            _logger = logger;
            _context = context;
        }

        /// <summary>
        /// Register a new patient account
        /// </summary>
        /// <param name="dto">Patient registration data</param>
        /// <returns>Token and patient ID</returns>
        [AllowAnonymous]
        [HttpPost("register/patient")]
        public async Task<IActionResult> RegisterPatient([FromBody] PatientDTO dto)
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
                patientId = result.UserId
            });
        }

        /// <summary>
        /// Update patient's profile
        /// </summary>
        /// <param name="dto">Update patient profile data</param>
        /// <returns>Success message</returns>
        // (Bên trong class AccountController)

        [Authorize]
        [HttpGet("profile")] // <-- Đảm bảo đường dẫn là "profile"  
        public async Task<IActionResult> GetProfile()
        {
            // 1. Lấy User ID từ Token
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            // 2. Tìm User và Patient trong Database
            var user = await _userManager.FindByIdAsync(userId);
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.PatientID == userId);
            
            if (user == null) return NotFound();

            // 3. Trả về dữ liệu (DTO hoặc Object)
            return Ok(new {
                fullName = patient?.FullName ?? "Not found",
                email = user.Email,
                phoneNumber = user.PhoneNumber,
                dateOfBirth = patient?.DateOfBirth,
                gender = patient?.Gender,
                address = patient?.Address,
                city = patient?.City,
                country = patient?.Country,
                bloodType = patient?.BloodType,
                emergencyContactName = patient?.EmergencyContactName,
                emergencyContactPhone = patient?.EmergencyContactPhone,
                emergencyContactRelationship = patient?.EmergencyContactRelationship,
                preferredLanguage = patient?.PreferredLanguage,
                preferredContactMethod = patient?.PreferredContactMethod,
                occupation = patient?.Occupation,
                photoURL = "" 
            });
        }

        [Authorize] // Bắt buộc phải có JWT Token C#
        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO dto)
        {
            // Lấy user ID từ token
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null) return NotFound("User not found.");

            // 1. Dùng UserManager để thay đổi mật khẩu
            var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);

            if (!result.Succeeded)
            {
                // Trả về lỗi nếu mật khẩu cũ sai
                return BadRequest(new { message = "Failed to change password.", errors = result.Errors });
            }

            // 2. Nếu thành công, có thể xóa tất cả các refresh token cũ (tùy chọn bảo mật cao)
            await _tokenService.RemoveAllRefreshTokensAsync(userId); 

            return Ok(new { message = "Password updated successfully." });
        }

        [Authorize]
        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdatePatientProfileDTO dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            // 1. Cập nhật bảng Patients
            var patient = await _context.Patients.FirstOrDefaultAsync(p => p.PatientID == userId);
            
            if (patient != null)
            {
                // Cập nhật từng trường nếu nó có dữ liệu (không null)
                if (dto.FullName != null) patient.FullName = dto.FullName;
                if (dto.DateOfBirth != null) patient.DateOfBirth = dto.DateOfBirth.Value;
                if (dto.MedicalHistorySummary != null) patient.MedicalHistorySummary = dto.MedicalHistorySummary;
                if (dto.InsuranceProvider != null) patient.InsuranceProvider = dto.InsuranceProvider;
                if (dto.InsurancePolicyNumber != null) patient.InsurancePolicyNumber = dto.InsurancePolicyNumber;
                if (dto.Gender != null) patient.Gender = dto.Gender;
                if (dto.Address != null) patient.Address = dto.Address;
                if (dto.City != null) patient.City = dto.City;
                if (dto.Country != null) patient.Country = dto.Country;
                if (dto.BloodType != null) patient.BloodType = dto.BloodType;
                if (dto.EmergencyContactName != null) patient.EmergencyContactName = dto.EmergencyContactName;
                if (dto.EmergencyContactPhone != null) patient.EmergencyContactPhone = dto.EmergencyContactPhone;
                if (dto.EmergencyContactRelationship != null) patient.EmergencyContactRelationship = dto.EmergencyContactRelationship;
                if (dto.PreferredLanguage != null) patient.PreferredLanguage = dto.PreferredLanguage;
                if (dto.PreferredContactMethod != null) patient.PreferredContactMethod = dto.PreferredContactMethod;
                if (dto.Occupation != null) patient.Occupation = dto.Occupation;
                
                // (Không cần gọi .Update(), EF Core tự theo dõi thay đổi)
            }

            // 2. Cập nhật bảng Users
            var user = await _userManager.FindByIdAsync(userId);
            if (user != null)
            {
                // Cập nhật PhoneNumber nếu có
                if (dto.PhoneNumber != null)
                {
                    await _userManager.SetPhoneNumberAsync(user, dto.PhoneNumber);
                }
                
                // Cập nhật UserName nếu có
                if (dto.FullName != null)
                {
                    user.UserName = dto.FullName;
                    await _userManager.UpdateAsync(user);
                }
            }
            
            // 3. LƯU THAY ĐỔI (QUAN TRỌNG NHẤT)
            await _context.SaveChangesAsync();

            return Ok(new { message = "Profile updated successfully." });
        }

        [Authorize]
        [HttpPost("change-email")]
        public async Task<IActionResult> ChangeEmail([FromBody] ChangeEmailDTO dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null) return NotFound("User not found.");

            // 1. Kiểm tra email mới đã tồn tại chưa
            var existingUser = await _userManager.FindByEmailAsync(dto.NewEmail);
            if (existingUser != null)
            {
                return Conflict(new { message = "Email already exists." });
            }

            // 2. Xác thực mật khẩu hiện tại
            var isPasswordValid = await _userManager.CheckPasswordAsync(user, dto.Password);
            if (!isPasswordValid)
            {
                return BadRequest(new { message = "Current password is incorrect." });
            }

            // 3. Cập nhật email (cả Email và UserName vì đang dùng email làm username)
            user.Email = dto.NewEmail;
            user.UserName = dto.NewEmail;
            user.EmailConfirmed = false; // Reset verification status (optional)

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new { message = "Failed to change email.", errors = result.Errors });
            }

            // 4. (Optional) Xóa refresh tokens để bắt đăng nhập lại
            await _tokenService.RemoveAllRefreshTokensAsync(userId);

            return Ok(new { message = "Email changed successfully. Please log in again with new email." });
        }

        // NOTE: Doctor account creation has been moved to:
        // - Admin creation: POST /api/Admin/create/doctor [Authorize(Roles="admin")]
        // Only patients can self-register through this controller
    }
}
