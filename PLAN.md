# Spots Implementation Plan

This document tracks planned updates to be implemented across multiple branches and sessions.

---

## Phase 1: Bug Fixes & Foundation

### 1.1 Fix Dashboard tracker totals
**Status:** Completed
**Branch:** fix/dashboard-tracker-totals

**Problem:**
- Dashboard "All trackers" section shows inconsistent progress breakdown vs tracker list page
- Tracker list page shows: overall progress, non-foil progress, foil progress
- Dashboard only shows single progress bar

**Solution:**
- Replicate tracker list breakdown in dashboard "All trackers" section
- Show separate progress bars for non-foil and foil when tracking both

**Files affected:**
- `src/Spots.App/src/pages/DashboardPage.tsx`
- `src/Spots.Api/Controllers/DashboardController.cs`

---

### 1.1b Fix nearest to completion calculation
**Status:** Completed
**Branch:** fix/dashboard-tracker-totals

**Problem:**
- Nearest to completion section shows (non-foil + foil) / (non-foil)
- This causes numerator to exceed denominator, showing incorrect progress

**Solution:**
- Correct calculation to properly account for foil tracking
- Calculate `totalNeeded` as `totalCards * 2` when tracking both variants

**Files affected:**
- `src/Spots.App/src/pages/DashboardPage.tsx`

---

### 1.2 Add logo to header
**Status:** Completed
**Branch:** feature/add-logo-to-header

**Requirements:**
- Add logo to sidebar header (desktop)
- Add logo to mobile header
- Logo file: `public/spots-logo.svg`

**Files affected:**
- `src/Spots.App/src/components/Layout.tsx`

---

## Phase 2: Navigation & Quick Add Refactor

### 2.1 Restructure navigation
**Status:** Pending
**Branch:** TBD

**Requirements:**
- New order: Dashboard, Collection, Trackers, Spots, Settings
- Collection has nested items (always visible, indented):
  - Collection (main collection page)
  - Add Cards
  - For Trade (new page - see 7.1)
- Update Layout.tsx navigation rendering

**Files affected:**
- `src/Spots.App/src/components/Layout.tsx`
- `src/Spots.App/src/App.tsx` (if routing changes needed)

---

### 2.2 Refactor quick add buttons
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Remove `-` (minus) buttons from both visual view and table view
- Add `+` (add non-foil) and `+Foil` (add foil) buttons
- Card removal should only happen via the card detail modal
- Ensures user knows which variant they're removing

**Files affected:**
- `src/Spots.App/src/pages/SetBrowserPage.tsx`
- `src/Spots.App/src/pages/SearchPage.tsx`
- `src/Spots.App/src/components/` (any shared card components)

---

## Phase 3: Dashboard Enhancements

### 3.1 Top 10 most expensive cards
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Add new section to dashboard showing top 10 most expensive cards
- Sort by individual card value (not total value × quantity)
- Use foil price if card is foil, otherwise standard price
- Display card name, set, foil status, and price

**Files affected:**
- `src/Spots.App/src/pages/DashboardPage.tsx`
- `src/Spots.Api/Controllers/DashboardController.cs`
- `src/Spots.Api/DTOs/DashboardDTOs.cs` (or equivalent)

---

### 3.2 Separate foil/non-foil in nearest to completion
**Status:** Pending
**Branch:** TBD

**Requirements:**
- When a tracker is tracking both foil and non-foil, show as two separate progress items
- Each item shows its own progress bar
- Helps users see which variant they're closer to completing

**Files affected:**
- `src/Spots.App/src/pages/DashboardPage.tsx`
- `src/Spots.Api/Controllers/DashboardController.cs`

---

## Phase 4: Add Cards Improvements

### 4.1 Set number sort order
**Status:** Pending
**Branch:** TBD

**Requirements:**
- When viewing cards by set, sort search results by collector number
- Collector number is available from Scryfall data
- Applies to SetBrowserPage view

**Files affected:**
- `src/Spots.App/src/pages/SetBrowserPage.tsx`
- Potentially backend sorting in `src/Spots.Api/Controllers/CardsController.cs`

---

### 4.2 Bulk multi-select
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Ctrl+click to select multiple cards in search/set browser
- When cards selected, show bulk action buttons
- Bulk actions: "Add selected" and "Add foil selected"
- Clear selection option

**Files affected:**
- `src/Spots.App/src/pages/SetBrowserPage.tsx`
- `src/Spots.App/src/pages/SearchPage.tsx`

---

### 4.3 Bulk action defaults
**Status:** Pending
**Branch:** TBD

**Requirements:**
- When performing bulk add, allow setting:
  - Default spot location
  - Default for-trade status
- Show modal or inline form when bulk action triggered
- Settings apply to all cards in the bulk operation

**Files affected:**
- `src/Spots.App/src/pages/SetBrowserPage.tsx`
- `src/Spots.App/src/pages/SearchPage.tsx`
- `src/Spots.Api/Controllers/CollectionController.cs` (bulk endpoint if needed)

