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

    public SettingsController(SpotsDbContext db)
    {
        _db = db;
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
}
