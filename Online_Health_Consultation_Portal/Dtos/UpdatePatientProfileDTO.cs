// DTO để cập nhật thông tin profile cơ bản (không liên quan đến bảo mật)
public class UpdatePatientProfileDTO
{
    public string? FullName { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? MedicalHistorySummary { get; set; }
    public string? InsuranceProvider { get; set; }
    public string? InsurancePolicyNumber { get; set; }
    public string? PhoneNumber { get; set; } // Để cập nhật cả bảng Users
}