---

## Phase 5: Spots Management

### 5.1 Drag reorder within parent
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Implement drag & drop for spots within same parent level
- Add `SortOrder` field to Spot model if not present
- Update UI to support drag interactions
- Persist order changes to backend

**Files affected:**
- `src/Spots.Api/Models/Spot.cs`
- `src/Spots.Api/Controllers/SpotsController.cs`
- `src/Spots.App/src/pages/SpotsPage.tsx`
- Database migration

---

### 5.2 Move between parents
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Allow moving a spot to a different parent
- Could be implemented via:
  - Drag & drop across hierarchy levels
  - Edit modal with parent selector dropdown
- Prevent circular references (spot cannot be its own ancestor)
- Update UI tree rendering

**Files affected:**
- `src/Spots.App/src/pages/SpotsPage.tsx`
- `src/Spots.App/src/pages/SpotDetailPage.tsx` (if edit modal there)
- `src/Spots.Api/Controllers/SpotsController.cs`

---

## Phase 6: Trackers Enhancements

### 6.1 Search trackers
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Add search/filter input to trackers list page
- Filter by tracker name
- Client-side filtering (no backend changes needed)

**Files affected:**
- `src/Spots.App/src/pages/TrackersPage.tsx`

---

### 6.2 Pin trackers
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Add "Pin" button/icon to each tracker
- Pinned trackers float to top of list
- Store pinned status in database (add `IsPinned` field to Tracker model)
- Show pin icon visually to indicate pinned status

**Files affected:**
- `src/Spots.Api/Models/Tracker.cs`
- `src/Spots.Api/Controllers/TrackersController.cs`
- `src/Spots.App/src/pages/TrackersPage.tsx`
- Database migration

---

### 6.3 Import to custom tracker
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Add import button to custom tracker detail page
- Accept plain text list format (one card name per line)
- Match cards by name and add to tracker
- Handle cards not found in database (show warning)
- Import format: Plain text, one card name per line

**Files affected:**
- `src/Spots.Api/Controllers/TrackersController.cs` (new import endpoint)
- `src/Spots.App/src/pages/TrackerDetailPage.tsx`

---

## Phase 7: Trade View Feature

### 7.1 Create For Trade page
**Status:** Pending
**Branch:** TBD

**Requirements:**
- New page showing all cards marked `ForTrade = true`
- Searchable (same as collection page)
- Support both visual and table views
- Add navigation item nested under Collection
- Route: `/trade` or `/collection/trade`

**Files affected:**
- `src/Spots.App/src/pages/TradePage.tsx` (new file)
- `src/Spots.App/src/App.tsx` (new route)
- `src/Spots.App/src/components/Layout.tsx` (navigation)
- `src/Spots.Api/Controllers/CollectionController.cs` (fortrade endpoint may exist already)

---

## Phase 8: Collection Enhancement

### 8.1 Add card button on collection page
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Add "Add Card" button to collection page header
- Opens search modal or navigates to add cards page
- Quick access for adding cards while viewing collection

**Files affected:**
- `src/Spots.App/src/pages/CollectionPage.tsx`

---

## Phase 9: Settings & Data Management

### 9.1 Database backup
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Add "Backup Database" button to settings page
- Download SQLite .db file to user's machine
- Backend endpoint to serve the file
- Consider: Also add restore functionality?

**Files affected:**
- `src/Spots.App/src/pages/SettingsPage.tsx`
- `src/Spots.Api/Controllers/SettingsController.cs`

---

### 9.2 Currency selection
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Add currency selection to settings
- Supported currencies: EUR, USD, TIX, GBP
- EUR, USD, TIX from Scryfall API
- GBP converted from EUR using Open Exchange Rates API
- Store preference in UserSettings
- Display all prices in selected currency throughout app

**API Key Handling:**
- Use Open Exchange Rates API (https://openexchangerates.org/)
- Store API key as environment variable: `OPENEXCHANGERATES_API_KEY`
- Add to docker-compose.yml
- User must obtain their own free API key

**Files affected:**
- `src/Spots.Api/Models/UserSettings.cs`
- `src/Spots.Api/Controllers/SettingsController.cs`
- `src/Spots.Api/Services/CurrencyService.cs` (new - for exchange rates)
- `src/Spots.App/src/pages/SettingsPage.tsx`
- All pages displaying prices (update to use selected currency)
- `docker-compose.yml`
- Database migration

---

## Implementation Notes

### Workflow
- Each item to be tackled individually in separate branches
- Update status in this document when starting/completing items
- Run lint/typecheck before committing

### Environment Variables
- `OPENEXCHANGERATES_API_KEY` - Required for GBP currency conversion

### Testing Checklist
After each item:
- [ ] Feature works as expected
- [ ] No console errors
- [ ] Existing functionality not broken
- [ ] Responsive design maintained
