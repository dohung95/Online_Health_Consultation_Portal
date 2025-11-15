using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using OHCP_BK.Data;
using OHCP_BK.Models;

namespace OHCP_BK.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ReviewController_hiep : ControllerBase
    {
        private readonly OHCPContext _context;
        private readonly ILogger<ReviewController_hiep> _logger;

        public ReviewController_hiep(OHCPContext context, ILogger<ReviewController_hiep> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Review
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Review>>> GetReviews()
        {
            try
            {
                var reviews = await _context.Reviews
                    .Include(r => r.Patient)
                    .Include(r => r.Doctor)
                    .ToListAsync();
                return Ok(reviews);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting reviews: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // GET: api/Review/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Review>> GetReview(int id)
        {
            try
            {
                var review = await _context.Reviews
                    .Include(r => r.Patient)
                    .Include(r => r.Doctor)
                    .FirstOrDefaultAsync(r => r.ReviewID == id);

                if (review == null)
                {
                    return NotFound($"Review with ID {id} not found");
                }

                return Ok(review);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting review {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // POST: api/Review
        [HttpPost]
        public async Task<ActionResult<Review>> CreateReview([FromBody] Review review)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                _context.Reviews.Add(review);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetReview), new { id = review.ReviewID }, review);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error creating review: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // PUT: api/Review/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateReview(int id, [FromBody] Review review)
        {
            try
            {
                if (id != review.ReviewID)
                {
                    return BadRequest("Review ID mismatch");
                }

                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var existingReview = await _context.Reviews.FindAsync(id);
                if (existingReview == null)
                {
                    return NotFound($"Review with ID {id} not found");
                }

                existingReview.PatientID = review.PatientID;
                existingReview.DoctorID = review.DoctorID;
                existingReview.Rating = review.Rating;
                existingReview.Comment = review.Comment;
                existingReview.ReviewDate = review.ReviewDate;

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating review {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        // DELETE: api/Review/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            try
            {
                var review = await _context.Reviews.FindAsync(id);
                if (review == null)
                {
                    return NotFound($"Review with ID {id} not found");
                }

                _context.Reviews.Remove(review);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error deleting review {id}: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}
