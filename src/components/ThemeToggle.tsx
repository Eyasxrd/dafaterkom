'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/lib/store'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const { isDarkMode, toggleDarkMode, setDarkMode } = useThemeStore()
  const t = useTranslations('theme')

  useEffect(() => {
    // Check localStorage and system preference on mount
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true')
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true)
    }
  }, [setDarkMode])

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleDarkMode}
      className="w-9 h-9 p-0 rounded-xl"
      title={isDarkMode ? t('light') : t('dark')}
    >
      {isDarkMode ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12" />
      )}
    </Button>
  )
}