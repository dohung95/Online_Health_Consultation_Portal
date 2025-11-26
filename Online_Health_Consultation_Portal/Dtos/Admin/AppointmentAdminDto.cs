namespace OHCP_BK.DTOs.Admin
{
    public class AppointmentAdminDto
    {
        public int AppointmentID { get; set; }
        public string PatientID { get; set; } = string.Empty;
        public string PatientName { get; set; } = string.Empty;
        public string DoctorID { get; set; } = string.Empty;
        public string DoctorName { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public DateTime AppointmentTime { get; set; }
        public string Date { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string ConsultationType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class AppointmentListResponseDto
    {
        public List<AppointmentAdminDto> Appointments { get; set; } = new();
        public int TotalCount { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }

    public class CreateAppointmentAdminDto
    {
        public string PatientID { get; set; } = string.Empty;
        public string DoctorID { get; set; } = string.Empty;
        public DateTime AppointmentTime { get; set; }
        public string ConsultationType { get; set; } = "In-Person";
        public string Status { get; set; } = "Scheduled";
    }

    public class UpdateAppointmentAdminDto
    {
        public DateTime? AppointmentTime { get; set; }
        public string? ConsultationType { get; set; }
        public string? Status { get; set; }
    }

    public class AppointmentStatsDto
    {
        public int TodayAppointments { get; set; }
        public int PendingApproval { get; set; }
        public int Completed { get; set; }
        public int Cancelled { get; set; }
    }
}
