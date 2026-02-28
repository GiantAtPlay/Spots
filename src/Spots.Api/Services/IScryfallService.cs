using Spots.Api.DTOs;

namespace Spots.Api.Services;

public interface IScryfallService
{
    Task<List<ScryfallSetDto>> GetSetsAsync();
    Task<ScryfallSetDto?> GetSetAsync(string code);
    Task<List<ScryfallCardDto>> GetSetCardsAsync(string setCode);
    Task<ScryfallCardDto?> GetCardByIdAsync(string scryfallId);
    Task<ScryfallSearchResultDto> SearchCardsAsync(string query, int page = 1);
    Task<List<string>> AutocompleteAsync(string query);
    Task ImportSetCardsToDbAsync(string setCode);
    Task SyncRecentSetsAsync(int months = 3);
    Task SyncPricesAsync();
}
