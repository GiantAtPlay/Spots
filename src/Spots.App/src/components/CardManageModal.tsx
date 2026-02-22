import { useState, useEffect } from 'react'
import Modal from './Modal'
import CardImage from './CardImage'
import { createCollectionEntry, deleteCollectionEntry, updateCollectionEntry, getSpots, getCardEntries } from '../api/client'
import type { CollectionEntry, Spot } from '../types'

interface CardInfo {
  id: number;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  rarity: string;
  typeLine?: string;
  imageUri?: string;
}

interface CardManageModalProps {
  card: CardInfo | null;
  onClose: () => void;
  onUpdate: () => void;
}

export default function CardManageModal({ card, onClose, onUpdate }: CardManageModalProps) {
  const [spots, setSpots] = useState<Spot[]>([])
  const [entries, setEntries] = useState<CollectionEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSpots().then(s => setSpots(flattenSpots(s))).catch(console.error)
  }, [])

  useEffect(() => {
    if (!card) return
    setLoading(true)
    getCardEntries(card.id)
      .then(setEntries)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [card?.id])

  const flattenSpots = (spots: Spot[], depth = 0): Spot[] => {
    const result: Spot[] = []
    for (const spot of spots) {
      result.push({ ...spot, name: '\u00A0\u00A0'.repeat(depth) + spot.name })
      if (spot.children?.length) result.push(...flattenSpots(spot.children, depth + 1))
    }
    return result
  }

  const standardEntries = entries.filter(e => !e.isFoil)
  const foilEntries = entries.filter(e => e.isFoil)

  const handleAdd = async (isFoil: boolean) => {
    if (!card) return
    setSaving(true)
    try {
      const created = await createCollectionEntry({
        cardId: card.id,
        isFoil,
        forTrade: false,
      })
      setEntries([...entries, created])
      onUpdate()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (entryId: number) => {
    setSaving(true)
    try {
      await deleteCollectionEntry(entryId)
      setEntries(entries.filter(e => e.id !== entryId))
      onUpdate()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateEntry = async (entryId: number, update: { spotId?: number; forTrade?: boolean }) => {
    try {
      const updated = await updateCollectionEntry(entryId, update)
      setEntries(entries.map(e => e.id === entryId ? updated : e))
      onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  if (!card) return null

  const renderEntryRow = (entry: CollectionEntry, index: number) => (
    <div key={entry.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/20">
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-5">{index + 1}.</span>

      <select
        value={entry.spotId ?? ''}
        onChange={e => handleUpdateEntry(entry.id, { spotId: e.target.value ? Number(e.target.value) : 0 })}
        className="input text-xs py-1 px-2 flex-1 min-w-0"
      >
        <option value="">No spot</option>
        {spots.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <button
        onClick={() => handleUpdateEntry(entry.id, { forTrade: !entry.forTrade })}
        className={`text-xs px-2 py-1 rounded transition-colors whitespace-nowrap ${
          entry.forTrade
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-600'
        }`}
      >
        {entry.forTrade ? 'For Trade' : 'Trade'}
      </button>

      <button
        onClick={() => handleRemove(entry.id)}
        disabled={saving}
        className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )

  return (
    <Modal isOpen={!!card} onClose={onClose} title="Manage Card" size="lg">
      <div className="flex gap-6">
        {/* Card Image */}
        <div className="flex-shrink-0">
          <CardImage src={card.imageUri} alt={card.name} size="normal" />
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-4 min-w-0">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{card.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {card.setName} #{card.collectorNumber}
            </p>
            <span className={`badge mt-1 ${
              card.rarity === 'mythic' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
              card.rarity === 'rare' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
              card.rarity === 'uncommon' ? 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300' :
              'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {card.rarity}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Standard copies */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Standard ({standardEntries.length})
                  </span>
                  <button
                    onClick={() => handleAdd(false)}
                    disabled={saving}
                    className="text-xs px-3 py-1 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    Add Standard
                  </button>
                </div>
                <div className="space-y-1.5">
                  {standardEntries.map((e, i) => renderEntryRow(e, i))}
                  {standardEntries.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic py-1">No standard copies</p>
                  )}
                </div>
              </div>

              {/* Foil copies */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                    Foil ({foilEntries.length})
                  </span>
                  <button
                    onClick={() => handleAdd(true)}
                    disabled={saving}
                    className="text-xs px-3 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                  >
                    Add Foil
                  </button>
                </div>
                <div className="space-y-1.5">
                  {foilEntries.map((e, i) => renderEntryRow(e, i))}
                  {foilEntries.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic py-1">No foil copies</p>
                  )}
                </div>
              </div>
            </>
          )}

          <button onClick={onClose} className="btn-secondary w-full">
            Done
          </button>
        </div>
      </div>
    </Modal>
  )
}
