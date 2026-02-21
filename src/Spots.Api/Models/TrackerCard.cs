namespace Spots.Api.Models;

public class TrackerCard
{
    public int Id { get; set; }
    public int TrackerId { get; set; }
    public int CardId { get; set; }
    public bool IsExcluded { get; set; }

    // Navigation
    public Tracker Tracker { get; set; } = null!;
    public Card Card { get; set; } = null!;
}
