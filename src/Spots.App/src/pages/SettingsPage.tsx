import { useState, useEffect } from 'react'
import { getSettings, updateSettings, getSyncSettings, updateSyncSettings, getSyncStatus, triggerSync, resetCollection, downloadBackup } from '../api/client'
import type { UserSettings, SyncSettings, SyncStatus } from '../types'

export default function SettingsPage() {
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null)
  const [syncSettings, setSyncSettings] = useState<SyncSettings | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [resetConfirm, setResetConfirm] = useState('')
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    Promise.all([
      getSettings(),
      getSyncSettings(),
      getSyncStatus(),
    ])
      .then(([user, sync, status]) => {
        setUserSettings(user)
        setSyncSettings(sync)
        setSyncStatus(status)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Poll sync status while syncing
  useEffect(() => {
    if (!syncStatus?.isSyncing) return
    const interval = setInterval(async () => {
      try {
        const status = await getSyncStatus()
        setSyncStatus(status)
      } catch {
        // ignore
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [syncStatus?.isSyncing])

  const handleUpdateUserSetting = async (update: Partial<UserSettings>) => {
    try {
      const updated = await updateSettings(update)
      setUserSettings(updated)
    } catch (e) {
      console.error(e)
    }
  }

  const handleUpdateSyncSetting = async (update: Partial<SyncSettings>) => {
    try {
      const updated = await updateSyncSettings(update)
      setSyncSettings(updated)
    } catch (e) {
      console.error(e)
    }
  }

  const handleTriggerSync = async () => {
    try {
      const status = await triggerSync()
      setSyncStatus(status)
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
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* User Settings */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Display</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark themes</p>
          </div>
          <button
            onClick={() => handleUpdateUserSetting({ darkMode: !userSettings?.darkMode })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              userSettings?.darkMode ? 'bg-primary-600' : 'bg-gray-300'
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              userSettings?.darkMode ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Default View Mode</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Choose how cards are displayed by default</p>
          </div>
          <select
            value={userSettings?.defaultViewMode ?? 'visual'}
            onChange={e => handleUpdateUserSetting({ defaultViewMode: e.target.value as 'table' | 'visual' })}
            className="input w-32"
          >
            <option value="visual">Visual</option>
            <option value="table">Table</option>
          </select>
        </div>
      </div>

      {/* Data Management */}
      <div className="card p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Data Management</h2>

        {/* Data Sync */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">Data Sync</h3>

          {/* Sync Status */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {syncStatus?.isSyncing ? 'Syncing...' : 'Sync Status'}
                </p>
                {syncStatus?.syncStatus && (
                  <p className="text-sm text-primary-600 dark:text-primary-400">{syncStatus.syncStatus}</p>
                )}
                {syncStatus?.lastCardSync && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last card sync: {new Date(syncStatus.lastCardSync).toLocaleString()}
                  </p>
                )}
                {syncStatus?.lastPriceSync && (
                  <p className="text-xs text-gray-500">
                    Last price sync: {new Date(syncStatus.lastPriceSync).toLocaleString()}
                  </p>
                )}
              </div>
              <button
                onClick={handleTriggerSync}
                disabled={syncStatus?.isSyncing}
                className="btn-primary btn-sm"
              >
                {syncStatus?.isSyncing ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Syncing
                  </span>
                ) : 'Sync Now'}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Card Data Sync</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">How often to update card data</p>
            </div>
            <select
              value={syncSettings?.cardSyncSchedule ?? 'daily'}
              onChange={e => handleUpdateSyncSetting({ cardSyncSchedule: e.target.value })}
              className="input w-32"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Price Sync</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">How often to update card prices</p>
            </div>
            <select
              value={syncSettings?.priceSyncSchedule ?? 'weekly'}
              onChange={e => handleUpdateSyncSetting({ priceSyncSchedule: e.target.value })}
              className="input w-32"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="manual">Manual</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Recent Sets Window</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">How many months of recent sets to sync</p>
            </div>
            <input
              type="number"
              min={1}
              max={24}
              value={syncSettings?.cardSyncRecentMonths ?? 3}
              onChange={e => handleUpdateSyncSetting({ cardSyncRecentMonths: Number(e.target.value) })}
              className="input w-20 text-center"
            />
          </div>
        </div>

        {/* Database */}
        <div className="space-y-4">
          <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 pb-2">Database</h3>
          
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Back up your database to SQLite file. You can restore a backup by replacing your current database file.
            </p>
            
            <button
              onClick={downloadBackup}
              className="btn-sm bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Download Backup
            </button>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">To restore a backup:</h4>
            <ol className="text-sm text-blue-700 dark:text-blue-400 list-decimal list-inside space-y-1 ml-4">
              <li>Stop the application</li>
              <li>Replace <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">spots.db</code> with your backup file</li>
              <li>Restart the application</li>
            </ol>
            <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">
              The database file is located in the data directory. If using Docker, use <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">docker cp</code> to copy files.
            </p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card p-6 border-red-300 dark:border-red-800 space-y-4">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h2>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Reset Collection</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Delete all cards from your collection. This cannot be undone. Type <strong>RESET</strong> to confirm.
            </p>
            <input
              type="text"
              value={resetConfirm}
              onChange={e => setResetConfirm(e.target.value)}
              placeholder="Type RESET to confirm"
              className="input mt-2 max-w-xs"
            />
          </div>
          <button
            onClick={async () => {
              if (resetConfirm !== 'RESET') return
              setResetting(true)
              try {
                await resetCollection()
                setResetConfirm('')
                alert('Collection has been reset.')
              } catch (e) {
                console.error(e)
                alert('Failed to reset collection.')
              } finally {
                setResetting(false)
              }
            }}
            disabled={resetConfirm !== 'RESET' || resetting}
            className="btn-danger btn-sm mt-6 whitespace-nowrap"
          >
            {resetting ? 'Resetting...' : 'Reset Collection'}
          </button>
        </div>
      </div>
    </div>
  )
}