import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSets } from '../api/client'
import type { MtgSet } from '../types'

export default function SetsListPage() {
  const [sets, setSets] = useState<MtgSet[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    getSets()
      .then(setSets)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const setTypes = Array.from(new Set(sets.map(s => s.set_type))).sort()

  const filtered = sets.filter(s => {
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || s.set_type === typeFilter
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <button onClick={() => window.history.back()} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Browse Sets</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {filtered.length} sets available
        </p>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search sets by name or code..."
          className="input flex-1 max-w-md"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="input w-44"
        >
          <option value="all">All Types</option>
          {setTypes.map(t => (
            <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="card divide-y divide-gray-200 dark:divide-gray-700">
        {filtered.map(s => (
          <Link
            key={s.code}
            to={`/sets/${s.code}`}
            className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {s.icon_svg_uri && (
                <img src={s.icon_svg_uri} alt="" className="w-6 h-6 flex-shrink-0 dark:invert" />
              )}
              <div className="min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {s.code.toUpperCase()} - {s.set_type.replace(/_/g, ' ')} - {s.released_at}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {s.card_count} cards
              </span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No sets match your search.
          </div>
        )}
      </div>
    </div>
  )
}
