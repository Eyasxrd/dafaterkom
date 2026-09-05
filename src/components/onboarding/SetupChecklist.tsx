'use client'

import React, { useState, useEffect } from 'react'
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  X, 
  Sparkles, 
  Store, 
  Utensils, 
  Receipt, 
  Users, 
  ShoppingBag,
  PartyPopper,
  ArrowUpRight
} from 'lucide-react'

interface SetupChecklistProps {
  onOpenWizard: (step?: number) => void
  onStartTour?: () => void
  onRefreshTrigger?: number
}

export default function SetupChecklist({ onOpenWizard, onStartTour, onRefreshTrigger }: SetupChecklistProps) {
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [progressPercent, setProgressPercent] = useState(0)
  const [steps, setSteps] = useState({
    profile: false,
    menu: false,
    tax: false,
    staff: false,
    firstSale: false
  })
  const [counts, setCounts] = useState({
    menuItems: 0,
    staff: 0,
    orders: 0
  })

  useEffect(() => {
    const isDismissed = (localStorage.getItem('dafaterkom_checklist_dismissed') || localStorage.getItem('cashir_checklist_dismissed')) === 'true'
    if (isDismissed) setDismissed(true)
  }, [])

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/onboarding/status')
      if (res.ok) {
        const data = await res.json()
        setSteps(data.completedSteps || {})
        setProgressPercent(data.progressPercent || 0)
        setCounts(data.counts || { menuItems: 0, staff: 0, orders: 0 })
      }
    } catch (e) {
      console.error('Failed to fetch setup status:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [onRefreshTrigger])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('dafaterkom_checklist_dismissed', 'true')
    localStorage.setItem('cashir_checklist_dismissed', 'true')
  }

  if (dismissed) return null

  const items = [
    { 
      key: 'profile', 
      label: 'Shop profile & currency', 
      detail: 'Configure name, geofence radius', 
      icon: Store,
      done: steps.profile,
      action: () => onOpenWizard(1)
    },
    { 
      key: 'menu', 
      label: 'Menu catalog & items', 
      detail: counts.menuItems > 0 ? `${counts.menuItems} items active` : 'Choose starter menu template', 
      icon: Utensils,
      done: steps.menu,
      action: () => onOpenWizard(2)
    },
    { 
      key: 'tax', 
      label: 'Tax rate & receipt format', 
      detail: 'Set VAT/Tax % and thermal header', 
      icon: Receipt,
      done: steps.tax,
      action: () => onOpenWizard(3)
    },
    { 
      key: 'staff', 
      label: 'Staff join code', 
      detail: counts.staff > 0 ? `${counts.staff} staff members` : 'Share 6-digit login code', 
      icon: Users,
      done: steps.staff,
      action: () => onOpenWizard(4)
    },
    { 
      key: 'firstSale', 
      label: 'Complete first sale', 
      detail: counts.orders > 0 ? `${counts.orders} completed sales` : 'Ring up a practice order', 
      icon: ShoppingBag,
      done: steps.firstSale,
      action: () => {
        if (onStartTour) {
          onStartTour()
        } else {
          onOpenWizard(6)
        }
      }
    }
  ]

  const isAllComplete = progressPercent === 100

  return (
    <div className="mx-4 md:mx-8 mb-6 p-4 md:p-5 rounded-3xl glass-panel border border-blue-500/20 dark:border-blue-400/20 shadow-xl relative overflow-hidden transition-all duration-300">
      
      {/* Top Banner Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl shadow-sm ${
            isAllComplete 
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
              : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
          }`}>
            {isAllComplete ? <PartyPopper className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                Quick Setup Checklist
              </h4>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isAllComplete 
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
              }`}>
                {progressPercent}% Complete
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAllComplete 
                ? 'Your café is 100% configured for real-time POS, LAN offline sync, and thermal receipts!' 
                : 'Complete these quick steps to get your counter ready for customers.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isAllComplete && (
            <button
              onClick={() => onOpenWizard(1)}
              className="px-3.5 py-1.5 rounded-xl liquid-btn-primary text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>Launch Wizard</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Dismiss checklist"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-200/80 dark:bg-white/10 h-2 rounded-full mt-4 overflow-hidden p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isAllComplete
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500'
          }`}
          style={{ width: `${Math.max(5, progressPercent)}%` }}
        />
      </div>

      {/* Checklist Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-4">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.key}
              onClick={item.action}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                item.done
                  ? 'bg-emerald-500/5 dark:bg-emerald-500/[0.04] border-emerald-500/20 text-slate-800 dark:text-slate-200'
                  : 'glass-card border-slate-200/80 dark:border-white/5 hover:border-blue-500/40 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <div className={`p-1.5 rounded-xl ${
                  item.done ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 hover:text-blue-500 shrink-0" />
                )}
              </div>

              <div>
                <div className={`text-xs font-bold leading-tight ${item.done ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                  {item.label}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  {item.detail}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
