'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, Banknote, CreditCard, Smartphone, Check, Divide } from 'lucide-react'

interface SplitBillModalProps {
  isOpen: boolean
  onClose: () => void
  totalAmount: number
  onCompleteSplit: (payments: { method: string; amount: number }[]) => void
}

export default function SplitBillModal({
  isOpen,
  onClose,
  totalAmount,
  onCompleteSplit
}: SplitBillModalProps) {
  const [splitCount, setSplitCount] = useState<number>(2)
  const [payments, setPayments] = useState<{ method: string; amount: number }[]>([
    { method: 'cash', amount: Math.round((totalAmount / 2) * 100) / 100 },
    { method: 'card', amount: Math.round((totalAmount - Math.round((totalAmount / 2) * 100) / 100) * 100) / 100 }
  ])

  const handleSplitCountChange = (count: number) => {
    const validCount = Math.max(2, Math.min(10, count))
    setSplitCount(validCount)

    const baseAmount = Math.floor((totalAmount / validCount) * 100) / 100
    const remainder = Math.round((totalAmount - baseAmount * validCount) * 100) / 100

    const newPayments = Array.from({ length: validCount }, (_, i) => ({
      method: i === 0 ? 'cash' : 'card',
      amount: i === 0 ? baseAmount + remainder : baseAmount
    }))

    setPayments(newPayments)
  }

  const handleAmountChange = (index: number, val: string) => {
    const num = parseFloat(val) || 0
    const updated = [...payments]
    updated[index].amount = num
    setPayments(updated)
  }

  const handleMethodChange = (index: number, method: string) => {
    const updated = [...payments]
    updated[index].method = method
    setPayments(updated)
  }

  const paidSum = payments.reduce((acc, p) => acc + p.amount, 0)
  const remaining = Math.round((totalAmount - paidSum) * 100) / 100
  const isBalanced = Math.abs(remaining) <= 0.01

  const handleConfirm = () => {
    if (!isBalanced) return
    onCompleteSplit(payments)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glass-panel border-white/40 dark:border-white/10 p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Divide className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Split Bill & Multi-Tender</span>
          </DialogTitle>
          <div className="flex justify-between items-center bg-slate-100 dark:bg-white/[0.04] p-3 rounded-2xl mt-2">
            <span className="text-xs text-slate-500 font-medium">Order Total:</span>
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Quick Split Buttons */}
          <div>
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Even Split Between Guests:
            </Label>
            <div className="grid grid-cols-4 gap-2 mt-1.5">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleSplitCountChange(num)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    splitCount === num
                      ? 'liquid-btn-primary border-transparent shadow-sm'
                      : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{num} Ways</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {payments.map((p, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.03]"
              >
                <span className="text-xs font-bold text-slate-500 w-16 shrink-0">
                  Guest {idx + 1}
                </span>

                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={p.amount}
                    onChange={(e) => handleAmountChange(idx, e.target.value)}
                    className="pl-6 h-8 text-xs font-bold"
                  />
                </div>

                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMethodChange(idx, 'cash')}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      p.method === 'cash'
                        ? 'bg-emerald-600 text-white border-transparent'
                        : 'border-slate-200 dark:border-white/10 text-slate-500'
                    }`}
                    title="Cash"
                  >
                    <Banknote className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMethodChange(idx, 'card')}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      p.method === 'card'
                        ? 'bg-blue-600 text-white border-transparent'
                        : 'border-slate-200 dark:border-white/10 text-slate-500'
                    }`}
                    title="Card"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMethodChange(idx, 'mobile')}
                    className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                      p.method === 'mobile'
                        ? 'bg-purple-600 text-white border-transparent'
                        : 'border-slate-200 dark:border-white/10 text-slate-500'
                    }`}
                    title="Mobile"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Remaining balance indicator */}
          <div className={`p-2.5 rounded-xl text-xs font-semibold flex justify-between items-center ${
            isBalanced
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
          }`}>
            <span>Remaining Unassigned:</span>
            <span className="font-mono font-bold">${remaining.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleConfirm}
            disabled={!isBalanced}
            className="text-xs gap-1.5 liquid-btn-primary"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Confirm Split Payments</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
