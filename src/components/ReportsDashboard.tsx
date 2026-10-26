'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ZReportModal, { ZReportData } from '@/components/ZReportModal'
import PrintableReportDocument, { PrintableReportConfig } from '@/components/PrintableReportDocument'
import PrintReportModal from '@/components/PrintReportModal'
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  CheckCircle2,
  Award,
  CreditCard,
  Users,
  Activity,
  Calendar,
  DollarSign,
  FileText,
  Download,
  Trash2,
  Sparkles,
  RefreshCw,
  Clock,
  Package,
  Truck,
  AlertTriangle,
  Receipt,
  UserCheck,
  Building,
  BarChart3,
  PieChart,
  Search,
  Printer,
  Layers,
  HeartHandshake,
  ShieldAlert
} from 'lucide-react'

export interface ComprehensiveReportData {
  timeRange: string
  currency: string
  businessName: string
  taxRate: number
  generatedAt: string
  overview: {
    grossSales: number
    netRevenue: number
    totalTax: number
    totalDiscounts: number
    estimatedCOGS: number
    grossProfit: number
    totalOperatingExpenses: number
    wastageLoss: number
    totalAllExpenses: number
    netProfit: number
    netProfitMargin: number
    totalOrders: number
    completedOrders: number
    cancelledOrders: number
    averageOrderValue: number
    totalStaff: number
    totalInventoryValuation: number
    totalSupplierDebt: number
  }
  ordersReport: {
    totalOrders: number
    completedOrders: number
    cancelledOrders: number
    fulfillmentChannels: { channel: string; orders: number; sales: number }[]
    paymentMethods: { method: string; amount: number; count: number; percentage: number }[]
    hourlySales: { hour: number; label: string; orders: number; sales: number }[]
    popularItems: { id: string; name: string; category: string; quantity: number; revenue: number; price: number }[]
    categoryBreakdown: { name: string; quantity: number; revenue: number }[]
    promoCodes: { code: string; description: string | null; discountType: string; usedCount: number; isActive: boolean }[]
    recentOrders: {
      id: string
      orderNumber: string
      createdAt: string
      staffName: string
      customerName: string
      subtotal: number
      tax: number
      discount: number
      totalAmount: number
      paymentMethod: string
      paymentStatus: string
      orderStatus: string
      tableNumber: number | null
      itemsCount: number
    }[]
  }
  moneyReport: {
    incomeStatement: {
      grossRevenue: number
      discounts: number
      netSales: number
      costOfGoodsSold: number
      grossProfit: number
      operatingExpenses: number
      wastageLoss: number
      netOperatingIncome: number
      profitMargin: number
    }
    expenseCategories: { category: string; amount: number; tax: number; count: number; percentage: number }[]
    expenseVouchers: {
      id: string
      voucherNumber: string
      title: string
      category: string
      amount: number
      taxAmount: number
      totalAmount: number
      paymentMethod: string
      paymentDate: string
      payee: string | null
      status: string
      notes: string | null
    }[]
    cashierShifts: {
      totalShifts: number
      totalExpectedCash: number
      totalActualCash: number
      totalVariance: number
      shiftsList: {
        id: string
        staffName: string
        startTime: string
        endTime: string | null
        status: string
        startCash: number
        cashSales: number
        cardSales: number
        totalOrders: number
        endCash: number | null
        variance: number
        notes: string | null
      }[]
    }
    taxSummary: {
      outputTaxCollected: number
      inputTaxPaid: number
      netTaxPayable: number
      applicableTaxRate: number
    }
  }
  employeesReport: {
    totalStaffCount: number
    activeStaffCount: number
    staffPerformance: {
      staffId: string
      name: string
      role: string
      department: string
      isActive: boolean
      ordersCount: number
      totalSales: number
      discountsGiven: number
      averageTicket: number
      hoursLogged: number
      regularHours: number
      overtimeHours: number
      shiftsWorked: number
      salesPerHour: number
    }[]
    attendanceSummary: {
      totalAttendanceLogs: number
      totalHoursLogged: number
      totalOvertimeHours: number
      recentLogs: {
        id: string
        staffName: string
        role: string
        clockIn: string
        clockOut: string | null
        totalHours: number | null
        overtimeHours: number | null
        status: string
      }[]
    }
    payrollSummary: {
      totalDisbursed: number
      basePay: number
      overtimePay: number
      bonuses: number
      deductions: number
      disbursementsList: {
        id: string
        period: string
        staffCount: number
        totalAmount: number
        basePay: number
        overtimePay: number
        bonuses: number
        deductions: number
        paymentMethod: string
        disbursedAt: string
        status: string
      }[]
    }
  }
  inventorySuppliersReport: {
    stockValuation: {
      totalValuation: number
      ingredientValuation: number
      retailValuation: number
      totalIngredientsTracked: number
      totalMenuItemsTracked: number
    }
    criticalLowStock: {
      id: string
      name: string
      type: 'ingredient' | 'menu_item'
      currentStock: number
      unit: string
      threshold: number
      costPerUnit: number
      estimatedReorderCost: number
    }[]
    wastageLogs: {
      id: string
      timestamp: string
      itemName: string
      quantity: number
      lossAmount: number
      reason: string
      staffId: string | null
    }[]
    purchasingSummary: {
      totalInvoices: number
      totalPurchases: number
      totalPaid: number
      outstandingBalance: number
      recentInvoices: {
        id: string
        invoiceNumber: string
        supplierName: string
        issueDate: string
        totalAmount: number
        paidAmount: number
        paymentStatus: string
        itemsCount: number
      }[]
    }
    suppliersList: {
      id: string
      name: string
      contactPerson: string | null
      phone: string | null
      balance: number
    }[]
  }
  customersReport: {
    totalCustomers: number
    totalLoyaltyPointsBalance: number
    topCustomers: {
      id: string
      name: string
      phone: string
      loyaltyPoints: number
      ordersCount: number
      totalSpend: number
      averageSpend: number
      joinedAt: string
    }[]
  }
}

type TabType = 'overview' | 'orders' | 'finance' | 'employees' | 'inventory' | 'customers'

