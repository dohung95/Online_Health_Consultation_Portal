using Microsoft.EntityFrameworkCore;
using OHCP_BK.Models;

namespace OHCP_BK.Data
{
    public static class SeedInvoiceData
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<OHCPContext>();

            // Check if invoices already exist
            if (await context.Invoices.AnyAsync())
            {
                Console.WriteLine("Invoices already exist. Skipping seed.");
                return;
            }

            Console.WriteLine("Seeding invoices...");

            // Get all completed appointments
            var completedAppointments = await context.Appointments
                .Where(a => a.Status == "Completed")
                .Include(a => a.Patient)
                .OrderBy(a => a.AppointmentID)
                .Take(50)
                .ToListAsync();

            if (completedAppointments.Count == 0)
            {
                Console.WriteLine("No completed appointments found. Please ensure appointments are seeded first.");
                return;
            }

            var random = new Random(42); // Fixed seed for reproducibility
            var invoices = new List<Invoice>();
            var statuses = new[] { "Generated", "Pending", "Paid", "Paid", "Paid" }; // More paid invoices

            for (int i = 0; i < Math.Min(50, completedAppointments.Count); i++)
            {
                var appointment = completedAppointments[i];

                // Calculate amount based on consultation type
                decimal baseAmount = appointment.ConsultationType.ToLower() switch
                {
                    "video" => 100m,
                    "chat" => 50m,
                    "in-person" => 150m,
                    _ => 75m
                };

                // Apply insurance discount if patient has insurance
                var hasInsurance = !string.IsNullOrWhiteSpace(appointment.Patient.InsurancePolicyNumber);
                if (hasInsurance)
                {
                    baseAmount *= 0.5m; // 50% discount
                }

                // Random status
                var status = statuses[random.Next(statuses.Length)];

                // Issue date - random date within last 60 days
                var issueDate = DateTime.Now.AddDays(-random.Next(1, 61));

                var invoice = new Invoice
                {
                    AppointmentID = appointment.AppointmentID,
                    PatientID = appointment.PatientID,
                    Amount = baseAmount,
                    IssueDate = issueDate,
                    Status = status
                };

                invoices.Add(invoice);
            }

            await context.Invoices.AddRangeAsync(invoices);
            await context.SaveChangesAsync();

            Console.WriteLine($"Successfully seeded {invoices.Count} invoices.");

            // Display summary
            var statusCounts = invoices.GroupBy(i => i.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToList();

            Console.WriteLine("\nInvoice Status Summary:");
            foreach (var stat in statusCounts)
            {
                Console.WriteLine($"  {stat.Status}: {stat.Count}");
            }

            var totalRevenue = invoices.Sum(i => i.Amount);
            Console.WriteLine($"\nTotal Revenue: ${totalRevenue:N2}");
        }
    }
}
