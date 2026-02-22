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
                TrackFoil = tracker.TrackFoil,
                TrackNonFoil = tracker.TrackNonFoil,
                TotalCards = total,
                CollectedCards = overallCollected,
                CompletionPercentage = overallTotal > 0 ? Math.Round((double)overallCollected / overallTotal * 100, 1) : 0,
                NonFoilCompletionPercentage = total > 0 ? Math.Round((double)collectedNonFoil / total * 100, 1) : 0,
                FoilCompletionPercentage = total > 0 ? Math.Round((double)collectedFoil / total * 100, 1) : 0
            });
        }

        // Top 10 nearest-to-complete (excluding fully complete)
        // Split into separate entries for foil and non-foil
        var nearCompleteItems = new List<NearCompleteItemDto>();
        
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

            // Add non-foil entry if tracking non-foil
            if (tracker.TrackNonFoil)
            {
                var nonFoilPercent = total > 0 ? Math.Round((double)collectedNonFoil / total * 100, 1) : 0;
                if (nonFoilPercent < 100 && nonFoilPercent > 0)
                {
                    nearCompleteItems.Add(new NearCompleteItemDto
                    {
                        TrackerId = tracker.Id,
                        TrackerName = tracker.Name,
                        SetCode = tracker.SetCode,
                        IsFoil = false,
                        CompletionPercentage = nonFoilPercent,
                        Collected = collectedNonFoil,
                        Total = total
                    });
                }
            }

            // Add foil entry if tracking foil
            if (tracker.TrackFoil)
            {
                var foilPercent = total > 0 ? Math.Round((double)collectedFoil / total * 100, 1) : 0;
                if (foilPercent < 100 && foilPercent > 0)
                {
                    nearCompleteItems.Add(new NearCompleteItemDto
                    {
                        TrackerId = tracker.Id,
                        TrackerName = tracker.Name,
                        SetCode = tracker.SetCode,
                        IsFoil = true,
                        CompletionPercentage = foilPercent,
                        Collected = collectedFoil,
                        Total = total
                    });
                }
            }
        }

        var nearComplete = nearCompleteItems
            .OrderByDescending(n => n.CompletionPercentage)
            .Take(10)
            .ToList();

        // Top 10 most expensive cards
        var topExpensive = new List<TopCardDto>();
        var cardPrices = await _db.CardPrices
            .GroupBy(cp => cp.CardId)
            .Select(g => g.OrderByDescending(cp => cp.UpdatedAt).First())
            .ToListAsync();
        
        var cardDict = (await _db.Cards.ToListAsync()).ToDictionary(c => c.Id);

        // Get unique card+foil combinations from collection
        var collectionCards = allCollectionEntries
            .Select(ce => new { ce.CardId, ce.IsFoil })
            .Distinct()
            .ToList();

        foreach (var item in collectionCards)
        {
            if (!cardDict.TryGetValue(item.CardId, out var card)) continue;
            
            var priceRec = cardPrices.FirstOrDefault(cp => cp.CardId == item.CardId);
            decimal? price = null;
            if (item.IsFoil)
                price = priceRec?.EurFoil;
            else
                price = priceRec?.Eur;
            
            if (price == null || price <= 0) continue;

            topExpensive.Add(new TopCardDto
            {
                CardId = item.CardId,
                CardName = card.Name,
                SetName = card.SetName,
                SetCode = card.SetCode,
                IsFoil = item.IsFoil,
                Price = price.Value
            });
        }

        var topExpensiveCards = topExpensive
            .OrderByDescending(t => t.Price)
            .Take(10)
            .ToList();

        return Ok(new DashboardDto
        {
            TotalCards = totalCards,
            UniqueCards = uniqueCards,
            ApproxValueEur = totalValue,
            TrackerProgress = trackerProgress,
            NearCompleteTrackers = nearComplete,
            TopExpensiveCards = topExpensiveCards
        });
    }
}
