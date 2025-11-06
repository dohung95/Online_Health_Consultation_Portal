using Microsoft.EntityFrameworkCore;
using OHCP_BK.Models;

namespace OHCP_BK.Data
{
    public class OHCPContext : DbContext
    {
        public OHCPContext(DbContextOptions options) : base(options)
        {
        }

        protected OHCPContext()
        {
        }
        public DbSet<HealthConsultation> HealthConsultations { get; set; }
    }
}
