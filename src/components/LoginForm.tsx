'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/store'
import { 
  Coffee, 
  Lock, 
  LogIn, 
  AlertCircle, 
  ShieldCheck, 
  Smartphone, 
  KeyRound, 
  Eye, 
  EyeOff, 
  BadgeCheck,
  Sparkles
} from 'lucide-react'

export default function LoginForm() {
  const [authMethod, setAuthMethod] = useState<'password' | 'authenticator'>('password')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = useAuthStore((state) => state.login)
  const t = useTranslations('login')
  const tCommon = useTranslations('common')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

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

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (response.ok) {
        const user = data.user || data
        login(user)
      } else {
        setError(data.error || (authMethod === 'password' ? t('loginError') : t('authenticatorError')))
      }
    } catch (err) {
      setError(authMethod === 'password' ? t('loginError') : t('authenticatorError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-panel rounded-3xl p-2 border border-white/60 dark:border-white/10 shadow-2xl transition-all duration-300">
        <CardHeader className="text-center pb-3 pt-6">
          <div className="mx-auto w-14 h-14 rounded-2xl liquid-btn-primary flex items-center justify-center shadow-xl shadow-blue-500/25 mb-4">
            <Coffee className="w-7 h-7 text-white" />
          </div>
          <CardTitle className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
            {t('title')}
          </CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('subtitle')}
          </p>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          {/* Method Selector Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 mb-5 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('password')
                setError('')
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                authMethod === 'password'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{t('tabPassword')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMethod('authenticator')
                setError('')
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                authMethod === 'authenticator'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md scale-[1.01]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('tabAuthenticator')}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Number / Identifier Input (Common to both methods) */}
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
                {t('username')}
              </Label>
              <Input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t('usernamePlaceholder')}
                required
                autoFocus
                className="h-11 bg-white/70 dark:bg-slate-900/70"
              />
            </div>

            {/* Method 1: Password Input */}
            {authMethod === 'password' && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  {t('password')}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('passwordPlaceholder')}
                    required
                    className="h-11 pe-10 bg-white/70 dark:bg-slate-900/70"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Method 2: Google Authenticator 6-Digit Code */}
            {authMethod === 'authenticator' && (
              <div className="space-y-2 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <Label htmlFor="totpCode" className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                    {t('totpCode')}
                  </Label>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    RFC 6238 TOTP
                  </span>
                </div>
                <Input
                  id="totpCode"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('totpPlaceholder')}
                  required
                  className="h-12 font-mono text-center tracking-[0.35em] text-xl font-black bg-white/90 dark:bg-slate-900/90 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50 focus-visible:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{t('totpHint')}</span>
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className={`w-full h-11 text-sm font-semibold gap-2 mt-2 cursor-pointer shadow-lg ${
                authMethod === 'authenticator'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/20'
                  : 'liquid-btn-primary shadow-blue-500/20'
              }`} 
              disabled={loading}
            >
              {authMethod === 'authenticator' ? <ShieldCheck className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {loading 
                ? tCommon('loading') 
                : (authMethod === 'authenticator' ? t('loginWithAuthenticator') : t('loginWithPassword'))
              }
            </Button>
          </form>

          {/* Support Contacts & Copyright */}
          <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/[0.08] text-center space-y-2">
            <div className="text-[11px] text-slate-400">
              {t('needHelp')}
            </div>
            <div className="flex items-center justify-center gap-4 text-xs font-semibold">
              <a
                href="tel:+15550192834"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                title="Call Support Hotline"
              >
                +1 (555) 019-2834
              </a>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href="mailto:support@dafaterkom.com"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                title="Email Support"
              >
                support@dafaterkom.com
              </a>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-1">
              © {new Date().getFullYear()} {t('rights')}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}