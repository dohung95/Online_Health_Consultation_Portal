using Microsoft.AspNetCore.Mvc;
using OHCP_BK.Dtos;
using OHCP_BK.Services;
using OHCP_BK.Exceptions;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ContactController : ControllerBase
    {
        private readonly IEmailService _emailService;
        private readonly ILogger<ContactController> _logger;

        public ContactController(IEmailService emailService, ILogger<ContactController> logger)
        {
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> SendContactEmail([FromBody] ContactDTO contactData)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.Values.SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return BadRequest(new { message = "Dữ liệu không hợp lệ", errors });
                }

                await _emailService.SendContactEmailAsync(contactData);

                return Ok(new { message = "Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send contact email");

                // Return a user-friendly error message
                return StatusCode(500, new {
                    message = "Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại sau.",
                    error = ex.Message
                });
            }
        }
    }
}
