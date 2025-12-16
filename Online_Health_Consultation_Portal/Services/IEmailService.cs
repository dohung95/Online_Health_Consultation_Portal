using OHCP_BK.Dtos;

namespace OHCP_BK.Services
{
    public interface IEmailService
    {
        Task SendContactEmailAsync(ContactDTO contactData);
        Task SendEmailConfirmationAsync(string email, string userName, string confirmationLink);
        Task SendAppointmentUpdateNotificationAsync(
            string recipientEmail, 
            string recipientName, 
            string appointmentId, 
            DateTime appointmentTime, 
            string doctorName, 
            string patientName, 
            string status, 
            string consultationType,
            DateTime? oldAppointmentTime = null,
            string oldStatus = null,
            string oldConsultationType = null);
    }
}
