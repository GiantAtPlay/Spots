Spots - MTG Collection Tracker Specification
1. Project Overview
Project Name: Spots  
Type: Single Docker container web application  
Purpose: Personal Magic: The Gathering collection tracker  
Target User: Single user initially, with future multi-user support planned  
Hosting: Local server, Docker container
2. Tech Stack
| Component | Technology |
|-----------|------------|
| Backend | ASP.NET Core 8 |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| Database | SQLite |
| ORM | Entity Framework Core 8 |
| Card Data API | Scryfall API |
3. Functional Requirements
3.1 Trackers
- Create trackers based on MTG sets (Core, Expansions) or custom empty trackers
- Each tracker tracks completion of a specific set of cards
- Option to track foil/non-foil separately per tracker
- Include/exclude specific cards from a tracker (for cards user doesn't want to collect)
- Mark entire sets as "not collecting"
- Progress shown as percentage complete
3.2 Collection
- Store owned physical cards
- Track quantity per card
- Separate tracking for foil vs non-foil versions
- Each card assigned to one spot (location)
- Optional "for trade" flag on any card
- Default language: English (schema supports future multi-language)
3.3 Spots (Locations)
- Hierarchical locations (e.g., Office → Shelf → Box)
- Unlimited nesting depth
- User-specific (not shared between users in future)
- Default spot types: Folder, Bulk box, Deck, Other (user-editable names)
3.4 Adding Cards
Two mechanisms:
1. Search: Search by card name → select variant/set/foil from results
2. Set Browser: Browse all cards in a set, +/- buttons to add/remove
3.5 Views
- Table Mode: List view with card details, mouseover for image
- Visual Mode: Card tile/grid view with artwork prominent
- User can switch between modes
- Default view mode stored in user settings
3.6 Dashboard
- Total cards in collection
- Total unique cards
- Approximate EUR value (using Cardmarket prices via Scryfall)
- Per-tracker completion percentage
- Top 10 nearest-to-complete trackers (excluding fully complete)
- Separate tracking for foil/non-foil completion
3.7 Sync
- Card Data Sync: Configurable schedule, updates recent sets (last 3 months by default)
- Price Sync: Weekly (configurable)
- Manual sync trigger available
- Scryfall rate limiting: 50-100ms delay between requests
3.8 Export
- Export missing cards from a tracker in Cardmarket "wants" format
- Format: {Quantity} {CardName} ({Version}) ({SetName})
- Example: 1 Y'shtola, Nights Blessed (V.2) (Commander: FINAL FANTASY: Extras)
- No FOIL indicator (quantity handles this)
3.9 Initial Setup
- On first run, user selects which sets to download
- Download selected sets, rest in background
- Indicator shows when background sync completes
3.10 UI/UX
- Light and dark mode support
- Toggle in navigation
- User preference persisted
- Simple design with card artwork as focus
- Clean, non-overwhelming interface
4. Database Schema
Tables:
- Cards (cached card data from Scryfall)
- CardPrices (EUR, EUR_Foil prices per card)
- Spots (locations, hierarchical)
- Trackers (user's collection goals)
- TrackerCards (cards in each tracker, with excluded flag)
- CollectionEntries (owned cards with quantity, spot, forTrade)
- SyncSettings (schedules, last sync times)
- UserSettings (darkMode, defaultViewMode)
Key Relationships
- Spot → Spot (self-referential for hierarchy)
- Tracker → TrackerCard (one-to-many)
- Card → CardPrices (one-to-many)
- Card → CollectionEntries (one-to-many)
- Card → TrackerCards (one-to-many)
5. API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/trackers | List/Create trackers |
| GET/PUT/DELETE | /api/trackers/{id} | CRUD single tracker |
| GET | /api/trackers/{id}/cards | Get cards in tracker |
| POST | /api/trackers/{id}/cards | Add card to tracker |
| DELETE | /api/trackers/{id}/cards/{cardId} | Remove card from tracker |
| POST | /api/trackers/{id}/cards/{cardId}/exclude | Toggle exclude status |
| POST | /api/trackers/{id}/export | Export missing cards |
| GET/POST/PUT/DELETE | /api/collection | Manage collection entries |
| POST | /api/collection/{id}/increment | Increase quantity |
| POST | /api/collection/{id}/decrement | Decrease quantity |
| GET | /api/collection/fortrade | Get cards marked for trade |
| GET/POST | /api/spots | List/Create spots |
| GET/PUT/DELETE | /api/spots/{id} | CRUD spot |
| GET | /api/sets | List all MTG sets |
| GET | /api/sets/{code} | Get set details |
| GET | /api/sets/{code}/cards | Get cards in set |
| GET | /api/cards/search?q= | Search Scryfall |
| GET | /api/cards/autocomplete?q= | Autocomplete suggestions |
| GET | /api/dashboard | Get statistics |
| GET/POST | /api/sync/status | Get/Trigger sync status |
| GET/PUT | /api/sync/settings | Get/Update sync settings |
| GET/PUT | /api/settings | Get/Update user settings |
6. Docker Configuration
- Single container containing both API and frontend
- Port: 5000 (configurable via docker-compose)
- Volume: For SQLite database persistence
- ASP.NET Core serves React static files from wwwroot
Dockerfile Requirements
- Multi-stage build (SDK for build, ASP.NET runtime for run)
- Node.js for React build
- Copy React dist to API's wwwroot
  docker-compose.yml
  services:
  spots:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - spots-data:/app/data
    environment:
      - ConnectionStrings__DefaultConnection=Data Source=/app/data/spots.db
7. Project Structure
   spots/
   ├── SPEC.md
   ├── Dockerfile
   ├── docker-compose.yml
   ├── .gitignore
   ├── Spots.sln
   └── src/
    ├── Spots.Api/
    │   ├── Spots.Api.csproj
    │   ├── Program.cs
    │   ├── Controllers/
    │   ├── Data/
    │   ├── DTOs/
    │   ├── Models/
    │   └── Services/
    └── Spots.App/
        ├── package.json
        ├── vite.config.ts
        ├── index.html
        └── src/
            ├── main.tsx
            ├── App.tsx
            ├── index.css
            ├── api/
            ├── components/
            ├── pages/
            └── types/
8. Build & Run Instructions
#Build and run
docker-compose up --build
#Access at http://localhost:5000
9. Acceptance Criteria
- [ ] App builds and runs in single Docker container
- [ ] Can create tracker from MTG set
- [ ] Can add/remove cards from collection
- [ ] Can create hierarchical spots
- [ ] Dashboard shows total cards, unique cards, EUR value
- [ ] Dashboard shows near-complete trackers
- [ ] Export produces valid Cardmarket format
- [ ] Light/dark mode works
- [ ] Table and visual views functional
- [ ] Card search works via Scryfall
- [ ] Initial setup allows set selection