using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Spots.Api.Data;

#nullable disable

namespace Spots.Api.Migrations;

[DbContext(typeof(SpotsDbContext))]
partial class SpotsDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder.HasAnnotation("ProductVersion", "8.0.11");

        modelBuilder.Entity("Spots.Api.Models.Card", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<string>("CollectorNumber")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<string>("ImageUri")
                    .HasColumnType("TEXT");

                b.Property<string>("ImageUriArtCrop")
                    .HasColumnType("TEXT");

                b.Property<string>("ImageUriSmall")
                    .HasColumnType("TEXT");

                b.Property<string>("Language")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<string>("ManaCost")
                    .HasColumnType("TEXT");

                b.Property<string>("Name")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<string>("OracleText")
                    .HasColumnType("TEXT");

                b.Property<string>("Rarity")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<string>("ScryfallId")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<string>("SetCode")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<string>("SetName")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<string>("TypeLine")
                    .HasColumnType("TEXT");

                b.Property<DateTime>("UpdatedAt")
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.HasIndex("Name");

                b.HasIndex("ScryfallId")
                    .IsUnique();

                b.HasIndex("SetCode", "CollectorNumber");

                b.ToTable("Cards");
            });

        modelBuilder.Entity("Spots.Api.Models.CardPrice", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<int>("CardId")
                    .HasColumnType("INTEGER");

                b.Property<decimal?>("Eur")
                    .HasColumnType("TEXT");

                b.Property<decimal?>("EurFoil")
                    .HasColumnType("TEXT");

                b.Property<decimal?>("Tix")
                    .HasColumnType("TEXT");

                b.Property<decimal?>("TixFoil")
                    .HasColumnType("TEXT");

                b.Property<decimal?>("Usd")
                    .HasColumnType("TEXT");

                b.Property<decimal?>("UsdFoil")
                    .HasColumnType("TEXT");

                b.Property<DateTime>("UpdatedAt")
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.HasIndex("CardId");

                b.ToTable("CardPrices");
            });

        modelBuilder.Entity("Spots.Api.Models.CollectionEntry", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<int>("CardId")
                    .HasColumnType("INTEGER");

                b.Property<bool>("ForTrade")
                    .HasColumnType("INTEGER");

                b.Property<bool>("IsFoil")
                    .HasColumnType("INTEGER");

                b.Property<int?>("SpotId")
                    .HasColumnType("INTEGER");

                b.HasKey("Id");

                b.HasIndex("SpotId");

                b.HasIndex("CardId", "IsFoil", "SpotId");

                b.ToTable("CollectionEntries");
            });

        modelBuilder.Entity("Spots.Api.Models.Spot", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<string>("Name")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<int?>("ParentSpotId")
                    .HasColumnType("INTEGER");

                b.Property<string>("Type")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<int>("UserId")
                    .HasColumnType("INTEGER");

                b.HasKey("Id");

                b.HasIndex("ParentSpotId");

                b.ToTable("Spots");
            });

        modelBuilder.Entity("Spots.Api.Models.SyncSettings", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<int>("CardSyncRecentMonths")
                    .HasColumnType("INTEGER");

                b.Property<string>("CardSyncSchedule")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<bool>("IsSyncing")
                    .HasColumnType("INTEGER");

                b.Property<DateTime?>("LastCardSync")
                    .HasColumnType("TEXT");

                b.Property<DateTime?>("LastPriceSync")
                    .HasColumnType("TEXT");

                b.Property<string>("PriceSyncSchedule")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<string>("SyncStatus")
                    .HasColumnType("TEXT");

                b.HasKey("Id");

                b.ToTable("SyncSettings");
            });

        modelBuilder.Entity("Spots.Api.Models.Tracker", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<DateTime>("CreatedAt")
                    .HasColumnType("TEXT");

                b.Property<bool>("IsCollecting")
                    .HasColumnType("INTEGER");

                b.Property<string>("Name")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<string>("SetCode")
                    .HasColumnType("TEXT");

                b.Property<bool>("TrackFoil")
                    .HasColumnType("INTEGER");

                b.Property<bool>("TrackNonFoil")
                    .HasColumnType("INTEGER");

                b.HasKey("Id");

                b.ToTable("Trackers");
            });

        modelBuilder.Entity("Spots.Api.Models.TrackerCard", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<int>("CardId")
                    .HasColumnType("INTEGER");

                b.Property<bool>("IsExcluded")
                    .HasColumnType("INTEGER");

                b.Property<int>("TrackerId")
                    .HasColumnType("INTEGER");

                b.HasKey("Id");

                b.HasIndex("CardId");

                b.HasIndex("TrackerId", "CardId")
                    .IsUnique();

                b.ToTable("TrackerCards");
            });

        modelBuilder.Entity("Spots.Api.Models.UserSettings", b =>
            {
                b.Property<int>("Id")
                    .ValueGeneratedOnAdd()
                    .HasColumnType("INTEGER");

                b.Property<bool>("DarkMode")
                    .HasColumnType("INTEGER");

                b.Property<string>("DefaultViewMode")
                    .IsRequired()
                    .HasColumnType("TEXT");

                b.Property<int>("GridColumns")
                    .HasColumnType("INTEGER");

                b.Property<bool>("InitialSetupComplete")
                    .HasColumnType("INTEGER");

                b.HasKey("Id");

                b.ToTable("UserSettings");
            });

        modelBuilder.Entity("Spots.Api.Models.CardPrice", b =>
            {
                b.HasOne("Spots.Api.Models.Card", "Card")
                    .WithMany("Prices")
                    .HasForeignKey("CardId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();

                b.Navigation("Card");
            });

        modelBuilder.Entity("Spots.Api.Models.CollectionEntry", b =>
            {
                b.HasOne("Spots.Api.Models.Card", "Card")
                    .WithMany("CollectionEntries")
                    .HasForeignKey("CardId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();

                b.HasOne("Spots.Api.Models.Spot", "Spot")
                    .WithMany("CollectionEntries")
                    .HasForeignKey("SpotId")
                    .OnDelete(DeleteBehavior.SetNull);

                b.Navigation("Card");

                b.Navigation("Spot");
            });

        modelBuilder.Entity("Spots.Api.Models.Spot", b =>
            {
                b.HasOne("Spots.Api.Models.Spot", "ParentSpot")
                    .WithMany("ChildSpots")
                    .HasForeignKey("ParentSpotId")
                    .OnDelete(DeleteBehavior.Restrict);

                b.Navigation("ParentSpot");
            });

        modelBuilder.Entity("Spots.Api.Models.TrackerCard", b =>
            {
                b.HasOne("Spots.Api.Models.Card", "Card")
                    .WithMany("TrackerCards")
                    .HasForeignKey("CardId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();

                b.HasOne("Spots.Api.Models.Tracker", "Tracker")
                    .WithMany("TrackerCards")
                    .HasForeignKey("TrackerId")
                    .OnDelete(DeleteBehavior.Cascade)
                    .IsRequired();

                b.Navigation("Card");

                b.Navigation("Tracker");
            });

        modelBuilder.Entity("Spots.Api.Models.Card", b =>
            {
                b.Navigation("CollectionEntries");

                b.Navigation("Prices");

                b.Navigation("TrackerCards");
            });

        modelBuilder.Entity("Spots.Api.Models.Spot", b =>
            {
                b.Navigation("ChildSpots");

                b.Navigation("CollectionEntries");
            });

        modelBuilder.Entity("Spots.Api.Models.Tracker", b =>
            {
                b.Navigation("TrackerCards");
            });
#pragma warning restore 612, 618
    }
}
