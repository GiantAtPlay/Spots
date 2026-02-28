using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Spots.Api.Data;
using Spots.Api.DTOs;
using Spots.Api.Models;

namespace Spots.Api.Services;

public class ScryfallService : IScryfallService
{
    private readonly HttpClient _httpClient;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ScryfallService> _logger;
    private static readonly SemaphoreSlim _rateLimiter = new(1, 1);
    private static DateTime _lastRequest = DateTime.MinValue;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    public ScryfallService(HttpClient httpClient, IServiceScopeFactory scopeFactory, ILogger<ScryfallService> logger)
    {
        _httpClient = httpClient;
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    private async Task RateLimitAsync()
    {
        await _rateLimiter.WaitAsync();
        try
        {
            var elapsed = DateTime.UtcNow - _lastRequest;
            if (elapsed.TotalMilliseconds < 75)
            {
                await Task.Delay(75 - (int)elapsed.TotalMilliseconds);
            }
            _lastRequest = DateTime.UtcNow;
        }
        finally
        {
            _rateLimiter.Release();
        }
    }

    public async Task<List<ScryfallSetDto>> GetSetsAsync()
    {
        await RateLimitAsync();
        var response = await _httpClient.GetAsync("sets");
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ScryfallListResponse<ScryfallSetDto>>(json, JsonOptions);
        return result?.Data ?? new List<ScryfallSetDto>();
    }

    public async Task<ScryfallSetDto?> GetSetAsync(string code)
    {
        await RateLimitAsync();
        var response = await _httpClient.GetAsync($"sets/{code}");
        if (!response.IsSuccessStatusCode) return null;
        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<ScryfallSetDto>(json, JsonOptions);
    }

    public async Task<List<ScryfallCardDto>> GetSetCardsAsync(string setCode)
    {
        var allCards = new List<ScryfallCardDto>();
        var url = $"cards/search?order=set&q=set%3A{setCode}&unique=prints";
        var hasMore = true;

        while (hasMore)
        {
            await RateLimitAsync();
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Failed to fetch cards for set {SetCode}: {Status}", setCode, response.StatusCode);
                break;
            }

            var json = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<ScryfallSearchResponse>(json, JsonOptions);

            if (result?.Data != null)
            {
                allCards.AddRange(result.Data);
            }

            hasMore = result?.HasMore ?? false;
            if (hasMore && result?.NextPage != null)
            {
                // NextPage is a full URL, extract the relative path
                var uri = new Uri(result.NextPage);
                url = uri.PathAndQuery.TrimStart('/');
            }
        }

        return allCards;
    }

    public async Task<ScryfallSearchResultDto> SearchCardsAsync(string query, int page = 1)
    {
        await RateLimitAsync();
        var response = await _httpClient.GetAsync($"cards/search?q={Uri.EscapeDataString(query)}&page={page}&unique=prints");

        if (!response.IsSuccessStatusCode)
        {
            return new ScryfallSearchResultDto { Cards = new List<ScryfallCardDto>(), TotalCards = 0, HasMore = false };
        }

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ScryfallSearchResponse>(json, JsonOptions);

        return new ScryfallSearchResultDto
        {
            Cards = result?.Data ?? new List<ScryfallCardDto>(),
            TotalCards = result?.TotalCards ?? 0,
            HasMore = result?.HasMore ?? false
        };
    }

    public async Task<List<string>> AutocompleteAsync(string query)
    {
        await RateLimitAsync();
        var response = await _httpClient.GetAsync($"cards/autocomplete?q={Uri.EscapeDataString(query)}");

        if (!response.IsSuccessStatusCode) return new List<string>();

        var json = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ScryfallAutocompleteResponse>(json, JsonOptions);
        return result?.Data ?? new List<string>();
    }

    public async Task<ScryfallCardDto?> GetCardByIdAsync(string scryfallId)
    {
        await RateLimitAsync();
        var response = await _httpClient.GetAsync($"cards/{scryfallId}");

        if (!response.IsSuccessStatusCode) return null;

        var json = await response.Content.ReadAsStringAsync();
        return JsonSerializer.Deserialize<ScryfallCardDto>(json, JsonOptions);
    }

    public async Task ImportSetCardsToDbAsync(string setCode)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SpotsDbContext>();

        var scryfallCards = await GetSetCardsAsync(setCode);
        _logger.LogInformation("Importing {Count} cards for set {SetCode}", scryfallCards.Count, setCode);

