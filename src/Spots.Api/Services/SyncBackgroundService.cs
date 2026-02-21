using Microsoft.EntityFrameworkCore;
using Spots.Api.Data;

namespace Spots.Api.Services;

public class SyncBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<SyncBackgroundService> _logger;
    private readonly SemaphoreSlim _triggerSync = new(0, 1);

    public void TriggerManualSync()
    {
        if (_triggerSync.CurrentCount == 0)
            _triggerSync.Release();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Sync background service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Wait for either the scheduled time or a manual trigger
                await Task.WhenAny(
                    _triggerSync.WaitAsync(stoppingToken),
                    Task.Delay(TimeSpan.FromHours(1), stoppingToken)
                );

                if (stoppingToken.IsCancellationRequested) break;

                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<SpotsDbContext>();
                var scryfallService = scope.ServiceProvider.GetRequiredService<IScryfallService>();

                var settings = await db.SyncSettings.FirstOrDefaultAsync(stoppingToken);
                if (settings == null) continue;

                // Check if card sync is needed
                var shouldSyncCards = ShouldSync(settings.CardSyncSchedule, settings.LastCardSync);
                var shouldSyncPrices = ShouldSync(settings.PriceSyncSchedule, settings.LastPriceSync);

                if (shouldSyncCards)
                {
                    settings.IsSyncing = true;
                    settings.SyncStatus = "Syncing card data...";
                    await db.SaveChangesAsync(stoppingToken);

                    await scryfallService.SyncRecentSetsAsync(settings.CardSyncRecentMonths);

                    settings.LastCardSync = DateTime.UtcNow;
                    settings.SyncStatus = null;
                    settings.IsSyncing = false;
                    await db.SaveChangesAsync(stoppingToken);
                }

                if (shouldSyncPrices)
                {
                    settings.IsSyncing = true;
                    settings.SyncStatus = "Syncing prices...";
                    await db.SaveChangesAsync(stoppingToken);

                    await scryfallService.SyncPricesAsync();

                    settings.LastPriceSync = DateTime.UtcNow;
                    settings.SyncStatus = null;
                    settings.IsSyncing = false;
                    await db.SaveChangesAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in sync background service");
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }

    private static bool ShouldSync(string schedule, DateTime? lastSync)
    {
        if (schedule == "manual") return false;
        if (lastSync == null) return true;

        return schedule switch
        {
            "daily" => DateTime.UtcNow - lastSync.Value > TimeSpan.FromDays(1),
            "weekly" => DateTime.UtcNow - lastSync.Value > TimeSpan.FromDays(7),
            _ => false
        };
    }

    public SyncBackgroundService(IServiceScopeFactory scopeFactory, ILogger<SyncBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }
}
