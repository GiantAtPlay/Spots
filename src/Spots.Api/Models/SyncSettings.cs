namespace Spots.Api.Models;

public class SyncSettings
{
    public int Id { get; set; }
    public string CardSyncSchedule { get; set; } = "daily"; // daily, weekly, manual
    public string PriceSyncSchedule { get; set; } = "weekly"; // daily, weekly, manual
    public int CardSyncRecentMonths { get; set; } = 3;
    public DateTime? LastCardSync { get; set; }
    public DateTime? LastPriceSync { get; set; }
    public bool IsSyncing { get; set; }
    public string? SyncStatus { get; set; } // Description of current sync activity
}
