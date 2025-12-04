using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Dtos.Admin
{
    public class AdminNotificationDto
    {
        public int NotificationID { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public string NotificationType { get; set; } = string.Empty; // "UserRegistration" or "AppointmentCreated"
    }

    public class UserRegisteredNotificationDto
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public string UserName { get; set; } = string.Empty;
        
        [Required]
        public string UserRole { get; set; } = string.Empty; // "Patient" or "Doctor"
        
        [Required]
        public string Email { get; set; } = string.Empty;
    }

    public class AppointmentCreatedNotificationDto
    {
        [Required]
        public int AppointmentId { get; set; }
        
        [Required]
        public string PatientName { get; set; } = string.Empty;
        
        [Required]
        public string DoctorName { get; set; } = string.Empty;
        
        [Required]
        public DateTime AppointmentTime { get; set; }
        
        [Required]
        public string ConsultationType { get; set; } = string.Empty;
    }

    public class AdminNotificationListResponseDto
    {
        public List<AdminNotificationDto> Notifications { get; set; } = new();
        public int TotalCount { get; set; }
        public int UnreadCount { get; set; }
    }
}
