'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, FileText, CheckCircle2, Layers } from 'lucide-react'
import { PrintableReportConfig } from './PrintableReportDocument'

interface PrintReportModalProps {
  isOpen: boolean
  onClose: () => void
  activeTab: string
  onConfirmPrint: (config: PrintableReportConfig) => void
  locale?: string
}

export default function PrintReportModal({
  isOpen,
  onClose,
  activeTab,
  onConfirmPrint,
  locale = 'en'
}: PrintReportModalProps) {
  const isAr = locale === 'ar'
  const [mode, setMode] = useState<'active' | 'full'>('full')
  const [sections, setSections] = useState({
    overview: true,
    pnl: true,
    orders: true,
    shifts: true,
    inventory: true,
    staff: true,
    customers: true
  })

  const getActiveTabTitle = (tab: string) => {
    switch (tab) {
      case 'overview': return isAr ? 'الملخص التنفيذي' : 'Executive Overview'
      case 'orders': return isAr ? 'الطلبات والمبيعات' : 'Orders & Sales'
      case 'finance': return isAr ? 'المالية وقائمة الدخل' : 'Money & Financials'
      case 'employees': return isAr ? 'الموظفين والموارد البشرية' : 'Employees & HR'
      case 'inventory': return isAr ? 'المخزون والموردين' : 'Inventory & Suppliers'
      case 'customers': return isAr ? 'العملاء وبرنامج الولاء' : 'Customers & Loyalty'
      default: return tab
    }
  }

  const handlePrint = () => {
    onConfirmPrint({
      mode,
      activeTab,
      includedSections: sections
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-6 rounded-3xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg font-black tracking-tight text-slate-900 dark:text-white">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <span>{isAr ? 'خيارات طباعة التقرير' : 'Print Business Report'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Print Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              {isAr ? 'نطاق الطباعة' : 'Report Scope'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('full')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  mode === 'full'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 shadow-sm'
                    : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'تقرير شامل معتمد' : 'Full Master Report'}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {isAr ? 'تجميع كافة الأقسام المالية والإدارية' : 'Consolidated P&L, Sales, Stock & HR'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('active')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                  mode === 'active'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 shadow-sm'
                    : 'border-border/60 hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'القسم الحالي فقط' : 'Active Tab Only'}</span>
                </div>
                <span className="text-[10px] text-muted-foreground truncate">
                  {getActiveTabTitle(activeTab)}
                </span>
              </button>
            </div>
          </div>

          {/* Section Selection (if full report) */}
          {mode === 'full' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-border/40 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? 'تضمين الأقسام التالية في التقرير:' : 'Include sections in printout:'}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sections.overview}
                    onChange={(e) => setSections(prev => ({ ...prev, overview: e.target.checked }))}
                    className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>{isAr ? 'الملخص التنفيذي' : 'Executive Overview'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sections.pnl}
                    onChange={(e) => setSections(prev => ({ ...prev, pnl: e.target.checked }))}
                    className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>{isAr ? 'قائمة الدخل والضرائب' : 'P&L & Taxes'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sections.orders}
                    onChange={(e) => setSections(prev => ({ ...prev, orders: e.target.checked }))}
                    className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>{isAr ? 'المبيعات والأصناف' : 'Sales & Best Sellers'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sections.shifts}
                    onChange={(e) => setSections(prev => ({ ...prev, shifts: e.target.checked }))}
                    className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>{isAr ? 'مطابقة الورديات' : 'Cashier Shifts'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sections.inventory}
                    onChange={(e) => setSections(prev => ({ ...prev, inventory: e.target.checked }))}
                    className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>{isAr ? 'المخزون وإعادة الطلب' : 'Inventory & Low Stock'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sections.staff}
                    onChange={(e) => setSections(prev => ({ ...prev, staff: e.target.checked }))}
                    className="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5 cursor-pointer"
                  />
                  <span>{isAr ? 'أداء الموظفين' : 'Staff Productivity'}</span>
                </label>
              </div>
            </div>
          )}

          {/* Redesign Highlight note */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              {isAr
                ? 'تم تنسيق هذا التقرير للطباعة الرسمية بدون أشرطة التصفح أو الأزرار غير الضرورية مع مظهر نقي وعالي التباين.'
                : 'Clean printable layout: sidebars, navigation bars, buttons, and dark overlays will be hidden automatically.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={handlePrint}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 rounded-2xl h-11 text-xs shadow-lg shadow-amber-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة التقرير الآن' : 'Print Clean Report'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-2xl h-11 text-xs font-semibold px-4"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
