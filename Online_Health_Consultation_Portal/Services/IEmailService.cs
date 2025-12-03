using OHCP_BK.Dtos;

namespace OHCP_BK.Services
{
    public interface IEmailService
    {
        Task SendContactEmailAsync(ContactDTO contactData);
        Task SendEmailConfirmationAsync(string email, string userName, string confirmationLink);
    }
}
