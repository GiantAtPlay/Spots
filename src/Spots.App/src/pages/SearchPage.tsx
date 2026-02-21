import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { searchCards, autocompleteCards, createCollectionEntry, getSpots, getSets, importSet, getSetCards } from '../api/client'
import CardImage from '../components/CardImage'
import Modal from '../components/Modal'
import GridSizeSlider from '../components/GridSizeSlider'
import { useSettings } from '../components/SettingsContext'
import type { ScryfallCard, Spot, MtgSet } from '../types'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [results, setResults] = useState<ScryfallCard[]>([])
  const [loading, setLoading] = useState(false)
  const [sets, setSets] = useState<MtgSet[]>([])
  const [spots, setSpots] = useState<Spot[]>([])
  const [showAdd, setShowAdd] = useState<ScryfallCard | null>(null)
  const [addQuantity, setAddQuantity] = useState(1)
  const [addFoil, setAddFoil] = useState(false)
  const [addSpotId, setAddSpotId] = useState<number | undefined>()
  const [adding, setAdding] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const { settings, updateGridColumns } = useSettings()

  useEffect(() => {
    getSpots().then(s => setSpots(flattenSpots(s))).catch(console.error)
    getSets().then(setSets).catch(console.error)
  }, [])

  const flattenSpots = (spots: Spot[], depth = 0): Spot[] => {
    const result: Spot[] = []
    for (const spot of spots) {
      result.push({ ...spot, name: '  '.repeat(depth) + spot.name })
      if (spot.children?.length) {
        result.push(...flattenSpots(spot.children, depth + 1))
      }
    }
    return result
  }

  // Autocomplete
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      try {
        const s = await autocompleteCards(query)
        setSuggestions(s.slice(0, 8))
      } catch {
        setSuggestions([])
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery ?? query
    if (!q.trim()) return
    setLoading(true)
    setSuggestions([])
    setPage(1)
    try {
      const result = await searchCards(q)
      setResults(result.cards)
      setHasMore(result.hasMore)
    } catch (e) {
      console.error(e)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = async () => {
    const nextPage = page + 1
    setPage(nextPage)
    try {
      const result = await searchCards(query, nextPage)
      setResults([...results, ...result.cards])
      setHasMore(result.hasMore)
    } catch (e) {
      console.error(e)
    }
  }

  const handleAdd = async () => {
    if (!showAdd) return
    setAdding(true)
    try {
      // We need the card's DB id - the search result only has Scryfall data
      // Import the set first, then use the card
      if (showAdd.set) {
        await importSet(showAdd.set)
      }
      // Now get the card from our DB by searching the set cards
      const setCards = await getSetCards(showAdd.set!)
      const dbCard = setCards.find(c =>
        c.scryfallId === showAdd.id || (c.collectorNumber === showAdd.collector_number && c.setCode === showAdd.set)
      )

      if (dbCard) {
        // Create individual entries for each copy
        for (let i = 0; i < addQuantity; i++) {
          await createCollectionEntry({
            cardId: dbCard.id,
            isFoil: addFoil,
            spotId: addSpotId,
            forTrade: false,
          })
        }
        alert(`Added ${addQuantity}x ${showAdd.name} to collection!`)
      } else {
        alert('Could not find card in database. Try importing the set first.')
      }

      setShowAdd(null)
      setAddQuantity(1)
      setAddFoil(false)
      setAddSpotId(undefined)
    } catch (e) {
      console.error(e)
      alert('Failed to add card')
    } finally {
      setAdding(false)
    }
  }

  const getCardImage = (card: ScryfallCard) => {
    return card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add Cards</h1>

      {/* Search or Browse tabs */}
      <div className="card p-4">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search for a card name..."
                className="input flex-1"
              />
              <button onClick={() => handleSearch()} className="btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
            {suggestions.length > 0 && (
              <div className="absolute z-10 left-0 right-16 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); handleSearch(s) }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Or <Link to="/sets" className="text-primary-600 dark:text-primary-400 font-medium">browse all sets</Link>, or jump to a recent set:
        </div>
        <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto">
          {sets.slice(0, 20).map(s => (
            <Link
              key={s.code}
              to={`/sets/${s.code}`}
              className="badge bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {s.name}
            </Link>
          ))}
          {sets.length > 20 && (
            <Link to="/sets" className="badge bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors">
              View all {sets.length} sets &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <>
          <div className="flex justify-end">
            <GridSizeSlider columns={settings.gridColumns} onChange={updateGridColumns} />
          </div>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${settings.gridColumns}, minmax(0, 1fr))` }}>
            {results.map((card, i) => (
              <div
                key={`${card.id}-${i}`}
                className="relative group cursor-pointer"
                onClick={() => setShowAdd(card)}
              >
                <CardImage
                  src={getCardImage(card)}
                  alt={card.name ?? ''}
                  size="fluid"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">{card.name}</p>
                  <p className="text-gray-300 text-xs">{card.set_name}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {hasMore && (
        <div className="text-center">
          <button onClick={handleLoadMore} className="btn-secondary">
            Load More
          </button>
        </div>
      )}

      {/* Add Card Modal */}
      <Modal isOpen={!!showAdd} onClose={() => setShowAdd(null)} title="Add to Collection">
        {showAdd && (
          <div className="flex gap-6">
            <CardImage
              src={getCardImage(showAdd)}
              alt={showAdd.name ?? ''}
              size="normal"
            />
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{showAdd.name}</h3>
                <p className="text-sm text-gray-500">{showAdd.set_name} #{showAdd.collector_number}</p>
                <p className="text-sm text-gray-500">{showAdd.rarity}</p>
                {showAdd.prices?.eur && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Price: {showAdd.prices.eur} EUR
                    {showAdd.prices.eur_foil && ` / ${showAdd.prices.eur_foil} EUR (foil)`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={addQuantity}
                  onChange={e => setAddQuantity(Math.max(1, Number(e.target.value)))}
                  className="input w-24"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addFoil}
                  onChange={e => setAddFoil(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Foil</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spot (Location)</label>
                <select
                  value={addSpotId ?? ''}
                  onChange={e => setAddSpotId(e.target.value ? Number(e.target.value) : undefined)}
                  className="input"
                >
                  <option value="">No spot selected</option>
                  {spots.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.type})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAdd}
                disabled={adding}
                className="btn-primary w-full"
              >
                {adding ? 'Adding...' : `Add ${addQuantity}x to Collection`}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
