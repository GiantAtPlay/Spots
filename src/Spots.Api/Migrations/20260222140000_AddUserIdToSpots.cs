using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Spots.Api.Data;

#nullable disable

namespace Spots.Api.Migrations;

[DbContext(typeof(SpotsDbContext))]
[Migration("20260222140000_AddUserIdToSpots")]
public partial class AddUserIdToSpots : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "UserId",
            table: "Spots",
            type: "INTEGER",
            nullable: false,
            defaultValue: 1);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "UserId",
            table: "Spots");
    }
}
