'use client'

import React, { useState } from 'react'
import { Sparkles, ArrowRight, Check, X, ShoppingBag, Sliders, CreditCard } from 'lucide-react'

interface FirstSaleTourProps {
  isOpen: boolean
  onClose: () => void
}

export default function FirstSaleTour({ isOpen, onClose }: FirstSaleTourProps) {
  const [tourStep, setTourStep] = useState(1)

  if (!isOpen) return null

  const steps = [
    {
      step: 1,
      icon: ShoppingBag,
      title: '1. Select an item from your catalog',
      description:
        'Tap any coffee, pastry, or food card on your screen. You can use the search bar or category tabs to filter by drinks, beans, or baked goods.'
    },
    {
      step: 2,
      icon: Sliders,
      title: '2. Customize size, milk & add-ons',
      description:
        'Tap "Customize" on any item to pick size (Regular vs Large), milk preference (Oat, Almond, Whole), sugar level, or extra espresso shots.'
    },
    {
      step: 3,
      icon: CreditCard,
      title: '3. Instant checkout & 80mm receipt',
      description:
        'Tap the checkout button to apply discounts, assign customer loyalty points, choose Cash or Card, and generate a compliant thermal receipt.'
    }
  ]

  const current = steps[tourStep - 1]
  const Icon = current.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-zinc-900 dark:text-zinc-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Interactive First Sale Guide ({tourStep} of 3)</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base">{current.title}</h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 leading-relaxed">
              {current.description}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === tourStep ? 'w-6 bg-emerald-500' : 'w-2 bg-zinc-300 dark:bg-zinc-700'
                }`}
              />
            ))}
          </div>

          {tourStep < 3 ? (
            <button
              onClick={() => setTourStep(tourStep + 1)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/20"
            >
              <span>Got it, let's sell!</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
