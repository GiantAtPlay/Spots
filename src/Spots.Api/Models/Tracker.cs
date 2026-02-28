namespace Spots.Api.Models;

public class Tracker
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? SetCode { get; set; } // Null for custom trackers
    public bool TrackFoil { get; set; }
    public bool TrackNonFoil { get; set; } = true;
    public bool IsCollecting { get; set; } = true;
    public bool IsPinned { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<TrackerCard> TrackerCards { get; set; } = new List<TrackerCard>();
}
