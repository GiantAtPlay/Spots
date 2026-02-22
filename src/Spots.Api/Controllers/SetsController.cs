using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spots.Api.Data;
using Spots.Api.DTOs;
using Spots.Api.Services;

namespace Spots.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SetsController : ControllerBase
{
    private readonly IScryfallService _scryfallService;
    private readonly SpotsDbContext _db;

    public SetsController(IScryfallService scryfallService, SpotsDbContext db)
    {
        _scryfallService = scryfallService;
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<ScryfallSetDto>>> GetSets()
    {
        var sets = await _scryfallService.GetSetsAsync();
        // Filter to physical, non-digital sets by default
        var filtered = sets
            .Where(s => !s.Digital && (
                s.SetType == "core" ||
                s.SetType == "expansion" ||
                s.SetType == "draft_innovation" ||
                s.SetType == "masters" ||
                s.SetType == "commander" ||
                s.SetType == "funny"))
            .OrderByDescending(s => s.ReleasedAt)
            .ToList();

        return Ok(filtered);
    }

    [HttpGet("{code}")]
    public async Task<ActionResult<ScryfallSetDto>> GetSet(string code)
    {
        var set = await _scryfallService.GetSetAsync(code);
        if (set == null) return NotFound();
        return Ok(set);
    }

    [HttpGet("{code}/cards")]
    public async Task<ActionResult> GetSetCards(string code)
    {
        // First check if we have them locally
        var localCards = await _db.Cards
            .Where(c => c.SetCode == code)
            .Select(c => new
            {
                c.Id,
                c.ScryfallId,
                c.Name,
                c.SetCode,
                c.SetName,
                c.CollectorNumber,
                c.Rarity,
                c.TypeLine,
                c.ManaCost,
                c.ImageUri,
                c.ImageUriSmall,
                c.ImageUriArtCrop
            })
            .ToListAsync();

        // Sort numerically (in memory, since string sort doesn't work for collector numbers)
        localCards = localCards
            .OrderBy(c => string.IsNullOrEmpty(c.CollectorNumber) ? 1 : 0)
            .ThenBy(c => int.TryParse(c.CollectorNumber, out var n) ? n : int.MaxValue)
            .ThenBy(c => c.CollectorNumber)
            .ToList();

        if (localCards.Any())
            return Ok(localCards);

        // Otherwise fetch from Scryfall and import
        await _scryfallService.ImportSetCardsToDbAsync(code);

        localCards = await _db.Cards
            .Where(c => c.SetCode == code)
            .Select(c => new
            {
                c.Id,
                c.ScryfallId,
                c.Name,
                c.SetCode,
                c.SetName,
                c.CollectorNumber,
                c.Rarity,
                c.TypeLine,
                c.ManaCost,
                c.ImageUri,
                c.ImageUriSmall,
                c.ImageUriArtCrop
            })
            .ToListAsync();

        // Sort numerically (in memory, since string sort doesn't work for collector numbers)
        localCards = localCards
            .OrderBy(c => string.IsNullOrEmpty(c.CollectorNumber) ? 1 : 0)
            .ThenBy(c => int.TryParse(c.CollectorNumber, out var n) ? n : int.MaxValue)
            .ThenBy(c => c.CollectorNumber)
            .ToList();

        return Ok(localCards);
    }
}
