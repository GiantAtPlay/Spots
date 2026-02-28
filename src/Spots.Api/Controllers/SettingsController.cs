using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spots.Api.Data;
using Spots.Api.DTOs;

namespace Spots.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly SpotsDbContext _db;
    private readonly IWebHostEnvironment _env;

    public SettingsController(SpotsDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    [HttpGet]
    public async Task<ActionResult<UserSettingsDto>> GetSettings()
    {
        var settings = await _db.UserSettings.FirstOrDefaultAsync();
        if (settings == null) return NotFound();

        return Ok(new UserSettingsDto
        {
            DarkMode = settings.DarkMode,
            DefaultViewMode = settings.DefaultViewMode,
            InitialSetupComplete = settings.InitialSetupComplete,
            GridColumns = settings.GridColumns
        });
    }

    [HttpPut]
    public async Task<ActionResult<UserSettingsDto>> UpdateSettings(UpdateUserSettingsDto dto)
    {
        var settings = await _db.UserSettings.FirstOrDefaultAsync();
        if (settings == null) return NotFound();

        if (dto.DarkMode.HasValue) settings.DarkMode = dto.DarkMode.Value;
        if (dto.DefaultViewMode != null) settings.DefaultViewMode = dto.DefaultViewMode;
        if (dto.InitialSetupComplete.HasValue) settings.InitialSetupComplete = dto.InitialSetupComplete.Value;
        if (dto.GridColumns.HasValue) settings.GridColumns = Math.Clamp(dto.GridColumns.Value, 2, 8);

        await _db.SaveChangesAsync();

        return Ok(new UserSettingsDto
        {
            DarkMode = settings.DarkMode,
            DefaultViewMode = settings.DefaultViewMode,
            InitialSetupComplete = settings.InitialSetupComplete,
            GridColumns = settings.GridColumns
        });
    }

    [HttpGet("backup")]
    public async Task<IActionResult> BackupDatabase()
    {
        try
        {
            // Get the database path from the connection string or config
            var dbPath = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection");
            if (string.IsNullOrEmpty(dbPath))
            {
                // Default path
                dbPath = "Data Source=/app/data/spots.db";
            }

            // Extract the file path from connection string
            var filePath = dbPath.Replace("Data Source=", "").Trim();
            
            // Check if file exists
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("Database file not found");
            }

            // Read the file
            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);

            // Return as file download
            var timestamp = DateTime.Now.ToString("yyyyMMdd-HHmmss");
            return File(fileBytes, "application/vnd.sqlite3", $"spots-backup-{timestamp}.db");
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error backing up database: {ex.Message}");
        }
    }
}
