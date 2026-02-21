using Microsoft.EntityFrameworkCore;
using Spots.Api.Models;

namespace Spots.Api.Data;

public class SpotsDbContext : DbContext
{
    public SpotsDbContext(DbContextOptions<SpotsDbContext> options) : base(options) { }

    public DbSet<Card> Cards => Set<Card>();
    public DbSet<CardPrice> CardPrices => Set<CardPrice>();
    public DbSet<Spot> Spots => Set<Spot>();
    public DbSet<Tracker> Trackers => Set<Tracker>();
    public DbSet<TrackerCard> TrackerCards => Set<TrackerCard>();
    public DbSet<CollectionEntry> CollectionEntries => Set<CollectionEntry>();
    public DbSet<SyncSettings> SyncSettings => Set<SyncSettings>();
    public DbSet<UserSettings> UserSettings => Set<UserSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Card
        modelBuilder.Entity<Card>(entity =>
        {
            entity.HasIndex(c => c.ScryfallId).IsUnique();
            entity.HasIndex(c => new { c.SetCode, c.CollectorNumber });
            entity.HasIndex(c => c.Name);
        });

        // CardPrice
        modelBuilder.Entity<CardPrice>(entity =>
        {
            entity.HasOne(cp => cp.Card)
                .WithMany(c => c.Prices)
                .HasForeignKey(cp => cp.CardId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Spot - self-referential hierarchy
        modelBuilder.Entity<Spot>(entity =>
        {
            entity.HasOne(s => s.ParentSpot)
                .WithMany(s => s.ChildSpots)
                .HasForeignKey(s => s.ParentSpotId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TrackerCard
        modelBuilder.Entity<TrackerCard>(entity =>
        {
            entity.HasIndex(tc => new { tc.TrackerId, tc.CardId }).IsUnique();

            entity.HasOne(tc => tc.Tracker)
                .WithMany(t => t.TrackerCards)
                .HasForeignKey(tc => tc.TrackerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(tc => tc.Card)
                .WithMany(c => c.TrackerCards)
                .HasForeignKey(tc => tc.CardId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // CollectionEntry
        modelBuilder.Entity<CollectionEntry>(entity =>
        {
            entity.HasIndex(ce => new { ce.CardId, ce.IsFoil, ce.SpotId });

            entity.HasOne(ce => ce.Card)
                .WithMany(c => c.CollectionEntries)
                .HasForeignKey(ce => ce.CardId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ce => ce.Spot)
                .WithMany(s => s.CollectionEntries)
                .HasForeignKey(ce => ce.SpotId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Seed default settings
        modelBuilder.Entity<SyncSettings>().HasData(new SyncSettings
        {
            Id = 1,
            CardSyncSchedule = "daily",
            PriceSyncSchedule = "weekly",
            CardSyncRecentMonths = 3
        });

        modelBuilder.Entity<UserSettings>().HasData(new UserSettings
        {
            Id = 1,
            DarkMode = true,
            DefaultViewMode = "visual",
            InitialSetupComplete = false,
            GridColumns = 5
        });
    }
}
