namespace OHCP_BK.Models
{
    public class ErrorResponse
    {
        public string Message { get; set; }
        public string ErrorCode { get; set; }
        public int StatusCode { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string TraceId { get; set; }
        public Dictionary<string, string[]> ValidationErrors { get; set; }
        public string StackTrace { get; set; }

        public ErrorResponse(string message, string errorCode = "ERROR", int statusCode = 400)
        {
            Message = message;
            ErrorCode = errorCode;
            StatusCode = statusCode;
        }
    }
}
