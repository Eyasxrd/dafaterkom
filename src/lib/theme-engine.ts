export interface ThemeColors {
  primary: string
  primaryForeground: string
  accent: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  border: string
  ring: string
  gradientStart: string
  gradientEnd: string
  mesh1: string
  mesh2: string
}

export interface ThemeDefinition {
  id: string
  name: string
  nameAr: string
  description: string
  isDark: boolean
  isCustom?: boolean
  colors: ThemeColors
}

export const PRESET_THEMES: ThemeDefinition[] = [
  {
    id: 'azure-cloud',
    name: 'Azure Cloud',
    nameAr: 'السحاب الأزرق',
    description: 'Modern vibrant blue and cyan gradient, optimized for fast-paced retail and cafes.',
    isDark: false,
    colors: {
      primary: '#2563eb',
      primaryForeground: '#ffffff',
      accent: '#06b6d4',
      background: '#f8fafc',
      foreground: '#0f172a',
      card: 'rgba(255, 255, 255, 0.75)',
      cardForeground: '#0f172a',
      border: 'rgba(226, 232, 240, 0.8)',
      ring: '#3b82f6',
      gradientStart: '#2563eb',
      gradientEnd: '#06b6d4',
      mesh1: 'rgba(59, 130, 246, 0.12)',
      mesh2: 'rgba(14, 165, 233, 0.1)'
    }
  },
  {
    id: 'matcha-green',
    name: 'Emerald Matcha',
    nameAr: 'ماتشا الزمرد',
    description: 'Earthy green, sage, and mint tones perfect for organic bakeries, juice bars, and cafes.',
    isDark: false,
    colors: {
      primary: '#059669',
      primaryForeground: '#ffffff',
      accent: '#10b981',
      background: '#f6fbf8',
      foreground: '#064e3b',
      card: 'rgba(255, 255, 255, 0.8)',
      cardForeground: '#064e3b',
      border: 'rgba(209, 250, 229, 0.8)',
      ring: '#10b981',
      gradientStart: '#059669',
      gradientEnd: '#34d399',
      mesh1: 'rgba(16, 185, 129, 0.14)',
      mesh2: 'rgba(5, 150, 105, 0.08)'
    }
  },
  {
    id: 'warm-espresso',
    name: 'Warm Espresso & Amber',
    nameAr: 'إسبريسو دافئ وعنبر',
    description: 'Artisan roasted amber and caramel tones designed for specialty coffee shops and bakeries.',
    isDark: false,
    colors: {
      primary: '#d97706',
      primaryForeground: '#ffffff',
      accent: '#f59e0b',
      background: '#fffbf5',
      foreground: '#451a03',
      card: 'rgba(255, 255, 255, 0.85)',
      cardForeground: '#451a03',
      border: 'rgba(254, 243, 199, 0.8)',
      ring: '#f59e0b',
      gradientStart: '#b45309',
      gradientEnd: '#f59e0b',
      mesh1: 'rgba(217, 119, 6, 0.14)',
      mesh2: 'rgba(245, 158, 11, 0.09)'
    }
  },
  {
    id: 'rose-velvet',
    name: 'Rose Velvet',
    nameAr: 'مخمل الورود',
    description: 'Sophisticated berry, rose, and pink accents suited for patisseries, floral shops, and dessert lounges.',
    isDark: false,
    colors: {
      primary: '#e11d48',
      primaryForeground: '#ffffff',
      accent: '#f43f5e',
      background: '#fff8f9',
      foreground: '#4c0519',
      card: 'rgba(255, 255, 255, 0.82)',
      cardForeground: '#4c0519',
      border: 'rgba(255, 228, 230, 0.8)',
      ring: '#fb7185',
      gradientStart: '#e11d48',
      gradientEnd: '#fb7185',
      mesh1: 'rgba(225, 29, 72, 0.12)',
      mesh2: 'rgba(244, 63, 94, 0.08)'
    }
  },
  {
    id: 'midnight-neon',
    name: 'Midnight Cyber',
    nameAr: 'سايبر منتصف الليل',
    description: 'Deep OLED black background with vibrant electric cyan and purple glows for lounge bars and modern spots.',
    isDark: true,
    colors: {
      primary: '#38bdf8',
      primaryForeground: '#090d16',
      accent: '#818cf8',
      background: '#040711',
      foreground: '#f8fafc',
      card: 'rgba(11, 17, 32, 0.75)',
      cardForeground: '#f8fafc',
      border: 'rgba(56, 189, 248, 0.15)',
      ring: '#38bdf8',
      gradientStart: '#0284c7',
      gradientEnd: '#6366f1',
      mesh1: 'rgba(56, 189, 248, 0.18)',
      mesh2: 'rgba(99, 102, 241, 0.12)'
    }
  },
  {
    id: 'slate-minimal',
    name: 'Monochrome Slate',
    nameAr: 'رمادي كلاسيكي',
    description: 'High-contrast monochromatic grayscale for fine dining, luxury apparel, and minimalist boutiques.',
    isDark: true,
    colors: {
      primary: '#94a3b8',
      primaryForeground: '#0f172a',
      accent: '#cbd5e1',
      background: '#0f172a',
      foreground: '#f8fafc',
      card: 'rgba(30, 41, 59, 0.65)',
      cardForeground: '#f8fafc',
      border: 'rgba(255, 255, 255, 0.1)',
      ring: '#94a3b8',
      gradientStart: '#475569',
      gradientEnd: '#94a3b8',
      mesh1: 'rgba(148, 163, 184, 0.12)',
      mesh2: 'rgba(203, 213, 225, 0.06)'
    }
  }
]

export const DEFAULT_THEME_ID = 'azure-cloud'

/**
 * Applies a theme to the DOM dynamically by modifying CSS Custom Properties
 */
export function applyThemeToDom(theme: ThemeDefinition): void {
  if (typeof window === 'undefined') return

  const root = document.documentElement

  // Set dark class
  if (theme.isDark) {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // Set CSS variables
  root.style.setProperty('--primary', theme.colors.primary)
  root.style.setProperty('--primary-foreground', theme.colors.primaryForeground)
  root.style.setProperty('--background', theme.colors.background)
  root.style.setProperty('--foreground', theme.colors.foreground)
  root.style.setProperty('--card', theme.colors.card)
  root.style.setProperty('--card-foreground', theme.colors.cardForeground)
  root.style.setProperty('--border', theme.colors.border)
  root.style.setProperty('--ring', theme.colors.ring)
  root.style.setProperty('--liquid-gradient', `linear-gradient(135deg, ${theme.colors.gradientStart} 0%, ${theme.colors.primary} 50%, ${theme.colors.gradientEnd} 100%)`)
  root.style.setProperty('--mesh-color-1', theme.colors.mesh1)
  root.style.setProperty('--mesh-color-2', theme.colors.mesh2)

  try {
    localStorage.setItem('dafaterkom_active_theme_id', theme.id)
    localStorage.setItem('darkMode', String(theme.isDark))
  } catch (e) {
    console.error('Failed to save active theme in localStorage:', e)
  }
}
