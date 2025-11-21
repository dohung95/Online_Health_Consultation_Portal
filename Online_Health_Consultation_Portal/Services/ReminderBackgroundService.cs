namespace OHCP_BK.Services
{
    public class ReminderBackgroundService : BackgroundService
    {
        private readonly ILogger<ReminderBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private const int CHECK_INTERVAL_HOURS = 24;

        public ReminderBackgroundService(
            ILogger<ReminderBackgroundService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Dịch vụ nhắc nhở tự động đã được khởi động");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Bắt đầu kiểm tra nhắc nhở lúc {Time}", DateTime.UtcNow);

                    using (var scope = _serviceProvider.CreateScope())
                    {
                        // Lấy service từ DI container
                        var medicationReminderService = scope.ServiceProvider
                            .GetRequiredService<IMedicationReminderService>();
                        var followUpReminderService = scope.ServiceProvider
                            .GetRequiredService<IFollowUpReminderService>();

                        // Kiểm tra và tạo nhắc nhở nạp thuốc
                        var medicationReminders = await medicationReminderService
                            .CheckAndCreateRefillRemindersAsync();
                        _logger.LogInformation(
                            "Đã tạo {Count} thông báo nhắc nhở nạp thuốc", 
                            medicationReminders);

                        // Kiểm tra và tạo nhắc nhở tái khám
                        var followUpReminders = await followUpReminderService
                            .CheckAndCreateFollowUpRemindersAsync();
                        _logger.LogInformation(
                            "Đã tạo {Count} thông báo nhắc nhở tái khám", 
                            followUpReminders);
                    }

                    _logger.LogInformation(
                        "Hoàn thành kiểm tra nhắc nhở. Chờ {Hours} giờ đến lần kiểm tra tiếp theo",
                        CHECK_INTERVAL_HOURS);

                    // Chờ 24 giờ trước khi kiểm tra lại
                    await Task.Delay(TimeSpan.FromHours(CHECK_INTERVAL_HOURS), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Dịch vụ nhắc nhở đang dừng lại");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi thực hiện kiểm tra nhắc nhở");
                    
                    // Chờ 1 giờ trước khi thử lại nếu có lỗi
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }

            _logger.LogInformation("Dịch vụ nhắc nhở tự động đã dừng");
        }
    }
}
