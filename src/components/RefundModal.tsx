'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RotateCcw, PackageCheck, Trash2, AlertCircle, Sparkles } from 'lucide-react'

interface RefundModalProps {
  isOpen: boolean
  onClose: () => void
  order: {
    id: string
    orderNumber: string
    totalAmount: number
    customerName?: string | null
    items: {
      id: string
      quantity: number
      menuItem: { name: string }
    }[]
  } | null
  onRefundCompleted: () => void
}

export default function RefundModal({ isOpen, onClose, order, onRefundCompleted }: RefundModalProps) {
  const [reason, setReason] = useState<string>('Customer Dissatisfaction')
  const [restitution, setRestitution] = useState<'restock' | 'waste' | 'none'>('restock')
  const [customNotes, setCustomNotes] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  if (!order) return null

  const handleProcessRefund = async () => {
    setIsProcessing(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${order.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          restitution,
          notes: customNotes
        })
      })

      if (res.ok) {
        onRefundCompleted()
        onClose()
      } else {
        const errData = await res.json()
        setError(errData.error || 'Failed to process refund')
      }
    } catch (e: any) {
      setError(e.message || 'Network error while processing refund')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <RotateCcw className="w-5 h-5" />
            <span>Process Refund — #{order.orderNumber}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Order Snapshot */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-700/50 space-y-1 text-xs">
            <div className="flex justify-between font-bold">
              <span>Refund Amount:</span>
              <span className="text-sm text-rose-600 dark:text-rose-400 font-extrabold">
                ${order.totalAmount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Customer:</span>
              <span>{order.customerName || 'Walk-in Guest'}</span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>Items ({order.items.length}):</span>
              <span className="truncate max-w-[200px]">
                {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
              </span>
            </div>
          </div>

          {/* Refund Reason */}
          <div>
            <Label className="text-xs font-semibold">Refund Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select refund reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Customer Dissatisfaction">Customer Dissatisfaction / Quality</SelectItem>
                <SelectItem value="Wrong Item Prepared">Wrong Item Prepared / Kitchen Error</SelectItem>
                <SelectItem value="Order Cancelled by Guest">Order Cancelled by Guest</SelectItem>
                <SelectItem value="Double Charge or Cashier Error">Double Charge / Cashier Mistake</SelectItem>
                <SelectItem value="Defective or Foreign Object">Defective / Contaminated Item</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Restitution Option */}
          <div>
            <Label className="text-xs font-semibold">Stock Restitution Workflow *</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setRestitution('restock')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  restitution === 'restock'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <PackageCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Return & Restock</span>
                </div>
                <p className="text-[10px] opacity-75 mt-0.5">
                  Item is unopened / untouched. Adds stock units back to inventory.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRestitution('waste')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  restitution === 'waste'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
                    : 'border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Discard as Waste</span>
                </div>
                <p className="text-[10px] opacity-75 mt-0.5">
                  Item is spoiled/discarded. Writes financial loss to Wastage Log.
                </p>
              </button>
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <Label className="text-xs font-semibold">Audit Notes (Optional)</Label>
            <Input
              placeholder="e.g. Approved by Shift Supervisor..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="mt-1 text-xs"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleProcessRefund}
              disabled={isProcessing}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold gap-1.5"
            >
              <RotateCcw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Confirm Refund</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
