namespace Spots.Api.Models;

public class CollectionEntry
{
    public int Id { get; set; }
    public int CardId { get; set; }
    public bool IsFoil { get; set; }
    public int? SpotId { get; set; }
    public bool ForTrade { get; set; }

    // Navigation
    public Card Card { get; set; } = null!;
    public Spot? Spot { get; set; }
}
