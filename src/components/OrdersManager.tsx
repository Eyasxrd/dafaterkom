'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal'
import RefundModal from '@/components/RefundModal'
import { formatCurrency, getCurrencySymbol } from '@/lib/currency'
import { 
  Printer, 
  Flame, 
  Bell, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  XCircle, 
  FileText, 
  AlertTriangle,
  Calendar
} from 'lucide-react'

interface OrderItem {
  id: string
  menuItem: {
    name: string
    category: { name: string }
  }
  quantity: number
  price: number
  subtotal: number
  notes?: string | null
}

interface Order {
  id: string
  orderNumber: string
  subtotal?: number
  tax?: number
  discount?: number
  totalAmount: number
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  tableNumber?: number | null
  customerName?: string | null
  customerEmail?: string | null
  customerId?: string | null
  customer?: {
    name: string
    phone?: string | null
    loyaltyPoints: number
  } | null
  notes?: string | null
  createdAt: string
  staff: {
    name: string
    role: string
  }
  items: OrderItem[]
}

export default function OrdersManager() {
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'
  const [orders, setOrders] = useState<Order[]>([])
  const [tenantInfo, setTenantInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [timeRangeFilter, setTimeRangeFilter] = useState<'today' | 'all'>('today')
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [refundingOrder, setRefundingOrder] = useState<Order | null>(null)
  
  // Void / Cancel State
  const [voidingOrder, setVoidingOrder] = useState<Order | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [isVoiding, setIsVoiding] = useState(false)
  const [voidError, setVoidError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const [ordRes, tenRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/tenant').catch(() => null)
      ])
      const data = await ordRes.json()
      setOrders(data)
      if (tenRes && tenRes.ok) {
        const tData = await tenRes.json()
        setTenantInfo(tData)
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      })
      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
    }
  }

  const handleConfirmVoid = async () => {
    if (!voidingOrder || !voidReason.trim()) return
    setIsVoiding(true)
    setVoidError(null)
    try {
      const response = await fetch(`/api/orders/${voidingOrder.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: voidReason.trim() })
      })
      const data = await response.json()
      if (response.ok) {
        setVoidingOrder(null)
        setVoidReason('')
        fetchOrders()
      } else {
        setVoidError(data.error || 'Failed to void order')
      }
    } catch (e: any) {
      setVoidError(e.message || 'Failed to void order')
    } finally {
      setIsVoiding(false)
    }
  }

  const isToday = (dateString: string) => {
    const orderDate = new Date(dateString)
    const today = new Date()
    return (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    )
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'all' && order.orderStatus !== statusFilter) {
      return false
    }
    if (timeRangeFilter === 'today' && !isToday(order.createdAt)) {
      return false
    }
    return true
  })

  const handleOpenReceipt = (order: Order) => {
    setSelectedReceipt({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      currency: tenantInfo?.currency || 'USD',
      businessName: tenantInfo?.businessName,
      taxNumber: tenantInfo?.taxNumber,
      taxRate: tenantInfo?.taxRate,
      receiptHeader: tenantInfo?.receiptHeader,
      receiptFooter: tenantInfo?.receiptFooter,
      staffName: order.staff.name,
      tableNumber: order.tableNumber,
      customerName: order.customer?.name || order.customerName,
      customerLoyaltyPoints: order.customer?.loyaltyPoints,
      subtotal: order.subtotal ?? order.totalAmount,
      discount: order.discount ?? 0,
      tax: order.tax ?? 0,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      notes: order.notes,
      items: order.items.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        notes: item.notes
      }))
    })
    setIsReceiptOpen(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'preparing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'refunded': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (loading) {
    return <div className="p-6">Loading orders...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
            Orders Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live order workflow, void/cancellation & receipts</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Time range toggle: Today vs All Time */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => setTimeRangeFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                timeRangeFilter === 'today'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Today&apos;s Orders</span>
            </button>
            <button
              type="button"
              onClick={() => setTimeRangeFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                timeRangeFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>All Time</span>
            </button>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 glass-panel text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses ({filteredOrders.length})</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 glass-panel rounded-2xl border border-slate-200/60 dark:border-white/10 text-slate-500">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="font-semibold text-sm">No orders found for this filter</p>
            <p className="text-xs text-slate-400 mt-1">
              {timeRangeFilter === 'today' ? "No orders punched yet today." : "No matching orders found."}
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="dark:bg-gray-800 dark:border-gray-700 hover:shadow-sm transition-shadow">
              <CardHeader className="pb-3 border-b dark:border-gray-700">
                <CardTitle className="flex justify-between items-center text-lg">
                  <div className="flex items-center gap-3">
                    <span>{order.orderNumber}</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2.5 py-1 rounded font-medium uppercase">
                      {order.paymentMethod}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenReceipt(order)}
                      className="h-8 text-xs gap-1.5 font-semibold"
                      title="View & Print Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm rounded-xl p-3 bg-white/40 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.05]">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Staff / Cashier</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{order.staff.name}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Table</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{order.tableNumber ? `Table #${order.tableNumber}` : 'Takeaway'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Customer</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                      {order.customer?.name || order.customerName || 'Walk-in'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Payment</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      {order.paymentMethod === 'gift' ? '🎁 Comp/Gift' : order.paymentMethod === 'staff' ? '👥 Staff Meal' : order.paymentMethod}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Time</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2">
                  <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">Ordered Items:</p>
                  <div className="space-y-2 divide-y divide-slate-200/60 dark:divide-white/[0.08]">
                    {order.items.map((item) => (
                      <div key={item.id} className="pt-2 flex justify-between items-start text-sm">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-700 dark:text-slate-300">{item.quantity}x</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{item.menuItem.name}</span>
                          </div>
                          {item.notes && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 pl-6 mt-0.5 font-medium">
                              ↳ {item.notes}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{formatCurrency(item.subtotal, tenantInfo?.currency, isAr)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="bg-amber-500/10 p-2.5 rounded-xl text-xs border border-amber-500/20">
                    <span className="font-bold text-amber-700 dark:text-amber-300">Notes: </span>
                    <span className="text-amber-800 dark:text-amber-200">{order.notes}</span>
                  </div>
                )}

                {/* Financial breakdown & Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-slate-200/60 dark:border-white/[0.08] pt-3 gap-3">
                  <div className="space-y-0.5">
                    {(order.discount && order.discount > 0) || (order.tax && order.tax > 0) ? (
                      <div className="flex gap-3 text-xs text-slate-400 font-medium">
                        {order.subtotal !== undefined && <span>Subtotal: {formatCurrency(order.subtotal, tenantInfo?.currency, isAr)}</span>}
                        {order.discount !== undefined && order.discount > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Disc: -{formatCurrency(order.discount, tenantInfo?.currency, isAr)}</span>}
                        {order.tax !== undefined && order.tax > 0 && <span>Tax: +{formatCurrency(order.tax, tenantInfo?.currency, isAr)}</span>}
                      </div>
                    ) : null}
                    <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                      Total: {formatCurrency(order.totalAmount, tenantInfo?.currency, isAr)}
                    </div>
                  </div>

                  {/* Workflow Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {order.orderStatus === 'pending' && (
                      <Button
                        size="sm"
                        className="liquid-btn-primary gap-1.5 font-bold"
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                      >
                        <Flame className="w-4 h-4" />
                        <span>Start Preparing</span>
                      </Button>
                    )}
                    {order.orderStatus === 'preparing' && (
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white gap-1.5 font-bold"
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                      >
                        <Bell className="w-4 h-4" />
                        <span>Mark Ready</span>
                      </Button>
                    )}
                    {order.orderStatus === 'ready' && (
                      <Button
                        size="sm"
                        className="bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 gap-1.5 font-bold"
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Complete</span>
                      </Button>
                    )}
                    {order.orderStatus === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 gap-1.5 font-bold"
                        onClick={() => setRefundingOrder(order)}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Refund / Return</span>
                      </Button>
                    )}
                    {order.orderStatus !== 'cancelled' && order.orderStatus !== 'refunded' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 gap-1.5 font-semibold cursor-pointer"
                        onClick={() => {
                          setVoidError(null)
                          setVoidReason('')
                          setVoidingOrder(order)
                        }}
                        title="Cancel or void order entered by mistake"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Void / Cancel</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Void / Cancel Order Reason Modal */}
      <Dialog open={!!voidingOrder} onOpenChange={(open) => !open && setVoidingOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span>Void / Cancel Order #{voidingOrder?.orderNumber}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to void this order? All quantities will automatically be returned to inventory stock.
            </p>
            {voidError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold">
                {voidError}
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">Reason for Cancellation *</Label>
              <Input
                placeholder="e.g. Entered by mistake, wrong table, customer cancelled"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="mt-1 text-xs"
                autoFocus
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['Entered by mistake', 'Wrong table / ticket', 'Customer changed mind', 'Test order'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setVoidReason(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.08]">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setVoidingOrder(null)}
              >
                Keep Order
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 font-bold"
                disabled={!voidReason.trim() || isVoiding}
                onClick={handleConfirmVoid}
              >
                {isVoiding ? 'Voiding...' : 'Confirm Void / Cancel'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Receipt Print Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
      />

      {/* Refund & Return Restitution Modal */}
      <RefundModal
        isOpen={!!refundingOrder}
        onClose={() => setRefundingOrder(null)}
        order={refundingOrder}
        onRefundCompleted={fetchOrders}
      />
    </div>
  )
}
