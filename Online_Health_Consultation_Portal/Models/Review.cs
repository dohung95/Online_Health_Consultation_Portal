using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace OHCP_BK.Models
{
    public class Review
    {
        [Key]
        public int ReviewID { get; set; }
        
        [Required]
        [ForeignKey(nameof(Patient))]
        public string PatientID { get; set; } = null!;
        
        [Required]
        [ForeignKey(nameof(Doctor))]
        public string DoctorID { get; set; } = null!;
        
        [Required]
        [Range(1, 5)]
        public int Rating { get; set; }
        
        [Required]
        public string Comment { get; set; } = null!;
        public DateTime ReviewDate { get; set; } = DateTime.Now;

        public virtual Patient Patient { get; set; } = null!;
        public virtual Doctor Doctor { get; set; } = null!;
    }

}
