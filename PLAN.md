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
**Status:** Completed
**Branch:** feature/restructure-navigation

**Requirements:**
- New order: Dashboard, Collection, Trackers, Spots, Settings
- Collection has nested items (always visible, indented):
  - Collection (main collection page)
  - Add Cards
  - For Trade (new page - see 7.1 - not yet implemented)

**Files affected:**
- `src/Spots.App/src/components/Layout.tsx`

---

### 2.2 Refactor quick add buttons
**Status:** Completed
**Branch:** feature/refactor-quick-add-buttons

**Requirements:**
- Remove `-` (minus) buttons from both visual view and table view
- Add `+` (add non-foil) and `+Foil` (add foil) buttons
- Card removal should only happen via the card detail modal

**Files affected:**
- `src/Spots.App/src/pages/SetBrowserPage.tsx`

---

### 2.3 Update Manage Card modal buttons
**Status:** Completed
**Branch:** feature/button-consistency-table-improvements

**Requirements:**
- Remove `+` symbol from button text
- Change "+ Add Standard" → "Add Standard"
- Change "+ Add Foil" → "Add Foil"
- Maintain existing colors (primary blue for standard, amber for foil)

**Files affected:**
- `src/Spots.App/src/components/CardManageModal.tsx`

---

### 2.4 Refactor Collection table view buttons
**Status:** Completed
**Branch:** feature/button-consistency-table-improvements

**Requirements:**
- Remove Standard and Foil columns with +/- buttons
- Add single "Actions" column with "Add" and "Add Foil" buttons side by side
- Match styling from SetBrowserPage (primary blue for Add, amber for Add Foil)

**Files affected:**
- `src/Spots.App/src/pages/CollectionPage.tsx`

---

### 2.5 Update Spot column logic in Collection table
**Status:** Completed
**Branch:** feature/button-consistency-table-improvements

**Requirements:**
- If all copies in same spot: show spot name only (e.g., "Binder")
- If copies in different spots: show "Multiple (N)" where N = count of unique spots
- If no spots assigned: show "-"
- Example: 3 copies in 2 different spots → "Multiple (2)"

**Files affected:**
- `src/Spots.App/src/pages/CollectionPage.tsx`

---

### 2.6 Add quantity columns to Set Browser table view
**Status:** Completed
**Branch:** feature/button-consistency-table-improvements

**Requirements:**
- Add "Standard" column showing count of non-foil copies
- Add "Foil" column showing count of foil copies
- Position: after Rarity column, before Actions column
- Display just the number (column headers provide context)

**Files affected:**
- `src/Spots.App/src/pages/SetBrowserPage.tsx`

---

## Phase 3: Dashboard Enhancements

### 3.1 Top 10 most expensive cards
**Status:** Completed
**Branch:** feature/dashboard-enhancements

**Requirements:**
- Add new section to dashboard showing top 10 most expensive cards
- Sort by individual card value (not total value × quantity)
- Each foil/non-foil variant appears once (if both in collection, both can appear)
- Use foil price if card is foil, otherwise standard price
- Display: numbered list (1-10), card name, set name, foil tag, price
- Condensed/small display
- Click navigates to `/collection?cardId=X` which filters collection to that card

**Files affected:**
- `src/Spots.App/src/pages/DashboardPage.tsx`
- `src/Spots.App/src/pages/CollectionPage.tsx` (add cardId query param filter)
- `src/Spots.App/src/types/index.ts`
- `src/Spots.Api/Controllers/DashboardController.cs`
- `src/Spots.Api/DTOs/DashboardDto.cs`

---

### 3.2 Separate foil/non-foil in nearest to completion
**Status:** Completed
**Branch:** feature/dashboard-enhancements

**Requirements:**
- Split trackers into separate entries for foil and non-foil
- Only show entries for variants the tracker is tracking
- Each entry shows its own progress (not combined)
- Exclude items at 100% completion
- Order by completion percentage descending, take top 10
- Display format: "TrackerName (Foil)" or "TrackerName (Non-Foil)"

**Files affected:**
- `src/Spots.App/src/pages/DashboardPage.tsx`
- `src/Spots.Api/Controllers/DashboardController.cs`
- `src/Spots.Api/DTOs/DashboardDto.cs`

---

