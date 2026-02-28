// Card types
export interface Card {
  id: number;
  scryfallId: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  typeLine?: string;
  manaCost?: string;
  oracleText?: string;
  imageUri?: string;
  imageUriSmall?: string;
  imageUriArtCrop?: string;
  language: string;
}

export interface ScryfallCard {
  id: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  rarity: string;
  type_line?: string;
  mana_cost?: string;
  oracle_text?: string;
  image_uris?: {
    small?: string;
    normal?: string;
    large?: string;
    art_crop?: string;
  };
  card_faces?: Array<{
    name: string;
    image_uris?: {
      small?: string;
      normal?: string;
      art_crop?: string;
    };
  }>;
  prices?: {
    eur?: string;
    eur_foil?: string;
  };
}

export interface ScryfallSearchResult {
  cards: ScryfallCard[];
  totalCards: number;
  hasMore: boolean;
}

// Set types
export interface MtgSet {
  id: string;
  code: string;
  name: string;
  set_type: string;
  released_at: string;
  card_count: number;
  icon_svg_uri: string;
  digital: boolean;
}

// Collection types - individual physical card
export interface CollectionEntry {
  id: number;
  cardId: number;
  isFoil: boolean;
  spotId?: number;
  spotName?: string;
  forTrade: boolean;
}

// Collection types - grouped view (all copies of one card)
export interface CollectionCard {
  cardId: number;
  cardName: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  typeLine?: string;
  manaCost?: string;
  imageUri?: string;
  imageUriSmall?: string;
  imageUriArtCrop?: string;
  priceEur?: number;
  priceEurFoil?: number;
  standardCount: number;
  foilCount: number;
  entries: CollectionEntry[];
}

export interface CreateCollectionEntry {
  cardId: number;
  isFoil: boolean;
  spotId?: number;
  forTrade: boolean;
}

// Tracker types
export interface Tracker {
  id: number;
  name: string;
  setCode?: string;
  trackFoil: boolean;
  trackNonFoil: boolean;
  isCollecting: boolean;
  isPinned: boolean;
  createdAt: string;
  completionPercentage: number;
  foilCompletionPercentage: number;
  nonFoilCompletionPercentage: number;
  totalCards: number;
  collectedCards: number;
}

export interface CreateTracker {
  name: string;
  setCode?: string;
  trackFoil: boolean;
  trackNonFoil: boolean;
}

export interface TrackerCard {
  id: number;
  cardId: number;
  cardName: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  imageUri?: string;
  imageUriSmall?: string;
  isExcluded: boolean;
  ownedQuantity: number;
  ownedFoilQuantity: number;
  isCollected: boolean;
  isFoilCollected: boolean;
}

// Spot types
export interface Spot {
  id: number;
  name: string;
  type: string;
  parentSpotId?: number;
  parentSpotName?: string;
  children: Spot[];
  cardCount: number;
}

export interface CreateSpot {
  name: string;
  type: string;
  parentSpotId?: number;
}

// Dashboard types
export interface Dashboard {
  totalCards: number;
  uniqueCards: number;
  approxValueEur: number;
  trackerProgress: TrackerProgress[];
  nearCompleteTrackers: NearCompleteItem[];
  topExpensiveCards: TopCard[];
}

export interface NearCompleteItem {
  trackerId: number;
  trackerName: string;
  setCode?: string;
  isFoil: boolean;
  completionPercentage: number;
  collected: number;
  total: number;
}

export interface TopCard {
  cardId: number;
  cardName: string;
  setName: string;
  setCode: string;
  isFoil: boolean;
  price: number;
}

export interface TrackerProgress {
  trackerId: number;
  trackerName: string;
  setCode?: string;
  trackFoil: boolean;
  trackNonFoil: boolean;
  completionPercentage: number;
  foilCompletionPercentage: number;
  nonFoilCompletionPercentage: number;
  totalCards: number;
  collectedCards: number;
}

// Settings types
export interface UserSettings {
  darkMode: boolean;
  defaultViewMode: 'table' | 'visual';
  initialSetupComplete: boolean;
  gridColumns: number;
}

export interface SyncSettings {
  cardSyncSchedule: string;
  priceSyncSchedule: string;
  cardSyncRecentMonths: number;
  lastCardSync?: string;
  lastPriceSync?: string;
  isSyncing: boolean;
  syncStatus?: string;
}

export interface SyncStatus {
  isSyncing: boolean;
  syncStatus?: string;
  lastCardSync?: string;
  lastPriceSync?: string;
}

export type ViewMode = 'table' | 'visual';
