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
            
            // create user admin
            var DocterUser = await userManager.FindByEmailAsync("docter@gmail.com");
            if (DocterUser == null)
            {
                var user = new AppUser_dat
                {
                    UserName = "Docter",
                    Email = "docter@gmail.com"
                };
                var createdUser = await userManager.CreateAsync(user, "Docter@123!#");

                if (createdUser.Succeeded)
                {
                    await userManager.AddToRoleAsync(user, "docter");
                }
            }
        }
    }
}
