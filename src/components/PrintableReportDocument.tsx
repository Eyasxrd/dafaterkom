'use client'

import React from 'react'
import { ComprehensiveReportData } from '@/components/ReportsDashboard'

export interface PrintableReportConfig {
  mode: 'active' | 'full'
  activeTab: string
  includedSections: {
    overview: boolean
    pnl: boolean
    orders: boolean
    shifts: boolean
    inventory: boolean
    staff: boolean
    customers: boolean
  }
}

interface PrintableReportDocumentProps {
  data: ComprehensiveReportData
  config: PrintableReportConfig
  locale?: string
}

export default function PrintableReportDocument({
  data,
  config,
  locale = 'en'
}: PrintableReportDocumentProps) {
  const isAr = locale === 'ar'
  const { overview, ordersReport, moneyReport, employeesReport, inventorySuppliersReport, customersReport, currency } = data

  const shouldShowSection = (sectionKey: keyof PrintableReportConfig['includedSections']) => {
    if (config.mode === 'full') {
      return config.includedSections[sectionKey]
    }
    // In active mode, map active tab to section key
    if (config.activeTab === 'overview') return sectionKey === 'overview'
    if (config.activeTab === 'orders') return sectionKey === 'orders'
    if (config.activeTab === 'finance') return sectionKey === 'pnl' || sectionKey === 'shifts'
    if (config.activeTab === 'employees') return sectionKey === 'staff'
    if (config.activeTab === 'inventory') return sectionKey === 'inventory'
    if (config.activeTab === 'customers') return sectionKey === 'customers'
    return true
  }

  const formatMoney = (amount: number) => {
    return `${currency === 'SAR' ? 'SAR ' : '$'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case 'today': return isAr ? 'اليوم' : 'Today'
      case 'yesterday': return isAr ? 'أمس' : 'Yesterday'
      case 'week': return isAr ? 'آخر 7 أيام' : 'Last 7 Days'
      case 'month': return isAr ? 'هذا الشهر' : 'This Month'
      case 'last_month': return isAr ? 'الشهر الماضي' : 'Last Month'
      case 'year': return isAr ? 'هذه السنة' : 'This Year'
      case 'all': return isAr ? 'كل الفترات' : 'All Time'
      default: return range
    }
  }

  return (
    <div id="printable-report-document" className="print-only hidden print:block bg-white text-slate-900 font-sans p-2 sm:p-6 max-w-4xl mx-auto text-[11px] leading-normal select-none">
      {/* Document Letterhead / Official Header */}
      <div className="border-b-2 border-slate-900 pb-4 mb-5">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-black text-sm">
                D
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {data.businessName || 'Dafaterkom POS'}
                </h1>
                <p className="text-[10px] text-slate-600 font-semibold tracking-wider uppercase">
                  {isAr ? 'تقرير الأعمال والبيانات المالية المعتمد' : 'Executive Business & Financial Report'}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right text-[10px] space-y-0.5 font-mono text-slate-700">
            <p><span className="text-slate-500 font-sans">{isAr ? 'الفترة:' : 'Period:'}</span> <strong className="font-bold text-slate-900">{getTimeRangeLabel(data.timeRange)}</strong></p>
            <p><span className="text-slate-500 font-sans">{isAr ? 'تاريخ التوليد:' : 'Generated:'}</span> {new Date(data.generatedAt).toLocaleString()}</p>
            <p><span className="text-slate-500 font-sans">{isAr ? 'الضريبة:' : 'VAT Rate:'}</span> {data.taxRate}% | <span className="text-slate-500 font-sans">{isAr ? 'العملة:' : 'Currency:'}</span> {currency}</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: EXECUTIVE KPI SUMMARY & PROFIT METRICS */}
      {/* ========================================================================= */}
      {shouldShowSection('overview') && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block"></span>
              {isAr ? '1. الملخص التنفيذي ومؤشرات الأداء المالي' : '1. Executive Performance & Profit Summary'}
            </h2>
            <span className="text-[9px] text-slate-500 uppercase">{isAr ? 'أهم الأرقام' : 'Key Metrics'}</span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="border border-slate-300 rounded p-2 bg-slate-50/50">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">{isAr ? 'صافي المبيعات' : 'Net Sales Revenue'}</span>
              <span className="text-sm font-black text-slate-900 font-mono block mt-0.5">{formatMoney(overview.netRevenue)}</span>
              <span className="text-[8px] text-slate-500">{isAr ? 'إجمالي المبيعات:' : 'Gross:'} {formatMoney(overview.grossSales)}</span>
            </div>

            <div className="border border-slate-300 rounded p-2 bg-slate-50/50">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">{isAr ? 'إجمالي الأرباح (COGS)' : 'Gross Profit'}</span>
              <span className="text-sm font-black text-slate-900 font-mono block mt-0.5">{formatMoney(overview.grossProfit)}</span>
              <span className="text-[8px] text-slate-500">
                {overview.grossSales > 0 ? `${((overview.grossProfit / overview.grossSales) * 100).toFixed(1)}% ${isAr ? 'هامش' : 'margin'}` : '0%'}
              </span>
            </div>

            <div className="border border-slate-300 rounded p-2 bg-slate-50/50">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">{isAr ? 'إجمالي المصاريف والهدر' : 'Total Expenses & Loss'}</span>
              <span className="text-sm font-black text-slate-900 font-mono block mt-0.5">{formatMoney(overview.totalAllExpenses)}</span>
              <span className="text-[8px] text-slate-500">{isAr ? 'مصاريف تشغيل:' : 'Opex:'} {formatMoney(overview.totalOperatingExpenses)}</span>
            </div>

            <div className="border-2 border-slate-900 rounded p-2 bg-slate-100">
              <span className="text-[9px] uppercase font-bold text-slate-700 block">{isAr ? 'صافي الربح التشغيلي' : 'Net Bottom-Line Profit'}</span>
              <span className="text-sm font-black text-slate-900 font-mono block mt-0.5">{formatMoney(overview.netProfit)}</span>
              <span className="text-[8px] font-bold text-slate-700">{isAr ? 'هامش الربح:' : 'Profit Margin:'} {overview.netProfitMargin}%</span>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-4 gap-2 text-[10px] border border-slate-200 rounded p-2 bg-white">
            <div>
              <span className="text-slate-500">{isAr ? 'إجمالي الطلبات:' : 'Total Orders:'}</span>{' '}
              <strong className="font-mono">{overview.totalOrders}</strong>{' '}
              <span className="text-slate-400">({overview.completedOrders} {isAr ? 'مكتمل' : 'done'})</span>
            </div>
            <div>
              <span className="text-slate-500">{isAr ? 'متوسط الفاتورة:' : 'Average Ticket:'}</span>{' '}
              <strong className="font-mono">{formatMoney(overview.averageOrderValue)}</strong>
            </div>
            <div>
              <span className="text-slate-500">{isAr ? 'قيمة المخزون:' : 'Stock Valuation:'}</span>{' '}
              <strong className="font-mono">{formatMoney(overview.totalInventoryValuation)}</strong>
            </div>
            <div>
              <span className="text-slate-500">{isAr ? 'مستحقات الموردين:' : 'Supplier Debt:'}</span>{' '}
              <strong className="font-mono">{formatMoney(overview.totalSupplierDebt)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PROFIT & LOSS STATEMENT & TAX SETTLEMENT */}
      {/* ========================================================================= */}
      {shouldShowSection('pnl') && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block"></span>
              {isAr ? '2. قائمة الدخل والأرباح والخسائر (P&L)' : '2. Income Statement & Tax Settlement'}
            </h2>
            <span className="text-[9px] text-slate-500 uppercase">{isAr ? 'البيان المالي' : 'Financial Statement'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* P&L Statement Table */}
            <table className="w-full border border-slate-300 text-[10px]">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="p-1.5 font-medium text-slate-700">{isAr ? 'إجمالي مبيعات الفترة (+)' : 'Gross Sales Revenue (+)'}</td>
                  <td className="p-1.5 text-right font-mono font-bold">{formatMoney(moneyReport.incomeStatement.grossRevenue)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-1.5 ps-4 text-slate-600">{isAr ? 'الخصومات والعروض الترويجية (-)' : 'Promotional Discounts & Coupons (-)'}</td>
                  <td className="p-1.5 text-right font-mono text-slate-600">-{formatMoney(moneyReport.incomeStatement.discounts)}</td>
                </tr>
                <tr className="border-b border-slate-300 bg-slate-100 font-bold">
                  <td className="p-1.5">{isAr ? 'صافي المبيعات (=)' : 'Net Sales Revenue (=)'}</td>
                  <td className="p-1.5 text-right font-mono">{formatMoney(moneyReport.incomeStatement.netSales)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-1.5 font-medium text-slate-700">{isAr ? 'تكلفة البضاعة المباعة (COGS) (-)' : 'Cost of Goods Sold (COGS) (-)'}</td>
                  <td className="p-1.5 text-right font-mono text-slate-600">-{formatMoney(moneyReport.incomeStatement.costOfGoodsSold)}</td>
                </tr>
                <tr className="border-b border-slate-300 bg-slate-100 font-bold">
                  <td className="p-1.5">{isAr ? 'إجمالي الربح التشغيلي (=)' : 'Gross Operating Profit (=)'}</td>
                  <td className="p-1.5 text-right font-mono">{formatMoney(moneyReport.incomeStatement.grossProfit)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-1.5 font-medium text-slate-700">{isAr ? 'المصاريف التشغيلية (إيجار، فواتير، رواتب) (-)' : 'Operating Expenses (Rent, Utilities, Admin) (-)'}</td>
                  <td className="p-1.5 text-right font-mono text-slate-600">-{formatMoney(moneyReport.incomeStatement.operatingExpenses)}</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="p-1.5 ps-4 text-slate-600">{isAr ? 'خسائر وتلف المواد الغذائية (-)' : 'Inventory Spoilage & Wastage Loss (-)'}</td>
                  <td className="p-1.5 text-right font-mono text-slate-600">-{formatMoney(moneyReport.incomeStatement.wastageLoss)}</td>
                </tr>
                <tr className="bg-slate-900 text-white font-black text-[11px]">
                  <td className="p-2">{isAr ? 'صافي الربح النهائي (=)' : 'Net Bottom-Line Operating Profit (=)'}</td>
                  <td className="p-2 text-right font-mono">{formatMoney(moneyReport.incomeStatement.netOperatingIncome)}</td>
                </tr>
              </tbody>
            </table>

            {/* Tax & VAT Summary */}
            <div className="border border-slate-300 rounded p-3 flex flex-col justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-[10px] uppercase tracking-wider text-slate-700 mb-2 pb-1 border-b border-slate-200">
                  {isAr ? 'تسوية ضريبة القيمة المضافة (VAT)' : 'VAT & Tax Settlement Analysis'} ({moneyReport.taxSummary.applicableTaxRate}%)
                </h3>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600">{isAr ? 'ضريبة المخرجات المحصلة (المبيعات):' : 'Output Tax Collected (Sales):'}</span>
                    <span className="font-mono font-bold">{formatMoney(moneyReport.taxSummary.outputTaxCollected)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{isAr ? 'ضريبة المدخلات المدفوعة (المشتريات/المصاريف):' : 'Input Tax Paid (Purchases/Expenses):'}</span>
                    <span className="font-mono font-bold">{formatMoney(moneyReport.taxSummary.inputTaxPaid)}</span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-slate-300 font-bold text-slate-900">
                    <span>{isAr ? 'صافي الضريبة المستحقة للسداد:' : 'Net VAT Liability Payable:'}</span>
                    <span className="font-mono text-xs">{formatMoney(moneyReport.taxSummary.netTaxPayable)}</span>
                  </div>
                </div>
              </div>

              {/* Operating Expenses Categories Summary */}
              {moneyReport.expenseCategories.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-200">
                  <h4 className="font-bold text-[9px] uppercase tracking-wider text-slate-500 mb-1">
                    {isAr ? 'توزيع المصاريف حسب الفئة' : 'Expense Categories Breakdown'}
                  </h4>
                  <div className="grid grid-cols-2 gap-1 text-[9px]">
                    {moneyReport.expenseCategories.slice(0, 4).map(exp => (
                      <div key={exp.category} className="flex justify-between bg-white border border-slate-200 p-1 rounded">
                        <span className="capitalize truncate text-slate-600">{exp.category.replace('_', ' ')}</span>
                        <span className="font-mono font-bold">{formatMoney(exp.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ORDERS, CHANNELS & TOP BEST SELLERS */}
      {/* ========================================================================= */}
      {shouldShowSection('orders') && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block"></span>
              {isAr ? '3. المبيعات، القنوات، والأصناف الأكثر طلباً' : '3. Sales Breakdown & Popular Menu Items'}
            </h2>
            <span className="text-[9px] text-slate-500 uppercase">{isAr ? 'حركة الطلبات' : 'Order Analytics'}</span>
          </div>

          {/* Channels & Payment Mix Row */}
          <div className="grid grid-cols-2 gap-3 mb-3 text-[10px]">
            {/* Fulfillment Channels */}
            <div className="border border-slate-300 rounded p-2">
              <h3 className="font-bold text-[9px] uppercase tracking-wider text-slate-600 mb-1.5">
                {isAr ? 'قنوات تنفيذ الطلبات' : 'Sales by Channel'}
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[9px]">
                    <th className="text-left font-semibold pb-1">{isAr ? 'القناة' : 'Channel'}</th>
                    <th className="text-center font-semibold pb-1">{isAr ? 'الطلبات' : 'Orders'}</th>
                    <th className="text-right font-semibold pb-1">{isAr ? 'المبيعات' : 'Sales'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ordersReport.fulfillmentChannels.map(ch => (
                    <tr key={ch.channel}>
                      <td className="py-1 font-medium">{ch.channel}</td>
                      <td className="py-1 text-center font-mono">{ch.orders}</td>
                      <td className="py-1 text-right font-mono font-bold">{formatMoney(ch.sales)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment Methods */}
            <div className="border border-slate-300 rounded p-2">
              <h3 className="font-bold text-[9px] uppercase tracking-wider text-slate-600 mb-1.5">
                {isAr ? 'طرق الدفع والتحصيل' : 'Payment Tender Mix'}
              </h3>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[9px]">
                    <th className="text-left font-semibold pb-1">{isAr ? 'طريقة الدفع' : 'Method'}</th>
                    <th className="text-center font-semibold pb-1">{isAr ? 'العدد' : 'Count'}</th>
                    <th className="text-center font-semibold pb-1">{isAr ? 'النسبة' : 'Share'}</th>
                    <th className="text-right font-semibold pb-1">{isAr ? 'المبلغ' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ordersReport.paymentMethods.map(pm => (
                    <tr key={pm.method}>
                      <td className="py-1 font-medium capitalize">{pm.method}</td>
                      <td className="py-1 text-center font-mono">{pm.count}</td>
                      <td className="py-1 text-center font-mono">{pm.percentage}%</td>
                      <td className="py-1 text-right font-mono font-bold">{formatMoney(pm.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Best-Selling Menu Items */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-bold text-[9px] uppercase tracking-wider text-slate-700">
              {isAr ? 'الأصناف الأكثر مبيعاً وتحقيقاً للإيرادات' : 'Top Performing Menu Items by Sales Volume'}
            </div>
            <table className="w-full text-[10px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[9px]">
                <tr>
                  <th className="p-1.5 text-center w-8">#</th>
                  <th className="p-1.5 text-left">{isAr ? 'اسم الصنف' : 'Item Name'}</th>
                  <th className="p-1.5 text-left">{isAr ? 'التصنيف' : 'Category'}</th>
                  <th className="p-1.5 text-center">{isAr ? 'الكمية المباعة' : 'Qty Sold'}</th>
                  <th className="p-1.5 text-right">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                  <th className="p-1.5 text-right">{isAr ? 'إجمالي الإيراد' : 'Total Revenue'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ordersReport.popularItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-3 text-center text-slate-400">
                      {isAr ? 'لا توجد مبيعات مسجلة في هذه الفترة' : 'No menu item sales recorded in this period'}
                    </td>
                  </tr>
                ) : (
                  ordersReport.popularItems.slice(0, 10).map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                      <td className="p-1.5 text-center font-bold text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-1.5 font-bold text-slate-800">{item.name}</td>
                      <td className="p-1.5 text-slate-600">{item.category}</td>
                      <td className="p-1.5 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="p-1.5 text-right font-mono">{formatMoney(item.price)}</td>
                      <td className="p-1.5 text-right font-mono font-black text-slate-900">{formatMoney(item.revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: CASHIER SHIFTS & DRAWER RECONCILIATIONS */}
      {/* ========================================================================= */}
      {shouldShowSection('shifts') && moneyReport.cashierShifts.shiftsList.length > 0 && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block"></span>
              {isAr ? '4. ورديات الكاشير ومطابقة الصندوق النقدي' : '4. Cashier Shifts & Drawer Reconciliations'}
            </h2>
            <span className="text-[9px] text-slate-500 font-mono">
              {isAr ? 'إجمالي الفروقات:' : 'Total Variance:'} {formatMoney(moneyReport.cashierShifts.totalVariance)}
            </span>
          </div>

          <table className="w-full border border-slate-300 text-[10px]">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase text-[9px]">
              <tr>
                <th className="p-1.5 text-left">{isAr ? 'الكاشير' : 'Cashier'}</th>
                <th className="p-1.5 text-left">{isAr ? 'بداية الوردية' : 'Start Time'}</th>
                <th className="p-1.5 text-right">{isAr ? 'عهدة البداية' : 'Start Cash'}</th>
                <th className="p-1.5 text-right">{isAr ? 'مبيعات الكاش' : 'Cash Sales'}</th>
                <th className="p-1.5 text-right">{isAr ? 'مبيعات الشبكة' : 'Card Sales'}</th>
                <th className="p-1.5 text-right">{isAr ? 'المعدود الفعلي' : 'Actual End'}</th>
                <th className="p-1.5 text-right">{isAr ? 'الفارق (عجز/فائض)' : 'Variance'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {moneyReport.cashierShifts.shiftsList.map((s, idx) => (
                <tr key={s.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                  <td className="p-1.5 font-bold">{s.staffName}</td>
                  <td className="p-1.5 text-slate-600 font-mono">
                    {new Date(s.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="p-1.5 text-right font-mono">{formatMoney(s.startCash)}</td>
                  <td className="p-1.5 text-right font-mono font-medium">{formatMoney(s.cashSales)}</td>
                  <td className="p-1.5 text-right font-mono font-medium">{formatMoney(s.cardSales)}</td>
                  <td className="p-1.5 text-right font-mono font-bold">
                    {s.endCash !== null ? formatMoney(s.endCash) : (isAr ? 'مستمرة' : 'In Progress')}
                  </td>
                  <td className="p-1.5 text-right font-mono font-bold">
                    {s.variance === 0 ? (
                      <span className="text-slate-700 font-normal">0.00</span>
                    ) : s.variance > 0 ? (
                      <span className="text-slate-900 font-bold">+{formatMoney(s.variance)}</span>
                    ) : (
                      <span className="text-slate-900 font-bold">-{formatMoney(Math.abs(s.variance))}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: INVENTORY & CRITICAL STOCK ALERTS */}
      {/* ========================================================================= */}
      {shouldShowSection('inventory') && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block"></span>
              {isAr ? '5. تقييم المخزون وتنبيهات إعادة الطلب العاجلة' : '5. Stock Valuation & Low Stock Alerts'}
            </h2>
            <span className="text-[9px] text-slate-500 uppercase">{isAr ? 'إدارة المستودع' : 'Inventory Control'}</span>
          </div>

          <table className="w-full border border-slate-300 text-[10px]">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase text-[9px]">
              <tr>
                <th className="p-1.5 text-left">{isAr ? 'الصنف / المادة الأولية' : 'Item / Ingredient'}</th>
                <th className="p-1.5 text-center">{isAr ? 'النوع' : 'Type'}</th>
                <th className="p-1.5 text-center">{isAr ? 'المخزون الحالي' : 'Current Stock'}</th>
                <th className="p-1.5 text-center">{isAr ? 'حد الأمان' : 'Safety Threshold'}</th>
                <th className="p-1.5 text-right">{isAr ? 'تكلفة الوحدة' : 'Cost / Unit'}</th>
                <th className="p-1.5 text-right">{isAr ? 'تكلفة إعادة الطلب التقديرية' : 'Est. Reorder Cost'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inventorySuppliersReport.criticalLowStock.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-3 text-center text-slate-500 font-medium">
                    {isAr ? 'جميع مستويات المخزون والمواد الأولية ضمن الحدود الآمنة والمثالية' : 'All items and raw ingredients are within safe operational limits.'}
                  </td>
                </tr>
              ) : (
                inventorySuppliersReport.criticalLowStock.map((item, idx) => (
                  <tr key={item.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                    <td className="p-1.5 font-bold text-slate-800">{item.name}</td>
                    <td className="p-1.5 text-center uppercase text-[9px] font-mono text-slate-600">{item.type}</td>
                    <td className="p-1.5 text-center font-bold font-mono text-slate-900">{item.currentStock} {item.unit}</td>
                    <td className="p-1.5 text-center font-mono text-slate-500">{item.threshold} {item.unit}</td>
                    <td className="p-1.5 text-right font-mono">{formatMoney(item.costPerUnit)}</td>
                    <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(item.estimatedReorderCost)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: STAFF PERFORMANCE & PRODUCTIVITY */}
      {/* ========================================================================= */}
      {shouldShowSection('staff') && employeesReport.staffPerformance.length > 0 && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block"></span>
              {isAr ? '6. أداء وإنتاجية فريق العمل والموظفين' : '6. Staff Productivity & Sales Performance'}
            </h2>
            <span className="text-[9px] text-slate-500 font-mono">
              {employeesReport.activeStaffCount} / {employeesReport.totalStaffCount} {isAr ? 'موظف نشط' : 'active staff'}
            </span>
          </div>

          <table className="w-full border border-slate-300 text-[10px]">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase text-[9px]">
              <tr>
                <th className="p-1.5 text-left">{isAr ? 'اسم الموظف' : 'Staff Member'}</th>
                <th className="p-1.5 text-left">{isAr ? 'المسمى الوظيفي' : 'Role'}</th>
                <th className="p-1.5 text-center">{isAr ? 'الطلبات المنجزة' : 'Orders'}</th>
                <th className="p-1.5 text-right">{isAr ? 'إجمالي المبيعات' : 'Sales Volume'}</th>
                <th className="p-1.5 text-right">{isAr ? 'متوسط الفاتورة' : 'Avg Ticket'}</th>
                <th className="p-1.5 text-center">{isAr ? 'ساعات العمل' : 'Hours'}</th>
                <th className="p-1.5 text-right">{isAr ? 'المبيعات / ساعة' : 'Sales / Hr'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {employeesReport.staffPerformance.map((staff, idx) => (
                <tr key={staff.staffId} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                  <td className="p-1.5 font-bold text-slate-800">{staff.name}</td>
                  <td className="p-1.5 text-slate-600 uppercase text-[9px]">{staff.role}</td>
                  <td className="p-1.5 text-center font-mono">{staff.ordersCount}</td>
                  <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(staff.totalSales)}</td>
                  <td className="p-1.5 text-right font-mono">{formatMoney(staff.averageTicket)}</td>
                  <td className="p-1.5 text-center font-mono">{staff.hoursLogged} hrs</td>
                  <td className="p-1.5 text-right font-mono font-bold text-slate-900">{formatMoney(staff.salesPerHour)}/hr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 7: VIP CUSTOMERS & LOYALTY */}
      {/* ========================================================================= */}
      {shouldShowSection('customers') && customersReport.topCustomers.length > 0 && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 inline-block"></span>
              {isAr ? '7. كبار العملاء وبرنامج الولاء (VIP Customers)' : '7. Top VIP Customers & Loyalty Leaderboard'}
            </h2>
            <span className="text-[9px] text-slate-500 font-mono">
              {customersReport.totalCustomers} {isAr ? 'عميل مسجل' : 'members'} | {customersReport.totalLoyaltyPointsBalance} pts
            </span>
          </div>

          <table className="w-full border border-slate-300 text-[10px]">
            <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 uppercase text-[9px]">
              <tr>
                <th className="p-1.5 text-left">{isAr ? 'اسم العميل' : 'Customer Name'}</th>
                <th className="p-1.5 text-left">{isAr ? 'رقم الهاتف' : 'Phone'}</th>
                <th className="p-1.5 text-center">{isAr ? 'عدد الطلبات' : 'Orders'}</th>
                <th className="p-1.5 text-center">{isAr ? 'نقاط الولاء' : 'Points'}</th>
                <th className="p-1.5 text-right">{isAr ? 'متوسط الطلب' : 'Average Order'}</th>
                <th className="p-1.5 text-right">{isAr ? 'إجمالي الإنفاق مدى الحياة' : 'Lifetime Spend'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {customersReport.topCustomers.slice(0, 8).map((cust, idx) => (
                <tr key={cust.id} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                  <td className="p-1.5 font-bold text-slate-800">{cust.name}</td>
                  <td className="p-1.5 text-slate-600 font-mono">{cust.phone}</td>
                  <td className="p-1.5 text-center font-mono">{cust.ordersCount}</td>
                  <td className="p-1.5 text-center font-mono font-bold text-slate-700">{cust.loyaltyPoints} pts</td>
                  <td className="p-1.5 text-right font-mono">{formatMoney(cust.averageSpend)}</td>
                  <td className="p-1.5 text-right font-mono font-black text-slate-900">{formatMoney(cust.totalSpend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Formal Document Verification & Signature Block */}
      <div className="mt-8 pt-4 border-t border-slate-300 print-avoid-break">
        <div className="grid grid-cols-3 gap-6 text-[9px] text-slate-600">
          <div className="border-t border-slate-400 pt-1">
            <p className="font-bold uppercase text-slate-800">{isAr ? 'إعداد المحاسب / المشرف:' : 'Prepared By:'}</p>
            <p className="text-slate-400 mt-4">_______________________</p>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <p className="font-bold uppercase text-slate-800">{isAr ? 'اعتماد الإدارة / التدقيق:' : 'Reviewed & Approved By:'}</p>
            <p className="text-slate-400 mt-4">_______________________</p>
          </div>
          <div className="border-t border-slate-400 pt-1 text-right">
            <p className="font-bold uppercase text-slate-800">{isAr ? 'التاريخ والختم:' : 'Official Stamp & Date:'}</p>
            <p className="text-slate-400 mt-4">_______________________</p>
          </div>
        </div>

        <div className="flex justify-between items-center text-[8px] text-slate-400 mt-4 pt-2 border-t border-slate-200">
          <span>Dafaterkom Cloud POS Business Intelligence Engine</span>
          <span>{isAr ? 'مستند أعمال رسمي وسري' : 'Confidential Official Management Report'}</span>
        </div>
      </div>
    </div>
  )
}
