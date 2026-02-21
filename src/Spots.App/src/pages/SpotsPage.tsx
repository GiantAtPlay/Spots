import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSpots, createSpot, updateSpot, deleteSpot } from '../api/client'
import Modal from '../components/Modal'
import type { Spot } from '../types'

const SPOT_TYPES = ['Folder', 'Bulk box', 'Deck', 'Other']

export default function SpotsPage() {
  const [spots, setSpots] = useState<Spot[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editSpot, setEditSpot] = useState<Spot | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [parentId, setParentId] = useState<number | undefined>()

  const loadSpots = () => {
    setLoading(true)
    getSpots()
      .then(setSpots)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadSpots() }, [])

  const flattenForSelect = (spots: Spot[], depth = 0): { id: number; label: string }[] => {
    const result: { id: number; label: string }[] = []
    for (const spot of spots) {
      result.push({ id: spot.id, label: '  '.repeat(depth) + spot.name })
      if (spot.children?.length) {
        result.push(...flattenForSelect(spot.children, depth + 1))
      }
    }
    return result
  }

  const handleCreate = async () => {
    try {
      await createSpot({ name, type, parentSpotId: parentId })
      setShowCreate(false)
      setName('')
      setType('')
      setParentId(undefined)
      loadSpots()
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdate = async () => {
    if (!editSpot) return
    try {
      await updateSpot(editSpot.id, { name, type })
      setEditSpot(null)
      loadSpots()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this spot?')) return
    try {
      await deleteSpot(id)
      loadSpots()
    } catch (e) {
      alert('Cannot delete spot with children. Delete children first.')
    }
  }

  const openEdit = (spot: Spot) => {
    setEditSpot(spot)
    setName(spot.name)
    setType(spot.type)
  }

  const renderSpot = (spot: Spot, depth = 0) => (
    <div key={spot.id}>
      <div
        className={`flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${
          depth > 0 ? 'border-l-2 border-gray-200 dark:border-gray-700' : ''
        }`}
        style={{ paddingLeft: `${16 + depth * 24}px` }}
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {spot.type === 'Folder' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            ) : spot.type === 'Deck' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            ) : spot.type === 'Bulk box' ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            )}
          </svg>
          <Link to={`/spots/${spot.id}`} className="hover:opacity-80 transition-opacity">
            <p className="font-medium text-gray-900 dark:text-white">{spot.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {spot.type} {spot.cardCount > 0 ? `- ${spot.cardCount} cards` : ''}
            </p>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setParentId(spot.id)
              setShowCreate(true)
            }}
            className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            title="Add child spot"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={() => openEdit(spot)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => handleDelete(spot.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      {spot.children?.map(child => renderSpot(child, depth + 1))}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Spots</h1>
        <button onClick={() => { setParentId(undefined); setShowCreate(true) }} className="btn-primary">
          New Spot
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : spots.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            No spots yet. Create locations to organize your collection.
          </p>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            Create Your First Spot
          </button>
        </div>
      ) : (
        <div className="card divide-y divide-gray-200 dark:divide-gray-700">
          {spots.map(spot => renderSpot(spot))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setParentId(undefined) }} title="Create Spot">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., DTK folder or Naya Counters deck"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="input">
              <option value="">Please select...</option>
              {SPOT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          {parentId && (
            <p className="text-sm text-gray-500">
              Creating inside: {flattenForSelect(spots).find(s => s.id === parentId)?.label}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowCreate(false); setParentId(undefined) }} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} disabled={!name || !type} className="btn-primary">Create</button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editSpot} onClose={() => setEditSpot(null)} title="Edit Spot">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="input">
              {SPOT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditSpot(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleUpdate} disabled={!name} className="btn-primary">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
