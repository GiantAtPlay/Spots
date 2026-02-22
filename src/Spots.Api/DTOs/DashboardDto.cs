namespace Spots.Api.DTOs;

public class DashboardDto
{
    public int TotalCards { get; set; }
    public int UniqueCards { get; set; }
    public decimal ApproxValueEur { get; set; }
    public List<TrackerProgressDto> TrackerProgress { get; set; } = new();
    public List<NearCompleteItemDto> NearCompleteTrackers { get; set; } = new();
    public List<TopCardDto> TopExpensiveCards { get; set; } = new();
}

public class NearCompleteItemDto
{
    public int TrackerId { get; set; }
    public string TrackerName { get; set; } = string.Empty;
    public string? SetCode { get; set; }
    public bool IsFoil { get; set; }
    public double CompletionPercentage { get; set; }
    public int Collected { get; set; }
    public int Total { get; set; }
}

public class TopCardDto
{
    public int CardId { get; set; }
    public string CardName { get; set; } = string.Empty;
    public string SetName { get; set; } = string.Empty;
    public string SetCode { get; set; } = string.Empty;
    public bool IsFoil { get; set; }
    public decimal Price { get; set; }
}

public class TrackerProgressDto
{
    public int TrackerId { get; set; }
    public string TrackerName { get; set; } = string.Empty;
    public string? SetCode { get; set; }
    public bool TrackFoil { get; set; }
    public bool TrackNonFoil { get; set; }
    public double CompletionPercentage { get; set; }
    public double FoilCompletionPercentage { get; set; }
    public double NonFoilCompletionPercentage { get; set; }
    public int TotalCards { get; set; }
    public int CollectedCards { get; set; }
}
