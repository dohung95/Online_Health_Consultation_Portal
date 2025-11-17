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
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAccountService _accountService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(
            IAccountService accountService,
            ILogger<AdminController> logger)
        {
            _accountService = accountService;
            _logger = logger;
        }

        /// <summary>
        /// Admin creates a new patient account
        /// </summary>
        /// <param name="dto">Patient registration data</param>
        /// <returns>Patient ID and user details</returns>
        [HttpPost("create/patient")]
        public async Task<IActionResult> CreatePatient([FromBody] PatientCreateDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _accountService.CreatePatientAsync(dto, isAdminCreated: true);

            if (!result.Succeeded)
            {
                if (result.ErrorCode == "USER_EXISTS")
                {
                    return Conflict(new { message = "Email already exists", errors = result.Errors, errorCode = result.ErrorCode });
                }

                return BadRequest(new { message = "Failed to create patient account", errors = result.Errors, errorCode = result.ErrorCode });
            }

            return Ok(new
            {
                message = "Patient account created successfully by admin",
                patientId = result.ProfileId,
                userId = result.UserId,
                email = result.Email
            });
        }

        /// <summary>
        /// Admin creates a new doctor account
        /// </summary>
        /// <param name="dto">Doctor registration data</param>
        /// <returns>Doctor ID and user details</returns>
        [HttpPost("create/doctor")]
        public async Task<IActionResult> CreateDoctor([FromBody] DoctorCreateDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var result = await _accountService.CreateDoctorAsync(dto);

            if (!result.Succeeded)
            {
                if (result.ErrorCode == "USER_EXISTS")
                {
                    return Conflict(new { message = "Email already exists", errors = result.Errors, errorCode = result.ErrorCode });
                }

                return BadRequest(new { message = "Failed to create doctor account", errors = result.Errors, errorCode = result.ErrorCode });
            }

            return Ok(new
            {
                message = "Doctor account created successfully by admin",
                doctorId = result.ProfileId,
                userId = result.UserId,
                email = result.Email
            });
        }
    }
}
