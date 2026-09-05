'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Coffee, Printer, QrCode } from 'lucide-react'
import AppleWalletButton from '@/components/loyalty/AppleWalletButton'

export interface ReceiptData {
  orderNumber: string
  createdAt: string | Date
  staffName?: string
  tableNumber?: number | null
  customerName?: string | null
  customerPhone?: string | null
  customerLoyaltyPoints?: number | null
  customerId?: string | null
  subtotal: number
  discount?: number
  tax?: number
  taxRate?: number
  totalAmount: number
  paymentMethod: string
  notes?: string | null
  businessName?: string
  taxNumber?: string
  receiptHeader?: string
  receiptFooter?: string
  items: {
    name: string
    quantity: number
    price: number
    subtotal: number
    notes?: string | null
  }[]
}

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  receipt: ReceiptData | null
}

export default function ReceiptModal({ isOpen, onClose, receipt }: ReceiptModalProps) {
  if (!receipt) return null

  const handlePrint = () => {
    window.print()
  }

  const formattedDate = new Date(receipt.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })

  const effectiveTaxRate = receipt.taxRate ?? 15

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-receipt,
          #printable-receipt * {
            visibility: visible !important;
          }
          #printable-receipt {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 80mm !important;
            margin: 0 !important;
            padding: 4mm !important;
            background: white !important;
            color: black !important;
            font-family: monospace !important;
            font-size: 11px !important;
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
              <Printer className="w-5 h-5 text-emerald-500" />
              <span>Customer Receipt #{receipt.orderNumber}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Thermal Receipt Paper Layout */}
          <div
            id="printable-receipt"
            className="bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 p-6 rounded-2xl shadow-inner border border-zinc-300 dark:border-zinc-800 font-mono text-xs max-w-[320px] mx-auto select-none"
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-zinc-400 dark:border-zinc-700 pb-3 mb-3">
              <div className="text-base font-black tracking-wider flex items-center justify-center gap-1.5 text-zinc-950 dark:text-white">
                <Coffee className="w-4 h-4 text-zinc-800 dark:text-zinc-200" />
                <span>{receipt.businessName || 'DAFATERKOM CAFÉ'}</span>
              </div>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 whitespace-pre-line mt-1">
                {receipt.receiptHeader || 'Specialty Coffee & Artisan Bakes'}
              </p>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-bold mt-1">
                VAT Reg: {receipt.taxNumber || '300123456700003'}
              </p>
            </div>

            {/* Metadata */}
            <div className="space-y-1 border-b border-dashed border-zinc-400 dark:border-zinc-700 pb-3 mb-3 text-[11px]">
              <div className="flex justify-between">
                <span className="font-semibold">Order:</span>
                <span className="font-bold">#{receipt.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{receipt.staffName || 'Station #1'}</span>
              </div>
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-semibold">{receipt.tableNumber ? `Table #${receipt.tableNumber}` : 'Takeaway'}</span>
              </div>
              {receipt.customerName && (
                <div className="flex justify-between">
                  <span>Customer:</span>
                  <span>{receipt.customerName}</span>
                </div>
              )}
              {receipt.customerLoyaltyPoints !== undefined && receipt.customerLoyaltyPoints !== null && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>Loyalty Points:</span>
                  <span>{receipt.customerLoyaltyPoints} pts</span>
                </div>
              )}
            </div>

            {/* Itemized list */}
            <div className="border-b border-dashed border-zinc-400 dark:border-zinc-700 pb-3 mb-3">
              <div className="flex justify-between font-bold border-b border-zinc-300 dark:border-zinc-700 pb-1 mb-2 text-[10px] uppercase">
                <span className="flex-1">ITEM</span>
                <span className="w-8 text-center">QTY</span>
                <span className="w-14 text-right">PRICE</span>
                <span className="w-14 text-right">TOTAL</span>
              </div>
              <div className="space-y-2">
                {receipt.items.map((item, idx) => (
                  <div key={idx} className="text-[11px]">
                    <div className="flex justify-between items-start">
                      <span className="flex-1 font-medium">{item.name}</span>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <span className="w-14 text-right">${item.price.toFixed(2)}</span>
                      <span className="w-14 text-right font-semibold">${item.subtotal.toFixed(2)}</span>
                    </div>
                    {item.notes && (
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 italic pl-2">
                        ↳ {item.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-400 dark:border-zinc-700 pb-3 mb-3">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${receipt.subtotal.toFixed(2)}</span>
              </div>
              {receipt.discount && receipt.discount > 0 ? (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>Discount:</span>
                  <span>-${receipt.discount.toFixed(2)}</span>
                </div>
              ) : null}
              {receipt.tax && receipt.tax > 0 ? (
                <div className="flex justify-between text-zinc-700 dark:text-zinc-300">
                  <span>Tax (VAT {effectiveTaxRate}%):</span>
                  <span>+${receipt.tax.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex justify-between text-sm font-black pt-2 border-t border-zinc-300 dark:border-zinc-700">
                <span>TOTAL:</span>
                <span>${receipt.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 text-[10px] text-zinc-500 dark:text-zinc-400 uppercase">
                <span>Payment:</span>
                <span className="font-bold">{receipt.paymentMethod}</span>
              </div>
            </div>

            {/* Compliant E-Invoicing & Loyalty QR Code mockup */}
            <div className="text-center py-2 flex flex-col items-center justify-center space-y-1 border-b border-dashed border-zinc-400 dark:border-zinc-700 pb-3 mb-3">
              <div className="w-20 h-20 bg-white border border-zinc-300 dark:border-zinc-700 rounded p-1 flex items-center justify-center">
                <QrCode className="w-16 h-16 text-zinc-900" />
              </div>
              <span className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono">
                Scan for E-Invoice & Loyalty Rewards
              </span>
            </div>

            {/* Apple Wallet Pass Link */}
            {receipt.customerId && (
              <div className="no-print pb-3 mb-3 border-b border-dashed border-zinc-400 dark:border-zinc-700 flex flex-col items-center text-center space-y-1.5">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
                  Apple Wallet Digital Pass
                </span>
                <AppleWalletButton
                  customerId={receipt.customerId}
                  customerName={receipt.customerName || undefined}
                  buttonText="Save Pass to Apple Wallet"
                  className="w-full text-xs py-2"
                />
              </div>
            )}

            {/* Order Note */}
            {receipt.notes && (
              <div className="text-[10px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded mb-3 text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold">Note:</span> {receipt.notes}
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-1 space-y-1 text-[10px] text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
              <p className="font-bold">{receipt.receiptFooter || 'THANK YOU FOR YOUR VISIT!\nPlease come again'}</p>
              <div className="tracking-widest font-mono text-xs pt-1 opacity-75">
                * * * * * * * * * *
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3 no-print">
            <Button onClick={handlePrint} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
              <Printer className="w-4 h-4" />
              <span>Print 80mm Receipt</span>
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
