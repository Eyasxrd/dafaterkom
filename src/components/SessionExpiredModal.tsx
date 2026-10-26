'use client'

import React, { useState } from 'react'
import { Lock, LogIn, KeyRound, ShieldCheck, Smartphone } from 'lucide-react'
import { useAuthStore } from '@/lib/store'

interface SessionExpiredModalProps {
  isOpen: boolean
  onSuccess: () => void
}

export default function SessionExpiredModal({ isOpen, onSuccess }: SessionExpiredModalProps) {
  const [authMethod, setAuthMethod] = useState<'password' | 'authenticator'>('password')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

  if (!isOpen) return null

  const handleReLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const payload: any = {
        authMethod,
        identifier: identifier.trim(),
        employeeNumber: identifier.trim()
      }

      if (authMethod === 'password') {
        payload.password = password
      } else {
        payload.totpCode = totpCode.trim()
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
            Your current state is preserved. Please re-authenticate to continue.
          </p>
        </div>

        {/* Method Switcher */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => { setAuthMethod('password'); setError(''); }}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              authMethod === 'password'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <KeyRound className="w-3 h-3" />
            <span>Password</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMethod('authenticator'); setError(''); }}
            className={`py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              authMethod === 'authenticator'
                ? 'bg-white dark:bg-zinc-900 text-indigo-500 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            <span>Authenticator</span>
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleReLogin} className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Employee Number or Email
            </label>
            <input
              type="text"
              placeholder="e.g. 100001 or email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {authMethod === 'password' ? (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block mb-1 flex items-center justify-between">
                <span>6-Digit Authenticator Code</span>
                <Smartphone className="w-3 h-3 text-indigo-400" />
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-zinc-50 dark:bg-zinc-800 font-mono text-center tracking-widest text-base font-bold text-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            {loading ? 'Re-authenticating...' : 'Resume Session'}
          </button>
        </form>
      </div>
    </div>
  )
}
