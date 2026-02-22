import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { getCollection, createCollectionEntry, deleteCollectionEntry } from '../api/client'
import ViewToggle from '../components/ViewToggle'
import CardImage from '../components/CardImage'
import CardHoverPreview from '../components/CardHoverPreview'
import GridSizeSlider from '../components/GridSizeSlider'
import CardManageModal from '../components/CardManageModal'
import { useSettings } from '../components/SettingsContext'
import type { CollectionCard, ViewMode } from '../types'

export default function CollectionPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [cards, setCards] = useState<CollectionCard[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('visual')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const { settings, updateGridColumns } = useSettings()
  const [selectedCard, setSelectedCard] = useState<CollectionCard | null>(null)
  const highlightedCardRef = useRef<HTMLDivElement>(null)
  const highlightedRowRef = useRef<HTMLTableRowElement>(null)

  const cardIdParam = searchParams.get('cardId')
  const highlightCardId = cardIdParam ? parseInt(cardIdParam, 10) : null

  const load = useCallback((cardId?: number) => {
    setLoading(true)
    getCollection({ 
      search: search || undefined, 
      cardId: cardId,
      page, 
      pageSize: 60 
    })
      .then(setCards)
      .catch(console.error)
      .finally(() => {
        setLoading(false)
        setInitialLoad(false)
      })
  }, [search, page])

  useEffect(() => { load(highlightCardId ?? undefined) }, [page])
  
  // Reload when cardId param changes (navigating from dashboard)
  useEffect(() => {
    setLoading(true)
    getCollection({ 
      search: search || undefined, 
      cardId: highlightCardId ?? undefined,
      page: 1, 
      pageSize: 60 
    })
      .then(cardsData => {
        setCards(cardsData)
        setPage(1)
        // Scroll to highlighted card after render
        setTimeout(() => {
          const ref = viewMode === 'visual' ? highlightedCardRef : highlightedRowRef
          if (highlightCardId && ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      })
      .catch(console.error)
      .finally(() => {
        setLoading(false)
        setInitialLoad(false)
      })
  }, [highlightCardId])

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      load(highlightCardId ?? undefined)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Open modal for cardId from query param
  useEffect(() => {
    if (highlightCardId && cards.length > 0) {
      const card = cards.find(c => c.cardId === highlightCardId)
      if (card) {
        setSelectedCard(card)
      }
    }
  }, [highlightCardId, cards])

  const handleQuickAdd = async (cardId: number, isFoil: boolean) => {
    try {
      await createCollectionEntry({ cardId, isFoil, forTrade: false })
      load()
    } catch (e) {
      console.error(e)
    }
  }

  const handleQuickRemove = async (cardId: number, isFoil: boolean) => {
    const card = cards.find(c => c.cardId === cardId)
    if (!card) return
    const entry = card.entries.find(e => e.isFoil === isFoil)
    if (!entry) return
    try {
      await deleteCollectionEntry(entry.id)
      load()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Collection</h1>
        <div className="flex items-center gap-4">
          <Link to="/search" className="btn-primary">
            Add Card
          </Link>
          {viewMode === 'visual' && (
            <GridSizeSlider columns={settings.gridColumns} onChange={updateGridColumns} />
          )}
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search your collection..."
          className="input max-w-md"
        />
        {loading && !initialLoad && (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {initialLoad ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : cards.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            {search ? 'No cards match your search.' : 'Your collection is empty. Add cards to get started!'}
          </p>
        </div>
      ) : viewMode === 'visual' ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${settings.gridColumns}, minmax(0, 1fr))` }}>
          {cards.map(card => (
            <div 
              key={card.cardId} 
              ref={card.cardId === highlightCardId ? highlightedCardRef : undefined}
              className={`relative group ${card.cardId === highlightCardId ? 'ring-4 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800 rounded-xl' : ''}`}
            >
              <div className="cursor-pointer" onClick={() => setSelectedCard(card)}>
                <CardImage
                  src={card.imageUri ?? card.imageUriSmall}
                  alt={card.cardName}
                  size="fluid"
                />
              </div>
              <div className="absolute top-2 right-2 flex gap-1">
                {card.standardCount > 0 && (
                  <span className="bg-black/70 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {card.standardCount}
                  </span>
                )}
                {card.foilCount > 0 && (
                  <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {card.foilCount}
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium truncate">{card.cardName}</p>
                <p className="text-gray-300 text-xs">{card.setName}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 w-20">Set</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 w-24">Rarity</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-20">Standard</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-20">Foil</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 w-20">Price</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-40">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cards.map(card => {
                const isHighlighted = card.cardId === highlightCardId
                return (
                <tr 
                  key={card.cardId} 
                  ref={isHighlighted ? highlightedRowRef : undefined}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${isHighlighted ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500 ring-inset' : ''}`}
                  onClick={() => setSelectedCard(card)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white truncate">{card.cardName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{card.setCode.toUpperCase()}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${
                      card.rarity === 'mythic' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                      card.rarity === 'rare' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {card.rarity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">{card.standardCount}</td>
                  <td className="px-4 py-3 text-center font-medium text-amber-700 dark:text-amber-400">{card.foilCount}</td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                    {card.priceEur?.toFixed(2) ?? '-'}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleQuickAdd(card.cardId, false)} className="btn-sm text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded px-2 py-1">Add</button>
                      <button onClick={() => handleQuickAdd(card.cardId, true)} className="btn-sm text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded px-2 py-1">Add Foil</button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {cards.length > 0 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">Previous</button>
          <span className="flex items-center px-3 text-sm text-gray-600 dark:text-gray-400">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={cards.length < 60} className="btn-secondary btn-sm">Next</button>
        </div>
      )}

      {/* Card Management Modal */}
      {selectedCard && (
        <CardManageModal
          card={{
            id: selectedCard.cardId,
            name: selectedCard.cardName,
            setCode: selectedCard.setCode,
            setName: selectedCard.setName,
            collectorNumber: selectedCard.collectorNumber,
            rarity: selectedCard.rarity,
            typeLine: selectedCard.typeLine,
            imageUri: selectedCard.imageUri,
          }}
          onClose={() => {
            setSelectedCard(null)
            if (cardIdParam) {
              navigate('/collection', { replace: true })
            }
          }}
          onUpdate={load}
        />
      )}
    </div>
  )
}
