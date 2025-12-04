using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Dtos.Admin
{
    public class MonthlyDataDto
    {
        public string Month { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class WeeklyDataDto
    {
        public string Week { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class RevenueDataDto
    {
        public string Month { get; set; } = string.Empty;
        public decimal Paid { get; set; }
        public decimal Pending { get; set; }
        public decimal Cancelled { get; set; }
    }

    public class PatientRegistrationsResponseDto
    {
        public List<MonthlyDataDto> Data { get; set; } = new();
        public int TotalPatients { get; set; }
    }

    public class AppointmentsByWeekResponseDto
    {
        public List<WeeklyDataDto> Data { get; set; } = new();
        public int TotalAppointments { get; set; }
    }

    public class AppointmentsByMonthResponseDto
    {
        public List<MonthlyDataDto> Data { get; set; } = new();
        public int TotalAppointments { get; set; }
    }

    public class RevenueByMonthResponseDto
    {
        public List<RevenueDataDto> Data { get; set; } = new();
        public decimal TotalRevenue { get; set; }
    }
}
