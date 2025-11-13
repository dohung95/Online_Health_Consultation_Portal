namespace OHCP_BK.Models
{
    public class Patient
    {
        public int PatientID { get; set; }

        // Link to Identity User
        public string UserId { get; set; }

        public string FullName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string MedicalHistorySummary { get; set; }
        public string InsuranceProvider { get; set; }
        public string InsurancePolicyNumber { get; set; }

        public virtual AppUser_dat User { get; set; }

        public ICollection<Appointment> Appointments { get; set; }
        public ICollection<Review> Reviews { get; set; }
        public ICollection<HealthRecord> HealthRecords { get; set; }
    }
}
