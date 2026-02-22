using Microsoft.EntityFrameworkCore;
using Spots.Api.Data;
using Spots.Api.Models;
using Spots.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<SpotsDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// HTTP client for Scryfall
builder.Services.AddHttpClient<IScryfallService, ScryfallService>(client =>
{
    client.BaseAddress = new Uri("https://api.scryfall.com/");
    client.DefaultRequestHeaders.Add("User-Agent", "Spots/1.0 (MTG Collection Tracker)");
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

// Services
builder.Services.AddHostedService<SyncBackgroundService>();

builder.Services.AddControllers();

var app = builder.Build();

// Auto-migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<SpotsDbContext>();
    var dataDir = Path.GetDirectoryName(db.Database.GetConnectionString()?.Replace("Data Source=", ""));
    if (!string.IsNullOrEmpty(dataDir) && !Directory.Exists(dataDir))
    {
        Directory.CreateDirectory(dataDir);
    }
    db.Database.Migrate();

    // Seed default settings if not exist
    if (!db.SyncSettings.Any())
    {
        db.SyncSettings.Add(new SyncSettings
        {
            Id = 1,
            CardSyncSchedule = "daily",
            PriceSyncSchedule = "weekly",
            CardSyncRecentMonths = 3
        });
    }
    if (!db.UserSettings.Any())
    {
        db.UserSettings.Add(new UserSettings
        {
            Id = 1,
            DarkMode = true,
            DefaultViewMode = "visual",
            InitialSetupComplete = false,
            GridColumns = 5
        });
    }
    db.SaveChanges();
}

// Serve static files (React build output)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

app.MapControllers();

// SPA fallback - serve index.html for non-API, non-file routes
app.MapFallbackToFile("index.html");

app.Run();
