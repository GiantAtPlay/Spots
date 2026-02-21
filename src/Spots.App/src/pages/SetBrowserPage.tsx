import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSetCards, getSet, createCollectionEntry, deleteCollectionEntry, getCollection, getSpots } from '../api/client'
import CardImage from '../components/CardImage'
import ViewToggle from '../components/ViewToggle'
import CardHoverPreview from '../components/CardHoverPreview'
import GridSizeSlider from '../components/GridSizeSlider'
import CardManageModal from '../components/CardManageModal'
import { useSettings } from '../components/SettingsContext'
import type { Card, MtgSet, CollectionEntry, CollectionCard, Spot, ViewMode } from '../types'

export default function SetBrowserPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [set, setSet] = useState<MtgSet | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [collectionMap, setCollectionMap] = useState<Map<number, CollectionEntry[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('visual')
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const { settings, updateGridColumns } = useSettings()

  const loadData = useCallback(async () => {
    if (!code) return
    setLoading(true)
    try {
      const [setData, cardData, collData] = await Promise.all([
        getSet(code),
        getSetCards(code),
        getCollection({ setCode: code, pageSize: 9999 }),
      ])
      setSet(setData)
      setCards(cardData)
      buildCollectionMap(collData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [code])

  useEffect(() => { loadData() }, [loadData])

  const buildCollectionMap = (collCards: CollectionCard[]) => {
    const map = new Map<number, CollectionEntry[]>()
    for (const cc of collCards) {
      map.set(cc.cardId, cc.entries)
    }
    setCollectionMap(map)
  }

  const getStandardCount = (cardId: number) => {
    return (collectionMap.get(cardId) ?? []).filter(e => !e.isFoil).length
  }

  const getFoilCount = (cardId: number) => {
    return (collectionMap.get(cardId) ?? []).filter(e => e.isFoil).length
  }

  const getTotalCount = (cardId: number) => {
    return (collectionMap.get(cardId) ?? []).length
  }

  const handleQuickAdd = async (cardId: number, isFoil = false) => {
    try {
      const created = await createCollectionEntry({ cardId, isFoil, forTrade: false })
      const existing = collectionMap.get(cardId) ?? []
      const updated = new Map(collectionMap)
      updated.set(cardId, [...existing, created])
      setCollectionMap(updated)
    } catch (e) {
      console.error(e)
    }
  }

  const handleQuickRemove = async (cardId: number, isFoil = false) => {
    const entries = collectionMap.get(cardId) ?? []
    const entry = entries.find(e => e.isFoil === isFoil)
    if (!entry) return
    try {
      await deleteCollectionEntry(entry.id)
      const updated = new Map(collectionMap)
      updated.set(cardId, entries.filter(e => e.id !== entry.id))
      setCollectionMap(updated)
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => navigate('/search')} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
            &larr; Back to Search
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {set?.name ?? code?.toUpperCase()}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {cards.length} cards
          </p>
        </div>
        <div className="flex items-center gap-4">
          {viewMode === 'visual' && (
            <GridSizeSlider columns={settings.gridColumns} onChange={updateGridColumns} />
          )}
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {viewMode === 'visual' ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${settings.gridColumns}, minmax(0, 1fr))` }}>
          {cards.map(card => {
            const stdCount = getStandardCount(card.id)
            const foilCount = getFoilCount(card.id)
            const totalCount = stdCount + foilCount
            return (
              <div key={card.id} className="relative group">
                <div className="cursor-pointer" onClick={() => setSelectedCard(card)}>
                  <CardImage
                    src={card.imageUri ?? card.imageUriSmall}
                    alt={card.name}
                    size="fluid"
                    className={totalCount === 0 ? 'grayscale-[50%] opacity-70' : ''}
                  />
                </div>
                <div className="absolute top-2 right-2 flex gap-1">
                  {stdCount > 0 && (
                    <span className="bg-black/70 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {stdCount}
                    </span>
                  )}
                  {foilCount > 0 && (
                    <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {foilCount}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">{card.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickRemove(card.id, false) }}
                      disabled={stdCount === 0}
                      className="text-white bg-red-500/80 hover:bg-red-500 disabled:opacity-30 w-6 h-6 rounded text-sm flex items-center justify-center"
                    >-</button>
                    <span className="text-white text-sm font-medium">{stdCount}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleQuickAdd(card.id, false) }}
                      className="text-white bg-green-500/80 hover:bg-green-500 w-6 h-6 rounded text-sm flex items-center justify-center"
                    >+</button>
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
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 w-24">Rarity</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-28">Standard</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-28">Foil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {cards.map(card => {
                const stdCount = getStandardCount(card.id)
                const foilCount = getFoilCount(card.id)
                return (
                  <CardHoverPreview key={card.id} imageUri={card.imageUri} cardName={card.name} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer" onClick={() => setSelectedCard(card)}>
                      <td className="px-4 py-3 text-gray-500">{card.collectorNumber}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white truncate">{card.name}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${
                          card.rarity === 'mythic' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                          card.rarity === 'rare' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          card.rarity === 'uncommon' ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {card.rarity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleQuickRemove(card.id, false)} disabled={stdCount === 0} className="btn-sm text-xs bg-gray-200 dark:bg-gray-600 rounded px-1.5 disabled:opacity-30">-</button>
                          <span className="w-6 text-center font-medium">{stdCount}</span>
                          <button onClick={() => handleQuickAdd(card.id, false)} className="btn-sm text-xs bg-gray-200 dark:bg-gray-600 rounded px-1.5">+</button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleQuickRemove(card.id, true)} disabled={foilCount === 0} className="btn-sm text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded px-1.5 disabled:opacity-30">-</button>
                          <span className="w-6 text-center font-medium">{foilCount}</span>
                          <button onClick={() => handleQuickAdd(card.id, true)} className="btn-sm text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded px-1.5">+</button>
                        </div>
                      </td>
                  </CardHoverPreview>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Card Management Modal */}
      <CardManageModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
        onUpdate={loadData}
      />
    </div>
  )
}
