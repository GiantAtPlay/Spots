import { createContext, useContext } from 'react'
import type { UserSettings } from '../types'

interface SettingsContextValue {
  settings: UserSettings;
  updateGridColumns: (columns: number) => void;
}

export const SettingsContext = createContext<SettingsContextValue>({
  settings: { darkMode: true, defaultViewMode: 'visual', initialSetupComplete: true, gridColumns: 5 },
  updateGridColumns: () => {},
})

export function useSettings() {
  return useContext(SettingsContext)
}
