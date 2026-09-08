'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal'
import TableTentModal from '@/components/TableTentModal'
import { useAuthStore } from '@/lib/store'
import { 
  RotateCcw, 
  Clock, 
  Printer, 
  Armchair, 
  Users, 
  Plus,
  Trash2,
  QrCode,
  Bell,
  CreditCard,
  CheckCheck
} from 'lucide-react'

interface TableServiceRequest {
  id: string
  tableNumber: number
  type: 'call_waiter' | 'request_bill'
  status: 'pending' | 'resolved'
  createdAt: string
  notes?: string
}

interface RestaurantTable {
  id: string
  number: number
  name: string | null
  capacity: number
  isActive: boolean
}

interface TableOrder {
  id: string
  orderNumber: string
  tableNumber: number
  customerName?: string | null
  totalAmount: number
  subtotal?: number
  tax?: number
  discount?: number
  paymentMethod: string
  orderStatus: string
  createdAt: string
  staff: { name: string }
  items: {
    menuItem: { name: string }
    quantity: number
    price: number
    subtotal: number
    notes?: string | null
  }[]
}

interface TableManagerProps {
  onSelectTableForPOS?: (tableNumber: number) => void
}

export default function TableManager({ onSelectTableForPOS }: TableManagerProps) {
  const { user } = useAuthStore()
  const canManageTables = user?.role === 'admin' || user?.role === 'manager'

  const [tables, setTables] = useState<RestaurantTable[]>([])
  const [activeOrders, setActiveOrders] = useState<TableOrder[]>([])
  const [serviceRequests, setServiceRequests] = useState<TableServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTableOrder, setSelectedTableOrder] = useState<TableOrder | null>(null)
  const [selectedTableForTent, setSelectedTableForTent] = useState<RestaurantTable | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)

  // Web Audio chime for incoming service alerts
  const playServiceChime = () => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtxClass) return
      const audioCtx = new AudioCtxClass()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12) // A5
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45)
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.45)
    } catch {
      // Audio playback silently bypassed if browser restricted
    }
  }

  // Add Table modal state
  const [isAddTableOpen, setIsAddTableOpen] = useState(false)
  const [tableNumberInput, setTableNumberInput] = useState('')
  const [tableNameInput, setTableNameInput] = useState('')
  const [tableCapacityInput, setTableCapacityInput] = useState('4')
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  useEffect(() => {
    fetchTables()
    fetchActiveOrders()
    fetchServiceRequests()
    const interval = setInterval(() => {
      fetchActiveOrders()
      fetchServiceRequests()
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const fetchServiceRequests = async () => {
    try {
      const res = await fetch('/api/tables/service')
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setServiceRequests((prev) => {
            const prevIds = new Set(prev.map((r) => r.id))
            const hasNew = data.some((d: any) => !prevIds.has(d.id))
            if (hasNew && data.length > 0) {
              playServiceChime()
            }
            return data
          })
        }
      }
    } catch (e) {
      console.error('Failed to fetch table service requests:', e)
    }
  }

  const handleDismissService = async (tableNumber: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      await fetch('/api/tables/service', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber })
      })
      setServiceRequests((prev) => prev.filter((r) => r.tableNumber !== tableNumber))
    } catch (err) {
      console.error('Failed to dismiss service request:', err)
    }
  }

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/tables')
      const data = await res.json()
      if (Array.isArray(data)) {
        setTables(data)
        const maxNum = data.reduce((max, t) => (t.number > max ? t.number : max), 0)
        setTableNumberInput(String(maxNum + 1))
      }
    } catch (e) {
      console.error('Failed to fetch tables:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      if (Array.isArray(data)) {
        const active = data.filter(
          (o: any) =>
            o.tableNumber &&
            (o.orderStatus === 'pending' || o.orderStatus === 'preparing' || o.orderStatus === 'ready')
        )
        setActiveOrders(active)
      }
    } catch (e) {
      console.error('Failed to fetch table orders:', e)
    }
  }

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setAddError(null)

    try {
      const res = await fetch('/api/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: tableNumberInput,
          name: tableNameInput.trim() || undefined,
          capacity: tableCapacityInput
        })
      })

      const data = await res.json()
      if (res.ok) {
        setIsAddTableOpen(false)
        setTableNameInput('')
        fetchTables()
      } else {
        setAddError(data.error || 'Failed to add table')
      }
    } catch (err: any) {
      setAddError(err.message || 'Failed to add table')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTable = async (table: RestaurantTable, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Are you sure you want to delete Table #${table.number} (${table.name || 'Table'})?`)) {
      return
    }

    try {
      const res = await fetch(`/api/tables/${table.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (res.ok) {
        fetchTables()
      } else {
        alert(data.error || 'Failed to delete table')
      }
    } catch (err) {
      console.error('Failed to delete table:', err)
    }
  }

  const getTableOrder = (tableNumber: number) => {
    return activeOrders.find((o) => o.tableNumber === tableNumber)
  }

  const totalTables = tables.length
  const occupiedCount = activeOrders.length
  const availableCount = Math.max(0, totalTables - occupiedCount)
  const occupancyRate = totalTables > 0 ? Math.round((occupiedCount / totalTables) * 100) : 0

  const handlePrintTableBill = (order: TableOrder) => {
    setReceiptData({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      staffName: order.staff.name,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
      subtotal: order.subtotal ?? order.totalAmount,
      discount: order.discount ?? 0,
      tax: order.tax ?? 0,
      totalAmount: order.totalAmount,
      paymentMethod: order.paymentMethod,
      items: order.items.map((i) => ({
        name: i.menuItem.name,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.subtotal,
        notes: i.notes
      }))
    })
    setIsReceiptOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
            Cafe Table Floor Plan
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live dining occupancy, dynamic tables & table bills</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { fetchTables(); fetchActiveOrders(); }} className="gap-1.5 font-semibold">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          {canManageTables && (
            <Button
              size="sm"
              onClick={() => {
                const maxNum = tables.reduce((max, t) => (t.number > max ? t.number : max), 0)
                setTableNumberInput(String(maxNum + 1))
                setIsAddTableOpen(true)
              }}
              className="liquid-btn-primary font-bold gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Table</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Tables</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{totalTables}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Available</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{availableCount}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Occupied</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">{occupiedCount}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Occupancy Rate</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{occupancyRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Service Requests Floor Alert Bar */}
      {serviceRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md animate-bounce">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span>Active Table Service Calls ({serviceRequests.length})</span>
                <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">Floor Alert</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Guests are requesting waiter assistance or the check at their table
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {serviceRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-400/50 shadow-xs text-xs"
              >
                <span className="font-extrabold text-slate-900 dark:text-white">Table #{req.tableNumber}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                  req.type === 'request_bill' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' 
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {req.type === 'request_bill' ? '💳 Bill' : '🛎️ Waiter'}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleDismissService(req.tableNumber, e)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  title="Mark Resolved"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => {
          const tableNum = table.number
          const order = getTableOrder(tableNum)
          const isOccupied = !!order
          const tableService = serviceRequests.find((r) => r.tableNumber === tableNum)
          const hasServiceAlert = !!tableService
          const elapsedMinutes = order
            ? Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000)
            : 0

          return (
            <Card
              key={table.id}
              onClick={() => {
                if (isOccupied) {
                  setSelectedTableOrder(order)
                } else if (onSelectTableForPOS) {
                  onSelectTableForPOS(tableNum)
                }
              }}
              className={`cursor-pointer transition-all duration-300 relative glass-card group ${
                hasServiceAlert
                  ? 'border-amber-500 ring-2 ring-amber-400/60 shadow-lg shadow-amber-500/20'
                  : isOccupied
                  ? 'border-blue-500/40 shadow-blue-500/10'
                  : 'hover:border-emerald-500/40'
              }`}
            >
              <CardHeader className="p-4 pb-2">
                {hasServiceAlert && (
                  <div className="mb-2 p-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-black flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-1">
                      <Bell className="w-3 h-3 animate-bounce" />
                      <span>{tableService.type === 'request_bill' ? 'BILL REQUESTED' : 'WAITER CALL'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDismissService(tableNum, e)}
                      className="p-0.5 hover:bg-white/20 rounded transition-colors cursor-pointer"
                      title="Dismiss Alert"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Armchair className={`w-4 h-4 ${isOccupied ? 'text-blue-500' : 'text-slate-400'}`} />
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">#{tableNum}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isOccupied
                          ? 'bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300'
                          : 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300'
                      }`}
                    >
                      {isOccupied ? 'Occupied' : 'Open'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTableForTent(table)
                      }}
                      className="p-1 text-slate-400 hover:text-emerald-500 rounded cursor-pointer transition-colors"
                      title="View & Print Table QR Stand"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    {canManageTables && !isOccupied && (
                      <button
                        onClick={(e) => handleDeleteTable(table, e)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                        title="Delete Table"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {table.name && table.name !== `Table ${tableNum}` && (
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">{table.name}</p>
                )}
                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                  <Users className="w-3 h-3" />
                  <span>{table.capacity || 4} Seats</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1 space-y-2">
                {isOccupied && order ? (
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {order.customerName || 'Walk-in Guest'}
                    </p>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>{order.orderNumber}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{elapsedMinutes}m</span>
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.08] flex justify-between items-center font-extrabold text-sm text-blue-600 dark:text-blue-400">
                      <span>Bill:</span>
                      <span>${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3 text-slate-400 text-xs">
                    <p className="font-medium">Ready for guests</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">Click to seat & order</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add Table Dialog */}
      <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Dining Table</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTable} className="space-y-4 pt-2">
            {addError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {addError}
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">Table Number</Label>
              <Input
                type="number"
                min="1"
                required
                value={tableNumberInput}
                onChange={(e) => setTableNumberInput(e.target.value)}
                placeholder="e.g. 13"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Table Name / Section (Optional)</Label>
              <Input
                value={tableNameInput}
                onChange={(e) => setTableNameInput(e.target.value)}
                placeholder="e.g. Patio Booth, Terrace 2"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Seating Capacity</Label>
              <Input
                type="number"
                min="1"
                max="50"
                value={tableCapacityInput}
                onChange={(e) => setTableCapacityInput(e.target.value)}
                placeholder="4"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddTableOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 liquid-btn-primary font-bold">
                {submitting ? 'Adding...' : 'Create Table'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Occupied Table Order Details Modal */}
      <Dialog open={!!selectedTableOrder} onOpenChange={(open) => !open && setSelectedTableOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Table #{selectedTableOrder?.tableNumber} - Order Details</DialogTitle>
          </DialogHeader>
          {selectedTableOrder && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08] flex justify-between items-center">
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{selectedTableOrder.orderNumber}</p>
                  <p className="text-slate-400">Cashier: {selectedTableOrder.staff.name}</p>
                  <p className="text-slate-400">Seated: {new Date(selectedTableOrder.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                    {selectedTableOrder.orderStatus}
                  </span>
                  <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-1.5">
                    ${selectedTableOrder.totalAmount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Ordered Items:</p>
                <div className="divide-y divide-slate-200/60 dark:divide-white/[0.08] max-h-48 overflow-y-auto pr-1">
                  {selectedTableOrder.items.map((i, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-start">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{i.quantity}x {i.menuItem.name}</span>
                        {i.notes && <p className="text-blue-600 dark:text-blue-400 text-[11px] mt-0.5 font-medium">{i.notes}</p>}
                      </div>
                      <span className="font-bold text-slate-700 dark:text-slate-300">${i.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.08]">
                <Button
                  onClick={() => handlePrintTableBill(selectedTableOrder)}
                  className="flex-1 liquid-btn-primary font-bold gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Table Bill</span>
                </Button>
                <Button variant="outline" onClick={() => setSelectedTableOrder(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bill Print Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={receiptData}
      />

      {/* Table QR Stand / Tent Modal */}
      <TableTentModal
        isOpen={!!selectedTableForTent}
        onClose={() => setSelectedTableForTent(null)}
        table={selectedTableForTent}
      />
    </div>
  )
}
