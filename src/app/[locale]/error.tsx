'use client'

import React, { useEffect } from 'react'
import { AlertOctagon, RefreshCw, Home } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Runtime error caught by boundary:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
          <AlertOctagon className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight">Something went wrong</h1>
          <p className="text-xs text-zinc-500">
            We encountered an unexpected error. Your sales and offline orders are safe in local storage.
          </p>
        </div>
        {error?.message && (
          <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 text-left overflow-x-auto max-h-24">
            {error.message}
          </div>
        )}
        <div className="pt-2 flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            Reload App
          </button>
        </div>
      </div>
    </div>
  )
}
