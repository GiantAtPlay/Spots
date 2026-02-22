import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../api/client'
import ProgressBar from '../components/ProgressBar'
import type { Dashboard } from '../types'

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard()
      .then(setDashboard)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!dashboard) {
    return <div className="text-center py-12 text-gray-500">Failed to load dashboard</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Cards</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {dashboard.totalCards.toLocaleString()}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Unique Cards</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {dashboard.uniqueCards.toLocaleString()}
          </p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Approx. Value (EUR)</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {dashboard.approxValueEur.toLocaleString('en-EU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Near-complete trackers */}
      {dashboard.nearCompleteTrackers.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Nearest to Complete
          </h2>
          <div className="space-y-4">
            {dashboard.nearCompleteTrackers.map(tracker => {
              const totalNeeded = tracker.trackFoil && tracker.trackNonFoil
                ? tracker.totalCards * 2
                : tracker.totalCards
              return (
                <Link
                  key={tracker.trackerId}
                  to={`/trackers/${tracker.trackerId}`}
                  className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-3 -mx-3 transition-colors"
                >
                  <ProgressBar
                    percentage={tracker.completionPercentage}
                    label={`${tracker.trackerName} (${tracker.collectedCards}/${totalNeeded})`}
                    size="sm"
                    color={tracker.trackFoil && !tracker.trackNonFoil ? 'bg-amber-500' : 'bg-primary-600'}
                  />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* All tracker progress */}
      {dashboard.trackerProgress.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            All Trackers
          </h2>
          <div className="space-y-4">
            {dashboard.trackerProgress.map(tracker => (
              <Link
                key={tracker.trackerId}
                to={`/trackers/${tracker.trackerId}`}
                className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg p-3 -mx-3 transition-colors"
              >
                <div className="space-y-1">
                  {tracker.trackFoil && tracker.trackNonFoil ? (
                    <>
                      <ProgressBar
                        percentage={tracker.completionPercentage}
                        label={`${tracker.trackerName} - Overall (${tracker.collectedCards}/${tracker.totalCards * 2})`}
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
                      label={`${tracker.trackerName} (${tracker.collectedCards}/${tracker.totalCards})`}
                      size="sm"
                      color={tracker.trackFoil ? 'bg-amber-500' : 'bg-primary-600'}
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {dashboard.trackerProgress.length === 0 && (
        <div className="card p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No trackers yet. Create one to start tracking your collection!</p>
          <Link to="/trackers" className="btn-primary">
            Create Tracker
          </Link>
        </div>
      )}
    </div>
  )
}
