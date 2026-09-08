'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChefHat, Printer, Coffee, Clock } from 'lucide-react'

export interface KitchenTicketData {
  orderNumber: string
  createdAt: string | Date
  tableNumber?: number | null
  customerName?: string | null
  staffName?: string
  station?: 'BARISTA / ESPRESSO' | 'KITCHEN / BAKERY' | 'BARISTA & KITCHEN' | 'ALL STATIONS' | string
  notes?: string | null
  items: {
    name: string
    quantity: number
    notes?: string | null
    category?: string
  }[]
}

interface KitchenTicketModalProps {
  isOpen: boolean
  onClose: () => void
  ticket: KitchenTicketData | null
}

export default function KitchenTicketModal({ isOpen, onClose, ticket }: KitchenTicketModalProps) {
  if (!ticket) return null

  const handlePrint = () => {
    window.print()
  }

  const formattedTime = new Date(ticket.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-kitchen-ticket,
          #printable-kitchen-ticket * {
            visibility: visible !important;
          }
          #printable-kitchen-ticket {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            font-family: monospace !important;
            font-size: 12px !important;
            line-height: 1.3 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
          <DialogHeader className="no-print">
            <DialogTitle className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-500" />
              <span>Kitchen Order Ticket (KOT) #{ticket.orderNumber}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Thermal KOT Ticket Paper Layout */}
          <div
            id="printable-kitchen-ticket"
            className="bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 p-6 rounded-2xl shadow-inner border-2 border-dashed border-zinc-300 dark:border-zinc-800 font-mono text-xs max-w-[320px] mx-auto select-none"
          >
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-zinc-800 dark:border-zinc-300 pb-2 mb-2">
              <span className="text-[10px] font-black tracking-widest uppercase block text-zinc-600 dark:text-zinc-400">
                *** KITCHEN ORDER TICKET ***
              </span>
              <h3 className="text-sm font-black tracking-wider uppercase mt-0.5">
                {ticket.station || 'BARISTA & KITCHEN'}
              </h3>
            </div>

            {/* Dining Type & Order Number Banner */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-center mb-3">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">
                {ticket.tableNumber ? 'DINE-IN ORDER' : 'TAKEAWAY / TO-GO'}
              </span>
              <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mt-0.5">
                {ticket.tableNumber ? `TABLE #${ticket.tableNumber}` : 'TAKEAWAY'}
              </h2>
              <div className="flex justify-between text-[11px] text-zinc-600 dark:text-zinc-400 font-bold pt-1 mt-1 border-t border-zinc-200 dark:border-zinc-800">
                <span>Order: #{ticket.orderNumber}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formattedTime}</span>
                </span>
              </div>
            </div>

            {/* Ticket Metadata */}
            <div className="space-y-0.5 border-b border-dashed border-zinc-400 dark:border-zinc-700 pb-2 mb-3 text-[11px]">
              {ticket.customerName && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Customer:</span>
                  <span className="font-bold">{ticket.customerName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Server:</span>
                <span>{ticket.staffName || 'Counter Cashier'}</span>
              </div>
            </div>

            {/* Items List with High-Contrast Modifier Highlights */}
            <div className="space-y-3 border-b-2 border-dashed border-zinc-800 dark:border-zinc-300 pb-3 mb-3">
              <div className="flex justify-between font-black text-[10px] uppercase border-b border-zinc-300 dark:border-zinc-700 pb-1">
                <span>QTY & ITEM</span>
                <span>STATION</span>
              </div>

              {ticket.items.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="font-extrabold text-sm text-zinc-950 dark:text-white">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-zinc-400">
                      {item.category || 'Prep'}
                    </span>
                  </div>

                  {/* Bold Modifier Callout for Baristas / Kitchen */}
                  {item.notes && (
                    <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 font-bold text-[11px] text-zinc-900 dark:text-zinc-100 leading-tight">
                      ↳ {item.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* General Order Notes */}
            {ticket.notes && (
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-[11px] font-bold text-amber-900 dark:text-amber-200 mb-3">
                <span>NOTE: </span>{ticket.notes}
              </div>
            )}

            {/* Ticket Footer */}
            <div className="text-center text-[10px] text-zinc-500 dark:text-zinc-400 font-bold tracking-wider">
              --- DISPATCH TO COUNTER WHEN READY ---
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 no-print">
            <Button
              onClick={handlePrint}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print KOT Ticket</span>
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
