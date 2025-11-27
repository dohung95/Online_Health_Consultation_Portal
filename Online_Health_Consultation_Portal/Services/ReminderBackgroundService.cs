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
            _logger.LogInformation("Reminder background service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Starting reminder check at {Time}", DateTime.UtcNow);

                    using (var scope = _serviceProvider.CreateScope())
                    {
                        // Get services from DI container
                        var medicationReminderService = scope.ServiceProvider
                            .GetRequiredService<IMedicationReminderService>();
                        var followUpReminderService = scope.ServiceProvider
                            .GetRequiredService<IFollowUpReminderService>();

                        // Check and create medication refill reminders
                        var medicationReminders = await medicationReminderService
                            .CheckAndCreateRefillRemindersAsync();
                        _logger.LogInformation(
                            "Created {Count} medication refill reminder notifications", 
                            medicationReminders);

                        // Check and create follow-up reminders
                        var followUpReminders = await followUpReminderService
                            .CheckAndCreateFollowUpRemindersAsync();
                        _logger.LogInformation(
                            "Created {Count} follow-up reminder notifications", 
                            followUpReminders);
                    }

                    _logger.LogInformation(
                        "Completed reminder check. Waiting {Hours} hours until next check",
                        CHECK_INTERVAL_HOURS);

                    // Wait 24 hours before next check
                    await Task.Delay(TimeSpan.FromHours(CHECK_INTERVAL_HOURS), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    _logger.LogInformation("Reminder service is stopping");
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error executing reminder check");
                    
                    // Wait 1 hour before retry on error
                    await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
                }
            }

            _logger.LogInformation("Reminder background service stopped");
        }
    }
}
