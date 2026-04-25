import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'zh-TW', label: 'Traditional Chinese', nativeLabel: '繁體中文' },
]

export const useSettingsStore = create(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'amazing-trip-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
