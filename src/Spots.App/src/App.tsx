import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import Layout from './components/Layout'
import { SettingsContext } from './components/SettingsContext'
import DashboardPage from './pages/DashboardPage'
import TrackersPage from './pages/TrackersPage'
import TrackerDetailPage from './pages/TrackerDetailPage'
import TrackerAddCardsPage from './pages/TrackerAddCardsPage'
import CollectionPage from './pages/CollectionPage'
import TradePage from './pages/TradePage'
import SpotsPage from './pages/SpotsPage'
import SettingsPage from './pages/SettingsPage'
import SetupPage from './pages/SetupPage'
import SearchPage from './pages/SearchPage'
import SetBrowserPage from './pages/SetBrowserPage'
import SetsListPage from './pages/SetsListPage'
import SpotDetailPage from './pages/SpotDetailPage'
import { getSettings, updateSettings } from './api/client'
import type { UserSettings } from './types'

export default function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings({ darkMode: true, defaultViewMode: 'visual', initialSetupComplete: false, gridColumns: 5 }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (settings?.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [settings?.darkMode])

  const updateGridColumns = useCallback((columns: number) => {
    setSettings(s => s ? { ...s, gridColumns: columns } : s)
    updateSettings({ gridColumns: columns }).catch(console.error)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (settings && !settings.initialSetupComplete) {
    return <SetupPage onComplete={() => setSettings({ ...settings, initialSetupComplete: true })} />
  }

  return (
    <SettingsContext.Provider value={{ settings: settings!, updateGridColumns }}>
      <Layout
        darkMode={settings?.darkMode ?? true}
        onToggleDarkMode={() => setSettings(s => s ? { ...s, darkMode: !s.darkMode } : s)}
      >
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/trackers" element={<TrackersPage />} />
          <Route path="/trackers/:id" element={<TrackerDetailPage />} />
          <Route path="/trackers/:id/add-cards" element={<TrackerAddCardsPage />} />
          <Route path="/collection" element={<CollectionPage />} />
          <Route path="/trade" element={<TradePage />} />
          <Route path="/spots" element={<SpotsPage />} />
          <Route path="/spots/:id" element={<SpotDetailPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/sets" element={<SetsListPage />} />
          <Route path="/sets/:code" element={<SetBrowserPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </SettingsContext.Provider>
  )
}
