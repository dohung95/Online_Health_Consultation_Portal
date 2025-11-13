namespace OHCP_BK.Models
{
    public class HealthRecord
    {
        public int HealthRecordID { get; set; }
        public int PatientID { get; set; }
        public DateTime LastUpdated { get; set; } = DateTime.Now;

        public Patient Patient { get; set; }
        public ICollection<MedicalDocument> Documents { get; set; }
    }

}
