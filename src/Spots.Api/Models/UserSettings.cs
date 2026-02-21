namespace Spots.Api.Models;

public class UserSettings
{
    public int Id { get; set; }
    public bool DarkMode { get; set; } = true;
    public string DefaultViewMode { get; set; } = "visual"; // "table" or "visual"
    public bool InitialSetupComplete { get; set; }
    public int GridColumns { get; set; } = 5;
}
