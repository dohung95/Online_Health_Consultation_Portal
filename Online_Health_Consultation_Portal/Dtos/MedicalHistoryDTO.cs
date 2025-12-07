using System.ComponentModel.DataAnnotations;
namespace OHCP_BK.Dtos
{
    // DTO return medical history of a patient
    public class MedicalHistoryDTO
    {
        public string PatientID { get; set; } = null!;
        public string PatientName { get; set; } = null!;
        public List<AppointmentHistoryDTO> Appointments { get; set; } = new List<AppointmentHistoryDTO>();
        public int TotalAppointments { get; set; }

        // Summary by doctor
        public List<DoctorVisitSummaryDTO> DoctorVisits { get; set; } = new List<DoctorVisitSummaryDTO>();
    }
    // DTO for each appointment in history
    public class AppointmentHistoryDTO
    {
        public int AppointmentID { get; set; }
        public DateTime AppointmentTime { get; set; }
        public string ConsultationType { get; set; } = null!;
        public string Status { get; set; } = null!;

        // info about doctor
        public string DoctorID { get; set; } = null!;
        public string DoctorName { get; set; } = null!;
        public string DoctorSpecialty { get; set; } = null!;

        public ConsultationDetailsDTO? Consultation { get; set; }

        public PrescriptionSummaryDTO? Prescription { get; set; }

        public InvoiceSummaryDTO? Invoice { get; set; }
    }
    // DTO for consultation details
    public class ConsultationDetailsDTO
    {
        public int ConsultationID { get; set; }
        public DateTime? StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public string? DoctorNotes { get; set; }
        public string? Diagnosis { get; set; }
        public DateTime? FollowUpDate { get; set; }
    }
    // DTO for prescription summary
    public class PrescriptionSummaryDTO
    {
        public int PrescriptionHeaderID { get; set; }
        public DateTime IssueDate { get; set; }
        public int MedicationCount { get; set; }
        public List<string> MedicationNames { get; set; } = new List<string>();
        public List<MedicationItemDTO> Medications { get; set; } = new List<MedicationItemDTO>();
    }
    // DTO for individual medication item
    public class MedicationItemDTO
    {
        public string MedicationName { get; set; } = null!;
        public string Dosage { get; set; } = null!;
        public string Instructions { get; set; } = null!;
        public int TotalSupplyDays { get; set; }
    }
    // DTO for invoice summary
    public class InvoiceSummaryDTO
    {
        public int InvoiceID { get; set; }
        public decimal TotalAmount { get; set; }
        public string PaymentStatus { get; set; } = null!;
        public DateTime? PaymentDate { get; set; }
    }
    // DTO summary of visits to a specific doctor
    public class DoctorVisitSummaryDTO
    {
        public string DoctorID { get; set; } = null!;
        public string DoctorName { get; set; } = null!;
        public string DoctorSpecialty { get; set; } = null!;
        public int VisitCount { get; set; }
        public DateTime LastVisit { get; set; }
        public DateTime FirstVisit { get; set; }
    }
}