export default function ReportsDashboard() {
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'
  const [data, setData] = useState<ComprehensiveReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [timeRange, setTimeRange] = useState<string>('today')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false)

  // Order filters
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all')

  // Z-Report Modal
  const [isZReportOpen, setIsZReportOpen] = useState(false)
  const [zReportData, setZReportData] = useState<ZReportData | null>(null)
  const [isGeneratingZReport, setIsGeneratingZReport] = useState(false)

  // Print Report Redesign Modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false)
  const [printConfig, setPrintConfig] = useState<PrintableReportConfig>({
    mode: 'full',
    activeTab: 'overview',
    includedSections: {
      overview: true,
      pnl: true,
      orders: true,
      shifts: true,
      inventory: true,
      staff: true,
      customers: true
    }
  })

  useEffect(() => {
    fetchReportData()
  }, [timeRange])

  const fetchReportData = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      let url = `/api/reports/comprehensive?timeRange=${timeRange}`
      if (timeRange === 'custom' && customStartDate) {
        url += `&startDate=${customStartDate}`
        if (customEndDate) url += `&endDate=${customEndDate}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const json = await response.json()
        setData(json)
      } else {
        const errJson = await response.json().catch(() => ({}))
        setErrorMsg(errJson.error || `Failed to fetch reports (Status ${response.status})`)
      }
    } catch (error: any) {
      console.error('Failed to fetch comprehensive reports:', error)
      setErrorMsg(error?.message || 'Network error while loading reports')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyCustomDates = () => {
    if (customStartDate) {
      setTimeRange('custom')
      fetchReportData()
      setIsCustomDateOpen(false)
    }
  }

  const handleOpenZReport = async () => {
    setIsGeneratingZReport(true)
    try {
      const res = await fetch('/api/reports/z-report')
      if (res.ok) {
        const d = await res.json()
        setZReportData(d)
        setIsZReportOpen(true)
      }
    } catch (e) {
      console.error('Failed to load Z-Report:', e)
    } finally {
      setIsGeneratingZReport(false)
    }
  }

  const handlePrint = () => {
    setIsPrintModalOpen(true)
  }

  const handleConfirmPrint = (config: PrintableReportConfig) => {
    setPrintConfig(config)
    setTimeout(() => {
      window.print()
    }, 150)
  }

  const handleExportCsv = (allTabs = false) => {
    if (!data) return

    const rows: (string | number)[][] = [
      ['DAFATERKOM CONSOLIDATED BUSINESS REPORT'],
      ['Business Name', data.businessName],
      ['Time Range', timeRange === 'custom' ? `${customStartDate} to ${customEndDate}` : timeRange],
      ['Generated At', new Date(data.generatedAt).toLocaleString()],
      ['Currency', data.currency],
      ['']
    ]

    if (allTabs || activeTab === 'overview' || activeTab === 'finance') {
      rows.push(
        ['--- FINANCIAL STATEMENT & P&L ---'],
        [`Gross Sales (${data.currency || 'USD'})`, data.overview.grossSales.toFixed(2)],
        ['Discounts Given', data.overview.totalDiscounts.toFixed(2)],
        ['Net Sales Revenue', data.overview.netRevenue.toFixed(2)],
        ['Cost of Goods Sold (COGS)', data.overview.estimatedCOGS.toFixed(2)],
        ['Gross Profit', data.overview.grossProfit.toFixed(2)],
        ['Operating Expenses', data.overview.totalOperatingExpenses.toFixed(2)],
        ['Food Wastage Loss', data.overview.wastageLoss.toFixed(2)],
        ['Total All Expenses', data.overview.totalAllExpenses.toFixed(2)],
        ['Net Operating Profit', data.overview.netProfit.toFixed(2)],
        ['Profit Margin %', `${data.overview.netProfitMargin}%`],
        ['Output VAT (15%) Collected', data.moneyReport.taxSummary.outputTaxCollected.toFixed(2)],
        ['Input VAT on Expenses', data.moneyReport.taxSummary.inputTaxPaid.toFixed(2)],
        ['Net VAT Payable', data.moneyReport.taxSummary.netTaxPayable.toFixed(2)],
        ['']
      )
    }

    if (allTabs || activeTab === 'orders') {
      rows.push(
        ['--- POPULAR MENU ITEMS ---'],
        ['Item Name', 'Category', 'Quantity Sold', `Revenue (${data.currency || 'USD'})`],
        ...data.ordersReport.popularItems.map(i => [i.name, i.category, i.quantity, i.revenue.toFixed(2)]),
        [''],
        ['--- SALES BY PAYMENT METHOD ---'],
        ['Payment Method', 'Orders Count', 'Total Amount', 'Share %'],
        ...data.ordersReport.paymentMethods.map(p => [p.method, p.count, p.amount.toFixed(2), `${p.percentage}%`]),
        [''],
        ['--- RECENT ORDERS ---'],
        ['Order #', 'Date/Time', 'Customer', 'Cashier', 'Items', 'Total', 'Payment', 'Status'],
        ...data.ordersReport.recentOrders.map(o => [
          o.orderNumber,
          new Date(o.createdAt).toLocaleString(),
          o.customerName,
          o.staffName,
          o.itemsCount,
          o.totalAmount.toFixed(2),
          o.paymentMethod,
          o.orderStatus
        ]),
        ['']
      )
    }

    if (allTabs || activeTab === 'employees') {
      rows.push(
        ['--- EMPLOYEE PERFORMANCE & ATTENDANCE ---'],
        ['Staff Name', 'Role', 'Department', 'Orders', 'Sales Volume', 'Avg Ticket', 'Hours Logged', 'Overtime Hours', 'Sales/Hr'],
        ...data.employeesReport.staffPerformance.map(s => [
          s.name,
          s.role,
          s.department,
          s.ordersCount,
          s.totalSales.toFixed(2),
          s.averageTicket.toFixed(2),
          s.hoursLogged,
          s.overtimeHours,
          s.salesPerHour.toFixed(2)
        ]),
        ['']
      )
    }

    if (allTabs || activeTab === 'inventory') {
      rows.push(
        ['--- CRITICAL LOW STOCK REORDER ALERTS ---'],
        ['Item Name', 'Type', 'Current Stock', 'Unit', 'Threshold', 'Cost/Unit', 'Estimated Reorder Cost'],
        ...data.inventorySuppliersReport.criticalLowStock.map(i => [
          i.name,
          i.type,
          i.currentStock,
          i.unit,
          i.threshold,
          i.costPerUnit.toFixed(2),
          i.estimatedReorderCost.toFixed(2)
        ]),
        [''],
        ['--- FOOD WASTAGE LOG ---'],
        ['Date', 'Item', 'Quantity', 'Loss Amount', 'Reason'],
        ...data.inventorySuppliersReport.wastageLogs.map(w => [
          new Date(w.timestamp).toLocaleDateString(),
          w.itemName,
          w.quantity,
          w.lossAmount.toFixed(2),
          w.reason
        ]),
        ['']
      )
    }

    if (allTabs || activeTab === 'customers') {
      rows.push(
        ['--- TOP VIP CUSTOMERS ---'],
        ['Customer Name', 'Phone', 'Orders Placed', 'Total Spend', 'Loyalty Points'],
        ...data.customersReport.topCustomers.map(c => [
          c.name,
          c.phone,
          c.ordersCount,
          c.totalSpend.toFixed(2),
          c.loyaltyPoints
        ]),
        ['']
      )
    }

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Dafaterkom_${activeTab}_Report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (!data?.ordersReport?.recentOrders) return []
    return data.ordersReport.recentOrders.filter(order => {
      const matchQuery =
        order.orderNumber.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.customerName.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.staffName.toLowerCase().includes(orderSearch.toLowerCase())
      const matchStatus = orderStatusFilter === 'all' || order.orderStatus === orderStatusFilter
      const matchPayment = orderPaymentFilter === 'all' || order.paymentMethod === orderPaymentFilter
      return matchQuery && matchStatus && matchPayment
    })
  }, [data, orderSearch, orderStatusFilter, orderPaymentFilter])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="glass-card px-8 py-6 rounded-3xl flex items-center gap-4 shadow-xl border border-white/20">
          <RefreshCw className="h-6 w-6 animate-spin text-amber-500" />
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">Generating Consolidated Reports...</p>
            <p className="text-xs text-muted-foreground">Aggregating Sales, Money, Staff, Inventory & Customers</p>
          </div>
        </div>
      </div>
    )
  }

  if (errorMsg && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass-card p-6 rounded-3xl max-w-md text-center space-y-4 border border-rose-500/20">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">Unable to Load Reports</h3>
            <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
          </div>
          <Button onClick={fetchReportData} className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { overview, ordersReport, moneyReport, employeesReport, inventorySuppliersReport, customersReport, currency } = data

  return (
    <>
      {/* Interactive Screen Dashboard UI (Hidden during Printing) */}
      <div className="no-print p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        {/* Top Header & Global Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Reports & Business Intelligence
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Consolidated real-time reports for Orders, Financials, Employees, Inventory & Loyalty
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchReportData}
            disabled={loading}
            className="h-9 px-3 rounded-xl gap-1.5 glass-pill"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline text-xs font-semibold">Refresh</span>
          </Button>

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportCsv(false)}
            className="h-9 px-3 rounded-xl gap-1.5 glass-pill"
            title="Export Active Tab to CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Export CSV</span>
          </Button>

          {/* Print */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-9 px-3 rounded-xl gap-1.5 glass-pill hidden md:flex"
            title="Print Report"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold">Print</span>
          </Button>

          {/* Daily Z-Report */}
          <Button
            type="button"
            onClick={handleOpenZReport}
            disabled={isGeneratingZReport}
            size="sm"
            className="h-9 px-3 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
          >
            <FileText className={`h-3.5 w-3.5 ${isGeneratingZReport ? 'animate-spin' : ''}`} />
            <span>Daily Z-Report</span>
          </Button>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select
              value={timeRange}
              onValueChange={(val) => {
                if (val === 'custom') {
                  setIsCustomDateOpen(true)
                } else {
                  setTimeRange(val)
                }
              }}
            >
              <SelectTrigger className="w-36 h-9 glass-pill rounded-xl text-xs font-bold">
                <SelectValue placeholder="Select Range" />
              </SelectTrigger>
              <SelectContent className="glass-panel">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="custom">Custom Range...</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Custom Date Range Picker Bar */}
      {isCustomDateOpen && (
        <div className="p-4 rounded-2xl glass-card border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-bold">Custom Date Range:</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">From:</span>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 text-xs w-36 rounded-lg bg-background/80"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">To:</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 text-xs w-36 rounded-lg bg-background/80"
              />
            </div>
            <Button size="sm" onClick={handleApplyCustomDates} className="h-8 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-700 text-white">
              Apply
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsCustomDateOpen(false)} className="h-8 text-xs rounded-lg">
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl glass-panel border border-border/40 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
            activeTab === 'overview'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
            activeTab === 'orders'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Orders & Sales</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono">{overview.totalOrders}</span>
        </button>

        <button
          onClick={() => setActiveTab('finance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
            activeTab === 'finance'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          <span>Money & Financials</span>
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
            activeTab === 'employees'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Employees & HR</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono">{overview.totalStaff}</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
            activeTab === 'inventory'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Inventory & Supplies</span>
          {inventorySuppliersReport.criticalLowStock.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono font-bold animate-pulse">
              {inventorySuppliersReport.criticalLowStock.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
            activeTab === 'customers'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
              : 'text-muted-foreground hover:text-foreground hover:bg-foreground/5'
          }`}
        >
          <HeartHandshake className="h-4 w-4" />
          <span>Customers & Loyalty</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 font-mono">{customersReport.totalCustomers}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EXECUTIVE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Primary Top KPI Cards */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {/* Net Revenue */}
            <Card className="glass-card rounded-2xl relative overflow-hidden border-border/40">
              <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Sales Revenue</CardTitle>
                <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <DollarSign className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  ${overview.netRevenue.toFixed(2)}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
                  <span>Gross: ${overview.grossSales.toFixed(2)}</span>
                  <span>Disc: -${overview.totalDiscounts.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Gross Profit & COGS */}
            <Card className="glass-card rounded-2xl relative overflow-hidden border-border/40">
              <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gross Profit</CardTitle>
                <div className="h-8 w-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">
                  ${overview.grossProfit.toFixed(2)}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
                  <span>COGS: ${overview.estimatedCOGS.toFixed(2)}</span>
                  <span className="font-bold text-blue-500">
                    {overview.grossSales > 0 ? `${((overview.grossProfit / overview.grossSales) * 100).toFixed(0)}% Margin` : '0%'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Operating Expenses & Spoilage */}
            <Card className="glass-card rounded-2xl relative overflow-hidden border-border/40">
              <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Expenses</CardTitle>
                <div className="h-8 w-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <TrendingDown className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-black tracking-tight text-rose-600 dark:text-rose-400">
                  ${overview.totalAllExpenses.toFixed(2)}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
                  <span>Opex: ${overview.totalOperatingExpenses.toFixed(2)}</span>
                  <span>Waste: ${overview.wastageLoss.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Net Operating Income / Profit */}
            <Card className="glass-card rounded-2xl relative overflow-hidden border-border/40">
              <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Bottom-Line Profit</CardTitle>
                <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Sparkles className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-black tracking-tight ${overview.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  ${overview.netProfit.toFixed(2)}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-2 pt-2 border-t border-border/30">
                  <span>Profit Margin:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-md ${overview.netProfitMargin >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                    {overview.netProfitMargin}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Secondary Quick Summary Row */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div className="p-4 rounded-2xl glass-panel border border-border/30">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-amber-500" /> Total Orders
              </span>
              <p className="text-xl font-black mt-1">{overview.totalOrders}</p>
              <span className="text-[11px] text-emerald-600 font-medium">{overview.completedOrders} completed</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-border/30">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5 text-blue-500" /> Average Ticket
              </span>
              <p className="text-xl font-black mt-1">${overview.averageOrderValue.toFixed(2)}</p>
              <span className="text-[11px] text-muted-foreground">per completed ticket</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-border/30">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 text-purple-500" /> Stock Valuation
              </span>
              <p className="text-xl font-black mt-1">${overview.totalInventoryValuation.toFixed(2)}</p>
              <span className="text-[11px] text-muted-foreground">ingredients & items</span>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-border/30">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-rose-500" /> Supplier Debt (AP)
              </span>
              <p className="text-xl font-black mt-1">${overview.totalSupplierDebt.toFixed(2)}</p>
              <span className="text-[11px] text-rose-500 font-medium">pending payable balance</span>
            </div>
          </div>

          {/* Visual Profit & Loss Allocation Bar */}
          <Card className="glass-card rounded-2xl border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-500" />
                  Financial Inflow & Outflow Allocation
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  Gross Sales: ${overview.grossSales.toFixed(2)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {overview.grossSales > 0 ? (
                <div className="w-full h-5 rounded-xl overflow-hidden flex shadow-inner bg-slate-100 dark:bg-slate-800">
                  <div
                    style={{ width: `${Math.min(100, (overview.estimatedCOGS / overview.grossSales) * 100)}%` }}
                    className="bg-blue-500 h-full transition-all"
                    title={`COGS: $${overview.estimatedCOGS.toFixed(2)} (${((overview.estimatedCOGS / overview.grossSales) * 100).toFixed(1)}%)`}
                  />
                  <div
                    style={{ width: `${Math.min(100, (overview.totalOperatingExpenses / overview.grossSales) * 100)}%` }}
                    className="bg-amber-500 h-full transition-all"
                    title={`Expenses: $${overview.totalOperatingExpenses.toFixed(2)} (${((overview.totalOperatingExpenses / overview.grossSales) * 100).toFixed(1)}%)`}
                  />
                  <div
                    style={{ width: `${Math.min(100, (overview.wastageLoss / overview.grossSales) * 100)}%` }}
                    className="bg-rose-500 h-full transition-all"
                    title={`Wastage: $${overview.wastageLoss.toFixed(2)} (${((overview.wastageLoss / overview.grossSales) * 100).toFixed(1)}%)`}
                  />
                  <div
                    style={{ width: `${Math.max(0, Math.min(100, (overview.netProfit / overview.grossSales) * 100))}%` }}
                    className="bg-emerald-500 h-full transition-all"
                    title={`Net Profit: $${overview.netProfit.toFixed(2)} (${overview.netProfitMargin}%)`}
                  />
                </div>
              ) : (
                <div className="w-full h-4 rounded-xl bg-slate-200 dark:bg-slate-800" />
              )}

              <div className="flex flex-wrap items-center justify-between text-xs gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                  <span className="text-muted-foreground">COGS:</span>
                  <span className="font-bold">${overview.estimatedCOGS.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span className="text-muted-foreground">Operating Expenses:</span>
                  <span className="font-bold">${overview.totalOperatingExpenses.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span className="text-muted-foreground">Wastage / Loss:</span>
                  <span className="font-bold">${overview.wastageLoss.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span className="text-muted-foreground">Net Bottom-Line Profit:</span>
                  <span className="font-bold text-emerald-600">${overview.netProfit.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Insights Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Fulfillment Channels */}
            <Card className="glass-card rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-amber-500" />
                  Sales by Fulfillment Channel
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ordersReport.fulfillmentChannels.map(ch => {
                  const share = overview.netRevenue > 0 ? (ch.sales / overview.netRevenue) * 100 : 0
                  return (
                    <div key={ch.channel} className="space-y-1 p-2 rounded-xl bg-background/40">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{ch.channel}</span>
                        <span className="font-mono">${ch.sales.toFixed(2)} ({share.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${share}%` }} />
                      </div>
                      <div className="text-[10px] text-muted-foreground">{ch.orders} orders processed</div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card className="glass-card rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  Payment Methods Mix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ordersReport.paymentMethods.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No payment transactions recorded</p>
                ) : (
                  ordersReport.paymentMethods.map(pm => (
                    <div key={pm.method} className="space-y-1 p-2 rounded-xl bg-background/40">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="capitalize">{pm.method}</span>
                        <span className="font-mono font-bold">${pm.amount.toFixed(2)} ({pm.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: `${pm.percentage}%` }} />
                      </div>
                      <div className="text-[10px] text-muted-foreground">{pm.count} transactions</div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Critical Business Alerts */}
            <Card className="glass-card rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                  Critical Status & Action Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {inventorySuppliersReport.criticalLowStock.length > 0 ? (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <p className="font-bold">{inventorySuppliersReport.criticalLowStock.length} Low Stock Alert(s)</p>
                      <p className="text-[11px] opacity-80">Immediate restocking required for key items/ingredients.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-medium">All stock levels within safe limits.</span>
                  </div>
                )}

                {moneyReport.cashierShifts.totalVariance !== 0 ? (
                  <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <p className="font-bold">Drawer Cash Variance</p>
                      <p className="text-[11px] opacity-80">
                        Total shift discrepancy: ${moneyReport.cashierShifts.totalVariance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Shift drawers balanced with 0 discrepancy.</span>
                  </div>
                )}

                <div className="p-2.5 rounded-xl bg-background/40 border border-border/30 text-xs flex justify-between items-center">
                  <span className="text-muted-foreground">Active Staff On Duty:</span>
                  <span className="font-bold font-mono">{employeesReport.activeStaffCount} / {employeesReport.totalStaffCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ORDERS & SALES */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Total Processed</span>
              <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">{ordersReport.totalOrders}</p>
              <span className="text-[11px] text-muted-foreground">Tickets in period</span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Completed Rate</span>
              <p className="text-2xl font-black mt-1 text-emerald-600">
                {ordersReport.totalOrders > 0
                  ? `${((ordersReport.completedOrders / ordersReport.totalOrders) * 100).toFixed(0)}%`
                  : '0%'}
              </p>
              <span className="text-[11px] text-muted-foreground">{ordersReport.completedOrders} completed</span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Cancelled / Voids</span>
              <p className="text-2xl font-black mt-1 text-rose-600">{ordersReport.cancelledOrders}</p>
              <span className="text-[11px] text-rose-500 font-medium">
                {ordersReport.totalOrders > 0
                  ? `${((ordersReport.cancelledOrders / ordersReport.totalOrders) * 100).toFixed(1)}% void rate`
                  : '0%'}
              </span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Average Order Size</span>
              <p className="text-2xl font-black mt-1 text-blue-600">${overview.averageOrderValue.toFixed(2)}</p>
              <span className="text-[11px] text-muted-foreground">Revenue per ticket</span>
            </Card>
          </div>

          {/* Hourly Peak Sales Curve */}
          <Card className="glass-card rounded-2xl border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  24-Hour Peak Sales & Volume Heatmap
                </span>
                <span className="text-xs text-muted-foreground font-normal">Hourly revenue curve</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const maxSales = Math.max(...ordersReport.hourlySales.map(h => h.sales), 1)
                return (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 items-end h-28 pt-4">
                      {ordersReport.hourlySales.map(h => {
                        const heightPct = Math.max(4, (h.sales / maxSales) * 100)
                        return (
                          <div
                            key={h.hour}
                            className="flex flex-col items-center justify-end h-full group relative"
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-1.5 rounded pointer-events-none whitespace-nowrap z-20 shadow-lg">
                              {h.label}: ${h.sales.toFixed(2)} ({h.orders} orders)
                            </div>
                            <div
                              style={{ height: `${heightPct}%` }}
                              className={`w-full rounded-t-sm transition-all duration-300 ${
                                h.sales > 0 ? 'bg-amber-500 group-hover:bg-amber-400' : 'bg-slate-200 dark:bg-slate-800'
                              }`}
                            />
                            <span className="text-[8px] text-muted-foreground font-mono mt-1 select-none">
                              {h.hour % 3 === 0 ? String(h.hour).padStart(2, '0') : ''}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Top Items & Category Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Top Best-Selling Menu Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersReport.popularItems.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">No items sold in this period</p>
                ) : (
                  <div className="space-y-2.5">
                    {ordersReport.popularItems.slice(0, 8).map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-background/40 hover:bg-background/80 transition-colors border border-border/20 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground">{item.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-slate-900 dark:text-white font-mono">${item.revenue.toFixed(2)}</p>
                          <p className="text-[10px] text-muted-foreground">{item.quantity} sold</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  Revenue by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ordersReport.categoryBreakdown.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-8 text-center">No categories data</p>
                ) : (
                  <div className="space-y-3">
                    {ordersReport.categoryBreakdown.map(cat => {
                      const share = overview.netRevenue > 0 ? (cat.revenue / overview.netRevenue) * 100 : 0
                      return (
                        <div key={cat.name} className="space-y-1 p-2 rounded-xl bg-background/40 text-xs">
                          <div className="flex justify-between font-bold">
                            <span>{cat.name}</span>
                            <span className="font-mono">${cat.revenue.toFixed(2)} ({share.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${share}%` }} />
                          </div>
                          <div className="text-[10px] text-muted-foreground">{cat.quantity} items ordered</div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Granular Searchable Orders Ledger Table */}
          <Card className="glass-card rounded-2xl border-border/40">
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-amber-500" />
                  Granular Order Transactions Log
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Showing {filteredOrders.length} of {ordersReport.recentOrders.length} recorded orders
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search order #, customer..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="h-8 pl-8 text-xs w-48 rounded-xl bg-background/80"
                  />
                </div>

                <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                  <SelectTrigger className="h-8 w-28 text-xs rounded-xl glass-pill">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel">
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={orderPaymentFilter} onValueChange={setOrderPaymentFilter}>
                  <SelectTrigger className="h-8 w-28 text-xs rounded-xl glass-pill">
                    <SelectValue placeholder="Payment" />
                  </SelectTrigger>
                  <SelectContent className="glass-panel">
                    <SelectItem value="all">All Payments</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-2.5 rounded-l-lg">Order #</th>
                      <th className="px-3 py-2.5">Date & Time</th>
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-3 py-2.5">Cashier</th>
                      <th className="px-3 py-2.5 text-center">Items</th>
                      <th className="px-3 py-2.5 text-center">Payment</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-3 py-2.5 text-right rounded-r-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/[0.05]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-muted-foreground">
                          No matching orders found
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-3 py-2.5 font-bold font-mono text-amber-600 dark:text-amber-400">
                            {order.orderNumber}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-3 py-2.5 font-medium">{order.customerName}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{order.staffName}</td>
                          <td className="px-3 py-2.5 text-center font-mono">{order.itemsCount}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800">
                              {order.paymentMethod}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                order.orderStatus === 'completed'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : order.orderStatus === 'cancelled'
                                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {order.orderStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-black font-mono text-slate-900 dark:text-white">
                            ${order.totalAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MONEY & FINANCIALS */}
      {/* ========================================================================= */}
      {activeTab === 'finance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Income Statement (P&L Card) */}
          <Card className="glass-card rounded-2xl border-border/40 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-600/10 via-amber-500/5 to-transparent pb-3">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                  Profit & Loss Statement (Income Statement)
                </span>
                <span className="text-xs font-mono font-normal text-muted-foreground">
                  Currency: {currency} | Tax: {data.taxRate}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="divide-y divide-border/40 text-xs">
                <div className="py-2 flex justify-between items-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Gross Sales Revenue (+)</span>
                  <span className="font-mono font-bold">${moneyReport.incomeStatement.grossRevenue.toFixed(2)}</span>
                </div>
                <div className="py-2 flex justify-between items-center text-purple-600 dark:text-purple-400">
                  <span className="ps-4">Less: Promotional Discounts & Coupons (-)</span>
                  <span className="font-mono font-bold">-${moneyReport.incomeStatement.discounts.toFixed(2)}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center font-bold bg-slate-50 dark:bg-slate-800/40 px-3 rounded-xl">
                  <span>Net Sales Revenue (=)</span>
                  <span className="font-mono text-sm">${moneyReport.incomeStatement.netSales.toFixed(2)}</span>
                </div>

                <div className="py-2 flex justify-between items-center text-blue-600 dark:text-blue-400">
                  <span className="font-semibold">Cost of Goods Sold (COGS - Ingredients & Supplies) (-)</span>
                  <span className="font-mono font-bold">-${moneyReport.incomeStatement.costOfGoodsSold.toFixed(2)}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center font-extrabold bg-blue-500/10 px-3 rounded-xl text-blue-700 dark:text-blue-300">
                  <span>Gross Operating Profit (=)</span>
                  <span className="font-mono text-sm">${moneyReport.incomeStatement.grossProfit.toFixed(2)}</span>
                </div>

                <div className="py-2 flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span className="font-semibold">Operating Expenses (Rent, Utilities, Maintenance, Admin) (-)</span>
                  <span className="font-mono font-bold">-${moneyReport.incomeStatement.operatingExpenses.toFixed(2)}</span>
                </div>
                <div className="py-2 flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span className="ps-4">Inventory Spoilage, Wastage & Food Loss (-)</span>
                  <span className="font-mono font-bold">-${moneyReport.incomeStatement.wastageLoss.toFixed(2)}</span>
                </div>

                <div className="py-3 flex justify-between items-center font-black text-base bg-emerald-500/15 px-3 rounded-xl text-emerald-700 dark:text-emerald-300">
                  <span>Net Operating Income / Bottom-Line Profit (=)</span>
                  <span className="font-mono text-lg">${moneyReport.incomeStatement.netOperatingIncome.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expenses Breakdown & Tax Summary */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-rose-500" />
                  Operating Expenses by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moneyReport.expenseCategories.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No expense vouchers in period</p>
                ) : (
                  <div className="space-y-3">
                    {moneyReport.expenseCategories.map(exp => (
                      <div key={exp.category} className="space-y-1 p-2 rounded-xl bg-background/40 text-xs">
                        <div className="flex justify-between font-bold">
                          <span className="capitalize">{exp.category.replace('_', ' ')}</span>
                          <span className="font-mono">${exp.amount.toFixed(2)} ({exp.percentage}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-rose-500 h-full rounded-full" style={{ width: `${exp.percentage}%` }} />
                        </div>
                        <div className="text-[10px] text-muted-foreground">{exp.count} vouchers</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Building className="h-4 w-4 text-purple-500" />
                  Tax & VAT Settlement Analysis ({moneyReport.taxSummary.applicableTaxRate}%)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <div className="p-3 rounded-xl bg-background/40 border border-border/30 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Output Tax Collected (Sales)</span>
                  <span className="font-bold font-mono text-emerald-600">${moneyReport.taxSummary.outputTaxCollected.toFixed(2)}</span>
                </div>
                <div className="p-3 rounded-xl bg-background/40 border border-border/30 flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Input Tax Paid (Expenses/Purchases)</span>
                  <span className="font-bold font-mono text-blue-600">${moneyReport.taxSummary.inputTaxPaid.toFixed(2)}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex justify-between items-center text-xs">
                  <span className="font-bold text-purple-700 dark:text-purple-300">Net Tax Liability Payable</span>
                  <span className="font-black font-mono text-base text-purple-700 dark:text-purple-300">
                    ${moneyReport.taxSummary.netTaxPayable.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cashier Shift Drawer Audits */}
          <Card className="glass-card rounded-2xl border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-amber-500" />
                  Cashier Shifts & Cash Drawer Reconciliations
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  Total Discrepancy: ${moneyReport.cashierShifts.totalVariance.toFixed(2)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 rounded-l-lg">Staff Member</th>
                      <th className="px-3 py-2.5">Start Time</th>
                      <th className="px-3 py-2.5 text-right">Start Cash</th>
                      <th className="px-3 py-2.5 text-right">Cash Sales</th>
                      <th className="px-3 py-2.5 text-right">Card Sales</th>
                      <th className="px-3 py-2.5 text-right">Counted Cash</th>
                      <th className="px-3 py-2.5 text-right rounded-r-lg">Discrepancy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/[0.05]">
                    {moneyReport.cashierShifts.shiftsList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-6 text-muted-foreground">
                          No cashier shifts recorded
                        </td>
                      </tr>
                    ) : (
                      moneyReport.cashierShifts.shiftsList.map(s => (
                        <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2.5 font-bold">{s.staffName}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {new Date(s.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">${s.startCash.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-emerald-600">${s.cashSales.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right font-mono text-blue-600">${s.cardSales.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold">
                            {s.endCash !== null ? `$${s.endCash.toFixed(2)}` : 'In Progress'}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold font-mono ${
                                s.variance === 0
                                  ? 'bg-emerald-500/15 text-emerald-600'
                                  : s.variance > 0
                                  ? 'bg-blue-500/15 text-blue-600'
                                  : 'bg-rose-500/15 text-rose-600'
                              }`}
                            >
                              {s.variance > 0 ? `+$${s.variance.toFixed(2)}` : `$${s.variance.toFixed(2)}`}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EMPLOYEES & HR */}
      {/* ========================================================================= */}
      {activeTab === 'employees' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Active Staff</span>
              <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">
                {employeesReport.activeStaffCount} / {employeesReport.totalStaffCount}
              </p>
              <span className="text-[11px] text-emerald-600 font-medium">registered workforce</span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Labor Hours Logged</span>
              <p className="text-2xl font-black mt-1 text-blue-600">
                {employeesReport.attendanceSummary.totalHoursLogged} hrs
              </p>
              <span className="text-[11px] text-muted-foreground">
                Overtime: {employeesReport.attendanceSummary.totalOvertimeHours} hrs
              </span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Payroll Disbursed</span>
              <p className="text-2xl font-black mt-1 text-purple-600">
                ${employeesReport.payrollSummary.totalDisbursed.toFixed(2)}
              </p>
              <span className="text-[11px] text-muted-foreground">wages and compensation</span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Top Sales Leader</span>
              <p className="text-lg font-black mt-1 truncate text-amber-600">
                {employeesReport.staffPerformance[0]?.name || 'N/A'}
              </p>
              <span className="text-[11px] text-muted-foreground">
                ${employeesReport.staffPerformance[0]?.totalSales.toFixed(2) || '0.00'} volume
              </span>
            </Card>
          </div>

          {/* Staff Performance Leaderboard */}
          <Card className="glass-card rounded-2xl border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                Staff Performance Leaderboard & Productivity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 rounded-l-lg">Staff Member</th>
                      <th className="px-3 py-2.5">Role</th>
                      <th className="px-3 py-2.5 text-center">Orders Handled</th>
                      <th className="px-3 py-2.5 text-right">Total Sales</th>
                      <th className="px-3 py-2.5 text-right">Avg Ticket</th>
                      <th className="px-3 py-2.5 text-center">Hours Worked</th>
                      <th className="px-3 py-2.5 text-right rounded-r-lg">Sales / Hour</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/[0.05]">
                    {employeesReport.staffPerformance.map((staff, idx) => (
                      <tr key={staff.staffId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="px-3 py-3 font-bold flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>{staff.name}</span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {staff.role}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center font-semibold">{staff.ordersCount}</td>
                        <td className="px-3 py-3 text-right font-extrabold font-mono text-amber-600">
                          ${staff.totalSales.toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-right font-mono">${staff.averageTicket.toFixed(2)}</td>
                        <td className="px-3 py-3 text-center font-mono">{staff.hoursLogged} hrs</td>
                        <td className="px-3 py-3 text-right font-black font-mono text-emerald-600">
                          ${staff.salesPerHour.toFixed(2)}/hr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Logs & Payroll List */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-500" />
                  Recent Clock-In / Clock-Out Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employeesReport.attendanceSummary.recentLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No attendance logs in period</p>
                ) : (
                  <div className="space-y-2">
                    {employeesReport.attendanceSummary.recentLogs.slice(0, 6).map(att => (
                      <div key={att.id} className="flex justify-between items-center p-2.5 rounded-xl bg-background/40 text-xs">
                        <div>
                          <p className="font-bold">{att.staffName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(att.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                            {att.clockOut ? `to ${new Date(att.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '(Active)'}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-emerald-600">
                          {att.totalHours ? `${att.totalHours.toFixed(1)} hrs` : 'In Progress'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-purple-500" />
                  Payroll Disbursements History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {employeesReport.payrollSummary.disbursementsList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No payroll disbursements recorded</p>
                ) : (
                  <div className="space-y-2">
                    {employeesReport.payrollSummary.disbursementsList.map(pay => (
                      <div key={pay.id} className="flex justify-between items-center p-2.5 rounded-xl bg-background/40 text-xs">
                        <div>
                          <p className="font-bold">Period: {pay.period}</p>
                          <p className="text-[10px] text-muted-foreground">{pay.staffCount} staff members</p>
                        </div>
                        <span className="font-mono font-black text-purple-600">
                          ${pay.totalAmount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INVENTORY & SUPPLIERS */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Total Stock Valuation</span>
              <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">
                ${inventorySuppliersReport.stockValuation.totalValuation.toFixed(2)}
              </p>
              <span className="text-[11px] text-muted-foreground">asset value on shelf</span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Critical Low Stock</span>
              <p className="text-2xl font-black mt-1 text-rose-600">
                {inventorySuppliersReport.criticalLowStock.length}
              </p>
              <span className="text-[11px] text-rose-500 font-medium">items below threshold</span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Food Spoilage / Loss</span>
              <p className="text-2xl font-black mt-1 text-rose-600">
                ${overview.wastageLoss.toFixed(2)}
              </p>
              <span className="text-[11px] text-muted-foreground">loss prevention log</span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Supplier Debt (AP)</span>
              <p className="text-2xl font-black mt-1 text-amber-600">
                ${overview.totalSupplierDebt.toFixed(2)}
              </p>
              <span className="text-[11px] text-muted-foreground">outstanding balance</span>
            </Card>
          </div>

          {/* Critical Low Stock Table */}
          <Card className="glass-card rounded-2xl border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" />
                  Critical Low Stock & Urgent Reorder Table
                </span>
                <span className="text-xs text-muted-foreground font-normal">
                  {inventorySuppliersReport.criticalLowStock.length} items requiring restocking
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 rounded-l-lg">Item / Ingredient</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5 text-center">Current Stock</th>
                      <th className="px-3 py-2.5 text-center">Safety Threshold</th>
                      <th className="px-3 py-2.5 text-right">Cost / Unit</th>
                      <th className="px-3 py-2.5 text-right rounded-r-lg">Estimated Reorder Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/[0.05]">
                    {inventorySuppliersReport.criticalLowStock.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-emerald-600 font-medium">
                          All items and ingredients have healthy stock levels!
                        </td>
                      </tr>
                    ) : (
                      inventorySuppliersReport.criticalLowStock.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2.5 font-bold">{item.name}</td>
                          <td className="px-3 py-2.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-slate-100 dark:bg-slate-800">
                              {item.type}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-rose-600 font-mono">
                            {item.currentStock} {item.unit}
                          </td>
                          <td className="px-3 py-2.5 text-center text-muted-foreground font-mono">
                            {item.threshold} {item.unit}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">${item.costPerUnit.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right font-black font-mono text-rose-600">
                            ${item.estimatedReorderCost.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Wastage Logs & Suppliers */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  Food Wastage & Spoilage Incidents Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inventorySuppliersReport.wastageLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No wastage reported in period</p>
                ) : (
                  <div className="space-y-2">
                    {inventorySuppliersReport.wastageLogs.slice(0, 8).map(w => (
                      <div key={w.id} className="flex justify-between items-center p-2.5 rounded-xl bg-background/40 text-xs">
                        <div>
                          <p className="font-bold">{w.itemName}</p>
                          <p className="text-[10px] text-muted-foreground">{w.reason}</p>
                        </div>
                        <span className="font-mono font-black text-rose-600">
                          -${w.lossAmount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass-card rounded-2xl border-border/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-500" />
                  Supplier Accounts Payable (AP) Balances
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inventorySuppliersReport.suppliersList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-6 text-center">No suppliers registered</p>
                ) : (
                  <div className="space-y-2">
                    {inventorySuppliersReport.suppliersList.map(sup => (
                      <div key={sup.id} className="flex justify-between items-center p-2.5 rounded-xl bg-background/40 text-xs">
                        <div>
                          <p className="font-bold">{sup.name}</p>
                          <p className="text-[10px] text-muted-foreground">{sup.contactPerson || sup.phone || 'Supplier'}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-mono font-bold ${sup.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            ${sup.balance.toFixed(2)}
                          </p>
                          <span className="text-[10px] text-muted-foreground">balance</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: CUSTOMERS & LOYALTY */}
      {/* ========================================================================= */}
      {activeTab === 'customers' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Registered Customers</span>
              <p className="text-2xl font-black mt-1 text-slate-900 dark:text-white">
                {customersReport.totalCustomers}
              </p>
              <span className="text-[11px] text-muted-foreground">loyalty member profiles</span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Points Pool Balance</span>
              <p className="text-2xl font-black mt-1 text-purple-600">
                {customersReport.totalLoyaltyPointsBalance} pts
              </p>
              <span className="text-[11px] text-muted-foreground">active reward points</span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">Top Customer LTV</span>
              <p className="text-2xl font-black mt-1 text-amber-600">
                ${customersReport.topCustomers[0]?.totalSpend.toFixed(2) || '0.00'}
              </p>
              <span className="text-[11px] text-muted-foreground">highest customer spend</span>
            </Card>

            <Card className="glass-card rounded-2xl p-4">
              <span className="text-xs text-muted-foreground">VIP Club Members</span>
              <p className="text-2xl font-black mt-1 text-emerald-600">
                {customersReport.topCustomers.filter(c => c.totalSpend > 100).length}
              </p>
              <span className="text-[11px] text-muted-foreground">&gt;$100 spend volume</span>
            </Card>
          </div>

          {/* VIP Customers Table */}
          <Card className="glass-card rounded-2xl border-border/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-amber-500" />
                VIP Customers & High-Value Retention Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 dark:bg-slate-800/80 uppercase font-semibold text-slate-500">
                    <tr>
                      <th className="px-3 py-2.5 rounded-l-lg">Customer</th>
                      <th className="px-3 py-2.5">Phone</th>
                      <th className="px-3 py-2.5 text-center">Orders Placed</th>
                      <th className="px-3 py-2.5 text-center">Loyalty Points</th>
                      <th className="px-3 py-2.5 text-right">Average Order</th>
                      <th className="px-3 py-2.5 text-right rounded-r-lg">Total Lifetime Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/[0.05]">
                    {customersReport.topCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-muted-foreground">
                          No customer profiles recorded yet
                        </td>
                      </tr>
                    ) : (
                      customersReport.topCustomers.map((cust, idx) => (
                        <tr key={cust.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                          <td className="px-3 py-2.5 font-bold flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black text-[10px] flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span>{cust.name}</span>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground font-mono">{cust.phone}</td>
                          <td className="px-3 py-2.5 text-center font-semibold">{cust.ordersCount}</td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600">
                              {cust.loyaltyPoints} pts
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">${cust.averageSpend.toFixed(2)}</td>
                          <td className="px-3 py-2.5 text-right font-black font-mono text-emerald-600">
                            ${cust.totalSpend.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>

      {/* Redesigned Printable Report Document (Rendered only on Paper/PDF Print Stream) */}
      <PrintableReportDocument
        data={data}
        config={printConfig}
        locale={locale}
      />

      {/* Print Configuration & Scope Options Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        activeTab={activeTab}
        onConfirmPrint={handleConfirmPrint}
        locale={locale}
      />

      {/* End-of-Day Z-Report Modal */}
      <ZReportModal
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        data={zReportData}
      />
    </>
  )
}
