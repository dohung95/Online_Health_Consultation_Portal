using Microsoft.EntityFrameworkCore;
using OHCP_BK.Models;
namespace OHCP_BK.Data
{
    public static class SeedConsultationData
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            Console.WriteLine("Starting medical consultation data seeding...");

            var context = serviceProvider.GetRequiredService<OHCPContext>();

            try
            {
                await SeedConsultations(context);
                await SeedPrescriptions(context);
                await SeedInvoices(context);
                Console.WriteLine("Medical consultation data seeding completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during consultation seeding: {ex.Message}");
                throw;
            }
        }
        private static async Task SeedConsultations(OHCPContext context)
        {
            Console.WriteLine("Seeding consultations...");
            var completedAppointments = await context.Appointments
                .Where(a => a.Status == "Completed" && a.Consultation == null)
                .Include(a => a.Doctor)
                .ToListAsync();
            if (completedAppointments.Count == 0)
            {
                Console.WriteLine("No completed appointments found to seed consultations.");
                return;
            }
            var random = new Random();
            var symptomTemplates = new[]
            {
                "Patient presented with {symptom}. Physical examination revealed {finding}.",
                "Chief complaint: {symptom}. Patient reports symptoms started {duration} ago.",
                "Patient experiencing {symptom} with {severity} severity.",
                "Follow-up visit for {condition}. Patient reports {improvement}.",
                "Routine checkup. Patient is {status}.",
                "Patient reports {symptom} affecting daily activities.",
                "Consultation for {concern}. Assessment shows {finding}."
            };
            var symptoms = new[]
            {
                "persistent headaches", "chest pain", "abdominal discomfort", "back pain",
                "joint pain", "fatigue", "dizziness", "shortness of breath",
                "skin rash", "fever", "cough", "anxiety symptoms",
                "sleep disturbances", "digestive issues", "muscle weakness"
            };
            var findings = new[]
            {
                "normal vital signs", "elevated blood pressure", "mild inflammation",
                "no acute distress", "benign presentation", "improvement since last visit",
                "stable condition", "minor abnormalities", "within normal limits"
            };
            var treatments = new[]
            {
                "Advised lifestyle modifications including regular exercise and healthy diet.",
                "Prescribed medication to manage symptoms. Follow-up in 2 weeks.",
                "Recommended physical therapy and pain management techniques.",
                "Ordered lab tests for further evaluation. Results pending.",
                "Continue current medication regimen. Monitor symptoms closely.",
                "Referred to specialist for comprehensive evaluation.",
                "Prescribed short-term medication. Reassess in one month.",
                "No medication needed at this time. Follow healthy lifestyle practices.",
                "Adjusted dosage of current medication. Monitor for side effects.",
                "Prescribed rest and over-the-counter pain relief as needed."
            };
            var diagnoses = new[]
            {
                "Hypertension - controlled with medication",
                "Upper respiratory infection - viral",
                "Musculoskeletal pain - likely strain",
                "Gastroesophageal reflux disease (GERD)",
                "Migraine headache - episodic",
                "Generalized anxiety disorder",
                "Type 2 Diabetes - well controlled",
                "Allergic rhinitis - seasonal",
                "Lower back pain - mechanical",
                "Dermatitis - contact",
                "Insomnia - primary",
                "Osteoarthritis - mild",
                "Asthma - intermittent",
                "Urinary tract infection",
                "Vitamin D deficiency"
            };
            foreach (var appointment in completedAppointments)
            {
                var duration = random.Next(15, 46);
                var startTime = appointment.AppointmentTime;
                var endTime = startTime.AddMinutes(duration);
                var template = symptomTemplates[random.Next(symptomTemplates.Length)];
                var notes = template
                    .Replace("{symptom}", symptoms[random.Next(symptoms.Length)])
                    .Replace("{finding}", findings[random.Next(findings.Length)])
                    .Replace("{duration}", $"{random.Next(1, 15)} days")
                    .Replace("{severity}", new[] { "mild", "moderate", "significant" }[random.Next(3)])
                    .Replace("{condition}", diagnoses[random.Next(diagnoses.Length)])
                    .Replace("{improvement}", new[] { "improvement", "no change", "slight worsening" }[random.Next(3)])
                    .Replace("{status}", new[] { "healthy", "stable", "recovering well" }[random.Next(3)])
                    .Replace("{concern}", symptoms[random.Next(symptoms.Length)]);
                notes += "\n\n";
                notes += $"Diagnosis: {diagnoses[random.Next(diagnoses.Length)]}\n\n";
                notes += $"Treatment Plan: {treatments[random.Next(treatments.Length)]}";
                DateTime? followUpDate = null;
                if (random.Next(100) < 30)
                {
                    followUpDate = appointment.AppointmentTime.AddDays(random.Next(14, 91));
                    notes += $"\n\nFollow-up appointment recommended in {((followUpDate.Value - appointment.AppointmentTime).Days)} days.";
                }
                var consultation = new Consultation
                {
                    AppointmentID = appointment.AppointmentID,
                    StartTime = startTime,
                    EndTime = endTime,
                    DoctorNotes = notes,
                    Diagnosis = diagnoses[random.Next(diagnoses.Length)],
                    FollowUpDate = followUpDate
                };
                context.Consultations.Add(consultation);
            }
            await context.SaveChangesAsync();
            Console.WriteLine($"Seeded {completedAppointments.Count} consultations successfully!");
        }
        private static async Task SeedPrescriptions(OHCPContext context)
        {
            Console.WriteLine("Seeding prescriptions...");
            var appointmentsNeedingPrescriptions = await context.Appointments
                .Where(a => a.Status == "Completed" &&
                           a.Consultation != null &&
                           !context.PrescriptionHeaders.Any(p => p.AppointmentID == a.AppointmentID))
                .ToListAsync();
            if (appointmentsNeedingPrescriptions.Count == 0)
            {
                Console.WriteLine("No appointments found needing prescriptions.");
                return;
            }
            var random = new Random();
            var medications = new[]
            {
                new { Name = "Amoxicillin", Dosage = "500mg/21 tabs", Instructions = "Take 3 times daily with food. Complete full course even if feeling better.", SupplyDays = 7 },
                new { Name = "Ibuprofen", Dosage = "400mg/42 tabs", Instructions = "Take as needed for pain. Do not exceed 1200mg per day. Take with food.", SupplyDays = 14 },
                new { Name = "Lisinopril", Dosage = "10mg/30 tabs", Instructions = "Take once daily in the morning. Monitor blood pressure regularly.", SupplyDays = 30 },
                new { Name = "Metformin", Dosage = "500mg/60 tabs", Instructions = "Take twice daily with meals to reduce stomach upset.", SupplyDays = 30 },
                new { Name = "Omeprazole", Dosage = "20mg/30 tabs", Instructions = "Take once daily before breakfast. Swallow whole, do not crush.", SupplyDays = 30 },
                new { Name = "Atorvastatin", Dosage = "20mg/30 tabs", Instructions = "Take once daily at bedtime. Avoid grapefruit juice.", SupplyDays = 30 },
                new { Name = "Levothyroxine", Dosage = "50mcg/30 tabs", Instructions = "Take once daily on empty stomach, 30 minutes before breakfast.", SupplyDays = 30 },
                new { Name = "Amlodipine", Dosage = "5mg/30 tabs", Instructions = "Take once daily at the same time each day. May cause swelling.", SupplyDays = 30 },
                new { Name = "Sertraline", Dosage = "50mg/30 tabs", Instructions = "Take once daily, may take with or without food. May cause drowsiness initially.", SupplyDays = 30 },
                new { Name = "Acetaminophen", Dosage = "500mg/21 tabs", Instructions = "Take as needed for pain or fever. Maximum 4000mg per day. Avoid alcohol.", SupplyDays = 7 },
                new { Name = "Cetirizine", Dosage = "10mg/30 tabs", Instructions = "Take once daily for allergy symptoms. May cause drowsiness.", SupplyDays = 30 },
                new { Name = "Albuterol Inhaler", Dosage = "90mcg/1 inhaler", Instructions = "Use as needed for breathing difficulties. Shake well before use. Rinse mouth after.", SupplyDays = 30 },
                new { Name = "Prednisone", Dosage = "20mg/5 tabs", Instructions = "Take once daily with food. Taper as directed by doctor. Do not stop abruptly.", SupplyDays = 5 },
                new { Name = "Ciprofloxacin", Dosage = "500mg/14 tabs", Instructions = "Take twice daily. Drink plenty of water. Avoid dairy products within 2 hours.", SupplyDays = 7 },
                new { Name = "Gabapentin", Dosage = "300mg/90 tabs", Instructions = "Take three times daily for nerve pain. Do not stop suddenly.", SupplyDays = 30 },
                new { Name = "Pantoprazole", Dosage = "40mg/30 tabs", Instructions = "Take once daily before first meal. For acid reflux treatment.", SupplyDays = 30 },
                new { Name = "Losartan", Dosage = "50mg/30 tabs", Instructions = "Take once daily for high blood pressure. May cause dizziness initially.", SupplyDays = 30 },
                new { Name = "Montelukast", Dosage = "10mg/30 tabs", Instructions = "Take once daily in evening for asthma control.", SupplyDays = 30 },
                new { Name = "Fluticasone Nasal Spray", Dosage = "50mcg/1 bottle", Instructions = "Use 2 sprays in each nostril once daily for allergies.", SupplyDays = 30 },
                new { Name = "Amoxicillin-Clavulanate", Dosage = "875mg/20 tabs", Instructions = "Take twice daily with food. Complete full course of antibiotics.", SupplyDays = 10 }
            };
            var appointmentsWithPrescriptions = appointmentsNeedingPrescriptions
                .OrderBy(x => random.Next())
                .Take((int)(appointmentsNeedingPrescriptions.Count * 0.7))
                .ToList();
            foreach (var appointment in appointmentsWithPrescriptions)
            {
                var prescriptionHeader = new PrescriptionHeader
                {
                    AppointmentID = appointment.AppointmentID,
                    PatientID = appointment.PatientID,
                    IssueDate = appointment.AppointmentTime.AddHours(1)
                };
                context.PrescriptionHeaders.Add(prescriptionHeader);
                await context.SaveChangesAsync();
                var medicationCount = random.Next(1, 5);
                var selectedMeds = medications.OrderBy(x => random.Next()).Take(medicationCount).ToList();
                foreach (var med in selectedMeds)
                {
                    var item = new PrescriptionItem
                    {
                        PrescriptionHeaderID = prescriptionHeader.PrescriptionHeaderID,
                        MedicationName = med.Name,
                        Dosage = med.Dosage,
                        Instructions = med.Instructions,
                        TotalSupplyDays = med.SupplyDays
                    };
                    context.PrescriptionItems.Add(item);
                }
            }
            await context.SaveChangesAsync();
            Console.WriteLine($"Seeded {appointmentsWithPrescriptions.Count} prescriptions successfully!");
        }
        private static async Task SeedInvoices(OHCPContext context)
        {
            Console.WriteLine("Seeding invoices...");
            var appointmentsNeedingInvoices = await context.Appointments
                .Where(a => a.Status == "Completed" && a.Invoice == null)
                .Include(a => a.Doctor)
                .ToListAsync();
            if (appointmentsNeedingInvoices.Count == 0)
            {
                Console.WriteLine("No appointments found needing invoices.");
                return;
            }
            var random = new Random();
            var baseConsultationFee = 50.0m;
            var specialtyPremiums = new Dictionary<string, decimal>
            {
                { "Cardiology", 30.0m },
                { "Neurology", 35.0m },
                { "Oncology", 40.0m },
                { "Orthopedics", 30.0m },
                { "Psychiatry", 25.0m },
                { "Dermatology", 20.0m },
                { "ENT (Otolaryngology)", 20.0m },
                { "Ophthalmology", 25.0m },
                { "Pediatrics", 15.0m },
                { "General Medicine", 0.0m }
            };
            foreach (var appointment in appointmentsNeedingInvoices)
            {
                var specialtyPremium = specialtyPremiums.ContainsKey(appointment.Doctor.Specialty)
                    ? specialtyPremiums[appointment.Doctor.Specialty]
                    : 0.0m;
                var consultationFee = baseConsultationFee + specialtyPremium;
                if (appointment.ConsultationType == "Video Call")
                {
                    consultationFee += 20.0m;
                }
                var hasPrescription = await context.PrescriptionHeaders
                    .AnyAsync(ph => ph.AppointmentID == appointment.AppointmentID);
                var prescriptionFee = hasPrescription ? 15.0m : 0.0m;
                var totalAmount = consultationFee + prescriptionFee;
                // Status: "Generated", "Paid", "Cancelled"
                // 90% will be "Paid", 10% will be "Generated"
                var isPaid = random.Next(100) < 90;
                var invoice = new Invoice
                {
                    AppointmentID = appointment.AppointmentID,
                    PatientID = appointment.PatientID,
                    Amount = totalAmount,
                    IssueDate = appointment.AppointmentTime.AddHours(2),
                    Status = isPaid ? "Paid" : "Generated"
                };
                context.Invoices.Add(invoice);
            }
            await context.SaveChangesAsync();
            Console.WriteLine($"Seeded {appointmentsNeedingInvoices.Count} invoices successfully!");
        }
    }
}