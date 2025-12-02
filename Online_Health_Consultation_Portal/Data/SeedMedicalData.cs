using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Models;
using OHCP_BK.Data;

namespace OHCP_BK.Data
{
    public static class SeedMedicalData
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();
            var context = serviceProvider.GetRequiredService<OHCPContext>();

            Console.WriteLine("Starting medical data seeding...");

            try
            {
                // Seed 50 Doctors
                await SeedDoctors(userManager, context);

                // Seed 100 Patients
                await SeedPatients(userManager, context);

                // Seed Appointments
                await SeedAppointments(context);

                // Seed Reviews
                await SeedReviews(context);

                // Seed Health Records
                await SeedHealthRecords(context);

                Console.WriteLine("Medical data seeding completed successfully!");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error during seeding: {ex.Message}");
                throw;
            }
        }

        private static async Task SeedDoctors(UserManager<AppUser> userManager, OHCPContext context)
        {
            Console.WriteLine("Seeding 50 doctors...");

            var doctorData = new[]
            {
                // CARDIOLOGY (8 doctors)
                new { Specialty = "Cardiology", FirstName = "James", LastName = "Anderson", Qualifications = "MD, FACC, Board Certified", Years = 25, Languages = "English, Spanish", Location = "New York, NY" },
                new { Specialty = "Cardiology", FirstName = "Sarah", LastName = "Mitchell", Qualifications = "MD, PhD, Cardiology Fellowship", Years = 18, Languages = "English, French", Location = "Los Angeles, CA" },
                new { Specialty = "Cardiology", FirstName = "Michael", LastName = "Chen", Qualifications = "MD, Interventional Cardiology", Years = 22, Languages = "English, Mandarin", Location = "San Francisco, CA" },
                new { Specialty = "Cardiology", FirstName = "Emily", LastName = "Rodriguez", Qualifications = "MD, Board Certified Cardiology", Years = 15, Languages = "English, Spanish", Location = "Miami, FL" },
                new { Specialty = "Cardiology", FirstName = "David", LastName = "Thompson", Qualifications = "MD, Electrophysiology", Years = 20, Languages = "English", Location = "Chicago, IL" },
                new { Specialty = "Cardiology", FirstName = "Lisa", LastName = "Nguyen", Qualifications = "MD, FACC", Years = 12, Languages = "English, Vietnamese", Location = "Houston, TX" },
                new { Specialty = "Cardiology", FirstName = "Robert", LastName = "Williams", Qualifications = "MD, PhD, Heart Failure Specialist", Years = 28, Languages = "English", Location = "Boston, MA" },
                new { Specialty = "Cardiology", FirstName = "Jennifer", LastName = "Davis", Qualifications = "MD, Preventive Cardiology", Years = 16, Languages = "English, German", Location = "Seattle, WA" },

                // GENERAL MEDICINE (7 doctors)
                new { Specialty = "General Medicine", FirstName = "John", LastName = "Smith", Qualifications = "MD, Family Medicine", Years = 20, Languages = "English", Location = "New York, NY" },
                new { Specialty = "General Medicine", FirstName = "Mary", LastName = "Johnson", Qualifications = "MD, Internal Medicine", Years = 15, Languages = "English, Spanish", Location = "Chicago, IL" },
                new { Specialty = "General Medicine", FirstName = "William", LastName = "Brown", Qualifications = "MD, Board Certified", Years = 18, Languages = "English", Location = "Dallas, TX" },
                new { Specialty = "General Medicine", FirstName = "Patricia", LastName = "Garcia", Qualifications = "MD, Primary Care", Years = 12, Languages = "English, Spanish", Location = "Phoenix, AZ" },
                new { Specialty = "General Medicine", FirstName = "Richard", LastName = "Martinez", Qualifications = "MD, Family Practice", Years = 14, Languages = "English, Spanish", Location = "San Diego, CA" },
                new { Specialty = "General Medicine", FirstName = "Linda", LastName = "Wilson", Qualifications = "MD, Internal Medicine", Years = 22, Languages = "English", Location = "Philadelphia, PA" },
                new { Specialty = "General Medicine", FirstName = "Thomas", LastName = "Lee", Qualifications = "MD, General Practice", Years = 10, Languages = "English, Korean", Location = "Atlanta, GA" },

                // PEDIATRICS (6 doctors)
                new { Specialty = "Pediatrics", FirstName = "Jessica", LastName = "Taylor", Qualifications = "MD, Board Certified Pediatrics", Years = 16, Languages = "English, Spanish", Location = "Los Angeles, CA" },
                new { Specialty = "Pediatrics", FirstName = "Christopher", LastName = "Anderson", Qualifications = "MD, Pediatric Specialist", Years = 19, Languages = "English", Location = "New York, NY" },
                new { Specialty = "Pediatrics", FirstName = "Amanda", LastName = "White", Qualifications = "MD, Child Development", Years = 13, Languages = "English, French", Location = "Boston, MA" },
                new { Specialty = "Pediatrics", FirstName = "Daniel", LastName = "Harris", Qualifications = "MD, Neonatology", Years = 21, Languages = "English", Location = "Chicago, IL" },
                new { Specialty = "Pediatrics", FirstName = "Michelle", LastName = "Clark", Qualifications = "MD, Adolescent Medicine", Years = 11, Languages = "English, Portuguese", Location = "Miami, FL" },
                new { Specialty = "Pediatrics", FirstName = "Kevin", LastName = "Lewis", Qualifications = "MD, Pediatric Immunology", Years = 17, Languages = "English", Location = "Denver, CO" },

                // DERMATOLOGY (6 doctors)
                new { Specialty = "Dermatology", FirstName = "Rachel", LastName = "Robinson", Qualifications = "MD, Board Certified Dermatology", Years = 14, Languages = "English", Location = "San Francisco, CA" },
                new { Specialty = "Dermatology", FirstName = "Steven", LastName = "Walker", Qualifications = "MD, Cosmetic Dermatology", Years = 18, Languages = "English, Spanish", Location = "Los Angeles, CA" },
                new { Specialty = "Dermatology", FirstName = "Nicole", LastName = "Hall", Qualifications = "MD, Dermatopathology", Years = 12, Languages = "English", Location = "New York, NY" },
                new { Specialty = "Dermatology", FirstName = "Brian", LastName = "Young", Qualifications = "MD, Mohs Surgery", Years = 20, Languages = "English", Location = "Dallas, TX" },
                new { Specialty = "Dermatology", FirstName = "Samantha", LastName = "Allen", Qualifications = "MD, Pediatric Dermatology", Years = 9, Languages = "English, French", Location = "Seattle, WA" },
                new { Specialty = "Dermatology", FirstName = "Gregory", LastName = "King", Qualifications = "MD, Laser Surgery", Years = 15, Languages = "English", Location = "Miami, FL" },

                // NEUROLOGY (5 doctors)
                new { Specialty = "Neurology", FirstName = "Catherine", LastName = "Wright", Qualifications = "MD, PhD, Neurology", Years = 24, Languages = "English, German", Location = "Boston, MA" },
                new { Specialty = "Neurology", FirstName = "Mark", LastName = "Lopez", Qualifications = "MD, Stroke Specialist", Years = 17, Languages = "English, Spanish", Location = "Houston, TX" },
                new { Specialty = "Neurology", FirstName = "Rebecca", LastName = "Hill", Qualifications = "MD, Epilepsy Specialist", Years = 13, Languages = "English", Location = "Chicago, IL" },
                new { Specialty = "Neurology", FirstName = "Andrew", LastName = "Scott", Qualifications = "MD, Movement Disorders", Years = 19, Languages = "English", Location = "San Francisco, CA" },
                new { Specialty = "Neurology", FirstName = "Karen", LastName = "Green", Qualifications = "MD, Headache Medicine", Years = 11, Languages = "English, Italian", Location = "New York, NY" },

                // ORTHOPEDICS (5 doctors)
                new { Specialty = "Orthopedics", FirstName = "Jason", LastName = "Adams", Qualifications = "MD, Orthopedic Surgery", Years = 22, Languages = "English", Location = "Denver, CO" },
                new { Specialty = "Orthopedics", FirstName = "Laura", LastName = "Baker", Qualifications = "MD, Sports Medicine", Years = 16, Languages = "English, Spanish", Location = "Los Angeles, CA" },
                new { Specialty = "Orthopedics", FirstName = "Matthew", LastName = "Nelson", Qualifications = "MD, Joint Replacement", Years = 20, Languages = "English", Location = "Phoenix, AZ" },
                new { Specialty = "Orthopedics", FirstName = "Angela", LastName = "Carter", Qualifications = "MD, Spine Surgery", Years = 18, Languages = "English", Location = "Seattle, WA" },
                new { Specialty = "Orthopedics", FirstName = "Timothy", LastName = "Mitchell", Qualifications = "MD, Hand Surgery", Years = 14, Languages = "English, French", Location = "Boston, MA" },

                // PSYCHIATRY (4 doctors)
                new { Specialty = "Psychiatry", FirstName = "Elizabeth", LastName = "Perez", Qualifications = "MD, Psychiatry & Behavioral Health", Years = 19, Languages = "English, Spanish", Location = "New York, NY" },
                new { Specialty = "Psychiatry", FirstName = "Joseph", LastName = "Roberts", Qualifications = "MD, Child Psychiatry", Years = 15, Languages = "English", Location = "Chicago, IL" },
                new { Specialty = "Psychiatry", FirstName = "Margaret", LastName = "Turner", Qualifications = "MD, Addiction Psychiatry", Years = 21, Languages = "English", Location = "San Francisco, CA" },
                new { Specialty = "Psychiatry", FirstName = "Charles", LastName = "Phillips", Qualifications = "MD, Geriatric Psychiatry", Years = 17, Languages = "English, German", Location = "Boston, MA" },

                // ONCOLOGY (3 doctors)
                new { Specialty = "Oncology", FirstName = "Susan", LastName = "Campbell", Qualifications = "MD, Medical Oncology", Years = 23, Languages = "English", Location = "Houston, TX" },
                new { Specialty = "Oncology", FirstName = "Paul", LastName = "Parker", Qualifications = "MD, PhD, Hematology-Oncology", Years = 26, Languages = "English, French", Location = "New York, NY" },
                new { Specialty = "Oncology", FirstName = "Nancy", LastName = "Evans", Qualifications = "MD, Radiation Oncology", Years = 18, Languages = "English", Location = "Los Angeles, CA" },

                // ENT (3 doctors)
                new { Specialty = "ENT (Otolaryngology)", FirstName = "George", LastName = "Edwards", Qualifications = "MD, Otolaryngology", Years = 16, Languages = "English", Location = "Miami, FL" },
                new { Specialty = "ENT (Otolaryngology)", FirstName = "Betty", LastName = "Collins", Qualifications = "MD, Head and Neck Surgery", Years = 20, Languages = "English, Spanish", Location = "Dallas, TX" },
                new { Specialty = "ENT (Otolaryngology)", FirstName = "Donald", LastName = "Stewart", Qualifications = "MD, Pediatric ENT", Years = 14, Languages = "English", Location = "Atlanta, GA" },

                // OPHTHALMOLOGY (3 doctors)
                new { Specialty = "Ophthalmology", FirstName = "Helen", LastName = "Morris", Qualifications = "MD, Ophthalmology", Years = 19, Languages = "English", Location = "San Diego, CA" },
                new { Specialty = "Ophthalmology", FirstName = "Edward", LastName = "Rogers", Qualifications = "MD, Retina Specialist", Years = 22, Languages = "English, Chinese", Location = "Seattle, WA" },
                new { Specialty = "Ophthalmology", FirstName = "Dorothy", LastName = "Reed", Qualifications = "MD, Cataract Surgery", Years = 15, Languages = "English", Location = "Portland, OR" }
            };

            int doctorCount = 1;
            foreach (var doc in doctorData)
            {
                var username = $"{doc.FirstName} {doc.LastName}";
                var email = $"{doc.FirstName.ToLower()}.{doc.LastName.ToLower()}@hospital.com";

                // Check if user already exists
                var existingUser = await userManager.FindByEmailAsync(email);
                if (existingUser != null)
                {
                    Console.WriteLine($"Doctor {email} already exists, skipping...");
                    doctorCount++;
                    continue;
                }

                var doctorUser = new AppUser
                {
                    UserName = username,
                    Email = email,
                    EmailConfirmed = true,
                    PhoneNumber = GeneratePhoneNumber(),
                    PhoneNumberConfirmed = true,
                    CreatedDate = DateTime.Now.AddDays(-new Random().Next(30, 365))
                };

                var result = await userManager.CreateAsync(doctorUser, "Test@123!#");

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(doctorUser, "doctor");

                    var doctor = new Doctor
                    {
                        DoctorID = doctorUser.Id,
                        FullName = $"Dr. {doc.FirstName} {doc.LastName}",
                        Qualifications = doc.Qualifications,
                        Specialty = doc.Specialty,
                        YearsOfExperience = doc.Years,
                        LanguageSpoken = doc.Languages,
                        Location = doc.Location
                    };

                    context.Doctors.Add(doctor);
                    Console.WriteLine($"Added doctor: {doctor.FullName} - {doc.Specialty}");
                }
                else
                {
                    Console.WriteLine($"Failed to create doctor user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }

                doctorCount++;
            }

            await context.SaveChangesAsync();
            Console.WriteLine($"Seeded {doctorData.Length} doctors successfully!");
        }

        private static async Task SeedPatients(UserManager<AppUser> userManager, OHCPContext context)
        {
            Console.WriteLine("Seeding 100 patients...");

            var firstNames = new[] { "John", "Mary", "James", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
                "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
                "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra",
                "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle",
                "Kenneth", "Dorothy", "Kevin", "Carol", "Brian", "Amanda", "George", "Melissa", "Edward", "Deborah",
                "Ronald", "Stephanie", "Timothy", "Rebecca", "Jason", "Sharon", "Jeffrey", "Laura", "Ryan", "Cynthia",
                "Jacob", "Kathleen", "Gary", "Amy", "Nicholas", "Shirley", "Eric", "Angela", "Jonathan", "Helen",
                "Stephen", "Anna", "Larry", "Brenda", "Justin", "Pamela", "Scott", "Nicole", "Brandon", "Emma",
                "Benjamin", "Samantha", "Samuel", "Katherine", "Raymond", "Christine", "Gregory", "Debra", "Frank", "Rachel",
                "Alexander", "Catherine", "Patrick", "Carolyn", "Jack", "Janet", "Dennis", "Ruth", "Jerry", "Maria" };

            var lastNames = new[] { "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
                "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
                "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
                "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
                "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts" };

            var medicalHistories = new[]
            {
                "No significant medical history",
                "Type 2 Diabetes, managed with Metformin",
                "Hypertension, controlled with medication",
                "Asthma, uses inhaler as needed",
                "Seasonal allergies",
                "History of migraine headaches",
                "Hypothyroidism, on Levothyroxine",
                "Acid reflux, takes omeprazole",
                "Osteoarthritis in knees",
                "Previous appendectomy in 2015",
                "Allergic to Penicillin",
                "Hyperlipidemia, on statin therapy",
                "Anxiety disorder, managed with therapy",
                "History of kidney stones",
                "Eczema, seasonal flare-ups",
                "Sleep apnea, uses CPAP machine",
                "Anemia, iron deficiency",
                "Previous sports injury - ACL repair",
                "Mild depression, on antidepressants",
                "Gluten sensitivity",
                "Lactose intolerance",
                "History of pneumonia in childhood",
                "Chronic back pain",
                "Allergic to shellfish",
                "Previous cesarean section",
                "ADHD, medication managed",
                "Psoriasis, topical treatment",
                "History of concussion",
                "Benign heart murmur",
                "Vitamin D deficiency"
            };

            var insuranceProviders = new[]
            {
                "Blue Cross Blue Shield",
                "Aetna",
                "UnitedHealthcare",
                "Cigna",
                "Humana",
                "Kaiser Permanente",
                "Anthem",
                "Medicare",
                "Medicaid",
                "Tricare",
                null // Some patients without insurance
            };

            var genders = new[] { "Male", "Female", "Other" };

            var cities = new[] { "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio",
                "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus", "San Francisco",
                "Charlotte", "Indianapolis", "Seattle", "Denver", "Boston", "Nashville", "Detroit", "Portland", "Las Vegas", "Miami" };

            var countries = new[] { "USA", "United States" };

            var bloodTypes = new[] { "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-" };

            var relationships = new[] { "Spouse", "Parent", "Sibling", "Child", "Friend", "Partner", "Relative" };

            var languages = new[] { "English", "Spanish", "Mandarin", "French", "German", "Italian", "Portuguese", "Korean", "Japanese", "Vietnamese" };

            var contactMethods = new[] { "Phone", "Email", "SMS", "Any" };

            var occupations = new[] { "Engineer", "Teacher", "Doctor", "Nurse", "Accountant", "Manager", "Sales Representative",
                "Software Developer", "Marketing Specialist", "Lawyer", "Architect", "Consultant", "Business Owner", "Analyst",
                "Writer", "Designer", "Chef", "Mechanic", "Electrician", "Plumber", "Carpenter", "Retired", "Student", "Unemployed",
                "Artist", "Musician", "Real Estate Agent", "Pharmacist", "Therapist", "Social Worker" };

            var random = new Random();

            for (int i = 1; i <= 100; i++)
            {
                var firstName = firstNames[random.Next(firstNames.Length)];
                var lastName = lastNames[random.Next(lastNames.Length)];
                var username = $"{firstName} {lastName}";
                var email = $"{firstName.ToLower()}.{lastName.ToLower()}.{i}@email.com";

                // Check if user already exists
                var existingUser = await userManager.FindByEmailAsync(email);
                if (existingUser != null)
                {
                    Console.WriteLine($"Patient {email} already exists, skipping...");
                    continue;
                }

                var patientUser = new AppUser
                {
                    UserName = username,
                    Email = email,
                    EmailConfirmed = true,
                    PhoneNumber = GeneratePhoneNumber(),
                    PhoneNumberConfirmed = true,
                    CreatedDate = DateTime.Now.AddDays(-random.Next(30, 730)) // Created within last 2 years
                };

                var result = await userManager.CreateAsync(patientUser, "Test@123!#");

                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(patientUser, "patient");

                    var birthYear = random.Next(1940, 2015); // Ages from children to elderly
                    var insurance = insuranceProviders[random.Next(insuranceProviders.Length)];
                    var gender = genders[random.Next(genders.Length)];
                    var city = cities[random.Next(cities.Length)];
                    var bloodType = bloodTypes[random.Next(bloodTypes.Length)];
                    var emergencyFirstName = firstNames[random.Next(firstNames.Length)];
                    var emergencyLastName = lastNames[random.Next(lastNames.Length)];

                    var patient = new Patient
                    {
                        PatientID = patientUser.Id,
                        FullName = $"{firstName} {lastName}",
                        DateOfBirth = new DateTime(birthYear, random.Next(1, 13), random.Next(1, 28)),
                        Gender = gender,
                        MedicalHistorySummary = medicalHistories[random.Next(medicalHistories.Length)],
                        InsuranceProvider = insurance,
                        InsurancePolicyNumber = insurance != null ? $"{insurance.Replace(" ", "").Substring(0, 3).ToUpper()}{random.Next(100000, 999999)}" : null,
                        Address = $"{random.Next(100, 9999)} {lastNames[random.Next(lastNames.Length)]} Street",
                        City = city,
                        Country = countries[random.Next(countries.Length)],
                        BloodType = bloodType,
                        EmergencyContactName = $"{emergencyFirstName} {emergencyLastName}",
                        EmergencyContactPhone = GeneratePhoneNumber(),
                        EmergencyContactRelationship = relationships[random.Next(relationships.Length)],
                        PreferredLanguage = languages[random.Next(languages.Length)],
                        PreferredContactMethod = contactMethods[random.Next(contactMethods.Length)],
                        Occupation = occupations[random.Next(occupations.Length)]
                    };

                    context.Patients.Add(patient);

                    if (i % 20 == 0)
                    {
                        Console.WriteLine($"Added {i} patients...");
                    }
                }
                else
                {
                    Console.WriteLine($"Failed to create patient user: {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }

            await context.SaveChangesAsync();
            Console.WriteLine("Seeded 100 patients successfully!");
        }

        private static async Task SeedAppointments(OHCPContext context)
        {
            Console.WriteLine("Seeding appointments...");

            var doctors = await context.Doctors.ToListAsync();
            var patients = await context.Patients.ToListAsync();
            var random = new Random();

            var consultationTypes = new[] { "Video Call", "Chat"};
            var statuses = new[] { "Scheduled", "Completed", "Cancelled", "In Progress" };

            var appointmentCount = 0;
            var targetAppointments = 180;

            // Each doctor gets 3-4 appointments
            foreach (var doctor in doctors)
            {
                var appointmentsForDoctor = random.Next(3, 5);

                for (int i = 0; i < appointmentsForDoctor && appointmentCount < targetAppointments; i++)
                {
                    var patient = patients[random.Next(patients.Count)];
                    var daysOffset = random.Next(-60, 60); // Appointments from 60 days ago to 60 days in future
                    var hour = random.Next(8, 17); // Working hours 8 AM to 5 PM
                    var status = daysOffset < 0 ? (random.Next(10) > 2 ? "Completed" : "Cancelled") : "Scheduled";
                    if (daysOffset == 0) status = "In Progress";

                    var appointment = new Appointment
                    {
                        PatientID = patient.PatientID,
                        DoctorID = doctor.DoctorID,
                        AppointmentTime = DateTime.Now.AddDays(daysOffset).Date.AddHours(hour),
                        ConsultationType = consultationTypes[random.Next(consultationTypes.Length)],
                        Status = status
                    };

                    context.Appointments.Add(appointment);
                    appointmentCount++;
                }
            }

            await context.SaveChangesAsync();
            Console.WriteLine($"Seeded {appointmentCount} appointments successfully!");
        }

        private static async Task SeedReviews(OHCPContext context)
        {
            Console.WriteLine("Seeding reviews...");

            // Only create reviews for completed appointments
            var completedAppointments = await context.Appointments
                .Where(a => a.Status == "Completed")
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .ToListAsync();

            var random = new Random();
            var reviewComments = new[]
            {
                "Excellent doctor! Very professional and caring. Highly recommend.",
                "Great experience. The doctor listened carefully and explained everything clearly.",
                "Very knowledgeable and took time to answer all my questions.",
                "Good consultation but had to wait a bit longer than expected.",
                "Outstanding care! The doctor was thorough and compassionate.",
                "Professional and efficient. Got exactly the help I needed.",
                "Friendly staff and the doctor was very understanding of my concerns.",
                "The doctor provided excellent treatment options and follow-up care.",
                "Very satisfied with the consultation. Would definitely come back.",
                "Helpful and informative. Made me feel comfortable throughout.",
                "Quick and to the point. Appreciated the efficiency.",
                "The doctor was patient and took time to explain my condition in detail.",
                "Good service overall. The doctor was knowledgeable and professional.",
                "Excellent bedside manner. Really cares about patients.",
                "Very thorough examination. I feel confident in the treatment plan.",
                "The consultation was helpful but felt a bit rushed.",
                "Great doctor! Fixed my problem and provided good advice.",
                "Professional and courteous. Would highly recommend to others.",
                "The doctor made me feel heard and understood my concerns.",
                "Positive experience. The doctor was clear about next steps."
            };

            // Create reviews for about 60% of completed appointments
            var appointmentsToReview = completedAppointments
                .OrderBy(x => random.Next())
                .Take((int)(completedAppointments.Count * 0.6))
                .ToList();

            foreach (var appointment in appointmentsToReview)
            {
                // Rating distribution: mostly 4-5 stars, some 3 stars, rare 1-2 stars
                int rating;
                var ratingRoll = random.Next(100);
                if (ratingRoll < 60) rating = 5;
                else if (ratingRoll < 85) rating = 4;
                else if (ratingRoll < 95) rating = 3;
                else rating = random.Next(1, 3);

                var review = new Review
                {
                    PatientID = appointment.PatientID,
                    DoctorID = appointment.DoctorID,
                    Rating = rating,
                    Comment = reviewComments[random.Next(reviewComments.Length)],
                    ReviewDate = appointment.AppointmentTime.AddDays(random.Next(1, 7)) // Review within a week after appointment
                };

                context.Reviews.Add(review);
            }

            await context.SaveChangesAsync();
            Console.WriteLine($"Seeded {appointmentsToReview.Count} reviews successfully!");
        }

        private static async Task SeedHealthRecords(OHCPContext context)
        {
            Console.WriteLine("Seeding health records...");

            var patients = await context.Patients.ToListAsync();
            var random = new Random();

            foreach (var patient in patients)
            {
                // Check if health record already exists
                var existingRecord = await context.HealthRecords
                    .FirstOrDefaultAsync(hr => hr.PatientID == patient.PatientID);

                if (existingRecord == null)
                {
                    var healthRecord = new HealthRecord
                    {
                        PatientID = patient.PatientID,
                        LastUpdated = DateTime.Now.AddDays(-random.Next(1, 365)) // Updated within last year
                    };

                    context.HealthRecords.Add(healthRecord);
                }
            }

            await context.SaveChangesAsync();
            Console.WriteLine($"Seeded {patients.Count} health records successfully!");
        }

        private static string GeneratePhoneNumber()
        {
            var random = new Random();
            return $"{random.Next(200, 999)}-{random.Next(200, 999)}-{random.Next(1000, 9999)}";
        }
    }
}
