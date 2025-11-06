using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Models;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class HealthConsultationController : ControllerBase
    {
        private readonly OHCPContext _context;

        public HealthConsultationController(OHCPContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<HealthConsultation>>> Get()
        {
            return await _context.HealthConsultations.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<HealthConsultation>> Post([FromBody] HealthConsultation consultation)
        {
            consultation.Date = DateTime.Now;
            _context.HealthConsultations.Add(consultation);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(Get), new { id = consultation.Id }, consultation);
        }
    }
}