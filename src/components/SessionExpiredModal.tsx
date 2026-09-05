'use client'

import React, { useState } from 'react'
import { Lock, LogIn, Check } from 'lucide-react'
import { useAuthStore } from '@/lib/store'

interface SessionExpiredModalProps {
  isOpen: boolean
  onSuccess: () => void
}

export default function SessionExpiredModal({ isOpen, onSuccess }: SessionExpiredModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

  if (!isOpen) return null

  const handleReLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(joinCode ? { joinCode } : { email, password })
      })

      const data = await res.json()
      if (res.ok && data.user) {
        login(data.user)
        onSuccess()
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch {
      setError('Network error during re-authentication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-zinc-900 dark:text-zinc-100">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>

        <div className="text-center">
          <h3 className="font-bold text-lg">Session Expired</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Your current cart is preserved. Please re-authenticate to continue taking orders.
          </p>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleReLogin} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              6-Digit Join Code (Fast)
            </label>
            <input
              type="text"
              placeholder="e.g. 100001"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-center font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
            <span className="flex-shrink mx-2 text-[10px] text-zinc-400 uppercase font-semibold">Or Email / Password</span>
            <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
          </div>

          <div>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20"
          >
            <LogIn className="w-3.5 h-3.5" />
            {loading ? 'Re-authenticating...' : 'Resume Session'}
          </button>
        </form>
      </div>
    </div>
  )
}
