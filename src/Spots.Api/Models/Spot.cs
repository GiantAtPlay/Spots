namespace Spots.Api.Models;

public class Spot
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Other"; // Folder, Bulk box, Deck, Other
    public int? ParentSpotId { get; set; }
    public int UserId { get; set; } = 1; // Default user for now

    // Navigation
    public Spot? ParentSpot { get; set; }
    public ICollection<Spot> ChildSpots { get; set; } = new List<Spot>();
    public ICollection<CollectionEntry> CollectionEntries { get; set; } = new List<CollectionEntry>();
}
