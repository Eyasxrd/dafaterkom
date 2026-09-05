'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  DollarSign
} from 'lucide-react'

interface Order {
  id: string
  totalAmount: number
  paymentMethod: string
  orderStatus: string
  createdAt: string
  staff: {
    name: string
  }
  items: {
    menuItem: {
      name: string
      category: { name: string }
    }
    quantity: number
    subtotal: number
  }[]
}

export default function ReportsDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<string>('today')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFilteredOrders = () => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (timeRange) {
      case 'today':
        return orders.filter(order => new Date(order.createdAt) >= today)
      case 'week':
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return orders.filter(order => new Date(order.createdAt) >= weekAgo)
      case 'month':
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return orders.filter(order => new Date(order.createdAt) >= monthAgo)
      default:
        return orders
    }
  }

  const filteredOrders = getFilteredOrders()

  const totalRevenue = filteredOrders
    .filter(order => order.orderStatus !== 'cancelled')
    .reduce((sum, order) => sum + order.totalAmount, 0)

  const totalOrders = filteredOrders.length
  const completedOrders = filteredOrders.filter(order => order.orderStatus === 'completed').length
  const cancelledOrders = filteredOrders.filter(order => order.orderStatus === 'cancelled').length

  // Calculate popular items
  const itemSales = filteredOrders
    .filter(order => order.orderStatus !== 'cancelled')
    .flatMap(order => order.items)
    .reduce((acc, item) => {
      const key = item.menuItem.name
      acc[key] = (acc[key] || 0) + item.quantity
      return acc
    }, {} as Record<string, number>)

  const popularItems = Object.entries(itemSales)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Calculate revenue by payment method
  const paymentMethodRevenue = filteredOrders
    .filter(order => order.orderStatus !== 'cancelled')
    .reduce((acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] || 0) + order.totalAmount
      return acc
    }, {} as Record<string, number>)

  // Calculate staff performance
  const staffPerformance = filteredOrders
    .filter(order => order.orderStatus !== 'cancelled')
    .reduce((acc, order) => {
      const key = order.staff.name
      acc[key] = (acc[key] || 0) + order.totalAmount
      return acc
    }, {} as Record<string, number>)

  const topStaff = Object.entries(staffPerformance)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

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
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-48 glass-pill rounded-xl">
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

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Revenue</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold tracking-tight">${totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span>Net filtered period</span>
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Orders</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold tracking-tight">{totalOrders}</p>
            <p className="text-xs text-muted-foreground mt-1">Orders processed</p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Completed</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{completedOrders}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalOrders > 0 ? `${((completedOrders / totalOrders) * 100).toFixed(0)}% completion rate` : 'No orders'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Cancelled</CardTitle>
            <div className="h-8 w-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <XCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">{cancelledOrders}</p>
            <p className="text-xs text-muted-foreground mt-1">
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
                {popularItems.map(([name, quantity], index) => (
                  <div key={name} className="flex justify-between items-center p-3 rounded-xl bg-background/40 hover:bg-background/70 border border-border/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-semibold">{name}</span>
                    </div>
                    <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-foreground/5 border border-border/40">
                      {quantity} sold
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
            {Object.keys(paymentMethodRevenue).length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No data available</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(paymentMethodRevenue).map(([method, amount]) => (
                  <div key={method} className="flex justify-between items-center p-3 rounded-xl bg-background/40 hover:bg-background/70 border border-border/30 transition-colors">
                    <span className="font-semibold capitalize">{method}</span>
                    <span className="font-bold text-primary">${amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Performing Staff */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-purple-500" />
              <span>Top Performing Staff</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topStaff.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">No data available</p>
            ) : (
              <div className="space-y-3">
                {topStaff.map(([name, revenue], index) => (
                  <div key={name} className="flex justify-between items-center p-3 rounded-xl bg-background/40 hover:bg-background/70 border border-border/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="font-semibold">{name}</span>
                    </div>
                    <span className="font-bold">${revenue.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="glass-card rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-blue-500" />
              <span>Order Status Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {['pending', 'preparing', 'ready', 'completed', 'cancelled'].map(status => {
                const count = filteredOrders.filter(order => order.orderStatus === status).length
                const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0
                return (
                  <div key={status} className="space-y-1.5 p-2 rounded-xl bg-background/30">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium text-foreground/90">{status}</span>
                      <span className="text-xs text-muted-foreground font-mono">{count} ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
