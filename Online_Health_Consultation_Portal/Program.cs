using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using OHCP_BK.Data;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(7267, listenOptions =>
    {
        listenOptions.UseHttps();
    });
});

// Đọc file .env thủ công
var envFile = Path.Combine(AppContext.BaseDirectory, ".env");
if (File.Exists(envFile))
{
    var lines = File.ReadAllLines(envFile);
    foreach (var line in lines)
    {
        if (string.IsNullOrEmpty(line) || line.StartsWith("#")) continue;
        var parts = line.Split('=', 2, StringSplitOptions.TrimEntries);
        if (parts.Length == 2)
        {
            Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
        }
    }
}

// Xây dựng chuỗi kết nối từ biến môi trường
var dbServer = Environment.GetEnvironmentVariable("DB_SERVER") ?? ".";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "OHCP_DB";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "sa";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "123456";
var connectionString = $"Server={dbServer};Database={dbName};User Id={dbUser};Password={dbPassword};TrustServerCertificate=True;MultipleActiveResultSets=true";
builder.Services.AddDbContext<OHCPContext>(options =>
    options.UseSqlServer(connectionString)
);

// Đăng ký dịch vụ Authorization
builder.Services.AddAuthorization();

// Cấu hình CORS
var corsAllowedOrigins = Environment.GetEnvironmentVariable("CORS_ALLOWED_ORIGINS")?.Split(';', StringSplitOptions.RemoveEmptyEntries) // Sửa: dùng ; thay vì ,
    .Select(o => o.Trim()).ToArray() ?? ["http://localhost:63527"]; // Sửa: dùng 63527 thay 5173
builder.Services.AddCors(c =>
{
    c.AddPolicy("AllowReactApp", p =>
    {
        p.WithOrigins(corsAllowedOrigins)
         .AllowAnyHeader()
         .AllowAnyMethod()
         .AllowCredentials();
    });
});

// Thêm logging
builder.Services.AddLogging(logging => logging.AddConsole().SetMinimumLevel(LogLevel.Debug));

// Thêm dịch vụ Controllers
builder.Services.AddControllers();

var app = builder.Build();

// Middleware exception handling
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "application/json";
        var error = new { Error = "Internal server error. Please check logs." };
        await context.Response.WriteAsJsonAsync(error);
    });
});

// Sử dụng middleware
app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();

app.Run();