import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTrackers, createTracker, deleteTracker, updateTracker, getSets } from '../api/client'
import ProgressBar from '../components/ProgressBar'
import Modal from '../components/Modal'
import type { Tracker, MtgSet } from '../types'

export default function TrackersPage() {
  const [trackers, setTrackers] = useState<Tracker[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [sets, setSets] = useState<MtgSet[]>([])
  const [creating, setCreating] = useState(false)
  const [editingTracker, setEditingTracker] = useState<Tracker | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state (shared for create)
  const [name, setName] = useState('')
  const [setCode, setSetCode] = useState('')
  const [trackFoil, setTrackFoil] = useState(false)
  const [trackNonFoil, setTrackNonFoil] = useState(true)
  const [isCustom, setIsCustom] = useState(false)

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editTrackFoil, setEditTrackFoil] = useState(false)
  const [editTrackNonFoil, setEditTrackNonFoil] = useState(true)

  const loadTrackers = () => {
    setLoading(true)
    getTrackers()
      .then(setTrackers)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTrackers() }, [])

  const handleOpenCreate = async () => {
    setShowCreate(true)
    if (sets.length === 0) {
      try {
        const s = await getSets()
        setSets(s)
      } catch (e) {
        console.error(e)
      }
    }
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createTracker({
        name: isCustom ? name : (sets.find(s => s.code === setCode)?.name ?? name),
        setCode: isCustom ? undefined : setCode,
        trackFoil,
        trackNonFoil,
      })
      setShowCreate(false)
      setName('')
      setSetCode('')
      setTrackFoil(false)
      setTrackNonFoil(true)
      loadTrackers()
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this tracker?')) return
    try {
      await deleteTracker(id)
      loadTrackers()
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenEdit = (tracker: Tracker) => {
    setEditingTracker(tracker)
    setEditName(tracker.name)
    setEditTrackFoil(tracker.trackFoil)
    setEditTrackNonFoil(tracker.trackNonFoil)
  }

  const handleSaveEdit = async () => {
    if (!editingTracker) return
    setSaving(true)
    try {
      await updateTracker(editingTracker.id, {
        name: editName,
        trackFoil: editTrackFoil,
        trackNonFoil: editTrackNonFoil,
      })
      setEditingTracker(null)
      loadTrackers()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trackers</h1>
        <button onClick={handleOpenCreate} className="btn-primary">
          New Tracker
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : trackers.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No trackers yet. Create one from an MTG set or start a custom tracker.
          </p>
          <button onClick={handleOpenCreate} className="btn-primary">
            Create Your First Tracker
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {trackers.map(tracker => (
            <div key={tracker.id} className="card p-4">
              <div className="flex items-start justify-between">
                <Link
                  to={`/trackers/${tracker.id}`}
                  className="flex-1 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{tracker.name}</h3>
                    {tracker.setCode && (
                      <span className="badge bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                        {tracker.setCode.toUpperCase()}
                      </span>
                    )}
                    {!tracker.isCollecting && (
                      <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                        Not collecting
                      </span>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    {tracker.trackFoil && tracker.trackNonFoil ? (
                      <>
                        <ProgressBar
                          percentage={tracker.completionPercentage}
                          label={`Overall (${tracker.collectedCards}/${tracker.totalCards * 2})`}
                          size="sm"
                        />
                        <ProgressBar
                          percentage={tracker.nonFoilCompletionPercentage}
                          label={`Non-Foil (${Math.round(tracker.nonFoilCompletionPercentage * tracker.totalCards / 100)}/${tracker.totalCards})`}
                          size="sm"
                        />
                        <ProgressBar
                          percentage={tracker.foilCompletionPercentage}
                          label={`Foil (${Math.round(tracker.foilCompletionPercentage * tracker.totalCards / 100)}/${tracker.totalCards})`}
                          size="sm"
                          color="bg-amber-500"
                        />
                      </>
                    ) : (
                      <ProgressBar
                        percentage={tracker.completionPercentage}
                        label={`Completion (${tracker.collectedCards}/${tracker.totalCards})`}
                        size="sm"
                        color={tracker.trackFoil ? 'bg-amber-500' : 'bg-primary-600'}
                      />
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-1 ml-4">
                  <button
                    onClick={() => handleOpenEdit(tracker)}
                    className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    title="Edit tracker"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(tracker.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete tracker"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Tracker" size="lg">
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => setIsCustom(false)}
              className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                !isCustom
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              From Set
            </button>
            <button
              onClick={() => setIsCustom(true)}
              className={`flex-1 p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                isCustom
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
              }`}
            >
              Custom
            </button>
          </div>

          {isCustom ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tracker Name
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="My Custom Tracker"
                className="input"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Set
              </label>
              <select
                value={setCode}
                onChange={e => setSetCode(e.target.value)}
                className="input"
              >
                <option value="">Choose a set...</option>
                {sets.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.code.toUpperCase()}) - {s.card_count} cards
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={trackNonFoil}
                onChange={e => setTrackNonFoil(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Track Non-Foil</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={trackFoil}
                onChange={e => setTrackFoil(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Track Foil</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowCreate(false)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || (isCustom ? !name : !setCode)}
              className="btn-primary"
            >
              {creating ? 'Creating...' : 'Create Tracker'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingTracker} onClose={() => setEditingTracker(null)} title="Edit Tracker">
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

          {editingTracker?.setCode && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set: {editingTracker.setCode.toUpperCase()} (cannot be changed)
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
            <button onClick={() => setEditingTracker(null)} className="btn-secondary">
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={saving || !editName}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
