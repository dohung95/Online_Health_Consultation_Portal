using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using OHCP_BK.Data;
using OHCP_BK.Middleware;
using OHCP_BK.Models;
using OHCP_BK.Services;
using System;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

DotNetEnv.Env.Load(); // U have this line so u don't need the manual .env reading code 💀                   SIGN: kudatdepzaine

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
builder.Services.AddDbContext<OHCPContext>(options =>
    options.UseSqlServer(connectionString)
);

// Builder Services
    // for identity
    builder.Services.AddIdentity<AppUser_dat, IdentityRole>(options =>
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
    var jwtSecretKey = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
        ?? builder.Configuration["Jwt:SecretKey"]!;
    var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER")
        ?? builder.Configuration["Jwt:Issuer"]!;
    var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
        ?? builder.Configuration["Jwt:Audience"]!;

    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
    };
});

builder.Services.AddAuthorization(o =>
    {
        o.AddPolicy(
            "AdminOnly",
            policy => policy.RequireRole("Admin"));
    });

    builder.Services.AddTransient<ITokenService_dat, TokenService_dat>();

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
app.UseMiddleware<GlobalExceptionMiddleware_dat>();
app.UseCors("AllowReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var userManager = services.GetRequiredService<UserManager<AppUser_dat>>();
    await SeedData.CreateRoles(services, userManager);
}

app.Run();