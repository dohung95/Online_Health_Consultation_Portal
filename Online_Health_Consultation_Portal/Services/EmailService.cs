using OHCP_BK.Dtos;
using System.Net.Mail;
using System.Net;

namespace OHCP_BK.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendContactEmailAsync(ContactDTO contactData)
        {
            try
            {
                var smtpSettings = _configuration.GetSection("Smtp");
                var smtpHost = smtpSettings["Host"] ?? "smtp.gmail.com";
                var smtpPort = int.Parse(smtpSettings["Port"] ?? "587");
                var smtpUser = smtpSettings["Username"];
                var smtpPass = smtpSettings["Password"];
                var fromEmail = smtpSettings["FromEmail"] ?? smtpUser;
                var fromName = smtpSettings["FromName"] ?? "Online Health Consultation Portal";
                var toEmail = smtpSettings["ToEmail"] ?? "hungtrum127@gmail.com";

                if (string.IsNullOrEmpty(smtpUser) || string.IsNullOrEmpty(smtpPass))
                {
                    throw new Exception("SMTP credentials not configured");
                }

                using (var client = new SmtpClient(smtpHost, smtpPort))
                {
                    client.Credentials = new NetworkCredential(smtpUser, smtpPass);
                    client.EnableSsl = true;

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(fromEmail, fromName),
                        Subject = $"Contact Form: {contactData.Subject}",
                        Body = BuildEmailBody(contactData),
                        IsBodyHtml = true
                    };

                    mailMessage.To.Add(toEmail);

                    await client.SendMailAsync(mailMessage);
                }

                _logger.LogInformation($"Contact email sent successfully from {contactData.Email} to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send contact email");
                throw;
            }
        }

        private string BuildEmailBody(ContactDTO contactData)
        {
            return $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 20px; }}
                        .container {{ max-width: 600px; margin: 0 auto; }}
                        .header {{ background-color: #006492; color: white; padding: 20px; text-align: center; }}
                        .content {{ padding: 20px; background-color: #f9f9f9; }}
                        .field {{ margin-bottom: 15px; }}
                        .label {{ font-weight: bold; color: #333; }}
                        .value {{ color: #666; }}
                        .message {{ background-color: white; padding: 15px; border-left: 4px solid #006492; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h2>Contact From Website</h2>
                            <p>Online Health Consultation Portal</p>
                        </div>
                        <div class='content'>
                            <div class='field'>
                                <div class='label'>Full name:</div>
                                <div class='value'>{contactData.Name}</div>
                            </div>
                            <div class='field'>
                                <div class='label'>Email:</div>
                                <div class='value'>{contactData.Email}</div>
                            </div>
                            <div class='field'>
                                <div class='label'>Phone:</div>
                                <div class='value'>{contactData.Phone}</div>
                            </div>
                            <div class='field'>
                                <div class='label'>Topic:</div>
                                <div class='value'>{contactData.Subject}</div>
                            </div>
                            <div class='field'>
                                <div class='label'>Message content:</div>
                                <div class='message'>{contactData.Message.Replace("\n", "<br>")}</div>
                            </div>
                            <hr>
                            <p style='color: #666; font-size: 12px; text-align: center;'>
                                This email was sent automatically from the Online Health Consultation Portal contact system.
                            </p>
                        </div>
                    </div>
                </body>
                </html>";
        }
    }
}
