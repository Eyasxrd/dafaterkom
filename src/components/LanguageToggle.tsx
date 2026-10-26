'use client'

import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useLanguageStore } from '@/lib/store'
import { Languages } from 'lucide-react'

interface LanguageToggleProps {
  compact?: boolean
  className?: string
}

export default function LanguageToggle({ compact = false, className = '' }: LanguageToggleProps) {
  const currentLocale = useLocale()
  const pathname = usePathname() || ''
  const { setLocale } = useLanguageStore()

  const switchLocale = (newLocale: string) => {
    if (newLocale === currentLocale) return

    setLocale(newLocale)

    if (typeof document !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`
      localStorage.setItem('locale', newLocale)
    }

    // Strip existing locale (/en or /ar) from the beginning of pathname
    const cleanPath = pathname.replace(/^\/(en|ar)(\/|$)/, '/')
    const targetPath = `/${newLocale}${cleanPath === '/' ? '' : cleanPath}`

    // Full document navigation ensures the App Router root layout re-renders
    // with the new locale, proper text direction (RTL/LTR), and new messages dictionary.
    window.location.href = targetPath
  }

  if (compact) {
    return (
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => switchLocale(currentLocale === 'en' ? 'ar' : 'en')}
        className={`w-9 h-9 rounded-xl border border-slate-200/80 dark:border-white/10 hover:bg-slate-100/70 dark:hover:bg-white/[0.06] flex items-center justify-center font-bold text-xs cursor-pointer transition-colors ${className}`}
        title={currentLocale === 'en' ? 'Switch to Arabic' : 'Switch to English'}
      >
        {currentLocale === 'en' ? 'AR' : 'EN'}
      </button>
    )
  }

  return (
    <div className={`flex items-center gap-1 p-0.5 rounded-xl glass-pill ${className}`} suppressHydrationWarning>
      <Languages className="w-3.5 h-3.5 ms-1.5 me-0.5 text-slate-400 shrink-0" />
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => switchLocale('en')}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          currentLocale === 'en'
            ? 'liquid-btn-primary shadow-sm text-white'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        suppressHydrationWarning
        onClick={() => switchLocale('ar')}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          currentLocale === 'ar'
            ? 'liquid-btn-primary shadow-sm text-white'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        عربي
      </button>
    </div>
  )
}