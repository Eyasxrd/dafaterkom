'use client'

import { useLanguageStore } from '@/lib/store'
import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Languages } from 'lucide-react'

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguageStore()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const switchLocale = (newLocale: string) => {
    startTransition(() => {
      setLocale(newLocale)
      // Remove the current locale from pathname and add the new one
      const segments = pathname.split('/')
      const segmentsWithoutLocale = segments.filter(segment => segment !== locale)
      const newPathname = `/${newLocale}${segmentsWithoutLocale.join('/') || ''}`
      router.push(newPathname)
    })
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-xl glass-pill">
      <Languages className="w-3.5 h-3.5 ml-1.5 mr-0.5 text-slate-400" />
      <button
        onClick={() => switchLocale('en')}
        disabled={isPending}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          locale === 'en'
            ? 'liquid-btn-primary shadow-sm'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => switchLocale('ar')}
        disabled={isPending}
        className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          locale === 'ar'
            ? 'liquid-btn-primary shadow-sm'
            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        عربي
      </button>
    </div>
  )
}