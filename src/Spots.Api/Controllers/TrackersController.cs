using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spots.Api.Data;
using Spots.Api.DTOs;
using Spots.Api.Models;
using Spots.Api.Services;

namespace Spots.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TrackersController : ControllerBase
{
    private readonly SpotsDbContext _db;
    private readonly IScryfallService _scryfallService;

    public TrackersController(SpotsDbContext db, IScryfallService scryfallService)
    {
        _db = db;
        _scryfallService = scryfallService;
    }

    [HttpGet]
    public async Task<ActionResult<List<TrackerDto>>> GetTrackers()
    {
        var trackers = await _db.Trackers
            .Include(t => t.TrackerCards)
            .ToListAsync();

        var result = new List<TrackerDto>();
        foreach (var t in trackers)
        {
            result.Add(await MapTrackerToDto(t));
        }

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TrackerDto>> GetTracker(int id)
    {
        var tracker = await _db.Trackers
            .Include(t => t.TrackerCards)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tracker == null) return NotFound();
        return Ok(await MapTrackerToDto(tracker));
    }

    [HttpPost]
    public async Task<ActionResult<TrackerDto>> CreateTracker(CreateTrackerDto dto)
    {
        var tracker = new Tracker
        {
            Name = dto.Name,
            SetCode = dto.SetCode,
            TrackFoil = dto.TrackFoil,
            TrackNonFoil = dto.TrackNonFoil,
            IsCollecting = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Trackers.Add(tracker);
        await _db.SaveChangesAsync();

        // If set-based tracker, import set cards and add them
        if (!string.IsNullOrEmpty(dto.SetCode))
        {
            await _scryfallService.ImportSetCardsToDbAsync(dto.SetCode);

            var setCards = await _db.Cards
                .Where(c => c.SetCode == dto.SetCode)
                .ToListAsync();

            foreach (var card in setCards)
            {
                _db.TrackerCards.Add(new TrackerCard
                {
                    TrackerId = tracker.Id,
                    CardId = card.Id,
                    IsExcluded = false
                });
            }

            await _db.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetTracker), new { id = tracker.Id }, await MapTrackerToDto(tracker));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TrackerDto>> UpdateTracker(int id, UpdateTrackerDto dto)
    {
        var tracker = await _db.Trackers.FindAsync(id);
        if (tracker == null) return NotFound();

        if (dto.Name != null) tracker.Name = dto.Name;
        if (dto.TrackFoil.HasValue) tracker.TrackFoil = dto.TrackFoil.Value;
        if (dto.TrackNonFoil.HasValue) tracker.TrackNonFoil = dto.TrackNonFoil.Value;
        if (dto.IsCollecting.HasValue) tracker.IsCollecting = dto.IsCollecting.Value;
        if (dto.IsPinned.HasValue) tracker.IsPinned = dto.IsPinned.Value;

        await _db.SaveChangesAsync();
        return Ok(await MapTrackerToDto(tracker));
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteTracker(int id)
    {
        var tracker = await _db.Trackers.FindAsync(id);
        if (tracker == null) return NotFound();

        _db.Trackers.Remove(tracker);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/cards")]
    public async Task<ActionResult<List<TrackerCardDto>>> GetTrackerCards(int id)
    {
        var tracker = await _db.Trackers.FindAsync(id);
        if (tracker == null) return NotFound();

        var trackerCards = await _db.TrackerCards
            .Where(tc => tc.TrackerId == id)
            .Include(tc => tc.Card)
            .ToListAsync();

        var cardIds = trackerCards.Select(tc => tc.CardId).ToList();
        var collectionEntries = await _db.CollectionEntries
            .Where(ce => cardIds.Contains(ce.CardId))
            .ToListAsync();

        var result = trackerCards.Select(tc =>
        {
            var owned = collectionEntries.Where(ce => ce.CardId == tc.CardId);
            var ownedQty = owned.Count(ce => !ce.IsFoil);
            var ownedFoilQty = owned.Count(ce => ce.IsFoil);

            return new TrackerCardDto
            {
                Id = tc.Id,
                CardId = tc.CardId,
                ScryfallId = tc.Card.ScryfallId,
                CardName = tc.Card.Name,
                SetCode = tc.Card.SetCode,
                SetName = tc.Card.SetName,
                CollectorNumber = tc.Card.CollectorNumber,
                Rarity = tc.Card.Rarity,
                ImageUri = tc.Card.ImageUri,
                ImageUriSmall = tc.Card.ImageUriSmall,
                IsExcluded = tc.IsExcluded,
                OwnedQuantity = ownedQty,
                OwnedFoilQuantity = ownedFoilQty,
                IsCollected = ownedQty > 0,
                IsFoilCollected = ownedFoilQty > 0
            };
        }).ToList();

        return Ok(result);
    }

    [HttpPost("{id}/cards")]
    public async Task<ActionResult> AddTrackerCard(int id, AddTrackerCardDto dto)
    {
        var tracker = await _db.Trackers.FindAsync(id);
        if (tracker == null) return NotFound();

        Card? card = null;

        // If CardId provided, use it directly
        if (dto.CardId.HasValue)
        {
            card = await _db.Cards.FindAsync(dto.CardId.Value);
        }
        // If ScryfallId provided, try to find or import the card
        else if (!string.IsNullOrEmpty(dto.ScryfallId))
        {
            card = await _db.Cards.FirstOrDefaultAsync(c => c.ScryfallId == dto.ScryfallId);
            if (card == null)
            {
                try
                {
                    // Search for the card to get its set
                    var searchResult = await _scryfallService.SearchCardsAsync($"id:{dto.ScryfallId}");
                    var scryfallCard = searchResult.Cards.FirstOrDefault();
                    if (scryfallCard == null)
                    {
                        return BadRequest("Card not found in Scryfall");
                    }
                    // Import the set
                    await _scryfallService.ImportSetCardsToDbAsync(scryfallCard.Set);
                    // Now get the card
                    card = await _db.Cards.FirstOrDefaultAsync(c => c.ScryfallId == dto.ScryfallId);
                }
                catch
                {
                    return BadRequest("Could not import card from Scryfall");
                }
            }
        }
        else
        {
            return BadRequest("Either CardId or ScryfallId must be provided");
        }

        if (card == null) return BadRequest("Card not found");

        var exists = await _db.TrackerCards.AnyAsync(tc => tc.TrackerId == id && tc.CardId == card.Id);
        if (exists) return Conflict("Card already in tracker");

        _db.TrackerCards.Add(new TrackerCard
        {
            TrackerId = id,
            CardId = card.Id,
            IsExcluded = false
        });

        await _db.SaveChangesAsync();
        return Ok();
    }

    [HttpDelete("{id}/cards/{cardId}")]
    public async Task<ActionResult> RemoveTrackerCard(int id, int cardId)
    {
        var tc = await _db.TrackerCards.FirstOrDefaultAsync(tc => tc.TrackerId == id && tc.CardId == cardId);
        if (tc == null) return NotFound();

        _db.TrackerCards.Remove(tc);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id}/cards/{cardId}/exclude")]
    public async Task<ActionResult> ToggleExclude(int id, int cardId)
    {
        var tc = await _db.TrackerCards.FirstOrDefaultAsync(tc => tc.TrackerId == id && tc.CardId == cardId);
        if (tc == null) return NotFound();

        tc.IsExcluded = !tc.IsExcluded;
        await _db.SaveChangesAsync();
        return Ok(new { tc.IsExcluded });
    }

    [HttpPost("{id}/export")]
    public async Task<ActionResult> ExportMissing(int id)
    {
        var tracker = await _db.Trackers
            .Include(t => t.TrackerCards)
                .ThenInclude(tc => tc.Card)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (tracker == null) return NotFound();

        var cardIds = tracker.TrackerCards
            .Where(tc => !tc.IsExcluded)
            .Select(tc => tc.CardId)
            .ToList();

        var collectionEntries = await _db.CollectionEntries
            .Where(ce => cardIds.Contains(ce.CardId))
            .ToListAsync();

        var lines = new List<string>();

        foreach (var tc in tracker.TrackerCards.Where(tc => !tc.IsExcluded))
        {
            var owned = collectionEntries
                .Any(ce => ce.CardId == tc.CardId && !ce.IsFoil);

            if (!owned)
            {
                // Format: {Quantity} {CardName} ({Version}) ({SetName})
                var version = $"V.{tc.Card.CollectorNumber}";
                lines.Add($"1 {tc.Card.Name} ({version}) ({tc.Card.SetName})");
            }
        }

        var content = string.Join("\n", lines);
        return Content(content, "text/plain");
    }

    private async Task<TrackerDto> MapTrackerToDto(Tracker tracker)
    {
        var trackerCards = await _db.TrackerCards
            .Where(tc => tc.TrackerId == tracker.Id && !tc.IsExcluded)
            .ToListAsync();

        var totalCards = trackerCards.Count;
        var cardIds = trackerCards.Select(tc => tc.CardId).ToList();

        var collectionEntries = await _db.CollectionEntries
            .Where(ce => cardIds.Contains(ce.CardId))
            .ToListAsync();

        var collectedNonFoil = cardIds.Count(cid =>
            collectionEntries.Any(ce => ce.CardId == cid && !ce.IsFoil));
        var collectedFoil = cardIds.Count(cid =>
            collectionEntries.Any(ce => ce.CardId == cid && ce.IsFoil));

        var collectedAny = cardIds.Count(cid =>
            collectionEntries.Any(ce => ce.CardId == cid));

        // When tracking both foil + non-foil, total needed doubles
        var tracksBoth = tracker.TrackFoil && tracker.TrackNonFoil;
        var overallTotal = tracksBoth ? totalCards * 2 : totalCards;
        var overallCollected = tracksBoth ? collectedNonFoil + collectedFoil : collectedAny;

        return new TrackerDto
        {
            Id = tracker.Id,
            Name = tracker.Name,
            SetCode = tracker.SetCode,
            TrackFoil = tracker.TrackFoil,
            TrackNonFoil = tracker.TrackNonFoil,
            IsCollecting = tracker.IsCollecting,
            IsPinned = tracker.IsPinned,
            CreatedAt = tracker.CreatedAt,
            TotalCards = totalCards,
            CollectedCards = overallCollected,
            CompletionPercentage = overallTotal > 0 ? Math.Round((double)overallCollected / overallTotal * 100, 1) : 0,
            NonFoilCompletionPercentage = totalCards > 0 ? Math.Round((double)collectedNonFoil / totalCards * 100, 1) : 0,
            FoilCompletionPercentage = totalCards > 0 ? Math.Round((double)collectedFoil / totalCards * 100, 1) : 0,
        };
    }
}
