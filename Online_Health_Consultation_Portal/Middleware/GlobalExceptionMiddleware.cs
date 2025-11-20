using OHCP_BK.Exceptions;
using OHCP_BK.Models;
using System.Net;
using System.Text.Json;

namespace OHCP_BK.Middleware
{
    public class GlobalExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionMiddleware> _logger;

        public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var response = new ErrorResponse(exception.Message);
            var statusCode = HttpStatusCode.InternalServerError;

            // Handle specific exception types
            switch (exception)
            {
                case ValidationException ve:
                    statusCode = (HttpStatusCode)ve.StatusCode;
                    response = new ErrorResponse(ve.Message, ve.ErrorCode, ve.StatusCode);
                    response.ValidationErrors = ve.Errors;
                    break;

                case UnauthorizedException ue:
                    statusCode = (HttpStatusCode)ue.StatusCode;
                    response = new ErrorResponse(ue.Message, ue.ErrorCode, ue.StatusCode);
                    break;

                case ForbiddenException fe:
                    statusCode = (HttpStatusCode)fe.StatusCode;
                    response = new ErrorResponse(fe.Message, fe.ErrorCode, fe.StatusCode);
                    break;

                case NotFoundException nfe:
                    statusCode = (HttpStatusCode)nfe.StatusCode;
                    response = new ErrorResponse(nfe.Message, nfe.ErrorCode, nfe.StatusCode);
                    break;

                case ConflictException ce:
                    statusCode = (HttpStatusCode)ce.StatusCode;
                    response = new ErrorResponse(ce.Message, ce.ErrorCode, ce.StatusCode);
                    break;

                case ApiException ae:
                    statusCode = (HttpStatusCode)ae.StatusCode;
                    response = new ErrorResponse(ae.Message, ae.ErrorCode, ae.StatusCode);
                    break;

                default:
                    statusCode = HttpStatusCode.InternalServerError;
                    response = new ErrorResponse(
                        "An unexpected error occurred",
                        "INTERNAL_SERVER_ERROR",
                        500
                    );
                    break;
            }

            context.Response.StatusCode = (int)statusCode;
            response.StatusCode = (int)statusCode;
            response.TraceId = context.TraceIdentifier;

            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var json = JsonSerializer.Serialize(response, options);

            return context.Response.WriteAsync(json);
        }
    }
}
