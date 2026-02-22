using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spots.Api.Data;
using Spots.Api.DTOs;
using Spots.Api.Models;

namespace Spots.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CollectionController : ControllerBase
{
    private readonly SpotsDbContext _db;

    public CollectionController(SpotsDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns collection grouped by card (consolidated view).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<CollectionCardDto>>> GetCollection(
        [FromQuery] string? setCode = null,
        [FromQuery] int? spotId = null,
        [FromQuery] int? cardId = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var query = _db.CollectionEntries
            .Include(ce => ce.Card)
                .ThenInclude(c => c.Prices)
            .Include(ce => ce.Spot)
            .AsQueryable();

        if (!string.IsNullOrEmpty(setCode))
            query = query.Where(ce => ce.Card.SetCode == setCode);

        if (spotId.HasValue)
            query = query.Where(ce => ce.SpotId == spotId);

        if (cardId.HasValue)
            query = query.Where(ce => ce.CardId == cardId.Value);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(ce => ce.Card.Name.Contains(search));

        return await GetGroupedCards(query, page, pageSize);
    }

    /// <summary>
    /// Returns cards marked for trade, grouped by card.
    /// </summary>
    [HttpGet("fortrade")]
    public async Task<ActionResult<List<CollectionCardDto>>> GetForTrade(
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 60)
    {
        var query = _db.CollectionEntries
            .Include(ce => ce.Card)
                .ThenInclude(c => c.Prices)
            .Include(ce => ce.Spot)
            .Where(ce => ce.ForTrade)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(ce => ce.Card.Name.Contains(search));

        return await GetGroupedCards(query, page, pageSize);
    }

    private async Task<ActionResult<List<CollectionCardDto>>> GetGroupedCards(IQueryable<CollectionEntry> query, int page, int pageSize)
    {
        var grouped = await query
            .OrderBy(ce => ce.Card.Name)
            .ThenBy(ce => ce.Card.SetCode)
            .ToListAsync();

        var cardGroups = grouped
            .GroupBy(ce => ce.CardId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(g =>
            {
                var card = g.First().Card;
                var latestPrice = card.Prices.OrderByDescending(p => p.UpdatedAt).FirstOrDefault();

                return new CollectionCardDto
                {
                    CardId = card.Id,
                    CardName = card.Name,
                    SetCode = card.SetCode,
                    SetName = card.SetName,
                    CollectorNumber = card.CollectorNumber,
                    Rarity = card.Rarity,
                    TypeLine = card.TypeLine,
                    ManaCost = card.ManaCost,
                    ImageUri = card.ImageUri,
                    ImageUriSmall = card.ImageUriSmall,
                    ImageUriArtCrop = card.ImageUriArtCrop,
                    PriceEur = latestPrice?.Eur,
                    PriceEurFoil = latestPrice?.EurFoil,
                    StandardCount = g.Count(e => !e.IsFoil),
                    FoilCount = g.Count(e => e.IsFoil),
                    Entries = g.Select(e => new CollectionEntryDto
                    {
                        Id = e.Id,
                        CardId = e.CardId,
                        IsFoil = e.IsFoil,
                        SpotId = e.SpotId,
                        SpotName = e.Spot?.Name,
                        ForTrade = e.ForTrade,
                    }).ToList()
                };
            })
            .ToList();

        var totalGroups = grouped.Select(e => e.CardId).Distinct().Count();
        Response.Headers.Append("X-Total-Count", totalGroups.ToString());
        return Ok(cardGroups);
    }

    /// <summary>
    /// Get all entries for a specific card (used by modal).
    /// </summary>
    [HttpGet("card/{cardId}")]
    public async Task<ActionResult<List<CollectionEntryDto>>> GetCardEntries(int cardId)
    {
        var entries = await _db.CollectionEntries
            .Where(ce => ce.CardId == cardId)
            .Include(ce => ce.Spot)
            .OrderBy(ce => ce.IsFoil)
            .ThenBy(ce => ce.Id)
            .ToListAsync();

        return Ok(entries.Select(e => new CollectionEntryDto
        {
            Id = e.Id,
            CardId = e.CardId,
            IsFoil = e.IsFoil,
            SpotId = e.SpotId,
            SpotName = e.Spot?.Name,
            ForTrade = e.ForTrade,
        }).ToList());
    }

    /// <summary>
    /// Add a single physical card to the collection.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<CollectionEntryDto>> CreateEntry(CreateCollectionEntryDto dto)
    {
        var card = await _db.Cards.FindAsync(dto.CardId);
        if (card == null) return BadRequest("Card not found");

        var entry = new CollectionEntry
        {
            CardId = dto.CardId,
            IsFoil = dto.IsFoil,
            SpotId = dto.SpotId,
            ForTrade = dto.ForTrade
        };

        _db.CollectionEntries.Add(entry);
        await _db.SaveChangesAsync();

        // Reload with navigation properties
        await _db.Entry(entry).Reference(e => e.Spot).LoadAsync();

        return CreatedAtAction(nameof(GetCardEntries), new { cardId = dto.CardId }, new CollectionEntryDto
        {
            Id = entry.Id,
            CardId = entry.CardId,
            IsFoil = entry.IsFoil,
            SpotId = entry.SpotId,
            SpotName = entry.Spot?.Name,
            ForTrade = entry.ForTrade,
        });
    }

    /// <summary>
    /// Update spot or trade status of a single physical card.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<CollectionEntryDto>> UpdateEntry(int id, UpdateCollectionEntryDto dto)
    {
        var entry = await _db.CollectionEntries
            .Include(e => e.Spot)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (entry == null) return NotFound();

        if (dto.SpotId.HasValue) entry.SpotId = dto.SpotId.Value == 0 ? null : dto.SpotId.Value;
        if (dto.ForTrade.HasValue) entry.ForTrade = dto.ForTrade.Value;

        await _db.SaveChangesAsync();

        // Reload spot if changed
        if (dto.SpotId.HasValue)
            await _db.Entry(entry).Reference(e => e.Spot).LoadAsync();

        return Ok(new CollectionEntryDto
        {
            Id = entry.Id,
            CardId = entry.CardId,
            IsFoil = entry.IsFoil,
            SpotId = entry.SpotId,
            SpotName = entry.Spot?.Name,
            ForTrade = entry.ForTrade,
        });
    }

    /// <summary>
    /// Remove a single physical card from the collection.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteEntry(int id)
    {
        var entry = await _db.CollectionEntries.FindAsync(id);
        if (entry == null) return NotFound();

        _db.CollectionEntries.Remove(entry);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Delete all collection entries.
    /// </summary>
    [HttpDelete("reset")]
    public async Task<ActionResult> ResetCollection()
    {
        var entries = await _db.CollectionEntries.ToListAsync();
        _db.CollectionEntries.RemoveRange(entries);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
