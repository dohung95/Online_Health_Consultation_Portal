namespace OHCP_BK.Models
{
    public class Prescription
    {
        public int PrescriptionID { get; set; }
        public int ConsultationID { get; set; }
        public int PatientID { get; set; }
        public string MedicationName { get; set; }
        public string Dosage { get; set; }
        public string Instructions { get; set; }
        public DateTime IssueDate { get; set; } = DateTime.Now;

        public Consultation Consultation { get; set; }
        public Patient Patient { get; set; }
    }

}
