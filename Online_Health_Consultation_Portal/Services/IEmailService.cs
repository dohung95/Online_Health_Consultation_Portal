using OHCP_BK.Dtos;

namespace OHCP_BK.Services
{
    public interface IEmailService
    {
        Task SendContactEmailAsync(ContactDTO contactData);
    }
}
