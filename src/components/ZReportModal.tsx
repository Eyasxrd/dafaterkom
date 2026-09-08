'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  FileText, 
  Printer, 
  Download, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2,
  Calendar,
  Building2
} from 'lucide-react'

export interface ZReportData {
  zReportNumber: string
  generatedAt: string
  reportDate: string
  tenant: {
    businessName: string
    taxNumber: string
    taxRate: number
  }
  summary: {
    totalOrdersCount: number
    completedCount: number
    refundedCount: number
    cancelledCount: number
    grossSales: number
    totalDiscount: number
    totalTax: number
    netSales: number
    totalRefundedAmount: number
    totalWastageLoss: number
    netOperatingRevenue: number
  }
  tenders: {
    cash: number
    card: number
    mobile: number
    split: number
  }
  drawerReconciliation: {
    openingFloat: number
    cashSales: number
    refundsPaid: number
    expectedDrawerCash: number
    shiftCount: number
  }
  shifts: {
    id: string
    staffName: string
    status: string
    startCash: number
    endCash?: number | null
    startTime: string
    endTime?: string | null
  }[]
}

interface ZReportModalProps {
  isOpen: boolean
  onClose: () => void
  data: ZReportData | null
}

export default function ZReportModal({ isOpen, onClose, data }: ZReportModalProps) {
  const [actualCountedCash, setActualCountedCash] = useState<string>('')

  if (!data) return null

  const countedCash = parseFloat(actualCountedCash) || 0
  const hasEnteredCash = actualCountedCash.trim() !== ''
  const cashDifference = hasEnteredCash 
    ? countedCash - data.drawerReconciliation.expectedDrawerCash 
    : 0

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadCsv = () => {
    const csvRows = [
      ['DAFATERKOM POS - DAILY Z-REPORT (REGISTER CLOSING)'],
      ['Z-Report Number', data.zReportNumber],
      ['Date', data.reportDate],
      ['Generated At', new Date(data.generatedAt).toLocaleString()],
      ['Business Name', data.tenant.businessName],
      ['Tax Registration Number', data.tenant.taxNumber],
      [''],
      ['SALES & TAX SUMMARY', 'AMOUNT (USD)'],
      ['Gross Sales', data.summary.grossSales.toFixed(2)],
      ['Total Discounts', `-${data.summary.totalDiscount.toFixed(2)}`],
      ['Total VAT (15%)', data.summary.totalTax.toFixed(2)],
      ['Net Sales', data.summary.netSales.toFixed(2)],
      ['Total Refunds Paid', `-${data.summary.totalRefundedAmount.toFixed(2)}`],
      ['Wastage / Spoilage Losses', `-${data.summary.totalWastageLoss.toFixed(2)}`],
      ['Net Operating Revenue', data.summary.netOperatingRevenue.toFixed(2)],
      [''],
      ['ORDER METRICS', 'COUNT'],
      ['Total Orders Processed', data.summary.totalOrdersCount],
      ['Completed Orders', data.summary.completedCount],
      ['Refunded Orders', data.summary.refundedCount],
      ['Cancelled Orders', data.summary.cancelledCount],
      [''],
      ['PAYMENT TENDER BREAKDOWN', 'AMOUNT (USD)'],
      ['Cash Payments', data.tenders.cash.toFixed(2)],
      ['Card Payments', data.tenders.card.toFixed(2)],
      ['Mobile Payments', data.tenders.mobile.toFixed(2)],
      ['Split / Multi-tender', data.tenders.split.toFixed(2)],
      [''],
      ['DRAWER RECONCILIATION', 'AMOUNT (USD)'],
      ['Opening Cash Float', data.drawerReconciliation.openingFloat.toFixed(2)],
      ['Cash Sales', data.drawerReconciliation.cashSales.toFixed(2)],
      ['Refunds Paid Out', `-${data.drawerReconciliation.refundsPaid.toFixed(2)}`],
      ['Expected Cash in Drawer', data.drawerReconciliation.expectedDrawerCash.toFixed(2)],
      ['Actual Counted Cash', hasEnteredCash ? countedCash.toFixed(2) : 'Not Entered'],
      ['Variance (Over / Short)', hasEnteredCash ? cashDifference.toFixed(2) : '0.00']
    ]

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${data.zReportNumber}_ZReport.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-zreport,
          #printable-zreport * {
            visibility: visible !important;
          }
          #printable-zreport {
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
              <FileText className="w-5 h-5 text-emerald-500" />
              <span>Daily Z-Report #{data.zReportNumber}</span>
            </DialogTitle>
          </DialogHeader>

          {/* Actual Cash Drawer Count Input */}
          <div className="no-print p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-2">
            <Label className="text-xs font-bold flex items-center justify-between">
              <span>Actual Cash Counted in Drawer:</span>
              <span className="text-slate-400 font-normal">Expected: ${data.drawerReconciliation.expectedDrawerCash.toFixed(2)}</span>
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Counted cash at end of day..."
                  value={actualCountedCash}
                  onChange={(e) => setActualCountedCash(e.target.value)}
                  className="text-xs pl-7 h-9 font-mono font-bold"
                />
              </div>
            </div>
            {hasEnteredCash && (
              <div className={`p-2 rounded-lg text-xs font-bold flex items-center justify-between ${
                cashDifference === 0 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : cashDifference > 0
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
              }`}>
                <span>{cashDifference === 0 ? 'Drawer Balanced Exactly' : cashDifference > 0 ? 'Drawer Over (+)' : 'Drawer Short (-)'}</span>
                <span>{cashDifference >= 0 ? `+$${cashDifference.toFixed(2)}` : `-$${Math.abs(cashDifference).toFixed(2)}`}</span>
              </div>
            )}
          </div>

          {/* Thermal Z-Report Paper Layout */}
          <div
            id="printable-zreport"
            className="bg-white dark:bg-zinc-950 text-zinc-950 dark:text-zinc-100 p-6 rounded-2xl shadow-inner border border-zinc-300 dark:border-zinc-800 font-mono text-xs max-w-[320px] mx-auto select-none"
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-zinc-400 dark:border-zinc-700 pb-3 mb-3">
              <div className="text-sm font-black tracking-widest uppercase">
                *** END OF DAY Z-REPORT ***
              </div>
              <div className="text-base font-bold mt-1">
                {data.tenant.businessName}
              </div>
              <p className="text-[10px] text-zinc-600 dark:text-zinc-400 font-bold mt-0.5">
                VAT Reg: {data.tenant.taxNumber}
              </p>
              <div className="text-[10px] text-zinc-500 mt-1">
                Report No: <span className="font-bold">{data.zReportNumber}</span>
              </div>
              <div className="text-[10px] text-zinc-500">
                Date: {data.reportDate}
              </div>
            </div>

            {/* Sales Summary */}
            <div className="space-y-1 border-b border-dashed border-zinc-400 dark:border-zinc-700 pb-3 mb-3 text-[11px]">
              <div className="font-bold uppercase tracking-wider text-[10px] text-zinc-600 dark:text-zinc-400 mb-1">
                -- SALES SUMMARY --
              </div>
              <div className="flex justify-between">
                <span>Total Orders:</span>
                <span className="font-bold">{data.summary.totalOrdersCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Completed Orders:</span>
                <span>{data.summary.completedCount}</span>
              </div>
              {data.summary.refundedCount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Refunded Orders:</span>
                  <span>{data.summary.refundedCount}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-dotted border-zinc-300 dark:border-zinc-800">
                <span>Gross Sales:</span>
                <span className="font-bold">${data.summary.grossSales.toFixed(2)}</span>
              </div>
              {data.summary.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discounts Given:</span>
                  <span>-${data.summary.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>VAT (15%):</span>
                <span>+${data.summary.totalTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-zinc-400 dark:border-zinc-700">
                <span>NET TOTAL SALES:</span>
                <span>${data.summary.netSales.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-1 border-b border-dashed border-zinc-400 dark:border-zinc-700 pb-3 mb-3 text-[11px]">
              <div className="font-bold uppercase tracking-wider text-[10px] text-zinc-600 dark:text-zinc-400 mb-1">
                -- PAYMENT TENDERS --
              </div>
              <div className="flex justify-between">
                <span>Cash Sales:</span>
                <span className="font-bold">${data.tenders.cash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Card Payments:</span>
                <span className="font-bold">${data.tenders.card.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Mobile Payments:</span>
                <span className="font-bold">${data.tenders.mobile.toFixed(2)}</span>
              </div>
              {data.tenders.split > 0 && (
                <div className="flex justify-between">
                  <span>Split Tender:</span>
                  <span className="font-bold">${data.tenders.split.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Drawer Reconciliation */}
            <div className="space-y-1 border-b border-dashed border-zinc-400 dark:border-zinc-700 pb-3 mb-3 text-[11px]">
              <div className="font-bold uppercase tracking-wider text-[10px] text-zinc-600 dark:text-zinc-400 mb-1">
                -- DRAWER AUDIT --
              </div>
              <div className="flex justify-between">
                <span>Opening Float:</span>
                <span>${data.drawerReconciliation.openingFloat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Sales:</span>
                <span>+${data.drawerReconciliation.cashSales.toFixed(2)}</span>
              </div>
              {data.drawerReconciliation.refundsPaid > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Refunds Paid Out:</span>
                  <span>-${data.drawerReconciliation.refundsPaid.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-dotted border-zinc-300 dark:border-zinc-800">
                <span>Expected Drawer:</span>
                <span>${data.drawerReconciliation.expectedDrawerCash.toFixed(2)}</span>
              </div>
              {hasEnteredCash && (
                <>
                  <div className="flex justify-between font-bold">
                    <span>Actual Counted:</span>
                    <span>${countedCash.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between font-black pt-1 ${cashDifference >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    <span>VARIANCE:</span>
                    <span>{cashDifference >= 0 ? `+$${cashDifference.toFixed(2)}` : `-$${Math.abs(cashDifference).toFixed(2)}`}</span>
                  </div>
                </>
              )}
            </div>

            {/* Food Wastage / Loss impact */}
            {data.summary.totalWastageLoss > 0 && (
              <div className="space-y-1 border-b border-dashed border-zinc-400 dark:border-zinc-700 pb-3 mb-3 text-[11px]">
                <div className="font-bold uppercase tracking-wider text-[10px] text-rose-600 mb-1">
                  -- LOSS PREVENTION --
                </div>
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Spoilage / Waste Cost:</span>
                  <span>-${data.summary.totalWastageLoss.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t border-dotted border-zinc-300 dark:border-zinc-800">
                  <span>Operating Revenue:</span>
                  <span>${data.summary.netOperatingRevenue.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="text-center pt-2 space-y-1 text-[10px] text-zinc-500">
              <p className="font-bold">REGISTER CLOSING COMPLETE</p>
              <p>Printed: {new Date().toLocaleTimeString()}</p>
              <div className="tracking-widest font-mono text-xs pt-1 opacity-75">
                ================================
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-3 no-print">
            <Button onClick={handlePrint} className="flex-1 min-w-[140px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
              <Printer className="w-4 h-4" />
              <span>Print 80mm Z-Slip</span>
            </Button>
            <Button
              type="button"
              onClick={handleDownloadCsv}
              variant="outline"
              className="font-bold gap-1.5 border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
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
