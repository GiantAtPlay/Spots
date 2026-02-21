using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spots.Api.Data;
using Spots.Api.DTOs;
using Spots.Api.Services;

namespace Spots.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SyncController : ControllerBase
{
    private readonly SpotsDbContext _db;
    private readonly SyncBackgroundService _syncService;
    private readonly IScryfallService _scryfallService;

    public SyncController(SpotsDbContext db, IEnumerable<IHostedService> hostedServices, IScryfallService scryfallService)
    {
        _db = db;
        _syncService = hostedServices.OfType<SyncBackgroundService>().First();
        _scryfallService = scryfallService;
    }

    [HttpGet("status")]
    public async Task<ActionResult<SyncStatusDto>> GetStatus()
    {
        var settings = await _db.SyncSettings.FirstOrDefaultAsync();
        if (settings == null) return NotFound();

        return Ok(new SyncStatusDto
        {
            IsSyncing = settings.IsSyncing,
            SyncStatus = settings.SyncStatus,
            LastCardSync = settings.LastCardSync,
            LastPriceSync = settings.LastPriceSync
        });
    }

    [HttpPost("status")]
    public async Task<ActionResult<SyncStatusDto>> TriggerSync()
    {
        var settings = await _db.SyncSettings.FirstOrDefaultAsync();
        if (settings == null) return NotFound();

        if (settings.IsSyncing)
            return BadRequest("Sync already in progress");

        _syncService.TriggerManualSync();

        return Ok(new SyncStatusDto
        {
            IsSyncing = true,
            SyncStatus = "Manual sync triggered...",
            LastCardSync = settings.LastCardSync,
            LastPriceSync = settings.LastPriceSync
        });
    }

    [HttpGet("settings")]
    public async Task<ActionResult<SyncSettingsDto>> GetSettings()
    {
        var settings = await _db.SyncSettings.FirstOrDefaultAsync();
        if (settings == null) return NotFound();

        return Ok(new SyncSettingsDto
        {
            CardSyncSchedule = settings.CardSyncSchedule,
            PriceSyncSchedule = settings.PriceSyncSchedule,
            CardSyncRecentMonths = settings.CardSyncRecentMonths,
            LastCardSync = settings.LastCardSync,
            LastPriceSync = settings.LastPriceSync,
            IsSyncing = settings.IsSyncing,
            SyncStatus = settings.SyncStatus
        });
    }

    [HttpPut("settings")]
    public async Task<ActionResult<SyncSettingsDto>> UpdateSettings(UpdateSyncSettingsDto dto)
    {
        var settings = await _db.SyncSettings.FirstOrDefaultAsync();
        if (settings == null) return NotFound();

        if (dto.CardSyncSchedule != null) settings.CardSyncSchedule = dto.CardSyncSchedule;
        if (dto.PriceSyncSchedule != null) settings.PriceSyncSchedule = dto.PriceSyncSchedule;
        if (dto.CardSyncRecentMonths.HasValue) settings.CardSyncRecentMonths = dto.CardSyncRecentMonths.Value;

        await _db.SaveChangesAsync();

        return Ok(new SyncSettingsDto
        {
            CardSyncSchedule = settings.CardSyncSchedule,
            PriceSyncSchedule = settings.PriceSyncSchedule,
            CardSyncRecentMonths = settings.CardSyncRecentMonths,
            LastCardSync = settings.LastCardSync,
            LastPriceSync = settings.LastPriceSync,
            IsSyncing = settings.IsSyncing,
            SyncStatus = settings.SyncStatus
        });
    }

    [HttpPost("import-set/{setCode}")]
    public async Task<ActionResult> ImportSet(string setCode)
    {
        try
        {
            await _scryfallService.ImportSetCardsToDbAsync(setCode);
            return Ok(new { message = $"Set {setCode} imported successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = ex.Message });
        }
    }
}
