using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Spots.Api.Data;

#nullable disable

namespace Spots.Api.Migrations;

[DbContext(typeof(SpotsDbContext))]
[Migration("20260228120000_AddIsPinnedToTrackers")]
public partial class AddIsPinnedToTrackers : Migration
{
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPinned",
                table: "Trackers",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPinned",
                table: "Trackers");
        }
}
