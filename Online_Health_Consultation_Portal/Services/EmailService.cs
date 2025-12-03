using OHCP_BK.Dtos;
using System.Net.Mail;
using System.Net;
using System.Web;

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

        public async Task SendEmailConfirmationAsync(string email, string userName, string confirmationLink)
        {
            try
            {
                // Read SMTP settings from environment variables
                var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com";
                var smtpPort = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587");
                var smtpUser = Environment.GetEnvironmentVariable("SMTP_USERNAME");
                var smtpPass = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
                var fromEmail = Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") ?? smtpUser;
                var fromName = Environment.GetEnvironmentVariable("SMTP_FROM_NAME") ?? "Online Health Consultation Portal";

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
                        Subject = "Email Confirmation - Online Health Consultation Portal",
                        Body = BuildConfirmationEmailBody(userName, confirmationLink),
                        IsBodyHtml = true
                    };

                    mailMessage.To.Add(email);

                    await client.SendMailAsync(mailMessage);
                }

                _logger.LogInformation($"Email confirmation sent successfully to {email}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email confirmation");
                throw;
            }
        }

        public async Task SendContactEmailAsync(ContactDTO contactData)
        {
            try
            {
                // Read SMTP settings from environment variables
                var smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") ?? "smtp.gmail.com";
                var smtpPort = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587");
                var smtpUser = Environment.GetEnvironmentVariable("SMTP_USERNAME");
                var smtpPass = Environment.GetEnvironmentVariable("SMTP_PASSWORD");
                var fromEmail = Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") ?? smtpUser;
                var fromName = Environment.GetEnvironmentVariable("SMTP_FROM_NAME") ?? "Online Health Consultation Portal";
                var toEmail = Environment.GetEnvironmentVariable("SMTP_TO_EMAIL") ?? "hungtrum127@gmail.com";

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

        private string BuildConfirmationEmailBody(string userName, string confirmationLink)
        {
            return $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
                        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
                        .header {{ background-color: #006492; color: white; padding: 30px; text-align: center; }}
                        .content {{ padding: 30px; background-color: #ffffff; }}
                        .button {{
                            display: inline-block;
                            padding: 15px 35px;
                            margin: 25px 0;
                            background-color: #009cde;
                            color: white !important;
                            text-decoration: none;
                            border-radius: 6px;
                            font-weight: bold;
                            font-size: 16px;
                            box-shadow: 0 3px 10px rgba(0, 156, 222, 0.3);
                            transition: all 0.3s ease;
                        }}
                        .button:hover {{
                            background-color: #0088c7;
                            box-shadow: 0 5px 15px rgba(0, 156, 222, 0.4);
                        }}
                        .footer {{
                            padding: 20px;
                            text-align: center;
                            color: #666;
                            font-size: 12px;
                            background-color: #f9f9f9;
                            border-top: 1px solid #e0e0e0;
                        }}
                        .warning {{
                            background-color: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 4px;
                        }}
                        h2 {{ color: #333; margin-top: 0; }}
                        p {{ color: #555; line-height: 1.6; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1 style='margin: 0; font-size: 28px;'>Welcome to OHCP!</h1>
                            <p style='margin: 10px 0 0 0; color: #e3f2fd;'>Online Health Consultation Portal</p>
                        </div>
                        <div class='content'>
                            <h2>Hi {userName},</h2>
                            <p>Thank you for registering with Online Health Consultation Portal.</p>
                            <p>Please confirm your email address by clicking the button below:</p>

                            <div style='text-align: center;'>
                                <a href='{confirmationLink}' class='button' style='color: white;'>✉️ Confirm Email Address</a>
                            </div>

                            <div class='warning'>
                                <strong>⚠️ Important:</strong> You must confirm your email before you can log in to your account.
                            </div>

                            <p>If you did not create an account, please ignore this email or contact our support team.</p>

                            <p style='color: #999; font-size: 13px;'>⏰ This link will expire in 24 hours.</p>
                        </div>
                        <div class='footer'>
                            <p style='margin: 5px 0;'>This is an automated email. Please do not reply to this message.</p>
                            <p style='margin: 5px 0;'>&copy; 2024 Online Health Consultation Portal. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>";
        }
    }
}
