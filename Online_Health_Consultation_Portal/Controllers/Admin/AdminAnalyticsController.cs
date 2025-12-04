using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Dtos.Admin;

namespace OHCP_BK.Controllers.Admin
{
    [Route("api/admin/analytics")]
    [ApiController]
    [Authorize(Roles = "admin")]
    public class AdminAnalyticsController : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<AdminAnalyticsController> _logger;

        public AdminAnalyticsController(OHCPContext context, ILogger<AdminAnalyticsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/admin/analytics/patient-registrations
        [HttpGet("patient-registrations")]
        public async Task<ActionResult<PatientRegistrationsResponseDto>> GetPatientRegistrations([FromQuery] int year = 0)
        {
            try
            {
                var targetYear = year == 0 ? DateTime.UtcNow.Year : year;

                var patients = await _context.Patients
                    .Include(p => p.User)
                    .Where(p => p.User.CreatedDate.HasValue && p.User.CreatedDate.Value.Year == targetYear)
                    .GroupBy(p => p.User.CreatedDate.Value.Month)
                    .Select(g => new
                    {
                        Month = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                var monthNames = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
                var data = new List<MonthlyDataDto>();

                for (int i = 1; i <= 12; i++)
                {
                    var monthData = patients.FirstOrDefault(p => p.Month == i);
                    data.Add(new MonthlyDataDto
                    {
                        Month = monthNames[i - 1],
                        Count = monthData?.Count ?? 0
                    });
                }

                return Ok(new PatientRegistrationsResponseDto
                {
                    Data = data,
                    TotalPatients = data.Sum(d => d.Count)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting patient registrations");
                return StatusCode(500, new { error = "Failed to get patient registrations" });
            }
        }

        // GET: api/admin/analytics/appointments-by-week
        [HttpGet("appointments-by-week")]
        public async Task<ActionResult<AppointmentsByWeekResponseDto>> GetAppointmentsByWeek([FromQuery] int year = 0, [FromQuery] int month = 0)
        {
            try
            {
                var now = DateTime.UtcNow;
                var targetYear = year == 0 ? now.Year : year;
                var targetMonth = month == 0 ? now.Month : month;

                var startDate = new DateTime(targetYear, targetMonth, 1);
                var endDate = startDate.AddMonths(1);

                var appointments = await _context.Appointments
                    .Where(a => a.AppointmentTime >= startDate && a.AppointmentTime < endDate)
                    .ToListAsync();

                var weeklyData = new List<WeeklyDataDto>();
                var currentDate = startDate;
                int weekNumber = 1;

                while (currentDate < endDate)
                {
                    var weekEnd = currentDate.AddDays(7);
                    if (weekEnd > endDate) weekEnd = endDate;

                    var count = appointments.Count(a => a.AppointmentTime >= currentDate && a.AppointmentTime < weekEnd);

                    weeklyData.Add(new WeeklyDataDto
                    {
                        Week = $"Week {weekNumber}",
                        Count = count
                    });

                    currentDate = weekEnd;
                    weekNumber++;
                }

                return Ok(new AppointmentsByWeekResponseDto
                {
                    Data = weeklyData,
                    TotalAppointments = weeklyData.Sum(w => w.Count)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointments by week");
                return StatusCode(500, new { error = "Failed to get appointments by week" });
            }
        }

        // GET: api/admin/analytics/appointments-by-month
        [HttpGet("appointments-by-month")]
        public async Task<ActionResult<AppointmentsByMonthResponseDto>> GetAppointmentsByMonth([FromQuery] int year = 0)
        {
            try
            {
                var targetYear = year == 0 ? DateTime.UtcNow.Year : year;

                var appointments = await _context.Appointments
                    .Where(a => a.AppointmentTime.Year == targetYear)
                    .GroupBy(a => a.AppointmentTime.Month)
                    .Select(g => new
                    {
                        Month = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                var monthNames = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
                var data = new List<MonthlyDataDto>();

                for (int i = 1; i <= 12; i++)
                {
                    var monthData = appointments.FirstOrDefault(a => a.Month == i);
                    data.Add(new MonthlyDataDto
                    {
                        Month = monthNames[i - 1],
                        Count = monthData?.Count ?? 0
                    });
                }

                return Ok(new AppointmentsByMonthResponseDto
                {
                    Data = data,
                    TotalAppointments = data.Sum(d => d.Count)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting appointments by month");
                return StatusCode(500, new { error = "Failed to get appointments by month" });
            }
        }

        // GET: api/admin/analytics/revenue-by-month
        [HttpGet("revenue-by-month")]
        public async Task<ActionResult<RevenueByMonthResponseDto>> GetRevenueByMonth([FromQuery] int year = 0)
        {
            try
            {
                var targetYear = year == 0 ? DateTime.UtcNow.Year : year;

                var invoices = await _context.Invoices
                    .Where(i => i.IssueDate.Year == targetYear)
                    .ToListAsync();

                var monthNames = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
                var data = new List<RevenueDataDto>();

                for (int i = 1; i <= 12; i++)
                {
                    var monthInvoices = invoices.Where(inv => inv.IssueDate.Month == i);

                    data.Add(new RevenueDataDto
                    {
                        Month = monthNames[i - 1],
                        Paid = monthInvoices.Where(inv => inv.Status.ToLower() == "paid").Sum(inv => inv.Amount),
                        Pending = monthInvoices.Where(inv => inv.Status.ToLower() == "pending").Sum(inv => inv.Amount),
                        Cancelled = monthInvoices.Where(inv => inv.Status.ToLower() == "cancelled").Sum(inv => inv.Amount)
                    });
                }

                var totalRevenue = data.Sum(d => d.Paid + d.Pending + d.Cancelled);

                return Ok(new RevenueByMonthResponseDto
                {
                    Data = data,
                    TotalRevenue = totalRevenue
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue by month");
                return StatusCode(500, new { error = "Failed to get revenue by month" });
            }
        }
    }
}
