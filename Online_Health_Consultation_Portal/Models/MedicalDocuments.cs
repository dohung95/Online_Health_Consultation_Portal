using System.ComponentModel.DataAnnotations;

namespace OHCP_BK.Models
{
    public class MedicalDocument
    {
        [Key]
        public int DocumentID { get; set; }
        public int HealthRecordID { get; set; }
        public string DocumentName { get; set; }
        public string DocumentType { get; set; }
        public string FileLocation { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.Now;

        public HealthRecord HealthRecord { get; set; }
    }

}
