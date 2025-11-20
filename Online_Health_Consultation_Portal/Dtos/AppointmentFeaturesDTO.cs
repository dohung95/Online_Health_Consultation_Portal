using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Dtos
{
    // 1. DTO find doctor (Filter)
    public class DoctorSearchDTO
    {
        public string? Specialty { get; set; }
        public string? Name { get; set; }
        public string? Location { get; set; }
    }

    // 2. DTO return slot calendar
    public class TimeSlotDTO
    {
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public bool IsAvailable { get; set; }
    }

    // 3. DTO change appointment (Reschedule)
    public class RescheduleDTO
    {
        [Required]
        public DateTime NewDate { get; set; }
        [Required]
        public string Reason { get; set; } = string.Empty;
    }

    // 4. DTO cancel appointment
    public class CancelAppointmentDTO
    {
        [Required]
        public string Reason { get; set; } = string.Empty;
    }

    // Helper class 
    public static class AppointmentConstants
    {
        public const string StatusScheduled = "Scheduled";
        public const string StatusCancelled = "Cancelled";
        public const string StatusCompleted = "Completed";
        public const string StatusRescheduled = "Rescheduled";

        public const string TypeVideo = "Video Call";
        public const string TypeAudio = "Audio Call";
        public const string TypeChat = "Chat";
    }
}