const BASE_URL = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return text ? JSON.parse(text) : (undefined as unknown as T);
}

// Backup
export const downloadBackup = async () => {
  const url = `${BASE_URL}/settings/backup`;
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to download backup');
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition
    ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'spots-backup.db'
    : 'spots-backup.db';
  
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
};

// Dashboard
export const getDashboard = () =>
  request<import('../types').Dashboard>('/dashboard');

// Trackers
export const getTrackers = () =>
  request<import('../types').Tracker[]>('/trackers');

export const getTracker = (id: number) =>
  request<import('../types').Tracker>(`/trackers/${id}`);

export const createTracker = (data: import('../types').CreateTracker) =>
  request<import('../types').Tracker>('/trackers', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateTracker = (id: number, data: Partial<import('../types').Tracker>) =>
  request<import('../types').Tracker>(`/trackers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteTracker = (id: number) =>
  request<void>(`/trackers/${id}`, { method: 'DELETE' });

export const getTrackerCards = (id: number) =>
  request<import('../types').TrackerCard[]>(`/trackers/${id}/cards`);

export const addTrackerCard = (trackerId: number, cardId?: number, scryfallId?: string) =>
  request<void>(`/trackers/${trackerId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ cardId: cardId ?? null, scryfallId: scryfallId ?? null }),
  });

export const removeTrackerCard = (trackerId: number, cardId: number) =>
  request<void>(`/trackers/${trackerId}/cards/${cardId}`, { method: 'DELETE' });

export const toggleExcludeCard = (trackerId: number, cardId: number) =>
  request<{ isExcluded: boolean }>(`/trackers/${trackerId}/cards/${cardId}/exclude`, {
    method: 'POST',
  });

export const exportTrackerMissing = async (trackerId: number): Promise<string> => {
  const response = await fetch(`${BASE_URL}/trackers/${trackerId}/export`, {
    method: 'POST',
  });
  return response.text();
};

// Collection
export const getCollection = (params?: {
  setCode?: string;
  spotId?: number;
  cardId?: number;
  search?: string;
  page?: number;
  pageSize?: number;
}) => {
  const searchParams = new URLSearchParams();
  if (params?.setCode) searchParams.set('setCode', params.setCode);
  if (params?.spotId) searchParams.set('spotId', String(params.spotId));
  if (params?.cardId) searchParams.set('cardId', String(params.cardId));
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  const qs = searchParams.toString();
  return request<import('../types').CollectionCard[]>(`/collection${qs ? `?${qs}` : ''}`);
};

export const getCardEntries = (cardId: number) =>
  request<import('../types').CollectionEntry[]>(`/collection/card/${cardId}`);

export const createCollectionEntry = (data: import('../types').CreateCollectionEntry) =>
  request<import('../types').CollectionEntry>('/collection', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateCollectionEntry = (id: number, data: { spotId?: number; forTrade?: boolean }) =>
  request<import('../types').CollectionEntry>(`/collection/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteCollectionEntry = (id: number) =>
  request<void>(`/collection/${id}`, { method: 'DELETE' });

export const getForTrade = (search?: string, page = 1) =>
  request<import('../types').CollectionCard[]>(`/collection/fortrade?search=${encodeURIComponent(search || '')}&page=${page}`);

export const resetCollection = () =>
  request<void>('/collection/reset', { method: 'DELETE' });

// Spots
export const getSpots = () =>
  request<import('../types').Spot[]>('/spots');

export const getSpot = (id: number) =>
  request<import('../types').Spot>(`/spots/${id}`);

export const createSpot = (data: import('../types').CreateSpot) =>
  request<import('../types').Spot>('/spots', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const updateSpot = (id: number, data: Partial<import('../types').Spot>) =>
  request<import('../types').Spot>(`/spots/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteSpot = (id: number) =>
  request<void>(`/spots/${id}`, { method: 'DELETE' });

// Sets
export const getSets = () =>
  request<import('../types').MtgSet[]>('/sets');

export const getSet = (code: string) =>
  request<import('../types').MtgSet>(`/sets/${code}`);

export const getSetCards = (code: string) =>
  request<import('../types').Card[]>(`/sets/${code}/cards`);

// Cards
export const searchCards = (q: string, page = 1) =>
  request<import('../types').ScryfallSearchResult>(`/cards/search?q=${encodeURIComponent(q)}&page=${page}`);

export const autocompleteCards = (q: string) =>
  request<string[]>(`/cards/autocomplete?q=${encodeURIComponent(q)}`);

// Sync
export const getSyncStatus = () =>
  request<import('../types').SyncStatus>('/sync/status');

export const triggerSync = () =>
  request<import('../types').SyncStatus>('/sync/status', { method: 'POST' });

export const getSyncSettings = () =>
  request<import('../types').SyncSettings>('/sync/settings');

export const updateSyncSettings = (data: Partial<import('../types').SyncSettings>) =>
  request<import('../types').SyncSettings>('/sync/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const importSet = (setCode: string) =>
  request<{ message: string }>(`/sync/import-set/${setCode}`, { method: 'POST' });

// User Settings
export const getSettings = () =>
  request<import('../types').UserSettings>('/settings');

export const updateSettings = (data: Partial<import('../types').UserSettings>) =>
  request<import('../types').UserSettings>('/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
