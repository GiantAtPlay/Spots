using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Spots.Api.Migrations
{
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
}
