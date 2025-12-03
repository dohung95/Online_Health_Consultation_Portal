using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OHCP_BK.Data;
using OHCP_BK.Middleware;
using OHCP_BK.Models;
using OHCP_BK.Services;
using OHCP_BK.Hubs;
using OHCP_BK.BackgroundServices;
using System;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.SignalR;

var builder = WebApplication.CreateBuilder(args);

DotNetEnv.Env.Load(); // U have this line so u don't need the manual .env reading code 💀                   SIGN: kudatdepzaine

// === THÊM KHỐI CODE KHỞI TẠO FIREBASE ADMIN NÀY VÀO ===
var saPath = Path.Combine(AppContext.BaseDirectory, "serviceAccountKey.json");
FirebaseApp.Create(new AppOptions()
{
    Credential = GoogleCredential.FromFile(saPath),
});
// =======================================================

builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenLocalhost(7267, listenOptions =>
    {
        listenOptions.UseHttps();
    });
});

// the manual .env reading code
//var envFile = Path.Combine(AppContext.BaseDirectory, ".env");
//if (File.Exists(envFile))
//{
//    var lines = File.ReadAllLines(envFile);
//    foreach (var line in lines)
//    {
//        if (string.IsNullOrEmpty(line) || line.StartsWith("#")) continue;
//        var parts = line.Split('=', 2, StringSplitOptions.TrimEntries);
//        if (parts.Length == 2)
//        {
//            Environment.SetEnvironmentVariable(parts[0].Trim(), parts[1].Trim());
//        }
//    }
//}

// Build connection string from environment variables
var dbServer = Environment.GetEnvironmentVariable("DB_SERVER") ?? ".";
var dbName = Environment.GetEnvironmentVariable("DB_NAME") ?? "OHCP_DB";
var dbUser = Environment.GetEnvironmentVariable("DB_USER") ?? "sa";
var dbPassword = Environment.GetEnvironmentVariable("DB_PASSWORD") ?? "123";
var connectionString = $"Server={dbServer};Database={dbName};User Id={dbUser};Password={dbPassword};TrustServerCertificate=True;MultipleActiveResultSets=true";

//  FIREBASE
builder.Services.AddDbContext<OHCPContext>(options => // <-- Khối này phải ở dưới FirebaseApp.Create
    options.UseSqlServer(connectionString)
);

// for identity
builder.Services.AddIdentity<AppUser, IdentityRole>(options =>
{
    // Disable cookie redirects for API
    options.SignIn.RequireConfirmedAccount = false;
    options.User.AllowedUserNameCharacters += " ";
})
    .AddEntityFrameworkStores<OHCPContext>()
    .AddDefaultTokenProviders();

// Configure authentication to use JWT as default and prevent redirects
builder.Services.ConfigureApplicationCookie(options =>
{
    // Disable automatic redirects for API calls
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

builder.Services.AddAuthentication(options =>
{
    // Set JWT as default scheme
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(o =>
{
    var jwtSecretKey = builder.Configuration["Jwt:SecretKey"]!;
    var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
    var jwtAudience = builder.Configuration["Jwt:Audience"]!;

    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
    };

    // Cấu hình JWT cho SignalR
    o.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(o =>
    {
        o.AddPolicy(
            "AdminOnly",
            policy => policy.RequireRole("Admin"));
    });

builder.Services.AddTransient<ITokenService, TokenService>();
builder.Services.AddScoped<IAccountService, AccountService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Đăng ký dịch vụ nhắc nhở
builder.Services.AddScoped<IMedicationReminderService, MedicationReminderService>();
builder.Services.AddScoped<IFollowUpReminderService, FollowUpReminderService>();
builder.Services.AddHostedService<ReminderBackgroundService>();

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

// Thêm SignalR
builder.Services.AddSignalR();

// Register notification service
builder.Services.AddScoped<INotificationService, NotificationService>();

// Register background services
builder.Services.AddHostedService<MedicationReminderBackgroundService>();
builder.Services.AddHostedService<AppointmentReminderBackgroundService>();

// Thêm dịch vụ Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Dòng này giúp bỏ qua lỗi vòng lặp tham chiếu (Cycle detected)
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.WriteIndented = true;
    });

// Đăng ký dịch vụ SignalR
builder.Services.AddSignalR();

// === ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT ===
// Dạy SignalR cách lấy User ID từ "sub" (Subject) trong JWT Token của bạn
// (Vì chúng ta dùng "Con đường khó", chúng ta phải làm thủ công)
builder.Services.AddSingleton<IUserIdProvider, NameUserIdProvider>();

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

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
// Add global exception middleware
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseCors("AllowReactApp");
app.UseStaticFiles();
app.UseRouting(); // Required for endpoint routing
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
// Đăng ký đường dẫn cho Hub
app.MapHub<OHCP_BK.Hubs.NotificationCalling>("/notificationcalling");

// Map SignalR Hub - must match frontend URL
app.MapHub<NotificationHub>("/notificationHub");

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var userManager = services.GetRequiredService<UserManager<AppUser>>();

    // Seed default admin, doctor, patient users
    await SeedData.CreateRoles(services, userManager);

    // Seed 50 doctors, 100 patients, and related data
    Console.WriteLine("Starting medical data seeding process...");
    await OHCP_BK.Data.SeedMedicalData.SeedAsync(services);
    Console.WriteLine("Medical data seeding completed!");

    // Seed 50 invoices
    Console.WriteLine("Starting invoice data seeding process...");
    await OHCP_BK.Data.SeedInvoiceData.SeedAsync(services);
    Console.WriteLine("Invoice data seeding completed!");
}

app.Run();
