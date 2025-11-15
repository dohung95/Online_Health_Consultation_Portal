using Microsoft.AspNetCore.Identity;
using OHCP_BK.Models;

namespace OHCP_BK.Data
{
    public class SeedData_dat
    {
        public static async Task CreateRoles(IServiceProvider serviceProvider, UserManager<AppUser_dat> userManager)
        {
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            string[] roleNames = { "admin", "docter", "patient" };

            IdentityResult roleResult;

            foreach (var roleName in roleNames)
            {
                var roleExist = await roleManager.RoleExistsAsync(roleName);
                if (!roleExist)
                {
                    var role = new IdentityRole(roleName);
                    roleResult = await roleManager.CreateAsync(role);
                }
            }

            // create user admin
            var adminUser = await userManager.FindByEmailAsync("admin@gmail.com");
            if (adminUser == null)
            {
                var user = new AppUser_dat
                {
                    UserName = "Administrator",
                    Email = "admin@gmail.com"
                };
                var createdUser = await userManager.CreateAsync(user, "Admin@123!#");

                if (createdUser.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "admin");
                }
            }
            
            // create user doctor
            var DoctorUser = await userManager.FindByEmailAsync("doctor@gmail.com");
            if (DoctorUser == null)
            {
                var user = new AppUser_dat
                {
                    UserName = "Doctor",
                    Email = "doctor@gmail.com"
                };
                var createdUser = await userManager.CreateAsync(user, "Doctor@123!#");

                if (createdUser.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "docter");

                    // Create Doctor record with DoctorID = user.Id
                    var context = serviceProvider.GetRequiredService<OHCPContext>();
                    var doctor = new Doctor
                    {
                        DoctorID = user.Id,
                        FullName = "Dr. John Doe",
                        Qualifications = "MD",
                        Specialty = "General Medicine",
                        YearsOfExperience = 10,
                        LanguageSpoken = "English",
                        Location = "New York"
                    };
                    context.Doctors.Add(doctor);
                    await context.SaveChangesAsync();
                }
            }

            // create user patient
            var PatientUser = await userManager.FindByEmailAsync("patient@gmail.com");
            if (PatientUser == null)
            {
                var user = new AppUser_dat
                {
                    UserName = "Patient",
                    Email = "patient@gmail.com"
                };
                var createdUser = await userManager.CreateAsync(user, "Patient@123!#");

                if (createdUser.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "patient");

                    // Create Patient record with PatientID = user.Id
                    var context = serviceProvider.GetRequiredService<OHCPContext>();
                    var patient = new Patient
                    {
                        PatientID = user.Id,
                        FullName = "Jane Smith",
                        DateOfBirth = new DateTime(1990, 5, 15),
                        MedicalHistorySummary = "No major health issues",
                        InsuranceProvider = "HealthCare Inc.",
                        InsurancePolicyNumber = "POL123456"
                    };
                    context.Patients.Add(patient);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
