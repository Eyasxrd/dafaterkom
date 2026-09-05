'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, ArrowRight, ShieldAlert, X } from 'lucide-react'

interface SubscriptionBannerProps {
  onNavigateToBilling: () => void
}

export default function SubscriptionBanner({ onNavigateToBilling }: SubscriptionBannerProps) {
  const [tenant, setTenant] = useState<any>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/tenant')
      .then(res => res.json())
      .then(data => setTenant(data))
      .catch(console.error)
  }, [])

  if (!tenant || dismissed) return null

  // Show banner if status is past_due or suspended, or trial ends in < 7 days
  const isPastDue = tenant.status === 'past_due' || tenant.status === 'suspended'
  const isTrial = tenant.status === 'trial'

  let daysRemaining: number | null = null
  if (tenant.trialEndsAt) {
    const diff = new Date(tenant.trialEndsAt).getTime() - Date.now()
    daysRemaining = Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
  }

  if (!isPastDue && !(isTrial && daysRemaining !== null && daysRemaining <= 7)) {
    return null
  }

  return (
    <div className={`mx-4 md:mx-8 mb-4 p-3.5 rounded-2xl flex items-center justify-between text-xs font-medium border ${
      isPastDue
        ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
        : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
    }`}>
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <span>
          {isPastDue
            ? 'Your subscription is past due. To prevent interruption to your LAN sync and KDS, please update your billing.'
            : `Your free trial ends in ${daysRemaining} days. Choose a plan to keep your offline sync and features active.`}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onNavigateToBilling}
          className="font-bold underline hover:opacity-80 flex items-center gap-1 cursor-pointer"
        >
          <span>Update Plan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
