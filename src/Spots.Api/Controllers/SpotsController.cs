using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Spots.Api.Data;
using Spots.Api.DTOs;
using Spots.Api.Models;

namespace Spots.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SpotsController : ControllerBase
{
    private readonly SpotsDbContext _db;

    public SpotsController(SpotsDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<SpotDto>>> GetSpots()
    {
        var spots = await _db.Spots
            .Include(s => s.ChildSpots)
            .Include(s => s.CollectionEntries)
            .ToListAsync();

        // Build hierarchical tree from root spots
        var rootSpots = spots.Where(s => s.ParentSpotId == null).ToList();
        var result = rootSpots.Select(s => MapToDto(s, spots)).ToList();
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SpotDto>> GetSpot(int id)
    {
        var allSpots = await _db.Spots
            .Include(s => s.ChildSpots)
            .Include(s => s.CollectionEntries)
            .Include(s => s.ParentSpot)
            .ToListAsync();

        var spot = allSpots.FirstOrDefault(s => s.Id == id);
        if (spot == null) return NotFound();

        var dto = MapToDto(spot, allSpots);
        dto.ParentSpotName = spot.ParentSpot?.Name;
        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<SpotDto>> CreateSpot(CreateSpotDto dto)
    {
        if (dto.ParentSpotId.HasValue)
        {
            var parent = await _db.Spots.FindAsync(dto.ParentSpotId.Value);
            if (parent == null) return BadRequest("Parent spot not found");
        }

        var spot = new Spot
        {
            Name = dto.Name,
            Type = dto.Type,
            ParentSpotId = dto.ParentSpotId
        };

        _db.Spots.Add(spot);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetSpot), new { id = spot.Id }, new SpotDto
        {
            Id = spot.Id,
            Name = spot.Name,
            Type = spot.Type,
            ParentSpotId = spot.ParentSpotId
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<SpotDto>> UpdateSpot(int id, UpdateSpotDto dto)
    {
        var spot = await _db.Spots.FindAsync(id);
        if (spot == null) return NotFound();

        if (dto.Name != null) spot.Name = dto.Name;
        if (dto.Type != null) spot.Type = dto.Type;
        if (dto.ParentSpotId.HasValue) spot.ParentSpotId = dto.ParentSpotId.Value;

        await _db.SaveChangesAsync();

        return Ok(new SpotDto
        {
            Id = spot.Id,
            Name = spot.Name,
            Type = spot.Type,
            ParentSpotId = spot.ParentSpotId
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteSpot(int id)
    {
        var spot = await _db.Spots
            .Include(s => s.ChildSpots)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (spot == null) return NotFound();

        if (spot.ChildSpots.Any())
            return BadRequest("Cannot delete spot with children. Delete children first.");

        _db.Spots.Remove(spot);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static SpotDto MapToDto(Spot spot, List<Spot> allSpots)
    {
        var children = allSpots.Where(s => s.ParentSpotId == spot.Id).ToList();

        return new SpotDto
        {
            Id = spot.Id,
            Name = spot.Name,
            Type = spot.Type,
            ParentSpotId = spot.ParentSpotId,
            CardCount = spot.CollectionEntries?.Count ?? 0,
            Children = children.Select(c => MapToDto(c, allSpots)).ToList()
        };
    }
}
