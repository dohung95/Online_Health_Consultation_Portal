namespace OHCP_BK.Models
{
    public class TokenResponse_dat
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public string TokenType { get; set; } = "Bearer";
        public int ExpiresIn { get; set; } // seconds
        public DateTime ExpiresAt { get; set; }
    }
}
