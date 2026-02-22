using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Spots.Api.Data;

#nullable disable

namespace Spots.Api.Migrations;

[DbContext(typeof(SpotsDbContext))]
[Migration("20260222000000_InitialCreate")]
partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Cards",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                ScryfallId = table.Column<string>(type: "TEXT", nullable: false),
                Name = table.Column<string>(type: "TEXT", nullable: false),
                SetCode = table.Column<string>(type: "TEXT", nullable: false),
                SetName = table.Column<string>(type: "TEXT", nullable: false),
                CollectorNumber = table.Column<string>(type: "TEXT", nullable: false),
                Rarity = table.Column<string>(type: "TEXT", nullable: false),
                TypeLine = table.Column<string>(type: "TEXT", nullable: true),
                ManaCost = table.Column<string>(type: "TEXT", nullable: true),
                OracleText = table.Column<string>(type: "TEXT", nullable: true),
                ImageUri = table.Column<string>(type: "TEXT", nullable: true),
                ImageUriSmall = table.Column<string>(type: "TEXT", nullable: true),
                ImageUriArtCrop = table.Column<string>(type: "TEXT", nullable: true),
                Language = table.Column<string>(type: "TEXT", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Cards", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Spots",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                Name = table.Column<string>(type: "TEXT", nullable: false),
                Type = table.Column<string>(type: "TEXT", nullable: false),
                ParentSpotId = table.Column<int>(type: "INTEGER", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Spots", x => x.Id);
                table.ForeignKey(
                    name: "FK_Spots_Spots_ParentSpotId",
                    column: x => x.ParentSpotId,
                    principalTable: "Spots",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "SyncSettings",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                CardSyncSchedule = table.Column<string>(type: "TEXT", nullable: false),
                PriceSyncSchedule = table.Column<string>(type: "TEXT", nullable: false),
                CardSyncRecentMonths = table.Column<int>(type: "INTEGER", nullable: false),
                LastCardSync = table.Column<DateTime>(type: "TEXT", nullable: true),
                LastPriceSync = table.Column<DateTime>(type: "TEXT", nullable: true),
                IsSyncing = table.Column<bool>(type: "INTEGER", nullable: false),
                SyncStatus = table.Column<string>(type: "TEXT", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SyncSettings", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "Trackers",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                Name = table.Column<string>(type: "TEXT", nullable: false),
                SetCode = table.Column<string>(type: "TEXT", nullable: true),
                TrackFoil = table.Column<bool>(type: "INTEGER", nullable: false),
                TrackNonFoil = table.Column<bool>(type: "INTEGER", nullable: false),
                IsCollecting = table.Column<bool>(type: "INTEGER", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Trackers", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "UserSettings",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                DarkMode = table.Column<bool>(type: "INTEGER", nullable: false),
                DefaultViewMode = table.Column<string>(type: "TEXT", nullable: false),
                InitialSetupComplete = table.Column<bool>(type: "INTEGER", nullable: false),
                GridColumns = table.Column<int>(type: "INTEGER", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserSettings", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "CardPrices",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                CardId = table.Column<int>(type: "INTEGER", nullable: false),
                Eur = table.Column<decimal>(type: "TEXT", nullable: true),
                EurFoil = table.Column<decimal>(type: "TEXT", nullable: true),
                Usd = table.Column<decimal>(type: "TEXT", nullable: true),
                UsdFoil = table.Column<decimal>(type: "TEXT", nullable: true),
                Tix = table.Column<decimal>(type: "TEXT", nullable: true),
                TixFoil = table.Column<decimal>(type: "TEXT", nullable: true),
                UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CardPrices", x => x.Id);
                table.ForeignKey(
                    name: "FK_CardPrices_Cards_CardId",
                    column: x => x.CardId,
                    principalTable: "Cards",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "CollectionEntries",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                CardId = table.Column<int>(type: "INTEGER", nullable: false),
                IsFoil = table.Column<bool>(type: "INTEGER", nullable: false),
                SpotId = table.Column<int>(type: "INTEGER", nullable: true),
                ForTrade = table.Column<bool>(type: "INTEGER", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CollectionEntries", x => x.Id);
                table.ForeignKey(
                    name: "FK_CollectionEntries_Cards_CardId",
                    column: x => x.CardId,
                    principalTable: "Cards",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_CollectionEntries_Spots_SpotId",
                    column: x => x.SpotId,
                    principalTable: "Spots",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.SetNull);
            });

        migrationBuilder.CreateTable(
            name: "TrackerCards",
            columns: table => new
            {
                Id = table.Column<int>(type: "INTEGER", nullable: false)
                    .Annotation("Sqlite:Autoincrement", true),
                TrackerId = table.Column<int>(type: "INTEGER", nullable: false),
                CardId = table.Column<int>(type: "INTEGER", nullable: false),
                IsExcluded = table.Column<bool>(type: "INTEGER", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_TrackerCards", x => x.Id);
                table.ForeignKey(
                    name: "FK_TrackerCards_Cards_CardId",
                    column: x => x.CardId,
                    principalTable: "Cards",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_TrackerCards_Trackers_TrackerId",
                    column: x => x.TrackerId,
                    principalTable: "Trackers",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CardPrices_CardId",
            table: "CardPrices",
            column: "CardId");

        migrationBuilder.CreateIndex(
            name: "IX_Cards_Name",
            table: "Cards",
            column: "Name");

        migrationBuilder.CreateIndex(
            name: "IX_Cards_ScryptheId",
            table: "Cards",
            column: "ScryfallId",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_Cards_SetCode_CollectorNumber",
            table: "Cards",
            columns: new[] { "SetCode", "CollectorNumber" });

        migrationBuilder.CreateIndex(
            name: "IX_CollectionEntries_CardId_IsFoil_SpotId",
            table: "CollectionEntries",
            columns: new[] { "CardId", "IsFoil", "SpotId" });

        migrationBuilder.CreateIndex(
            name: "IX_Spots_ParentSpotId",
            table: "Spots",
            column: "ParentSpotId");

        migrationBuilder.CreateIndex(
            name: "IX_TrackerCards_TrackerId_CardId",
            table: "TrackerCards",
            columns: new[] { "TrackerId", "CardId" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "CardPrices");

        migrationBuilder.DropTable(
            name: "CollectionEntries");

        migrationBuilder.DropTable(
            name: "SyncSettings");

        migrationBuilder.DropTable(
            name: "TrackerCards");

        migrationBuilder.DropTable(
            name: "UserSettings");

        migrationBuilder.DropTable(
            name: "Spots");

        migrationBuilder.DropTable(
            name: "Trackers");

        migrationBuilder.DropTable(
            name: "Cards");
    }
}
