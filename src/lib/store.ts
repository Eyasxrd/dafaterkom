import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  toggleDarkMode: () => void
  setDarkMode: (isDark: boolean) => void
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
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'dafaterkom-auth-storage',
    }
  )
)

const getInitialDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const saved = localStorage.getItem('darkMode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

export const useThemeStore = create<ThemeState>((set) => ({
  isDarkMode: getInitialDarkMode(),
  toggleDarkMode: () => set((state) => {
    const newMode = !state.isDarkMode
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('darkMode', String(newMode))
        if (newMode) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      } catch {}
    }
    return { isDarkMode: newMode }
  }),
  setDarkMode: (isDark) => set(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('darkMode', String(isDark))
        if (isDark) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      } catch {}
    }
    return { isDarkMode: isDark }
  }),
}))

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: 'en',
  setLocale: (locale) => set(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale)
    }
    return { locale }
  }),
}))