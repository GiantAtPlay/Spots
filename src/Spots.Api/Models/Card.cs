namespace Spots.Api.Models;

public class Card
{
    public int Id { get; set; }
    public string ScryfallId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string SetCode { get; set; } = string.Empty;
    public string SetName { get; set; } = string.Empty;
    public string CollectorNumber { get; set; } = string.Empty;
    public string Rarity { get; set; } = string.Empty;
    public string? TypeLine { get; set; }
    public string? ManaCost { get; set; }
    public string? OracleText { get; set; }
    public string? ImageUri { get; set; }
    public string? ImageUriSmall { get; set; }
    public string? ImageUriArtCrop { get; set; }
    public string Language { get; set; } = "en";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<CardPrice> Prices { get; set; } = new List<CardPrice>();
    public ICollection<CollectionEntry> CollectionEntries { get; set; } = new List<CollectionEntry>();
    public ICollection<TrackerCard> TrackerCards { get; set; } = new List<TrackerCard>();
}
