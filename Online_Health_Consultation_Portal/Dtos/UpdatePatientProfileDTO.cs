// DTO để cập nhật thông tin profile cơ bản (không liên quan đến bảo mật)
public class UpdatePatientProfileDTO
{
    public string? FullName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? MedicalHistorySummary { get; set; }
    public string? InsuranceProvider { get; set; }
    public string? InsurancePolicyNumber { get; set; }
    public string? PhoneNumber { get; set; } // Để cập nhật cả bảng Users
    public string? Gender { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Country { get; set; }
    public string? BloodType { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }
    public string? EmergencyContactRelationship { get; set; }
    public string? PreferredLanguage { get; set; }
    public string? PreferredContactMethod { get; set; }
    public string? Occupation { get; set; }
}