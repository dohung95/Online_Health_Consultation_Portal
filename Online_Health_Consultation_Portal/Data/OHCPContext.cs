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

        public DbSet<Patient> Patients { get; set; }
        public DbSet<Doctor> Doctors { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<Consultation> Consultations { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<HealthRecord> HealthRecords { get; set; }
        public DbSet<MedicalDocument> MedicalDocuments { get; set; }
        public DbSet<Prescription> Prescriptions { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Invoice> Invoices { get; set; }


        public DbSet<RefreshToken_dat> RefreshTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Message>(entity =>
            {
                entity.HasOne(m => m.Sender)
                    .WithMany(u => u.MessagesSent)
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(m => m.Receiver)
                    .WithMany(u => u.MessagesReceived)
                    .HasForeignKey(m => m.ReceiverId)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // Prevent cascade deletes for Patient/Doctor -> Appointment
            builder.Entity<Appointment>(entity =>
            {
                entity.HasOne(a => a.Patient)
                    .WithMany(p => p.Appointments)
                    .HasForeignKey(a => a.PatientID)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(a => a.Doctor)
                    .WithMany(d => d.Appointments)
                    .HasForeignKey(a => a.DoctorID)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            // Prevent cascade deletes for Review as well
            builder.Entity<Review>(entity =>
            {
                entity.HasOne(r => r.Patient)
                    .WithMany(p => p.Reviews)
                    .HasForeignKey(r => r.PatientID)
                    .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(r => r.Doctor)
                    .WithMany(d => d.Reviews)
                    .HasForeignKey(r => r.DoctorID)
                    .OnDelete(DeleteBehavior.NoAction);
            });

            builder.Entity<Doctor>()
                .HasOne(d => d.User)
                .WithMany()
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            builder.Entity<Patient>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.NoAction);

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
