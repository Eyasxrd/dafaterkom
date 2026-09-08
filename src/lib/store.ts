import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  ThemeDefinition, 
  PRESET_THEMES, 
  DEFAULT_THEME_ID, 
  applyThemeToDom 
} from '@/lib/theme-engine'

interface AuthState {
  user: {
    id: string
    name: string
    email: string
    role: string
  } | null
  isAuthenticated: boolean
  login: (user: { id: string; name: string; email: string; role: string }) => void
  logout: () => void
}

interface ThemeState {
  isDarkMode: boolean
  activeThemeId: string
  customThemes: ThemeDefinition[]
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
  setActiveTheme: (themeId: string) => void
  addCustomTheme: (theme: ThemeDefinition) => void
  deleteCustomTheme: (themeId: string) => void
  getAllThemes: () => ThemeDefinition[]
  getActiveTheme: () => ThemeDefinition
}

interface LanguageState {
  locale: string
  setLocale: (locale: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => {
        // Ping backend to clear cookie as well
        if (typeof window !== 'undefined') {
          fetch('/api/auth/login', { method: 'DELETE' }).catch(() => {})
        }
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: 'dafaterkom-auth-storage',
    }
  )
)

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDarkMode: false,
      activeThemeId: DEFAULT_THEME_ID,
      customThemes: [],

      getAllThemes: () => {
        const { customThemes } = get()
        return [...PRESET_THEMES, ...customThemes]
      },

      getActiveTheme: () => {
        const { activeThemeId, getAllThemes } = get()
        const all = getAllThemes()
        return all.find(t => t.id === activeThemeId) || PRESET_THEMES[0]
      },

      setActiveTheme: (themeId: string) => {
        const all = get().getAllThemes()
        const theme = all.find(t => t.id === themeId)
        if (theme) {
          applyThemeToDom(theme)
          set({ activeThemeId: themeId, isDarkMode: theme.isDark })
        }
      },

      addCustomTheme: (theme: ThemeDefinition) => {
        const markedTheme = { ...theme, isCustom: true }
        set((state) => {
          const updated = [...state.customThemes.filter(t => t.id !== theme.id), markedTheme]
          return { customThemes: updated }
        })
        get().setActiveTheme(markedTheme.id)
      },

      deleteCustomTheme: (themeId: string) => {
        set((state) => {
          const filtered = state.customThemes.filter(t => t.id !== themeId)
          const newActive = state.activeThemeId === themeId ? DEFAULT_THEME_ID : state.activeThemeId
          return { customThemes: filtered, activeThemeId: newActive }
        })
        get().setActiveTheme(get().activeThemeId)
      },

      toggleDarkMode: () => {
        const currentTheme = get().getActiveTheme()
        const newIsDark = !currentTheme.isDark
        // Look for matching dark/light counterpart or invert
        const counterpart = PRESET_THEMES.find(t => t.isDark === newIsDark)
        if (counterpart) {
          get().setActiveTheme(counterpart.id)
        } else {
          set({ isDarkMode: newIsDark })
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', newIsDark)
          }
        }
      },

      setDarkMode: (isDark: boolean) => {
        set({ isDarkMode: isDark })
        if (typeof document !== 'undefined') {
          if (isDark) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      },
    }),
    {
      name: 'dafaterkom_theme_storage',
      onRehydrateStorage: () => (state) => {
        if (state && typeof window !== 'undefined') {
          const active = state.getActiveTheme()
          applyThemeToDom(active)
        }
      }
    }
  )
)

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: 'en',
  setLocale: (locale) => set(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale)
    }
    return { locale }
  }),
}))