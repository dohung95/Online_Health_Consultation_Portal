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

        [MaxLength(10)]
        public string? Gender { get; set; }
    
        [MaxLength(255)]
        public string? Address { get; set; }
    
        [MaxLength(100)]
        public string? City { get; set; }
    
        [MaxLength(100)]
        public string? Country { get; set; }
        
        [MaxLength(10)]
        public string? BloodType { get; set; }
        
        [MaxLength(100)]
        public string? EmergencyContactName { get; set; }
        
        [MaxLength(20)]
        public string? EmergencyContactPhone { get; set; }
        
        [MaxLength(50)]
        public string? EmergencyContactRelationship { get; set; }
        
        [MaxLength(50)]
        public string? PreferredLanguage { get; set; }
        
        [MaxLength(20)]
        public string? PreferredContactMethod { get; set; }
        
        [MaxLength(100)]
        public string? Occupation { get; set; }

        public virtual AppUser User { get; set; } = null!;

        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        public ICollection<HealthRecord> HealthRecords { get; set; } = new List<HealthRecord>();
    }
}
