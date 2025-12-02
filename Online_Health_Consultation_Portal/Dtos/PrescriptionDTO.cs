namespace OHCP_BK.Dtos
{
    public class PrescriptionItemDTO
    {
        public string MedicationName { get; set; } = null!;
        public string Dosage { get; set; } = null!;
        public string Instructions { get; set; } = null!;
        public int TotalSupplyDays { get; set; }
    }

    public class CreatePrescriptionDTO
    {
        public int AppointmentID { get; set; }
        public string PatientID { get; set; } = null!;
        public List<PrescriptionItemDTO> Medications { get; set; } = new List<PrescriptionItemDTO>();
    }

    public class PrescriptionHeaderResponseDTO
    {
        public int PrescriptionHeaderID { get; set; }
        public int AppointmentID { get; set; }
        public string PatientID { get; set; } = null!;
        public DateTime IssueDate { get; set; }
        public string? DoctorName { get; set; }
        public string? Specialty { get; set; }
        public List<PrescriptionItemResponseDTO> Medications { get; set; } = new List<PrescriptionItemResponseDTO>();
    }

    public class PrescriptionItemResponseDTO
    {
        public int PrescriptionItemID { get; set; }
        public string MedicationName { get; set; } = null!;
        public string Dosage { get; set; } = null!;
        public string Instructions { get; set; } = null!;
        public int TotalSupplyDays { get; set; }
    }
}
