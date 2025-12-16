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


        public async Task SendAppointmentUpdateNotificationAsync(
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
            string oldConsultationType = null)
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
                        Subject = "Appointment Updated by Admin - OHCP",
                        Body = BuildAppointmentUpdateEmailBody(recipientName, appointmentId, appointmentTime, doctorName, patientName, status, consultationType, oldAppointmentTime, oldStatus, oldConsultationType),
                        IsBodyHtml = true
                    };

                    mailMessage.To.Add(recipientEmail);

                    await client.SendMailAsync(mailMessage);
                }

                _logger.LogInformation($"Appointment update notification sent successfully to {recipientEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send appointment update notification to {recipientEmail}");
                throw;
            }
        }

        private string BuildAppointmentUpdateEmailBody(
            string recipientName, 
            string appointmentId, 
            DateTime appointmentTime, 
            string doctorName, 
            string patientName, 
            string status, 
            string consultationType,
            DateTime? oldAppointmentTime = null,
            string oldStatus = null,
            string oldConsultationType = null)
        {
            var formattedDate = appointmentTime.ToString("dddd, MMMM dd, yyyy");
            var formattedTime = appointmentTime.ToString("hh:mm tt");
            
            // Check what changed
            bool dateTimeChanged = oldAppointmentTime.HasValue && oldAppointmentTime.Value != appointmentTime;
            bool statusChanged = !string.IsNullOrEmpty(oldStatus) && oldStatus != status;
            bool typeChanged = !string.IsNullOrEmpty(oldConsultationType) && oldConsultationType != consultationType;
            
            // Format old values if they exist
            string oldFormattedDate = oldAppointmentTime?.ToString("dddd, MMMM dd, yyyy") ?? "";
            string oldFormattedTime = oldAppointmentTime?.ToString("hh:mm tt") ?? "";
            
            return $@"
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
                        .container {{ max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
                        .header {{ background-color: #006492; color: white; padding: 30px; text-align: center; }}
                        .content {{ padding: 30px; background-color: #ffffff; }}
                        .info-box {{
                            background-color: #f0f8ff;
                            border-left: 4px solid #009cde;
                            padding: 20px;
                            margin: 20px 0;
                            border-radius: 4px;
                        }}
                        .info-row {{
                            display: flex;
                            padding: 10px 0;
                            border-bottom: 1px solid #e0e0e0;
                        }}
                        .info-row:last-child {{
                            border-bottom: none;
                        }}
                        .info-row.changed {{
                            background-color: #fff9e6;
                            padding: 15px 10px;
                            margin: 5px -10px;
                            border-radius: 4px;
                            border-left: 4px solid #ff9800;
                        }}
                        .info-label {{
                            font-weight: bold;
                            color: #006492;
                            width: 150px;
                            flex-shrink: 0;
                        }}
                        .info-value {{
                            color: #333;
                            flex-grow: 1;
                        }}
                        .changed-badge {{
                            display: inline-block;
                            background-color: #ff9800;
                            color: white;
                            padding: 2px 8px;
                            border-radius: 12px;
                            font-size: 11px;
                            font-weight: bold;
                            margin-left: 8px;
                            text-transform: uppercase;
                        }}
                        .old-value {{
                            color: #999;
                            text-decoration: line-through;
                            font-size: 13px;
                            display: block;
                            margin-top: 5px;
                        }}
                        .new-value {{
                            color: #ff9800;
                            font-weight: bold;
                        }}
                        .status-badge {{
                            display: inline-block;
                            padding: 5px 15px;
                            border-radius: 20px;
                            font-weight: bold;
                            font-size: 14px;
                        }}
                        .status-scheduled {{ background-color: #d4edda; color: #155724; }}
                        .status-pending {{ background-color: #fff3cd; color: #856404; }}
                        .status-completed {{ background-color: #cce5ff; color: #004085; }}
                        .status-cancelled {{ background-color: #f8d7da; color: #721c24; }}
                        .footer {{
                            padding: 20px;
                            text-align: center;
                            color: #666;
                            font-size: 12px;
                            background-color: #f9f9f9;
                            border-top: 1px solid #e0e0e0;
                        }}
                        .alert {{
                            background-color: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 4px;
                        }}
                        .changes-summary {{
                            background-color: #ffe0b2;
                            border-left: 4px solid #ff9800;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 4px;
                        }}
                        .changes-summary ul {{
                            margin: 10px 0 0 0;
                            padding-left: 20px;
                        }}
                        .changes-summary li {{
                            color: #e65100;
                            font-weight: 500;
                            margin: 5px 0;
                        }}
                        h2 {{ color: #333; margin-top: 0; }}
                        p {{ color: #555; line-height: 1.6; }}
                    </style>
                </head>
                <body>
                    <div class='container'>
                        <div class='header'>
                            <h1 style='margin: 0; font-size: 28px;'>📅 Appointment Updated</h1>
                            <p style='margin: 10px 0 0 0; color: #e3f2fd;'>Online Health Consultation Portal</p>
                        </div>
                        <div class='content'>
                            <h2>Hi {recipientName},</h2>
                            <p>An administrator has updated your appointment. Please review the updated details below:</p>

                            {(dateTimeChanged || statusChanged || typeChanged ? $@"
                            <div class='changes-summary'>
                                <strong>🔔 Changes Made:</strong>
                                <ul>
                                    {(dateTimeChanged ? "<li>Appointment Date & Time has been changed</li>" : "")}
                                    {(statusChanged ? "<li>Status has been updated</li>" : "")}
                                    {(typeChanged ? "<li>Consultation Type has been changed</li>" : "")}
                                </ul>
                            </div>" : "")}

                            <div class='info-box'>
                                <div class='info-row'>
                                    <div class='info-label'>Appointment ID:</div>
                                    <div class='info-value'>#{appointmentId}</div>
                                </div>
                                <div class='info-row'>
                                    <div class='info-label'>Patient:</div>
                                    <div class='info-value'>{patientName}</div>
                                </div>
                                <div class='info-row'>
                                    <div class='info-label'>Doctor:</div>
                                    <div class='info-value'>{doctorName}</div>
                                </div>
                                <div class='info-row{(dateTimeChanged ? " changed" : "")}'>
                                    <div class='info-label'>Date:{(dateTimeChanged ? "<span class='changed-badge'>Changed</span>" : "")}</div>
                                    <div class='info-value'>
                                        <span class='{(dateTimeChanged ? "new-value" : "")}'>{formattedDate}</span>
                                        {(dateTimeChanged ? $"<span class='old-value'>Previous: {oldFormattedDate}</span>" : "")}
                                    </div>
                                </div>
                                <div class='info-row{(dateTimeChanged ? " changed" : "")}'>
                                    <div class='info-label'>Time:{(dateTimeChanged ? "<span class='changed-badge'>Changed</span>" : "")}</div>
                                    <div class='info-value'>
                                        <span class='{(dateTimeChanged ? "new-value" : "")}'>{formattedTime}</span>
                                        {(dateTimeChanged ? $"<span class='old-value'>Previous: {oldFormattedTime}</span>" : "")}
                                    </div>
                                </div>
                                <div class='info-row{(typeChanged ? " changed" : "")}'>
                                    <div class='info-label'>Type:{(typeChanged ? "<span class='changed-badge'>Changed</span>" : "")}</div>
                                    <div class='info-value'>
                                        <span class='{(typeChanged ? "new-value" : "")}'>{consultationType}</span>
                                        {(typeChanged ? $"<span class='old-value'>Previous: {oldConsultationType}</span>" : "")}
                                    </div>
                                </div>
                                <div class='info-row{(statusChanged ? " changed" : "")}'>
                                    <div class='info-label'>Status:{(statusChanged ? "<span class='changed-badge'>Changed</span>" : "")}</div>
                                    <div class='info-value'>
                                        <span class='status-badge status-{status.ToLower()}'>{status}</span>
                                        {(statusChanged ? $"<span class='old-value'>Previous: {oldStatus}</span>" : "")}
                                    </div>
                                </div>
                            </div>

                            <div class='alert'>
                                <strong>ℹ️ Note:</strong> This appointment was updated by an administrator. If you have any questions or concerns, please contact our support team.
                            </div>

                            <p>Please make note of these changes and ensure you are available at the scheduled time.</p>
                        </div>
                        <div class='footer'>
                            <p style='margin: 5px 0;'>This is an automated email notification. Please do not reply to this message.</p>
                            <p style='margin: 5px 0;'>&copy; 2024 Online Health Consultation Portal. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>";
        }
    }
}
