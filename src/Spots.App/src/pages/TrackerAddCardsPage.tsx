import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTracker, getTrackerCards, searchCards, addTrackerCard, removeTrackerCard } from '../api/client'
import CardImage from '../components/CardImage'
import ViewToggle from '../components/ViewToggle'
import GridSizeSlider from '../components/GridSizeSlider'
import { useSettings } from '../components/SettingsContext'
import type { Tracker, ScryfallCard, ViewMode } from '../types'

export default function TrackerAddCardsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tracker, setTracker] = useState<Tracker | null>(null)
  const [existingCards, setExistingCards] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ScryfallCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('visual')
  const [addingCards, setAddingCards] = useState<Set<string>>(new Set())
  const [addedMessage, setAddedMessage] = useState<string | null>(null)
  const { settings, updateGridColumns } = useSettings()
  
  const trackerId = Number(id)

  const loadTracker = useCallback(async () => {
    try {
      const [t, cards] = await Promise.all([
        getTracker(trackerId),
        getTrackerCards(trackerId),
      ])
      setTracker(t)
      const cardIds = new Set(cards.map(c => c.scryfallId || '').filter(Boolean))
      setExistingCards(cardIds)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [trackerId])

  useEffect(() => { loadTracker() }, [loadTracker])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const result = await searchCards(searchQuery)
      setSearchResults(result.cards)
    } catch (e) {
      console.error(e)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const handleAddCard = async (cardId: string) => {
    if (addingCards.has(cardId)) return

    setAddingCards(new Set(addingCards).add(cardId))

    try {
      await addTrackerCard(trackerId, 0, cardId)
      setExistingCards(new Set(existingCards).add(cardId))
      setAddedMessage(`Added card to tracker`)
      setTimeout(() => setAddedMessage(null), 2000)
    } catch (e) {
      console.error(e)
      const newSet = new Set(addingCards)
      newSet.delete(cardId)
      setAddingCards(newSet)
    }
  }

  const handleRemoveCard = async (cardId: string) => {
    if (addingCards.has(cardId)) return

    setAddingCards(new Set(addingCards).add(cardId))
    try {
      const cards = await getTrackerCards(trackerId)
      const trackerCard = cards.find(c => c.scryfallId === cardId)
      if (trackerCard) {
        await removeTrackerCard(trackerId, trackerCard.cardId)
        const newExisting = new Set(existingCards)
        newExisting.delete(cardId)
        setExistingCards(newExisting)
        setAddedMessage(`Removed card from tracker`)
        setTimeout(() => setAddedMessage(null), 2000)
      }
    } catch (e) {
      console.error(e)
      const newSet = new Set(addingCards)
      newSet.delete(cardId)
      setAddingCards(newSet)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!tracker) {
    return <div className="text-center py-12 text-gray-500">Tracker not found</div>
  }

  if (tracker.setCode) {
    return (
      <div className="text-center py-12 text-gray-500">
        This feature is only available for custom trackers.
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate(`/trackers/${trackerId}`)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
            &larr; Back to {tracker.name}
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add Cards to {tracker.name}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Search and add cards to track
          </p>
        </div>
        <div className="flex items-center gap-4">
          {viewMode === 'visual' && (
            <GridSizeSlider columns={settings.gridColumns} onChange={updateGridColumns} />
          )}
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search for cards..."
          className="input flex-1"
        />
        <button type="submit" className="btn-primary" disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {addedMessage && (
        <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-4 py-2 rounded-lg">
          {addedMessage}
        </div>
      )}

      {searchResults.length > 0 && (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {searchResults.length} results
          </p>
          {viewMode === 'visual' ? (
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${settings.gridColumns}, minmax(0, 1fr))` }}>
              {searchResults.map(card => {
                const isInTracker = existingCards.has(card.id)
                const isAdding = addingCards.has(card.id)
                const isLoading = isAdding

                return (
                  <div key={card.id} className="relative group">
                    <div className="cursor-pointer">
                      <CardImage
                        src={card.image_uris?.normal ?? card.image_uris?.small}
                        alt={card.name}
                        size="fluid"
                        className={isInTracker ? 'ring-2 ring-primary-500' : ''}
                      />
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      {isInTracker && (
                        <span className="bg-primary-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          In Tracker
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs font-medium truncate">{card.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {isLoading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : isInTracker ? (
                          <button
                            onClick={() => handleRemoveCard(card.id)}
                            className="text-white bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-xs font-medium"
                          >Remove</button>
                        ) : (
                          <button
                            onClick={() => handleAddCard(card.id)}
                            className="text-white bg-primary-600 hover:bg-primary-500 px-2 py-1 rounded text-xs font-medium"
                          >Add</button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 w-12">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 w-24">Set</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-32">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map(card => {
                    const isInTracker = existingCards.has(card.id)
                    const isLoading = addingCards.has(card.id)

                    return (
                      <tr key={card.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${isInTracker ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                        <td className="px-4 py-3 text-gray-500">{card.collector_number}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white truncate">{card.name}</td>
                        <td className="px-4 py-3">
                          <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                            {card.set?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                            ) : isInTracker ? (
                              <button
                                onClick={() => handleRemoveCard(card.id)}
                                className="btn-sm text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded px-2 py-1"
                              >Remove</button>
                            ) : (
                              <button
                                onClick={() => handleAddCard(card.id)}
                                className="btn-sm text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded px-2 py-1"
                              >Add</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {searchQuery && !searching && searchResults.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No cards found. Try a different search term.
        </div>
      )}

      {!searchQuery && (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>Enter a card name above to search and add cards to your tracker.</p>
          <p className="mt-2 text-sm">You can search any Magic: The Gathering card by name.</p>
        </div>
      )}
    </div>
  )
}
