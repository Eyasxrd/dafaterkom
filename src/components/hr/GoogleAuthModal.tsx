'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLocale } from 'next-intl'
import { 
  ShieldCheck, 
  QrCode, 
  Smartphone, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  Clock,
  Trash2,
  Lock
} from 'lucide-react'

interface GoogleAuthModalProps {
  isOpen: boolean
  onClose: () => void
  staffId: string | null
  staffName: string
  staffEmail?: string
  isAlreadyLinked?: boolean
  onSuccess?: () => void
}

export default function GoogleAuthModal({
  isOpen,
  onClose,
  staffId,
  staffName,
  staffEmail,
  isAlreadyLinked = false,
  onSuccess
}: GoogleAuthModalProps) {
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'

  const [loading, setLoading] = useState(false)
  const [setupData, setSetupData] = useState<{
    secret: string
    qrCodeDataUrl: string
    otpAuthUri: string
    totpEnabled: boolean
  } | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [copiedKey, setCopiedKey] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(30)

  // Countdown timer for 30s rotating TOTP window
  useEffect(() => {
    const updateCountdown = () => {
      const currentSec = Math.floor(Date.now() / 1000) % 30
      setRemainingSeconds(30 - currentSec)
    }
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isOpen && staffId) {
      fetchSetupData()
    } else {
      setSetupData(null)
      setVerificationCode('')
      setFeedback(null)
    }
  }, [isOpen, staffId])

  const fetchSetupData = async () => {
    if (!staffId) return
    setLoading(true)
    setFeedback(null)
    try {
      const res = await fetch(`/api/hr/totp?staffId=${staffId}`)
      const data = await res.json()
      if (res.ok) {
        setSetupData(data)
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to initialize Google Authenticator setup' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error fetching QR code' })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyKey = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret)
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    }
  }

  const handleVerifyAndLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffId || !setupData?.secret) return
    const cleanCode = verificationCode.trim()
    if (cleanCode.length !== 6) {
      setFeedback({ type: 'error', message: isAr ? 'يرجى إدخال رمز التحقق المكون من 6 أرقام' : 'Please enter the 6-digit code from Google Authenticator' })
      return
    }

    setSubmitting(true)
    setFeedback(null)
    try {
      const res = await fetch('/api/hr/totp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          secret: setupData.secret,
          token: cleanCode,
          requireForShift: true
        })
      })

      const data = await res.json()
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: isAr ? `تم ربط تطبيق Google Authenticator بنجاح للموظف ${staffName}!` : `Google Authenticator linked successfully for ${staffName}!`
        })
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500)
      } else {
        setFeedback({ type: 'error', message: data.error || 'Invalid code. Please try again.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verification failed' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnlink = async () => {
    if (!staffId) return
    if (!confirm(isAr ? 'هل أنت متأكد من إلغاء ربط Google Authenticator لهذا الموظف؟' : 'Are you sure you want to unlink Google Authenticator for this employee?')) {
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/hr/totp?staffId=${staffId}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: isAr ? 'تم إلغاء الربط بنجاح.' : 'Google Authenticator unlinked successfully.'
        })
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1200)
      } else {
        setFeedback({ type: 'error', message: data.error || 'Failed to unlink' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Operation failed' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 glass-panel rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-slate-900 dark:text-white text-lg font-black">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div>{isAr ? 'ربط Google Authenticator' : 'Link Google Authenticator'}</div>
              <div className="text-xs font-normal text-slate-500 dark:text-slate-400">
                {staffName} {staffEmail ? `(${staffEmail})` : ''}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">
              {isAr ? 'جاري إنشاء باركود الأمان QR...' : 'Generating secure QR Code...'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {feedback && (
              <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300'
              }`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Instruction Banner */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>{isAr ? 'حماية من تسجيل الحضور بالنيابة (Buddy Punching)' : 'Anti-Proxy Clock-In Security'}</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                {isAr 
                  ? 'يقوم الموظف بمسح الباركود باستخدام تطبيق Google Authenticator على هاتفه. الرمز يتغير كل 30 ثانية ولا يمكن إعطاؤه لزميل ليسجل نيابة عنه.'
                  : 'The employee scans this QR code with Google Authenticator on their personal phone. The 6-digit code rotates every 30 seconds and cannot be shared with coworkers.'}
              </p>
            </div>

            {/* Step 1: Scan QR Code */}
            {setupData?.qrCodeDataUrl && (
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                <div className="bg-white p-2.5 rounded-2xl shadow-md border border-slate-100">
                  <img
                    src={setupData.qrCodeDataUrl}
                    alt="Google Authenticator QR Code"
                    className="w-44 h-44 rounded-lg object-contain"
                  />
                </div>

                {/* Secret Key Manual Display */}
                <div className="mt-3 w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/5">
                  <div className="text-[10px] text-slate-500 font-mono truncate">
                    <span className="font-bold uppercase tracking-wider text-slate-400 mr-1">{isAr ? 'المفتاح:' : 'Key:'}</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">{setupData.secret}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition cursor-pointer"
                    title="Copy Key"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Verification Input with Live 30s Countdown Ring */}
            <form onSubmit={handleVerifyAndLink} className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'أدخل رمز الـ 6 أرقام للتأكيد والتفعيل:' : 'Enter 6-digit verification code to activate:'}
                  </Label>
                  <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                    <Clock className="w-3 h-3 animate-spin" />
                    <span>{remainingSeconds}s</span>
                  </div>
                </div>
                <Input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center font-mono text-2xl tracking-[0.4em] font-black h-12 glass-panel"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2">
                {isAlreadyLinked ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleUnlink}
                    disabled={submitting}
                    className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إلغاء الربط' : 'Unlink 2FA'}</span>
                  </Button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="text-xs font-bold cursor-pointer"
                  >
                    {isAr ? 'إغلاق' : 'Close'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || verificationCode.trim().length !== 6}
                    className="liquid-btn-primary text-xs font-bold gap-1.5 cursor-pointer shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'تأكيد وربط' : 'Confirm & Link'}</span>
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
