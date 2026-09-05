'use client'

import React from 'react'
import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
          <FileQuestion className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight">404 - Page Not Found</h1>
          <p className="text-xs text-zinc-500">
            The screen or resource you are looking for might have been moved, or does not exist.
          </p>
        </div>
        <div className="pt-2 flex flex-col gap-2">
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <Home className="w-4 h-4" />
            Back to Dafaterkom POS
          </Link>
        </div>
      </div>
    </div>
  )
}
