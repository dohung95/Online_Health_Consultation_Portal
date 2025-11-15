using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class Patient
    {
        [Key]
        [Required]
        [ForeignKey(nameof(User))]
        public string PatientID { get; set; } = null!;

        // Link to Identity User
        
        [Required]
        public string FullName { get; set; } = null!;
        
        public DateTime? DateOfBirth { get; set; }
        
        public string? MedicalHistorySummary { get; set; }
        
        public string? InsuranceProvider { get; set; }
        
        public string? InsurancePolicyNumber { get; set; }

        public virtual AppUser_dat User { get; set; } = null!;

        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<HealthRecord> HealthRecords { get; set; } = new List<HealthRecord>();
    }
}
