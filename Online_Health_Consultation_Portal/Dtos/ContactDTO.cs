using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Dtos
{
    public class ContactDTO
    {
        [Required]
        [StringLength(100, MinimumLength = 2)]
        public string Name { get; set; } = null!;

        [Required]
        [StringLength(254)]
        [RegularExpression(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", ErrorMessage = "Email không hợp lệ")]
        public string Email { get; set; } = null!;

        [Required]
        [StringLength(20, MinimumLength = 8)]
        public string Phone { get; set; } = null!;

        [Required]
        [StringLength(200, MinimumLength = 3)]
        public string Subject { get; set; } = null!;

        [Required]
        [StringLength(2000, MinimumLength = 5)]
        public string Message { get; set; } = null!;
    }
}
