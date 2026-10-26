'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/lib/store'
import { Sun, Moon } from 'lucide-react'

interface ThemeToggleProps {
  className?: string
}

export default function ThemeToggle({ className = 'h-8 w-8 p-0 rounded-xl' }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false)
  const { isDarkMode, toggleDarkMode, setDarkMode } = useThemeStore()
  const t = useTranslations('theme')

  useEffect(() => {
    setMounted(true)
    // Check localStorage and system preference on mount
    const savedMode = localStorage.getItem('darkMode')
    if (savedMode !== null) {
      setDarkMode(savedMode === 'true')
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true)
    }
  }, [setDarkMode])

  if (!mounted) {
    return <div className={className} />
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleDarkMode}
      className={`${className} cursor-pointer hover:bg-amber-500/10 hover:border-amber-400/40`}
      title={isDarkMode ? t('light') : t('dark')}
    >
      {isDarkMode ? (
        <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300 transition-transform hover:-rotate-12" />
      )}
    </Button>
  )
}