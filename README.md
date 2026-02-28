# Spots - MTG Collection Tracker

A personal Magic: The Gathering collection tracker built as a single-container Docker web application. Track your cards, manage locations, monitor collection progress, and sync card data from Scryfall.

## Features

- **Trackers**: Create collection trackers based on MTG sets (Core, Expansions) or custom empty trackers
- **Collection Management**: Track owned physical cards with quantity, foil/non-foil status, and location
- **Spots (Locations)**: Hierarchical location system (e.g., Office → Shelf → Box)
- **Card Search**: Search by card name via Scryfall API with autocomplete
- **Set Browser**: Browse all cards in a set, add/remove with +/- buttons
- **Dashboard**: View total cards, unique cards, EUR value, and completion percentages
- **Export**: Export missing cards in Cardmarket "wants" format
- **Views**: Table mode (list with mouseover images) and Visual mode (card tile grid)
- **Theme**: Light and dark mode support

## To-do list
- [ ] Spots - Add ability to move/reorder spots (Drag & drop?)
- [ ] Tracker - Add ability to add cards to custom trackers, via text import
- [ ] Settings - Allow selection of currency to display card values in


## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | ASP.NET Core 8 |
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build Tool | Vite |
| Database | SQLite |
| ORM | Entity Framework Core 8 |
| Card Data API | Scryfall API |

## Quick Start

```bash
# Build and run with Docker
docker-compose up --build

# Access the application
# Open http://localhost:5000
```

## Project Structure

```
Spots-Opus/
├── SPEC.md                 # Detailed specification
├── Dockerfile              # Multi-stage Docker build
├── docker-compose.yml      # Docker Compose configuration
├── Spots.sln               # Solution file
└── src/
    ├── Spots.Api/          # ASP.NET Core backend
    │   ├── Controllers/    # API endpoints
    │   ├── Data/           # EF Core DbContext
    │   ├── DTOs/           # Data transfer objects
    │   ├── Models/         # Entity models
    │   └── Services/       # Business logic
    └── Spots.App/          # React frontend
        ├── src/
        │   ├── api/        # API client
        │   ├── components/ # Reusable UI components
        │   ├── pages/      # Page components
        │   └── types/      # TypeScript types
        └── package.json
```

## Installation

### Prerequisites

- Docker
- Docker Compose

### Using Docker Compose

1. Clone the repository
2. Run the container:

```bash
docker-compose up --build
```

The application will be available at `http://localhost:5000`

### Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `ConnectionStrings__DefaultConnection` | SQLite database path | `/app/data/spots.db` |
| `ASPNETCORE_URLS` | Server URL | `http://+:5000` |

Data is persisted in a Docker volume (`spots-data`).

## API Endpoints

### Trackers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/trackers` | List/Create trackers |
| GET/PUT/DELETE | `/api/trackers/{id}` | CRUD single tracker |
| GET | `/api/trackers/{id}/cards` | Get cards in tracker |
| POST | `/api/trackers/{id}/export` | Export missing cards |

### Collection
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST/PUT/DELETE | `/api/collection` | Manage collection entries |
| POST | `/api/collection/{id}/increment` | Increase quantity |
| POST | `/api/collection/{id}/decrement` | Decrease quantity |
| GET | `/api/collection/fortrade` | Get cards marked for trade |

### Spots
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/spots` | List/Create spots |
| GET/PUT/DELETE | `/api/spots/{id}` | CRUD spot |

### Sets & Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sets` | List all MTG sets |
| GET | `/api/sets/{code}` | Get set details |
| GET | `/api/sets/{code}/cards` | Get cards in set |
| GET | `/api/cards/search?q=` | Search Scryfall |
| GET | `/api/cards/autocomplete?q=` | Autocomplete suggestions |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get statistics |
| GET/POST | `/api/sync/status` | Get/Trigger sync status |
| GET/PUT | `/api/sync/settings` | Get/Update sync settings |
| GET/PUT | `/api/settings` | Get/Update user settings |

## Development

### Running Locally (Without Docker)

**Backend:**
```bash
cd src/Spots.Api
dotnet restore
dotnet run
```

**Frontend:**
```bash
cd src/Spots.App
npm install
npm run dev
```

The frontend development server runs on `http://localhost:5173` by default.

### Building

```bash
# Build frontend
cd src/Spots.App
npm run build

# Build backend
cd src/Spots.Api
dotnet publish -c Release
```

## License

MIT
