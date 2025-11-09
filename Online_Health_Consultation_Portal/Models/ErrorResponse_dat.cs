namespace OHCP_BK.Models
{
    public class ErrorResponse_dat
    {
        public string Message { get; set; }
        public string ErrorCode { get; set; }
        public int StatusCode { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string TraceId { get; set; }
        public Dictionary<string, string[]> ValidationErrors { get; set; }
        public string StackTrace { get; set; }

        public ErrorResponse_dat(string message, string errorCode = "ERROR", int statusCode = 400)
        {
            Message = message;
            ErrorCode = errorCode;
            StatusCode = statusCode;
        }
    }
}
