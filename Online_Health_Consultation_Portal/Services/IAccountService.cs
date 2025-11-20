using OHCP_BK.Dtos;
using OHCP_BK.Models;

namespace OHCP_BK.Services
{
    public interface IAccountService
    {
        /// <summary>
        /// Create a new patient account with Identity user and profile
        /// </summary>
        /// <param name="dto">Patient creation data</param>
        /// <param name="isAdminCreated">Whether the account is created by admin (auto-confirmed email)</param>
        /// <returns>User creation result with success status and details</returns>
        Task<UserCreationResult> CreatePatientAsync(PatientCreateDTO dto, bool isAdminCreated = false);

        /// <summary>
        /// Create a new doctor account with Identity user and profile (admin-only)
        /// </summary>
        /// <param name="dto">Doctor creation data</param>
        /// <returns>User creation result with success status and details</returns>
        Task<UserCreationResult> CreateDoctorAsync(DoctorCreateDTO dto);
    }
}
