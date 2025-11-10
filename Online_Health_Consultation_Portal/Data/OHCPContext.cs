using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Models;

namespace OHCP_BK.Data
{
    public class OHCPContext : IdentityDbContext<AppUser_dat>
    {
        public OHCPContext(DbContextOptions options) : base(options)
        {
        }

        protected OHCPContext()
        {
        }
        public DbSet<HealthConsultation> HealthConsultations { get; set; }
        public DbSet<RefreshToken_dat> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure RefreshToken relationships
            builder.Entity<RefreshToken_dat>()
                .HasOne(rt => rt.AppUser_dat)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            foreach (var et in builder.Model.GetEntityTypes())
            {
                var tblName = et.GetTableName();
                if (tblName!.StartsWith("AspNet"))
                {
                    et.SetTableName(tblName.Substring(6));
                }
            }
        }
    }
}
