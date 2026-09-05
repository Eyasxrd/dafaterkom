'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ChefHat, 
  Volume2, 
  VolumeX, 
  Coffee, 
  AlertTriangle, 
  Flame, 
  Bell, 
  CheckCircle2, 
  Clock 
} from 'lucide-react'

interface OrderItem {
  id: string
  menuItem: {
    name: string
    category: { name: string }
  }
  quantity: number
  notes?: string | null
}

interface KitchenOrder {
  id: string
  orderNumber: string
  tableNumber?: number | null
  customerName?: string | null
  notes?: string | null
  orderStatus: string
  createdAt: string
  items: OrderItem[]
}

export default function KitchenDisplay() {
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all')
  const [now, setNow] = useState(Date.now())
  const [soundEnabled, setSoundEnabled] = useState(true)
  const previousOrderCount = useRef<number>(0)

  // Web Audio API beep sound for new orders
  const playNewOrderSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1) // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.35)
    } catch (e) {
      // Audio might be blocked before first user gesture
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      if (Array.isArray(data)) {
        // Filter out completed and cancelled orders
        const active = data.filter(
          (o: any) => o.orderStatus === 'pending' || o.orderStatus === 'preparing' || o.orderStatus === 'ready'
        )

        // Sound alert if new order arrived
        if (previousOrderCount.current > 0 && active.length > previousOrderCount.current) {
          playNewOrderSound()
        }
        previousOrderCount.current = active.length

        setOrders(active)
      }
    } catch (e) {
      console.error('Failed to fetch kitchen orders:', e)
    }
  }

  // Poll orders every 5 seconds
  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 5000)
    return () => clearInterval(interval)
  }, [soundEnabled])

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      })
      if (res.ok) {
        fetchOrders()
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Calculate elapsed time & urgency color
  const getTimerInfo = (createdAt: string) => {
    const diffMs = now - new Date(createdAt).getTime()
    const minutes = Math.floor(diffMs / 60000)
    const seconds = Math.floor((diffMs % 60000) / 1000)
    const formatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`

    let urgency: 'normal' | 'warning' | 'urgent' = 'normal'
    if (minutes >= 10) urgency = 'urgent'
    else if (minutes >= 5) urgency = 'warning'

    return { formatted, minutes, urgency }
  }

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true
    return o.orderStatus === filter
  })

  return (
    <div className="p-6 space-y-6">
      {/* KDS Liquid Glass Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-panel p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl liquid-btn-primary flex items-center justify-center shadow-md">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-wide text-slate-900 dark:text-white">
                KITCHEN DISPLAY SYSTEM (KDS)
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Live order tickets with automated timers and bumping</p>
            </div>
            <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
              {orders.length} ACTIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-xs gap-1.5 h-9"
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-500" />
                <span>Sound: ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>Sound: OFF</span>
              </>
            )}
          </Button>

          <div className="flex p-1 rounded-xl glass-pill text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${filter === 'all' ? 'liquid-btn-primary shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              All ({orders.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${filter === 'pending' ? 'bg-amber-500 text-black shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Pending ({orders.filter(o => o.orderStatus === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('preparing')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${filter === 'preparing' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Prep ({orders.filter(o => o.orderStatus === 'preparing').length})
            </button>
            <button
              onClick={() => setFilter('ready')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${filter === 'ready' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Ready ({orders.filter(o => o.orderStatus === 'ready').length})
            </button>
          </div>
        </div>
      </div>

      {/* Orders Grid */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-20 glass-card rounded-3xl border border-dashed border-slate-300 dark:border-white/10 space-y-3">
          <div className="w-20 h-20 rounded-3xl glass-pill flex items-center justify-center mx-auto mb-3 text-indigo-500 dark:text-indigo-400">
            <Coffee className="w-10 h-10 stroke-[1.5]" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">All caught up!</h3>
          <p className="text-xs text-slate-400">No active kitchen orders at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredOrders.map((order) => {
            const timer = getTimerInfo(order.createdAt)

            const headerBg =
              timer.urgency === 'urgent'
                ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white animate-pulse'
                : timer.urgency === 'warning'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black'
                : order.orderStatus === 'ready'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                : order.orderStatus === 'preparing'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white'

            return (
              <Card
                key={order.id}
                className="glass-card flex flex-col justify-between overflow-hidden shadow-lg border border-white/50 dark:border-white/[0.08]"
              >
                {/* Ticket Header */}
                <div>
                  <div className={`p-3.5 flex justify-between items-center font-bold ${headerBg}`}>
                    <div>
                      <div className="text-base tracking-tight">{order.orderNumber}</div>
                      <div className="text-[11px] font-semibold opacity-90">
                        {order.tableNumber ? `TABLE #${order.tableNumber}` : 'TAKEAWAY'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black font-mono flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{timer.formatted}</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider font-semibold opacity-90">{order.orderStatus}</div>
                    </div>
                  </div>

                  {/* Customer and Special Instructions */}
                  {(order.customerName || order.notes) && (
                    <div className="bg-amber-500/10 border-b border-amber-500/20 p-2.5 text-xs">
                      {order.customerName && (
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          Guest: {order.customerName}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{order.notes}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {/* Ticket Items */}
                  <CardContent className="p-3.5 space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="border-b border-slate-200/60 dark:border-white/[0.08] pb-2 last:border-0 last:pb-0">
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-slate-200/80 dark:bg-white/10 text-slate-900 dark:text-white">
                            {item.quantity}x
                          </span>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                              {item.menuItem.name}
                            </p>
                            {item.notes && (
                              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1 bg-blue-500/10 px-2 py-0.5 rounded-lg inline-block">
                                {item.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </div>

                {/* Ticket Bump Actions */}
                <div className="p-3 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-200/60 dark:border-white/[0.08]">
                  {order.orderStatus === 'pending' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold h-10 text-sm gap-2"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Start Preparing</span>
                    </Button>
                  )}
                  {order.orderStatus === 'preparing' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold h-10 text-sm gap-2"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Mark Ready</span>
                    </Button>
                  )}
                  {order.orderStatus === 'ready' && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, 'completed')}
                      className="w-full bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold h-10 text-sm gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Bump / Complete</span>
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
