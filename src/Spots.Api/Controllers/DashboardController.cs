using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spots.Api.Data;
using Spots.Api.DTOs;

namespace Spots.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly SpotsDbContext _db;

    public DashboardController(SpotsDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardDto>> GetDashboard()
    {
        // Total cards (each entry = 1 physical card)
        var totalCards = await _db.CollectionEntries.CountAsync();

        // Unique cards (distinct card IDs)
        var uniqueCards = await _db.CollectionEntries
            .Select(ce => ce.CardId)
            .Distinct()
            .CountAsync();

        // Approximate EUR value
        var entries = await _db.CollectionEntries
            .Include(ce => ce.Card)
                .ThenInclude(c => c.Prices)
            .ToListAsync();

        var totalValue = 0m;
        foreach (var entry in entries)
        {
            var latestPrice = entry.Card.Prices.OrderByDescending(p => p.UpdatedAt).FirstOrDefault();
            if (latestPrice != null)
            {
                if (entry.IsFoil && latestPrice.EurFoil.HasValue)
                    totalValue += latestPrice.EurFoil.Value;
                else if (latestPrice.Eur.HasValue)
                    totalValue += latestPrice.Eur.Value;
            }
        }

        // Tracker progress
        var trackers = await _db.Trackers
            .Where(t => t.IsCollecting)
            .Include(t => t.TrackerCards)
            .ToListAsync();

        var trackerProgress = new List<TrackerProgressDto>();
        var allCollectionEntries = await _db.CollectionEntries.ToListAsync();

        foreach (var tracker in trackers)
        {
            var activeCards = tracker.TrackerCards.Where(tc => !tc.IsExcluded).ToList();
            var total = activeCards.Count;
            if (total == 0) continue;

            var cardIds = activeCards.Select(tc => tc.CardId).ToList();
            var relevantEntries = allCollectionEntries.Where(ce => cardIds.Contains(ce.CardId)).ToList();

            var collectedNonFoil = cardIds.Count(cid =>
                relevantEntries.Any(ce => ce.CardId == cid && !ce.IsFoil));
            var collectedFoil = cardIds.Count(cid =>
                relevantEntries.Any(ce => ce.CardId == cid && ce.IsFoil));
            var collectedAny = cardIds.Count(cid =>
                relevantEntries.Any(ce => ce.CardId == cid));

            var tracksBoth = tracker.TrackFoil && tracker.TrackNonFoil;
            var overallTotal = tracksBoth ? total * 2 : total;
            var overallCollected = tracksBoth ? collectedNonFoil + collectedFoil : collectedAny;

            trackerProgress.Add(new TrackerProgressDto
            {
                TrackerId = tracker.Id,
                TrackerName = tracker.Name,
                SetCode = tracker.SetCode,
                TotalCards = total,
                CollectedCards = overallCollected,
                CompletionPercentage = overallTotal > 0 ? Math.Round((double)overallCollected / overallTotal * 100, 1) : 0,
                NonFoilCompletionPercentage = total > 0 ? Math.Round((double)collectedNonFoil / total * 100, 1) : 0,
                FoilCompletionPercentage = total > 0 ? Math.Round((double)collectedFoil / total * 100, 1) : 0
            });
        }

        // Top 10 nearest-to-complete (excluding fully complete)
        var nearComplete = trackerProgress
            .Where(t => t.CompletionPercentage < 100 && t.CompletionPercentage > 0)
            .OrderByDescending(t => t.CompletionPercentage)
            .Take(10)
            .ToList();

        return Ok(new DashboardDto
        {
            TotalCards = totalCards,
            UniqueCards = uniqueCards,
            ApproxValueEur = totalValue,
            TrackerProgress = trackerProgress,
            NearCompleteTrackers = nearComplete
        });
    }
}
