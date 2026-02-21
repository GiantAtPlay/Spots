namespace Spots.Api.Models;

public class CardPrice
{
    public int Id { get; set; }
    public int CardId { get; set; }
    public decimal? Eur { get; set; }
    public decimal? EurFoil { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Card Card { get; set; } = null!;
}
