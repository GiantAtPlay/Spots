namespace Spots.Api.DTOs;

/// <summary>
/// A single physical card in the collection (one row = one physical card).
/// </summary>
public class CollectionEntryDto
{
    public int Id { get; set; }
    public int CardId { get; set; }
    public bool IsFoil { get; set; }
    public int? SpotId { get; set; }
    public string? SpotName { get; set; }
    public bool ForTrade { get; set; }
}

/// <summary>
/// Grouped view: all copies of a single card, consolidated for display.
/// </summary>
public class CollectionCardDto
{
    public int CardId { get; set; }
    public string CardName { get; set; } = string.Empty;
    public string SetCode { get; set; } = string.Empty;
    public string SetName { get; set; } = string.Empty;
    public string CollectorNumber { get; set; } = string.Empty;
    public string Rarity { get; set; } = string.Empty;
    public string? TypeLine { get; set; }
    public string? ManaCost { get; set; }
    public string? ImageUri { get; set; }
    public string? ImageUriSmall { get; set; }
    public string? ImageUriArtCrop { get; set; }
    public decimal? PriceEur { get; set; }
    public decimal? PriceEurFoil { get; set; }
    public int StandardCount { get; set; }
    public int FoilCount { get; set; }
    public List<CollectionEntryDto> Entries { get; set; } = new();
}

public class CreateCollectionEntryDto
{
    public int CardId { get; set; }
    public bool IsFoil { get; set; }
    public int? SpotId { get; set; }
    public bool ForTrade { get; set; }
}

public class UpdateCollectionEntryDto
{
    public int? SpotId { get; set; }
    public bool? ForTrade { get; set; }
}
