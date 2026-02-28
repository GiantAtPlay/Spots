import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getTracker, getTrackerCards, toggleExcludeCard, exportTrackerMissing, updateTracker } from '../api/client'
import ProgressBar from '../components/ProgressBar'
import ViewToggle from '../components/ViewToggle'
import CardImage from '../components/CardImage'
import CardHoverPreview from '../components/CardHoverPreview'
import GridSizeSlider from '../components/GridSizeSlider'
import CardManageModal from '../components/CardManageModal'
import Modal from '../components/Modal'
import { useSettings } from '../components/SettingsContext'
import type { Tracker, TrackerCard, ViewMode } from '../types'

export default function TrackerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [tracker, setTracker] = useState<Tracker | null>(null)
  const [cards, setCards] = useState<TrackerCard[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('visual')
  const [filter, setFilter] = useState<string>('all')
  const { settings, updateGridColumns } = useSettings()
  const [selectedCard, setSelectedCard] = useState<TrackerCard | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editTrackFoil, setEditTrackFoil] = useState(false)
  const [editTrackNonFoil, setEditTrackNonFoil] = useState(true)

  const trackerId = Number(id)

  const load = async () => {
    setLoading(true)
    try {
      const [t, c] = await Promise.all([
        getTracker(trackerId),
        getTrackerCards(trackerId),
      ])
      setTracker(t)
      setCards(c)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  useEffect(() => { load() }, [trackerId])

  const handleToggleExclude = async (cardId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      await toggleExcludeCard(trackerId, cardId)
      // Optimistic update for cards list
      setCards(cards.map(c =>
        c.cardId === cardId ? { ...c, isExcluded: !c.isExcluded } : c
      ))
      // Re-fetch tracker to update totals (excluded cards affect counts)
      const updatedTracker = await getTracker(trackerId)
      setTracker(updatedTracker)
    } catch (e) {
      console.error(e)
    }
  }

  const handleExport = async () => {
    const text = await exportTrackerMissing(trackerId)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${tracker?.name ?? 'tracker'}-missing.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleToggleCollecting = async () => {
    if (!tracker) return
    try {
      await updateTracker(trackerId, { isCollecting: !tracker.isCollecting })
      setTracker({ ...tracker, isCollecting: !tracker.isCollecting })
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenEdit = () => {
    if (!tracker) return
    setEditName(tracker.name)
    setEditTrackFoil(tracker.trackFoil)
    setEditTrackNonFoil(tracker.trackNonFoil)
    setShowEdit(true)
  }

  const handleSaveEdit = async () => {
    if (!tracker) return
    try {
      const updated = await updateTracker(trackerId, {
        name: editName,
        trackFoil: editTrackFoil,
        trackNonFoil: editTrackNonFoil,
      })
      setTracker(updated)
      setShowEdit(false)
    } catch (e) {
      console.error(e)
    }
  }

  const filteredCards = cards.filter(c => {
    switch (filter) {
      case 'collected': return (c.isCollected || c.isFoilCollected) && !c.isExcluded
      case 'missing': return !c.isCollected && !c.isFoilCollected && !c.isExcluded
      case 'missing-std': return !c.isCollected && !c.isExcluded
      case 'missing-foil': return !c.isFoilCollected && !c.isExcluded
      case 'excluded': return c.isExcluded
      default: return true
    }
  })

  const tracksBoth = tracker?.trackFoil && tracker?.trackNonFoil

  if (initialLoad) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!tracker) {
    return <div className="text-center py-12 text-gray-500">Tracker not found</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div>
            <button onClick={() => navigate('/trackers')} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
              &larr; Back to Trackers
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{tracker.name}</h1>
            {tracker.setCode && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Set: {tracker.setCode.toUpperCase()}
              </p>
            )}
          </div>
          {loading && (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
          )}
        </div>
        <div className="flex gap-2">
          {!tracker.setCode && (
            <Link to={`/trackers/${tracker.id}/add-cards`} className="btn-primary btn-sm">
              Add Cards
            </Link>
          )}
          <button onClick={handleOpenEdit} className="btn-secondary btn-sm">
            Edit
          </button>
          <button onClick={handleToggleCollecting} className="btn-secondary btn-sm">
            {tracker.isCollecting ? 'Mark Not Collecting' : 'Mark Collecting'}
          </button>
          <button onClick={handleExport} className="btn-secondary btn-sm">
            Export Missing
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="card p-4 space-y-3">
        {tracksBoth ? (
          <>
            <ProgressBar percentage={tracker.completionPercentage} label={`Overall (${tracker.collectedCards}/${tracker.totalCards * 2})`} />
            <ProgressBar percentage={tracker.nonFoilCompletionPercentage} label={`Non-Foil (${Math.round(tracker.nonFoilCompletionPercentage * tracker.totalCards / 100)}/${tracker.totalCards})`} size="sm" />
            <ProgressBar percentage={tracker.foilCompletionPercentage} label={`Foil (${Math.round(tracker.foilCompletionPercentage * tracker.totalCards / 100)}/${tracker.totalCards})`} size="sm" color="bg-amber-500" />
          </>
        ) : (
          <ProgressBar
            percentage={tracker.completionPercentage}
            label={`Completion (${tracker.collectedCards}/${tracker.totalCards})`}
            color={tracker.trackFoil ? 'bg-amber-500' : 'bg-primary-600'}
          />
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {(() => {
            const filters: { key: string; label: string; count: number }[] = [
              { key: 'all', label: 'All', count: cards.length },
              { key: 'collected', label: 'Collected', count: cards.filter(c => (c.isCollected || c.isFoilCollected) && !c.isExcluded).length },
            ]
            if (tracksBoth) {
              filters.push({ key: 'missing-std', label: 'Missing Std', count: cards.filter(c => !c.isCollected && !c.isExcluded).length })
              filters.push({ key: 'missing-foil', label: 'Missing Foil', count: cards.filter(c => !c.isFoilCollected && !c.isExcluded).length })
            } else {
              filters.push({ key: 'missing', label: 'Missing', count: cards.filter(c => !c.isCollected && !c.isFoilCollected && !c.isExcluded).length })
            }
            filters.push({ key: 'excluded', label: 'Excluded', count: cards.filter(c => c.isExcluded).length })
            return filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`btn-sm rounded-lg ${filter === f.key ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'btn-secondary'}`}
              >
                {f.label} ({f.count})
              </button>
            ))
          })()}
        </div>
        <div className="flex items-center gap-4">
          {viewMode === 'visual' && (
            <GridSizeSlider columns={settings.gridColumns} onChange={updateGridColumns} />
          )}
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Cards */}
      {viewMode === 'visual' ? (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${settings.gridColumns}, minmax(0, 1fr))` }}>
          {filteredCards.map(card => (
            <div
              key={card.id}
              className={`relative group cursor-pointer ${card.isExcluded ? 'opacity-40' : ''} ${card.isCollected || card.isFoilCollected ? '' : 'grayscale-[50%]'}`}
              onClick={() => setSelectedCard(card)}
            >
              <CardImage
                src={card.imageUri ?? card.imageUriSmall}
                alt={card.cardName}
                size="fluid"
              />
              {/* Collection status badges — check marks */}
              <div className="absolute top-2 right-2 flex gap-1">
                {card.isCollected && (
                  <span className="bg-black/70 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
                {card.isFoilCollected && (
                  <span className="bg-amber-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium truncate">{card.cardName}</p>
                <p className="text-gray-300 text-xs">#{card.collectorNumber}</p>
                <button
                  onClick={(e) => handleToggleExclude(card.cardId, e)}
                  className="text-xs text-gray-300 hover:text-white mt-1"
                >
                  {card.isExcluded ? 'Include' : 'Exclude'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 w-12">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400 w-24">Rarity</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-16">Std</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-16">Foil</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400 w-24">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400 w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCards.map(card => (
                <CardHoverPreview key={card.id} imageUri={card.imageUri} cardName={card.cardName} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer ${card.isExcluded ? 'opacity-40' : ''}`} onClick={() => setSelectedCard(card)}>
                    <td className="px-4 py-3 text-gray-500">{card.collectorNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white truncate">{card.cardName}</td>
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
                    <td className="px-4 py-3 text-center">
                      {card.isCollected ? (
                        <span className="inline-flex w-5 h-5 rounded-full bg-green-500 text-white items-center justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {card.isFoilCollected ? (
                        <span className="inline-flex w-5 h-5 rounded-full bg-amber-500 text-white items-center justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {card.isExcluded ? (
                        <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Excluded</span>
                      ) : tracksBoth ? (
                        card.isCollected && card.isFoilCollected ? (
                          <span className="badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Collected</span>
                        ) : card.isCollected || card.isFoilCollected ? (
                          <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Partial</span>
                        ) : (
                          <span className="badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Missing</span>
                        )
                      ) : (tracker.trackFoil ? card.isFoilCollected : card.isCollected) ? (
                        <span className="badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Collected</span>
                      ) : (
                        <span className="badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Missing</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleExclude(card.cardId)}
                        className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {card.isExcluded ? 'Include' : 'Exclude'}
                      </button>
                    </td>
                </CardHoverPreview>
              ))}
            </tbody>
          </table>
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
            imageUri: selectedCard.imageUri,
          }}
          onClose={() => { setSelectedCard(null); load() }}
          onUpdate={() => load()}
        />
      )}

      {/* Edit Tracker Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Tracker">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tracker Name
            </label>
            <input
              type="text"
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="input"
            />
          </div>

          {tracker.setCode && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set: {tracker.setCode.toUpperCase()} (cannot be changed)
            </p>
          )}

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editTrackNonFoil}
                onChange={e => setEditTrackNonFoil(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Track Non-Foil</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editTrackFoil}
                onChange={e => setEditTrackFoil(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Track Foil</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowEdit(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={!editName}
              className="btn-primary"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
