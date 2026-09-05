'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal'
import { 
  Printer, 
  Flame, 
  Bell, 
  CheckCircle2, 
  Clock, 
  RotateCcw, 
  XCircle, 
  FileText 
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
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)

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

  const handleOpenReceipt = (order: Order) => {
    setSelectedReceipt({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
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

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(order => order.orderStatus === statusFilter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'preparing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (loading) {
    return <div className="p-6">Loading orders...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-sm text-gray-500">Live order workflow, receipts & status tracking</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders ({orders.length})</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="preparing">Preparing</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredOrders.map((order) => (
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm rounded-xl p-3 bg-white/40 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.05]">
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Staff / Cashier</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{order.staff.name}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Table</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{order.tableNumber ? `Table #${order.tableNumber}` : 'Takeaway'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Customer</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {order.customer?.name || order.customerName || 'Walk-in'}
                    {order.customer && (
                      <span className="ml-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                        ({order.customer.loyaltyPoints} pts)
                      </span>
                    )}
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
                      <span className="font-bold text-slate-700 dark:text-slate-300">${item.subtotal.toFixed(2)}</span>
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
                      {order.subtotal !== undefined && <span>Subtotal: ${order.subtotal.toFixed(2)}</span>}
                      {order.discount !== undefined && order.discount > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Disc: -${order.discount.toFixed(2)}</span>}
                      {order.tax !== undefined && order.tax > 0 && <span>Tax: +${order.tax.toFixed(2)}</span>}
                    </div>
                  ) : null}
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                    Total: ${order.totalAmount.toFixed(2)}
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
                  {(order.orderStatus === 'pending' || order.orderStatus === 'preparing') && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/50 gap-1.5"
                      onClick={() => updateOrderStatus(order.id, 'cancelled')}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Receipt Print Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  )
}
