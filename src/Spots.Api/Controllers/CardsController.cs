using Microsoft.AspNetCore.Mvc;
using Spots.Api.DTOs;
using Spots.Api.Services;

namespace Spots.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CardsController : ControllerBase
{
    private readonly IScryfallService _scryfallService;

    public CardsController(IScryfallService scryfallService)
    {
        _scryfallService = scryfallService;
    }

    [HttpGet("search")]
    public async Task<ActionResult<ScryfallSearchResultDto>> Search([FromQuery] string q, [FromQuery] int page = 1)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest("Query is required");

        var result = await _scryfallService.SearchCardsAsync(q, page);
        return Ok(result);
    }

    [HttpGet("autocomplete")]
    public async Task<ActionResult<List<string>>> Autocomplete([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(new List<string>());

        var result = await _scryfallService.AutocompleteAsync(q);
        return Ok(result);
    }
}
