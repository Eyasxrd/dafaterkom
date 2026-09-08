'use client'

import React, { useState, useEffect, use } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Coffee, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Check, 
  Clock, 
  ChefHat, 
  ArrowRight,
  Sparkles,
  Utensils,
  Bell,
  CreditCard,
  CheckCircle2,
  SlidersHorizontal,
  X,
  PartyPopper
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  imageUrl?: string
  isAvailable: boolean
}

interface CartItem {
  id: string
  menuItem: MenuItem
  quantity: number
  price: number
  notes?: string
  options?: {
    size?: string
    milk?: string
    sweetness?: string
  }
}

export default function TableSelfOrderPage({
  params
}: {
  params: Promise<{ locale: string; tableNumber: string }>
}) {
  const resolvedParams = use(params)
  const { locale, tableNumber } = resolvedParams

  const [categories, setCategories] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Service bell state
  const [callingService, setCallingService] = useState(false)
  const [serviceToast, setServiceToast] = useState<string | null>(null)

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestNotes, setGuestNotes] = useState('')
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null)

  // Customization drawer state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null)
  const [customSize, setCustomSize] = useState<'regular' | 'large'>('regular')
  const [customMilk, setCustomMilk] = useState<'whole' | 'oat' | 'almond' | 'skim' | 'none'>('whole')
  const [customSweetness, setCustomSweetness] = useState<'100%' | '50%' | '25%' | '0%'>('100%')
  const [customSpecialNote, setCustomSpecialNote] = useState('')

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [catsRes, itemsRes] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/menu-items')
        ])
        const [catsData, itemsData] = await Promise.all([
          catsRes.json(),
          itemsRes.json()
        ])
        if (Array.isArray(catsData)) setCategories(catsData)
        if (Array.isArray(itemsData)) setMenuItems(itemsData.filter(i => i.isAvailable))
      } catch (err) {
        console.error('Failed to load menu:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCatalog()
  }, [])

  // Poll submitted order status in real time
  useEffect(() => {
    if (!submittedOrder?.id) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${submittedOrder.id}`)
        if (res.ok) {
          const freshOrder = await res.json()
          setSubmittedOrder((prev: any) => ({ ...prev, ...freshOrder }))
        }
      } catch (e) {
        console.error('Failed to poll order status:', e)
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [submittedOrder?.id])

  // Call waiter or request bill
  const handleRequestService = async (type: 'call_waiter' | 'request_bill') => {
    setCallingService(true)
    try {
      const res = await fetch('/api/tables/service', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber: parseInt(tableNumber) || 1,
          type
        })
      })
      const data = await res.json()
      if (res.ok) {
        const msg = type === 'call_waiter'
          ? `Staff notified! A waiter is on the way to Table #${tableNumber}.`
          : `Bill request received! Counter staff is preparing your check.`
        setServiceToast(msg)
        setTimeout(() => setServiceToast(null), 7000)
      } else {
        alert(data.error || 'Failed to alert staff. Please wave down a floor member.')
      }
    } catch (e) {
      console.error('Failed to call service:', e)
      alert('Network error requesting service. Please inform floor staff.')
    } finally {
      setCallingService(false)
    }
  }

  // Open customizer for an item
  const openCustomizer = (item: MenuItem) => {
    setCustomizingItem(item)
    setCustomSize('regular')
    setCustomMilk('whole')
    setCustomSweetness('100%')
    setCustomSpecialNote('')
  }

  // Calculate customized price
  const getCustomizedPrice = (basePrice: number) => {
    let price = basePrice
    if (customSize === 'large') price += 1.50
    if (customMilk === 'oat' || customMilk === 'almond') price += 0.75
    return Math.round(price * 100) / 100
  }

  const handleAddCustomizedItem = () => {
    if (!customizingItem) return
    const unitPrice = getCustomizedPrice(customizingItem.price)
    const optionsParts: string[] = []
    if (customSize === 'large') optionsParts.push('Large (+ $1.50)')
    if (customMilk === 'oat') optionsParts.push('Oat Milk (+ $0.75)')
    else if (customMilk === 'almond') optionsParts.push('Almond Milk (+ $0.75)')
    else if (customMilk === 'skim') optionsParts.push('Skim Milk')
    else if (customMilk === 'none') optionsParts.push('No Milk')

    if (customSweetness !== '100%') optionsParts.push(`${customSweetness} Sweet`)
    if (customSpecialNote.trim()) optionsParts.push(customSpecialNote.trim())

    const notesSummary = optionsParts.length > 0 ? optionsParts.join(' • ') : undefined
    const uniqueRowId = `${customizingItem.id}-${customSize}-${customMilk}-${customSweetness}-${customSpecialNote.trim()}`

    setCart((prev) => {
      const existing = prev.find((ci) => ci.id === uniqueRowId)
      if (existing) {
        return prev.map((ci) =>
          ci.id === uniqueRowId ? { ...ci, quantity: ci.quantity + 1 } : ci
        )
      }
      return [
        ...prev,
        {
          id: uniqueRowId,
          menuItem: customizingItem,
          quantity: 1,
          price: unitPrice,
          notes: notesSummary,
          options: {
            size: customSize,
            milk: customMilk,
            sweetness: customSweetness
          }
        }
      ]
    })

    setCustomizingItem(null)
  }

  const quickAddToCart = (item: MenuItem) => {
    const uniqueRowId = `${item.id}-default`
    setCart((prev) => {
      const existing = prev.find((ci) => ci.id === uniqueRowId)
      if (existing) {
        return prev.map((ci) =>
          ci.id === uniqueRowId ? { ...ci, quantity: ci.quantity + 1 } : ci
        )
      }
      return [
        ...prev,
        {
          id: uniqueRowId,
          menuItem: item,
          quantity: 1,
          price: item.price
        }
      ]
    })
  }

  const updateCartItemQty = (cartId: string, delta: number) => {
    setCart((prev) => {
      const item = prev.find((ci) => ci.id === cartId)
      if (!item) return prev
      const newQty = item.quantity + delta
      if (newQty <= 0) {
        return prev.filter((ci) => ci.id !== cartId)
      }
      return prev.map((ci) => (ci.id === cartId ? { ...ci, quantity: newQty } : ci))
    })
  }

  const totalItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0)
  const cartSubtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const estimatedTax = Math.round(cartSubtotal * 0.15 * 100) / 100
  const grandTotal = Math.round((cartSubtotal + estimatedTax) * 100) / 100

  const handleSendOrder = async () => {
    if (cart.length === 0 || orderSubmitting) return
    setOrderSubmitting(true)

    const orderPayload = {
      orderNumber: `QR-${tableNumber}-${Date.now().toString().slice(-6)}`,
      staffId: 'customer-self-service',
      subtotal: cartSubtotal,
      tax: estimatedTax,
      discount: 0,
      totalAmount: grandTotal,
      paymentMethod: 'cash',
      tableNumber: parseInt(tableNumber) || 1,
      customerName: guestName.trim() || `Table ${tableNumber} Guest`,
      notes: guestNotes ? `[QR Self-Order] ${guestNotes}` : '[QR Self-Order]',
      deviceId: `table-qr-${tableNumber}`,
      items: cart.map((i) => ({
        menuItemId: i.menuItem.id,
        quantity: i.quantity,
        price: i.price,
        subtotal: i.price * i.quantity,
        notes: i.notes || null
      }))
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      })

      if (res.ok) {
        const created = await res.json()
        setSubmittedOrder(created)
        setCart([])
        setIsCartOpen(false)
      } else {
        alert('Could not submit order. Please speak to staff.')
      }
    } catch (err) {
      console.error(err)
      alert('Network error submitting order.')
    } finally {
      setOrderSubmitting(false)
    }
  }

  const filteredItems = selectedCategory === 'all'
    ? menuItems
    : menuItems.filter(i => i.categoryId === selectedCategory)

  // Determine stage for active tracker
  const getOrderStage = (status: string) => {
    switch (status) {
      case 'pending': return 1
      case 'preparing': return 2
      case 'ready': return 3
      case 'completed': return 4
      default: return 1
    }
  }

  const currentStage = submittedOrder ? getOrderStage(submittedOrder.orderStatus || 'pending') : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-3">
          <Coffee className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Loading dining menu...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 text-slate-900 dark:text-slate-100">
      {/* Table Header Banner */}
      <header className="sticky top-0 z-30 glass-panel border-b border-slate-200/80 dark:border-white/10 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl liquid-btn-primary flex items-center justify-center text-white shadow-sm">
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Dafaterkom Express
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Interactive Dining Hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-600 dark:text-blue-300 border border-blue-500/20">
              Table #{tableNumber}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Quick Floor Service Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={callingService}
            onClick={() => handleRequestService('call_waiter')}
            className="py-2.5 px-3 rounded-2xl glass-card border border-amber-500/30 hover:border-amber-500/60 bg-amber-500/10 hover:bg-amber-500/15 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <Bell className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>Call Waiter</span>
          </button>
          <button
            type="button"
            disabled={callingService}
            onClick={() => handleRequestService('request_bill')}
            className="py-2.5 px-3 rounded-2xl glass-card border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xs"
          >
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>Request Bill</span>
          </button>
        </div>

        {/* Service Alert Confirmation Toast */}
        {serviceToast && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-semibold">{serviceToast}</span>
            </div>
            <button
              onClick={() => setServiceToast(null)}
              className="p-1 hover:bg-emerald-500/20 rounded cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live 4-Stage Order Progress Tracker */}
        {submittedOrder && (
          <div className="p-4 rounded-3xl glass-card border border-blue-500/30 bg-gradient-to-b from-blue-500/10 via-transparent to-emerald-500/5 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                  #{submittedOrder.orderNumber ? submittedOrder.orderNumber.slice(-4) : 'LIVE'}
                </div>
                <div>
                  <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Live Order Tracker
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Auto-updates every 4s
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  currentStage === 4
                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : currentStage === 3
                    ? 'bg-emerald-500 text-white animate-pulse shadow-sm'
                    : currentStage === 2
                    ? 'bg-amber-500 text-white animate-pulse shadow-sm'
                    : 'bg-blue-600 text-white shadow-sm'
                }`}
              >
                {currentStage === 4
                  ? 'Delivered'
                  : currentStage === 3
                  ? 'Ready to Serve'
                  : currentStage === 2
                  ? 'In Kitchen'
                  : 'Order Placed'}
              </span>
            </div>

            {/* 4-Stage Horizontal Timeline */}
            <div className="grid grid-cols-4 gap-1 text-center relative pt-1">
              {/* Stage 1: Received */}
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStage >= 1
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  Received
                </span>
              </div>

              {/* Stage 2: Preparing */}
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStage >= 2
                      ? 'bg-amber-500 text-white shadow-md animate-bounce'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  Preparing
                </span>
              </div>

              {/* Stage 3: Ready */}
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStage >= 3
                      ? 'bg-emerald-500 text-white shadow-md animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <Utensils className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  Ready!
                </span>
              </div>

              {/* Stage 4: Delivered */}
              <div className="flex flex-col items-center space-y-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStage >= 4
                      ? 'bg-slate-700 dark:bg-slate-300 text-white dark:text-slate-900 shadow-md'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                  }`}
                >
                  <PartyPopper className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                  Enjoy!
                </span>
              </div>
            </div>

            {/* Message based on stage */}
            <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/5 text-xs text-center font-medium text-slate-600 dark:text-slate-300">
              {currentStage === 1 && 'Your order was received and ticketed to the kitchen & barista.'}
              {currentStage === 2 && 'Our chef is preparing your meal fresh with precision.'}
              {currentStage === 3 && '🎉 Order is ready! Floor staff is bringing it to Table #' + tableNumber + '.'}
              {currentStage === 4 && 'Delivered! Need anything else? Use the Call Waiter bell anytime.'}
            </div>
          </div>
        )}

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'liquid-btn-primary shadow-sm'
                : 'bg-white/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === c.id
                  ? 'liquid-btn-primary shadow-sm'
                  : 'bg-white/80 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div className="space-y-2.5">
          {filteredItems.map((item) => {
            const inCartItems = cart.filter((ci) => ci.menuItem.id === item.id)
            const countInCart = inCartItems.reduce((s, ci) => s + ci.quantity, 0)

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl glass-card border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between gap-3 shadow-xs hover:border-blue-500/30 transition-all"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {item.name}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  )}
                  <div className="font-extrabold text-sm text-blue-600 dark:text-blue-400 mt-1">
                    ${item.price.toFixed(2)}
                  </div>
                </div>

                {/* Actions: Customize & Quick Add */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openCustomizer(item)}
                    className="h-8 px-2.5 text-[11px] font-bold gap-1 rounded-xl border-slate-200 dark:border-white/15 cursor-pointer hover:border-blue-500/40"
                    title="Customize (Size, Milk, Sweetness)"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-blue-500" />
                    <span>Options</span>
                  </Button>

                  {countInCart > 0 ? (
                    <div className="flex items-center gap-1 bg-blue-500/10 p-1 rounded-xl border border-blue-500/20">
                      <span className="w-6 text-center font-black text-xs text-blue-600 dark:text-blue-400">
                        x{countInCart}
                      </span>
                      <button
                        onClick={() => quickAddToCart(item)}
                        className="w-6 h-6 rounded-lg liquid-btn-primary flex items-center justify-center text-white font-bold cursor-pointer"
                        title="Add another"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => quickAddToCart(item)}
                      className="h-8 px-3 text-xs font-bold gap-1 rounded-xl liquid-btn-primary cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* Item Customizer Modal Drawer */}
      <Dialog open={!!customizingItem} onOpenChange={(open) => !open && setCustomizingItem(null)}>
        <DialogContent className="max-w-md glass-panel border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl">
          {customizingItem && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between text-base font-extrabold">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>Customize {customizingItem.name}</span>
                  </div>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">
                    ${getCustomizedPrice(customizingItem.price).toFixed(2)}
                  </span>
                </DialogTitle>
              </DialogHeader>

              {/* Size Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomSize('regular')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      customSize === 'regular'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-300 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Regular Size
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomSize('large')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      customSize === 'large'
                        ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-300 ring-1 ring-blue-500'
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Large (+ $1.50)
                  </button>
                </div>
              </div>

              {/* Milk Preference */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Milk Option</Label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'whole', label: 'Whole' },
                      { id: 'oat', label: 'Oat (+0.75)' },
                      { id: 'almond', label: 'Almond (+0.75)' },
                      { id: 'skim', label: 'Skim' },
                      { id: 'none', label: 'No Milk' }
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setCustomMilk(m.id)}
                      className={`py-1.5 px-2 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                        customMilk === m.id
                          ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-300 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sweetness Level */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sweetness</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['100%', '50%', '25%', '0%'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCustomSweetness(s)}
                      className={`py-1.5 px-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                        customSweetness === s
                          ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-300 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {s === '0%' ? 'Sugar-Free' : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Note */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kitchen Notes
                </Label>
                <Input
                  placeholder="e.g. Extra hot, decaf, ice on side..."
                  value={customSpecialNote}
                  onChange={(e) => setCustomSpecialNote(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Confirm Add */}
              <Button
                onClick={handleAddCustomizedItem}
                className="w-full h-11 text-sm font-bold gap-2 liquid-btn-primary cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Order • ${getCustomizedPrice(customizingItem.price).toFixed(2)}</span>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating View Cart Footer Bar */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl liquid-btn-primary shadow-xl flex items-center justify-between text-white font-bold text-sm cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-black">
                {totalItemsCount}
              </div>
              <span>View Table Order</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span>${grandTotal.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Cart & Checkout Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md glass-panel border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="text-base font-extrabold">Review Table #{tableNumber} Order</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">
                {totalItemsCount} items
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Cart items review */}
          <div className="space-y-3 mt-3 max-h-60 overflow-y-auto pr-1">
            {cart.map((i) => (
              <div
                key={i.id}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {i.menuItem.name}
                  </div>
                  {i.notes && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {i.notes}
                    </div>
                  )}
                  <div className="text-blue-600 dark:text-blue-400 font-extrabold mt-0.5">
                    ${i.price.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateCartItemQty(i.id, -1)}
                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-4 text-center font-bold">{i.quantity}</span>
                  <button
                    onClick={() => updateCartItemQty(i.id, 1)}
                    className="w-6 h-6 rounded-lg liquid-btn-primary flex items-center justify-center text-white font-bold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Guest Name & Notes */}
          <div className="space-y-3 pt-3 border-t border-slate-200/60 dark:border-white/10">
            <div>
              <Label className="text-xs font-semibold">Your Name (Optional)</Label>
              <Input
                placeholder="e.g. John"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">General Kitchen Instructions</Label>
              <Input
                placeholder="e.g. Bring food all at once..."
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span>${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Estimated Tax (15%):</span>
              <span>+${estimatedTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-extrabold pt-1 text-slate-900 dark:text-white">
              <span>Total Due:</span>
              <span className="text-blue-600 dark:text-blue-400">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={handleSendOrder}
            disabled={orderSubmitting}
            className="w-full mt-4 h-11 text-sm font-bold gap-2 liquid-btn-primary cursor-pointer"
          >
            <ChefHat className="w-4 h-4" />
            <span>{orderSubmitting ? 'Sending to Kitchen...' : 'Send Order to Kitchen'}</span>
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
