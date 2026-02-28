namespace Spots.Api.DTOs;

public class TrackerDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? SetCode { get; set; }
    public bool TrackFoil { get; set; }
    public bool TrackNonFoil { get; set; }
    public bool IsCollecting { get; set; }
    public bool IsPinned { get; set; }
    public DateTime CreatedAt { get; set; }
    public double CompletionPercentage { get; set; }
    public double FoilCompletionPercentage { get; set; }
    public double NonFoilCompletionPercentage { get; set; }
    public int TotalCards { get; set; }
    public int CollectedCards { get; set; }
}

public class CreateTrackerDto
{
    public string Name { get; set; } = string.Empty;
    public string? SetCode { get; set; }
    public bool TrackFoil { get; set; }
    public bool TrackNonFoil { get; set; } = true;
}

public class UpdateTrackerDto
{
    public string? Name { get; set; }
    public bool? TrackFoil { get; set; }
    public bool? TrackNonFoil { get; set; }
    public bool? IsCollecting { get; set; }
    public bool? IsPinned { get; set; }
}

public class TrackerCardDto
{
    public int Id { get; set; }
    public int CardId { get; set; }
    public string CardName { get; set; } = string.Empty;
    public string SetCode { get; set; } = string.Empty;
    public string SetName { get; set; } = string.Empty;
    public string CollectorNumber { get; set; } = string.Empty;
    public string Rarity { get; set; } = string.Empty;
    public string? ImageUri { get; set; }
    public string? ImageUriSmall { get; set; }
    public bool IsExcluded { get; set; }
    public int OwnedQuantity { get; set; }
    public int OwnedFoilQuantity { get; set; }
    public bool IsCollected { get; set; }
    public bool IsFoilCollected { get; set; }
}

public class AddTrackerCardDto
{
    public int CardId { get; set; }
}