## Phase 4: Add Cards Improvements

### 4.1 Set number sort order
**Status:** Completed
**Branch:** feature/set-number-sort

**Requirements:**
- When viewing cards by set, sort search results by collector number
- Collector number is available from Scryfall data
- Applies to SetBrowserPage view

**Files affected:**
- `src/Spots.Api/Controllers/SetsController.cs`

---

### 4.2 Bulk multi-select
**Status:** Completed
**Branch:** feature/bulk-actions-set-browser

**Requirements:**
- Add checkbox column to table view (left side)
- Add "Select All / None" checkbox in header
- Individual row checkboxes for selection
- Sticky action panel at bottom when cards selected
- Panel shows: spot dropdown, for-trade toggle, Add button, Add Foil button
- "Select All" selects all cards on current page only
- Clear selection after successful add
- Loading indicator during bulk add
- Success message after completion
- Handle large selections efficiently (batch processing)
- Subtle highlight on selected rows

**Implementation notes:**
- Batch process cards in groups of 10
- Show progress indicator "Adding X of Y..."
- Keep UI responsive during bulk operations

**Files affected:**
- `src/Spots.App/src/pages/SetBrowserPage.tsx`

---

### 4.3 Bulk action defaults
**Status:** Completed
**Branch:** feature/bulk-actions-set-browser

**Requirements:**
- Optional spot selection in sticky panel
- Optional for-trade toggle in sticky panel
- Settings apply to all cards in bulk add
- If no spot selected → cards added with spotId = null
- If trade not selected → cards added with forTrade = false

**Files affected:**
- `src/Spots.App/src/pages/SetBrowserPage.tsx`
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

### 6.1 Search & filter trackers
**Status:** Completed
**Branch:** feature/search-filter-trackers

**Requirements:**
- Add search/filter bar to trackers list page (beneath header and Add button)
- Filter dropdown: "All", "Custom", "Set"
- Search input: filter by tracker name (client-side)
- Filter and search displayed in same row, visually inline
- Search input and filter dropdown are separate UI elements

**Files affected:**
- `src/Spots.App/src/pages/TrackersPage.tsx`

---

### 6.2 Order trackers
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Add order dropdown to trackers list page (inline with search/filter)
- Order options:
  - Alphabetical (A-Z) - default
  - Total Completion (highest % first)
  - Set Order (by set release date from Scryfall)
- When ordering by Set Order: custom trackers grouped at bottom of list
- Pinned trackers:
  - Displayed in a sticky section at top (visually identifiable)
  - Also duplicated in the main sorted list below
  - Sticky section clearly differentiated from main list

**Files affected:**
- `src/Spots.App/src/pages/TrackersPage.tsx`
- `src/Spots.Api/Controllers/TrackersController.cs` (if ordering requires backend)

---

### 6.3 Pin trackers
**Status:** Pending
**Branch:** TBD

**Requirements:**
- Add "Pin" button/icon to each tracker
- Store pinned status in database (add `IsPinned` field to Tracker model)
- Show pin icon visually to indicate pinned status
- Pinned trackers appear in a sticky section at top AND in the main sorted list (see 6.2)
- Sticky section visually distinguishable from main list

**Files affected:**
- `src/Spots.Api/Models/Tracker.cs`
- `src/Spots.Api/Controllers/TrackersController.cs`
- `src/Spots.App/src/pages/TrackersPage.tsx`
- Database migration

---

### 6.4 Import to custom tracker
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
**Status:** Completed
**Branch:** feature/for-trade-page

**Requirements:**
- New page showing all cards marked `ForTrade = true`
- Searchable (same as collection page)
- Support both visual and table views
- Add navigation item nested under Collection
- Route: `/trade`

**Files affected:**
- `src/Spots.App/src/pages/TradePage.tsx` (new file)
- `src/Spots.App/src/App.tsx` (new route)
- `src/Spots.App/src/components/Layout.tsx` (navigation)
- `src/Spots.App/src/api/client.ts` (updated getForTrade)
- `src/Spots.Api/Controllers/CollectionController.cs` (updated fortrade endpoint)

---

## Phase 8: Collection Enhancement

### 8.1 Add card button on collection page
**Status:** Completed
**Branch:** feature/add-card-button-collection

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
