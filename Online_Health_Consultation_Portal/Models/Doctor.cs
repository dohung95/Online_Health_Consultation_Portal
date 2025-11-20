using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class Doctor
    {
        [Key]
        [Required]
        [ForeignKey(nameof(User))]
        public string DoctorID { get; set; } = null!;

        // Link to Identity User

        [Required]
        public string FullName { get; set; } = null!;
        
        [Required]
        public string Qualifications { get; set; } = null!;
        
        [Required]
        public string Specialty { get; set; } = null!;
        
        public int? YearsOfExperience { get; set; }
        
        [Required]
        public string LanguageSpoken { get; set; } = null!;
        
        [Required]
        public string Location { get; set; } = null!;

        public virtual AppUser User { get; set; } = null!;

        public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
