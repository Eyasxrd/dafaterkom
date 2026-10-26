'use client'

import React, { useEffect } from 'react'
import SuperAdminPortal from '@/components/SuperAdminPortal'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useLocale } from 'next-intl'

import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import Footer from '@/components/Footer'

export default function SuperAdminPage() {
  const locale = useLocale() || 'en'

  useEffect(() => {
    document.title = 'SaaS Fleet Management | Dafaterkom Super Admin'
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors flex flex-col justify-between overflow-x-hidden">
      <div>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <Link
            href={`/${locale}`}
            prefetch={false}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-emerald-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop POS
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
        <SuperAdminPortal />
      </div>
      <Footer />
    </div>
  )
}
