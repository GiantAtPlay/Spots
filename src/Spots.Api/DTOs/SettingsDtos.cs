namespace Spots.Api.DTOs;

public class UserSettingsDto
{
    public bool DarkMode { get; set; }
    public string DefaultViewMode { get; set; } = "visual";
    public bool InitialSetupComplete { get; set; }
    public int GridColumns { get; set; } = 5;
}

public class UpdateUserSettingsDto
{
    public bool? DarkMode { get; set; }
    public string? DefaultViewMode { get; set; }
    public bool? InitialSetupComplete { get; set; }
    public int? GridColumns { get; set; }
}

public class SyncSettingsDto
{
    public string CardSyncSchedule { get; set; } = "daily";
    public string PriceSyncSchedule { get; set; } = "weekly";
    public int CardSyncRecentMonths { get; set; } = 3;
    public DateTime? LastCardSync { get; set; }
    public DateTime? LastPriceSync { get; set; }
    public bool IsSyncing { get; set; }
    public string? SyncStatus { get; set; }
}

public class UpdateSyncSettingsDto
{
    public string? CardSyncSchedule { get; set; }
    public string? PriceSyncSchedule { get; set; }
    public int? CardSyncRecentMonths { get; set; }
}

public class SyncStatusDto
{
    public bool IsSyncing { get; set; }
    public string? SyncStatus { get; set; }
    public DateTime? LastCardSync { get; set; }
    public DateTime? LastPriceSync { get; set; }
}
