using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Services;

namespace OHCP_BK.BackgroundServices
{
    public class MedicationReminderBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MedicationReminderBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(24); // Run once daily
        private readonly TimeSpan _runTime = new TimeSpan(8, 0, 0); // Run at 8:00 AM

        public MedicationReminderBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<MedicationReminderBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Medication Reminder Background Service is starting.");

            // Wait until the scheduled time on first run
            await WaitUntilScheduledTime(stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Medication Reminder Service executing at: {time}", DateTimeOffset.Now);
                    await ProcessMedicationReminders(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred in Medication Reminder Background Service.");
                }

                // Wait 24 hours before next run
                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("Medication Reminder Background Service is stopping.");
        }

        private async Task WaitUntilScheduledTime(CancellationToken stoppingToken)
        {
            var now = DateTime.Now;
            var scheduledTime = now.Date.Add(_runTime);

            // If scheduled time has passed today, schedule for tomorrow
            if (now > scheduledTime)
            {
                scheduledTime = scheduledTime.AddDays(1);
            }

            var delay = scheduledTime - now;
            _logger.LogInformation("Next medication reminder check scheduled at: {time}", scheduledTime);

            await Task.Delay(delay, stoppingToken);
        }

        private async Task ProcessMedicationReminders(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<OHCPContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var today = DateTime.UtcNow.Date;

            // Find all active prescriptions
            var activePrescriptions = await context.PrescriptionHeaders
                .Include(ph => ph.PrescriptionItems)
                .Include(ph => ph.Patient)
                .Where(ph => ph.IssueDate <= today)
                .ToListAsync(stoppingToken);

            _logger.LogInformation("Found {count} prescription headers to process", activePrescriptions.Count);

            int remindersSent = 0;
            int remindersSkipped = 0;

            foreach (var prescription in activePrescriptions)
            {
                if (stoppingToken.IsCancellationRequested) break;

                // Get all active medications for this prescription
                var activeMedications = new List<MedicationReminderDto>();

                foreach (var item in prescription.PrescriptionItems)
                {
                    // Calculate if medication is still active
                    var endDate = prescription.IssueDate.AddDays(item.TotalSupplyDays);

                    if (endDate >= today)
                    {
                        activeMedications.Add(new MedicationReminderDto
                        {
                            PrescriptionId = prescription.PrescriptionHeaderID,
                            MedicationName = item.MedicationName,
                            Dosage = item.Dosage,
                            Instructions = item.Instructions,
                            IssueDate = prescription.IssueDate,
                            TotalSupplyDays = item.TotalSupplyDays
                        });
                    }
                }

                // Send one reminder per prescription if there are active medications
                if (activeMedications.Any())
                {
                    // Check if reminder already sent today for this prescription
                    var reminderExists = await notificationService.CheckIfReminderExistsAsync(
                        prescription.PatientID,
                        $"Prescription {prescription.PrescriptionHeaderID}",
                        today
                    );

                    if (!reminderExists)
                    {
                        await notificationService.SendPrescriptionReminderAsync(
                            prescription.PatientID,
                            activeMedications,
                            prescription.PrescriptionHeaderID,
                            prescription.IssueDate
                        );

                        remindersSent++;
                        _logger.LogInformation("Sent prescription reminder to patient {PatientId} with {Count} medications",
                            prescription.PatientID, activeMedications.Count);
                    }
                    else
                    {
                        remindersSkipped++;
                    }
                }
            }

            _logger.LogInformation("Medication reminder processing complete. Sent: {sent}, Skipped: {skipped}",
                remindersSent, remindersSkipped);
        }
    }
}
