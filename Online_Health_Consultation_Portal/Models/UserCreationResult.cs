namespace OHCP_BK.Models
{
    public class UserCreationResult
    {
        public bool Succeeded { get; set; }
        public string? UserId { get; set; }
        public string? ProfileId { get; set; }
        public string? Email { get; set; }
        public string? ErrorCode { get; set; }
        public Dictionary<string, string[]>? Errors { get; set; }

        public static UserCreationResult Success(string userId, string profileId, string email)
        {
            return new UserCreationResult
            {
                Succeeded = true,
                UserId = userId,
                ProfileId = profileId,
                Email = email
            };
        }

        public static UserCreationResult Failure(string errorCode, Dictionary<string, string[]> errors)
        {
            return new UserCreationResult
            {
                Succeeded = false,
                ErrorCode = errorCode,
                Errors = errors
            };
        }

        public static UserCreationResult Failure(string errorCode, string errorMessage)
        {
            return new UserCreationResult
            {
                Succeeded = false,
                ErrorCode = errorCode,
                Errors = new Dictionary<string, string[]>
                {
                    { "Error", new[] { errorMessage } }
                }
            };
        }
    }
}