        foreach (var sc in scryfallCards)
        {
            var existing = await db.Cards.FirstOrDefaultAsync(c => c.ScryfallId == sc.Id);

            if (existing != null)
            {
                // Update existing card
                MapScryfallCardToEntity(sc, existing);
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Insert new card
                var card = new Card();
                MapScryfallCardToEntity(sc, card);
                card.UpdatedAt = DateTime.UtcNow;
                db.Cards.Add(card);
            }
        }

        await db.SaveChangesAsync();

        // Update prices
        foreach (var sc in scryfallCards)
        {
            var card = await db.Cards.FirstOrDefaultAsync(c => c.ScryfallId == sc.Id);
            if (card == null) continue;

            var existingPrice = await db.CardPrices
                .Where(p => p.CardId == card.Id)
                .OrderByDescending(p => p.UpdatedAt)
                .FirstOrDefaultAsync();

            decimal? eur = null;
            decimal? eurFoil = null;

            if (sc.Prices != null)
            {
                if (decimal.TryParse(sc.Prices.Eur, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var e))
                    eur = e;
                if (decimal.TryParse(sc.Prices.EurFoil, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var ef))
                    eurFoil = ef;
            }

            if (existingPrice != null)
            {
                existingPrice.Eur = eur;
                existingPrice.EurFoil = eurFoil;
                existingPrice.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                db.CardPrices.Add(new CardPrice
                {
                    CardId = card.Id,
                    Eur = eur,
                    EurFoil = eurFoil,
                    UpdatedAt = DateTime.UtcNow
                });
            }
        }

        await db.SaveChangesAsync();
        _logger.LogInformation("Finished importing set {SetCode}", setCode);
    }

    public async Task SyncRecentSetsAsync(int months = 3)
    {
        var sets = await GetSetsAsync();
        var cutoff = DateTime.UtcNow.AddMonths(-months);

        var recentSets = sets
            .Where(s => s.ReleasedAt != null
                && DateTime.TryParse(s.ReleasedAt, out var date)
                && date >= cutoff
                && (s.SetType == "core" || s.SetType == "expansion" || s.SetType == "draft_innovation"
                    || s.SetType == "masters" || s.SetType == "commander"))
            .ToList();

        _logger.LogInformation("Syncing {Count} recent sets", recentSets.Count);

        foreach (var set in recentSets)
        {
            try
            {
                await ImportSetCardsToDbAsync(set.Code!);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing set {SetCode}", set.Code);
            }
        }
    }

    public async Task SyncPricesAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<SpotsDbContext>();

        // Get distinct set codes from our card database
        var setCodes = await db.Cards
            .Select(c => c.SetCode)
            .Distinct()
            .ToListAsync();

        _logger.LogInformation("Syncing prices for {Count} sets", setCodes.Count);

        foreach (var setCode in setCodes)
        {
            try
            {
                await ImportSetCardsToDbAsync(setCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing prices for set {SetCode}", setCode);
            }
        }
    }

    private static void MapScryfallCardToEntity(ScryfallCardDto dto, Card card)
    {
        card.ScryfallId = dto.Id ?? string.Empty;
        card.Name = dto.Name ?? string.Empty;
        card.SetCode = dto.Set ?? string.Empty;
        card.SetName = dto.SetName ?? string.Empty;
        card.CollectorNumber = dto.CollectorNumber ?? string.Empty;
        card.Rarity = dto.Rarity ?? string.Empty;
        card.TypeLine = dto.TypeLine;
        card.ManaCost = dto.ManaCost;
        card.OracleText = dto.OracleText;
        card.Language = dto.Lang ?? "en";

        if (dto.ImageUris != null)
        {
            card.ImageUri = dto.ImageUris.Normal;
            card.ImageUriSmall = dto.ImageUris.Small;
            card.ImageUriArtCrop = dto.ImageUris.ArtCrop;
        }
        else if (dto.CardFaces?.Count > 0 && dto.CardFaces[0].ImageUris != null)
        {
            card.ImageUri = dto.CardFaces[0].ImageUris!.Normal;
            card.ImageUriSmall = dto.CardFaces[0].ImageUris!.Small;
            card.ImageUriArtCrop = dto.CardFaces[0].ImageUris!.ArtCrop;
        }
    }
}
