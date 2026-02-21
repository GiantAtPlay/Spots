namespace Spots.Api.DTOs;

public class SpotDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int? ParentSpotId { get; set; }
    public string? ParentSpotName { get; set; }
    public List<SpotDto> Children { get; set; } = new();
    public int CardCount { get; set; }
}

public class CreateSpotDto
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Other";
    public int? ParentSpotId { get; set; }
}

public class UpdateSpotDto
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public int? ParentSpotId { get; set; }
}
