namespace OHCP_BK.Models
{
    public class Appointment
    {
        public int AppointmentID { get; set; }
        public int PatientID { get; set; }
        public int DoctorID { get; set; }
        public DateTime AppointmentTime { get; set; }
        public string ConsultationType { get; set; }
        public string Status { get; set; } = "Scheduled";

        public Patient Patient { get; set; }
        public Doctor Doctor { get; set; }

        public Consultation Consultation { get; set; }
        public Invoice Invoice { get; set; }
    }

}
