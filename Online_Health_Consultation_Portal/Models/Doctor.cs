namespace OHCP_BK.Models
{
    public class Doctor
    {
        public int DoctorID { get; set; }

        // Link to Identity User
        public string UserId { get; set; }

        public string FullName { get; set; }
        public string Qualifications { get; set; }
        public string Specialty { get; set; }
        public int? YearsOfExperience { get; set; }
        public string LanguageSpoken { get; set; }
        public string Location { get; set; }

        public virtual AppUser_dat User { get; set; }

        public ICollection<Appointment> Appointments { get; set; }
        public ICollection<Review> Reviews { get; set; }
    }
}
