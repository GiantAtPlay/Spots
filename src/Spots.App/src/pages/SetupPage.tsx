import { useState, useEffect } from 'react'
import { getSets, importSet, updateSettings } from '../api/client'
import type { MtgSet } from '../types'

interface SetupPageProps {
  onComplete: () => void
}

export default function SetupPage({ onComplete }: SetupPageProps) {
  const [sets, setSets] = useState<MtgSet[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSets, setSelectedSets] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, currentSet: '' })

  useEffect(() => {
    getSets()
      .then(s => {
        setSets(s)
        // Pre-select the 5 most recent sets
        const recent = s.slice(0, 5).map(set => set.code)
        setSelectedSets(new Set(recent))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const toggleSet = (code: string) => {
    const next = new Set(selectedSets)
    if (next.has(code)) {
      next.delete(code)
    } else {
      next.add(code)
    }
    setSelectedSets(next)
  }

  const handleImport = async () => {
    setImporting(true)
    const codes = Array.from(selectedSets)
    setProgress({ current: 0, total: codes.length, currentSet: '' })

    for (let i = 0; i < codes.length; i++) {
      setProgress({ current: i + 1, total: codes.length, currentSet: codes[i] })
      try {
        await importSet(codes[i])
      } catch (e) {
        console.error(`Failed to import ${codes[i]}`, e)
      }
    }

    try {
      await updateSettings({ initialSetupComplete: true })
    } catch (e) {
      console.error(e)
    }

    onComplete()
  }

  const handleSkip = async () => {
    try {
      await updateSettings({ initialSetupComplete: true })
    } catch (e) {
      console.error(e)
    }
    onComplete()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Spots</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Select which MTG sets you'd like to download to get started.
          </p>
        </div>

        {importing ? (
          <div className="card p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Importing sets... ({progress.current}/{progress.total})
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Currently importing: {progress.currentSet.toUpperCase()}
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-4">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="card p-6 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Available Sets ({sets.length})
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedSets.size} selected
                </span>
              </div>
              <div className="max-h-96 overflow-y-auto space-y-1">
                {sets.map(s => (
                  <label
                    key={s.code}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedSets.has(s.code)
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSets.has(s.code)}
                      onChange={() => toggleSet(s.code)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {s.code.toUpperCase()} - {s.card_count} cards - {s.released_at}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-between">
              <button onClick={handleSkip} className="btn-secondary">
                Skip Setup
              </button>
              <button
                onClick={handleImport}
                disabled={selectedSets.size === 0}
                className="btn-primary"
              >
                Import {selectedSets.size} Set{selectedSets.size !== 1 ? 's' : ''}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
