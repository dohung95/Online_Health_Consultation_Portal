namespace OHCP_BK.Models
{
    public class Consultation
    {
        public int ConsultationID { get; set; }
        public int AppointmentID { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string DoctorNotes { get; set; }

        public Appointment Appointment { get; set; }
    }

}
