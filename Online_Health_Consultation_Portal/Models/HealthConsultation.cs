using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Models
{
    public class HealthConsultation
    {
        [Key]
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public DateTime Date { get; set; } = DateTime.Now;
    }
}
