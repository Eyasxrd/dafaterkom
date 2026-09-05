'use client'

import React from 'react'
import SuperAdminPortal from '@/components/SuperAdminPortal'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'

export default function SuperAdminPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
        <Link
          href="/"
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
  )
}
