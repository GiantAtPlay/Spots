using System.Text.Json.Serialization;

namespace Spots.Api.DTOs;

// --- Scryfall API response types ---

public class ScryfallListResponse<T>
{
    [JsonPropertyName("data")]
    public List<T> Data { get; set; } = new();
}

public class ScryfallSearchResponse
{
    [JsonPropertyName("data")]
    public List<ScryfallCardDto> Data { get; set; } = new();

    [JsonPropertyName("has_more")]
    public bool HasMore { get; set; }

    [JsonPropertyName("next_page")]
    public string? NextPage { get; set; }

    [JsonPropertyName("total_cards")]
    public int TotalCards { get; set; }
}

public class ScryfallAutocompleteResponse
{
    [JsonPropertyName("data")]
    public List<string> Data { get; set; } = new();
}

public class ScryfallSetDto
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("code")]
    public string? Code { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("set_type")]
    public string? SetType { get; set; }

    [JsonPropertyName("released_at")]
    public string? ReleasedAt { get; set; }

    [JsonPropertyName("card_count")]
    public int CardCount { get; set; }

    [JsonPropertyName("icon_svg_uri")]
    public string? IconSvgUri { get; set; }

    [JsonPropertyName("digital")]
    public bool Digital { get; set; }
}

public class ScryfallCardDto
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("set")]
    public string? Set { get; set; }

    [JsonPropertyName("set_name")]
    public string? SetName { get; set; }

    [JsonPropertyName("collector_number")]
    public string? CollectorNumber { get; set; }

    [JsonPropertyName("rarity")]
    public string? Rarity { get; set; }

    [JsonPropertyName("type_line")]
    public string? TypeLine { get; set; }

    [JsonPropertyName("mana_cost")]
    public string? ManaCost { get; set; }

    [JsonPropertyName("oracle_text")]
    public string? OracleText { get; set; }

    [JsonPropertyName("lang")]
    public string? Lang { get; set; }

    [JsonPropertyName("image_uris")]
    public ScryfallImageUris? ImageUris { get; set; }

    [JsonPropertyName("card_faces")]
    public List<ScryfallCardFace>? CardFaces { get; set; }

    [JsonPropertyName("prices")]
    public ScryfallPrices? Prices { get; set; }
}

public class ScryfallCardFace
{
    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("image_uris")]
    public ScryfallImageUris? ImageUris { get; set; }
}

public class ScryfallImageUris
{
    [JsonPropertyName("small")]
    public string? Small { get; set; }

    [JsonPropertyName("normal")]
    public string? Normal { get; set; }

    [JsonPropertyName("large")]
    public string? Large { get; set; }

    [JsonPropertyName("art_crop")]
    public string? ArtCrop { get; set; }
}

public class ScryfallPrices
{
    [JsonPropertyName("eur")]
    public string? Eur { get; set; }

    [JsonPropertyName("eur_foil")]
    public string? EurFoil { get; set; }
}

// --- Our API response types ---

public class ScryfallSearchResultDto
{
    public List<ScryfallCardDto> Cards { get; set; } = new();
    public int TotalCards { get; set; }
    public bool HasMore { get; set; }
}
