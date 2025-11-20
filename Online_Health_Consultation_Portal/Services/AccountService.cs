using Microsoft.AspNetCore.Identity;
using OHCP_BK.Data;
using OHCP_BK.Dtos;
using OHCP_BK.Models;

namespace OHCP_BK.Services
{
    public class AccountService : IAccountService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly OHCPContext _context;
        private readonly ILogger<AccountService> _logger;

        public AccountService(
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole> roleManager,
            OHCPContext context,
            ILogger<AccountService> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
            _logger = logger;
        }

        public async Task<UserCreationResult> CreatePatientAsync(PatientCreateDTO dto, bool isAdminCreated = false)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _userManager.FindByEmailAsync(dto.Email);
                if (existingUser != null)
                {
                    _logger.LogWarning($"Attempt to create patient with existing email: {dto.Email}");
                    return UserCreationResult.Failure(
                        "USER_EXISTS",
                        new Dictionary<string, string[]>
                        {
                            { "Email", new[] { $"User with email '{dto.Email}' already exists" } }
                        }
                    );
                }

                // Create Identity user
                var user = new AppUser
                {
                    UserName = dto.FullName,
                    Email = dto.Email,
                    EmailConfirmed = isAdminCreated, // Admin-created accounts are auto-confirmed
                    CreatedDate = DateTime.UtcNow
                };

                var createResult = await _userManager.CreateAsync(user, dto.Password);
                if (!createResult.Succeeded)
                {
                    _logger.LogWarning($"Failed to create user account for {dto.Email}");
                    var errors = createResult.Errors.ToDictionary(
                        e => e.Code,
                        e => new[] { e.Description }
                    );
                    return UserCreationResult.Failure("USER_CREATE_FAILED", errors);
                }

                // Ensure role exists and add user to role
                await EnsureRoleExistsAsync("patient");
                var roleResult = await _userManager.AddToRoleAsync(user, "patient");
                if (!roleResult.Succeeded)
                {
                    _logger.LogError($"Failed to assign 'patient' role to user {dto.Email}; rolling back");
                    await _userManager.DeleteAsync(user);
                    var errors = roleResult.Errors.ToDictionary(
                        e => e.Code,
                        e => new[] { e.Description }
                    );
                    return UserCreationResult.Failure("ROLE_ASSIGN_FAILED", errors);
                }

                // Create patient profile with ID = user.Id
                var patient = new Patient
                {
                    PatientID = user.Id,
                    FullName = dto.FullName,
                    DateOfBirth = dto.DateOfBirth,
                    MedicalHistorySummary = dto.MedicalHistorySummary,
                    InsuranceProvider = dto.InsuranceProvider,
                    InsurancePolicyNumber = dto.InsurancePolicyNumber,
                    User = user
                };

                try
                {
                    _context.Patients.Add(patient);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Patient account created successfully: {dto.Email} (Admin: {isAdminCreated})");

                    return UserCreationResult.Success(user.Id, patient.PatientID, user.Email!);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to create patient profile for {dto.Email}; rolling back user");
                    await _userManager.DeleteAsync(user);
                    return UserCreationResult.Failure("PROFILE_CREATE_FAILED", "Failed to create patient profile");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error during patient creation for {dto.Email}");
                return UserCreationResult.Failure("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
            }
        }

        public async Task<UserCreationResult> CreateDoctorAsync(DoctorCreateDTO dto)
        {
            try
            {
                // Check if user already exists
                var existingUser = await _userManager.FindByEmailAsync(dto.Email);
                if (existingUser != null)
                {
                    _logger.LogWarning($"Attempt to create doctor with existing email: {dto.Email}");
                    return UserCreationResult.Failure(
                        "USER_EXISTS",
                        new Dictionary<string, string[]>
                        {
                            { "Email", new[] { $"User with email '{dto.Email}' already exists" } }
                        }
                    );
                }

                // Create Identity user
                var user = new AppUser
                {
                    UserName = dto.Email,
                    Email = dto.Email,
                    EmailConfirmed = true, // Doctors are admin-created and auto-confirmed
                    CreatedDate = DateTime.UtcNow
                };

                var createResult = await _userManager.CreateAsync(user, dto.Password);
                if (!createResult.Succeeded)
                {
                    _logger.LogWarning($"Failed to create user account for doctor {dto.Email}");
                    var errors = createResult.Errors.ToDictionary(
                        e => e.Code,
                        e => new[] { e.Description }
                    );
                    return UserCreationResult.Failure("USER_CREATE_FAILED", errors);
                }

                // Ensure role exists and add user to role
                await EnsureRoleExistsAsync("doctor");
                var roleResult = await _userManager.AddToRoleAsync(user, "doctor");
                if (!roleResult.Succeeded)
                {
                    _logger.LogError($"Failed to assign 'doctor' role to user {dto.Email}; rolling back");
                    await _userManager.DeleteAsync(user);
                    var errors = roleResult.Errors.ToDictionary(
                        e => e.Code,
                        e => new[] { e.Description }
                    );
                    return UserCreationResult.Failure("ROLE_ASSIGN_FAILED", errors);
                }

                // Create doctor profile with ID = user.Id
                var doctor = new Doctor
                {
                    DoctorID = user.Id,
                    FullName = dto.FullName,
                    Specialty = dto.Specialty,
                    Qualifications = dto.Qualifications,
                    YearsOfExperience = dto.YearsOfExperience,
                    LanguageSpoken = dto.LanguageSpoken ?? "English",
                    Location = dto.Location ?? "Not specified",
                    User = user
                };

                try
                {
                    _context.Doctors.Add(doctor);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Doctor account created successfully: {dto.Email}");

                    return UserCreationResult.Success(user.Id, doctor.DoctorID, user.Email!);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Failed to create doctor profile for {dto.Email}; rolling back user");
                    await _userManager.DeleteAsync(user);
                    return UserCreationResult.Failure("PROFILE_CREATE_FAILED", "Failed to create doctor profile");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error during doctor creation for {dto.Email}");
                return UserCreationResult.Failure("INTERNAL_SERVER_ERROR", "An unexpected error occurred");
            }
        }

        private async Task EnsureRoleExistsAsync(string roleName)
        {
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                _logger.LogInformation($"Creating role '{roleName}'");
                await _roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }
    }
}
