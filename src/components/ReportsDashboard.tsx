'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import ZReportModal, { ZReportData } from '@/components/ZReportModal'
import {
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  XCircle,
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
  Percent
} from 'lucide-react'

interface AnalyticsData {
  totalRevenue: number
  subtotal?: number
  tax?: number
  discount?: number
  wastageLoss?: number
  netProfit?: number
  totalOrders: number
  completedOrders: number
  cancelledOrders: number
  paymentMethods: { method: string; amount: number; count: number }[]
  popularItems: { name: string; quantity: number; revenue: number }[]
  staffPerformance?: {
    staffId: string
    name: string
    role: string
    ordersCount: number
    totalSales: number
    averageTicket: number
  }[]
}

export default function ReportsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    paymentMethods: [],
    popularItems: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<string>('today')
  const [isZReportOpen, setIsZReportOpen] = useState(false)
  const [zReportData, setZReportData] = useState<ZReportData | null>(null)
  const [isGeneratingZReport, setIsGeneratingZReport] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/reports/analytics?timeRange=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenZReport = async () => {
    setIsGeneratingZReport(true)
    try {
      const res = await fetch('/api/reports/z-report')
      if (res.ok) {
        const data = await res.json()
        setZReportData(data)
        setIsZReportOpen(true)
      }
    } catch (e) {
      console.error('Failed to load Z-Report:', e)
    } finally {
      setIsGeneratingZReport(false)
    }
  }

  const handleExportAnalyticsCsv = () => {
    const rows = [
      ['DAFATERKOM ANALYTICS EXPORT'],
      ['Time Range', timeRange],
      ['Generated At', new Date().toLocaleString()],
      [''],
      ['METRIC', 'VALUE'],
      ['Gross Sales', (analytics.subtotal || totalRevenue).toFixed(2)],
      ['Total Discounts', (analytics.discount || 0).toFixed(2)],
      ['Total VAT (15%)', (analytics.tax || 0).toFixed(2)],
      ['Net Total Revenue', totalRevenue.toFixed(2)],
      ['Food Wastage Loss', (analytics.wastageLoss || 0).toFixed(2)],
      ['Operating Profit', (analytics.netProfit || totalRevenue).toFixed(2)],
      ['Total Orders', totalOrders],
      ['Completed Orders', completedOrders],
      ['Cancelled Orders', cancelledOrders],
      [''],
      ['POPULAR ITEMS', 'QUANTITY SOLD', 'REVENUE (USD)'],
      ...popularItems.map(i => [i.name, i.quantity, i.revenue.toFixed(2)]),
      [''],
      ['PAYMENT METHOD', 'COUNT', 'AMOUNT (USD)'],
      ...paymentMethods.map(p => [p.method, p.count, p.amount.toFixed(2)]),
      [''],
      ['STAFF MEMBER', 'ROLE', 'ORDERS', 'TOTAL SALES (USD)', 'AVG TICKET (USD)'],
      ...(analytics.staffPerformance || []).map(s => [s.name, s.role, s.ordersCount, s.totalSales.toFixed(2), s.averageTicket.toFixed(2)])
    ]
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(cell => `"${cell}"`).join(',')).join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Dafaterkom_Analytics_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const {
    totalRevenue = 0,
    totalOrders = 0,
    completedOrders = 0,
    cancelledOrders = 0,
    popularItems = [],
    paymentMethods = []
  } = analytics

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass-card px-8 py-6 rounded-2xl flex items-center gap-3">
          <Activity className="h-5 w-5 animate-spin text-amber-500" />
          <span className="font-medium text-muted-foreground">Loading reports & analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-stone-900 via-amber-800 to-amber-600 dark:from-white dark:via-amber-200 dark:to-amber-400">
            Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time revenue, order volume, and staff performance</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleExportAnalyticsCsv}
            className="h-10 text-xs font-bold gap-1.5 glass-pill rounded-xl"
            title="Download CSV report"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </Button>

          <Button
            type="button"
            onClick={handleOpenZReport}
            disabled={isGeneratingZReport}
            className="h-10 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md"
          >
            <FileText className={`h-3.5 w-3.5 ${isGeneratingZReport ? 'animate-spin' : ''}`} />
            <span>Daily Z-Report</span>
          </Button>

          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40 glass-pill rounded-xl">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent className="glass-panel">
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Net Sales Revenue</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">${totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>Gross: ${(analytics.subtotal || totalRevenue).toFixed(2)}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Discounts Given</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Percent className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">
              -${(analytics.discount || 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Promos & loyalty redemptions</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Wastage / Spoilage Loss</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Trash2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
              -${(analytics.wastageLoss || 0).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Written off in Loss Prevention</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Loss-Adjusted Profit</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
              ${(analytics.netProfit !== undefined ? analytics.netProfit : totalRevenue).toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Revenue minus wastage write-offs</p>
          </CardContent>
        </Card>
      </div>

      {/* Operational Order Counts */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Orders</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold">{totalOrders}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Tickets processed</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{completedOrders}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalOrders > 0 ? `${((completedOrders / totalOrders) * 100).toFixed(0)}% completion rate` : '0%'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Cancelled / Voided</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">{cancelledOrders}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalOrders > 0 ? `${((cancelledOrders / totalOrders) * 100).toFixed(0)}% cancellation rate` : '0%'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Popular Items */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Award className="h-5 w-5 text-amber-500" />
              <span>Popular Items</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No data available</p>
            ) : (
              <div className="space-y-3">
                {popularItems.map((item, index) => (
                  <div key={item.name} className="flex justify-between items-center p-3 rounded-xl bg-background/40 hover:bg-background/70 border border-border/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-semibold">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-foreground/5 border border-border/40">
                      {item.quantity} sold (${item.revenue.toFixed(2)})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Payment Method */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-primary" />
              <span>Revenue by Payment Method</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No data available</p>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((pm) => (
                  <div key={pm.method} className="flex justify-between items-center p-3 rounded-xl bg-background/40 hover:bg-background/70 border border-border/30 transition-colors">
                    <div>
                      <span className="font-semibold capitalize">{pm.method}</span>
                      <span className="text-xs text-muted-foreground ml-2">({pm.count} orders)</span>
                    </div>
                    <span className="font-bold text-primary">${pm.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff & Cashier Performance Matrix */}
      {analytics.staffPerformance && analytics.staffPerformance.length > 0 && (
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-500" />
              <span>Cashier & Staff Performance Leaderboard</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5 rounded-l-lg">Staff Member</th>
                    <th className="px-4 py-2.5">Role</th>
                    <th className="px-4 py-2.5 text-center">Orders Handled</th>
                    <th className="px-4 py-2.5 text-right">Avg Ticket Size</th>
                    <th className="px-4 py-2.5 text-right rounded-r-lg">Total Sales Volume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-white/[0.05]">
                  {analytics.staffPerformance.map((staff, idx) => (
                    <tr key={staff.staffId} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{staff.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{staff.ordersCount} orders</td>
                      <td className="px-4 py-3 text-right font-mono">${staff.averageTicket.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                        ${staff.totalSales.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Distribution */}
      <Card className="glass-card rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-blue-500" />
            <span>Order Fulfillment Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { status: 'Completed Orders', count: completedOrders, color: 'from-emerald-500 to-emerald-600' },
              { status: 'Cancelled Orders', count: cancelledOrders, color: 'from-rose-500 to-rose-600' },
              { status: 'In-Progress / Pending', count: Math.max(0, totalOrders - completedOrders - cancelledOrders), color: 'from-amber-500 to-amber-600' }
            ].map(({ status, count, color }) => {
              const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0
              return (
                <div key={status} className="space-y-1.5 p-2 rounded-xl bg-background/30">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground/90">{status}</span>
                    <span className="text-xs text-muted-foreground font-mono">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* End-of-Day Z-Report Modal */}
      <ZReportModal
        isOpen={isZReportOpen}
        onClose={() => setIsZReportOpen(false)}
        data={zReportData}
      />
    </div>
  )
}

