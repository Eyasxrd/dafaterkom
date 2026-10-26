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
  PartyPopper,
  AlertCircle,
  LayoutGrid,
  Rows,
  Maximize2,
  Flame,
  Star,
  Zap,
  Wifi
} from 'lucide-react'
import Link from 'next/link'
import Footer from '@/components/Footer'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  imageUrl?: string
  isAvailable: boolean
  calories?: number
  prepTime?: number
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

type ViewMode = 'showcase' | 'grid' | 'list'

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
  const [viewMode, setViewMode] = useState<ViewMode>('showcase')
  const [loading, setLoading] = useState(true)

  // Service bell state
  const [callingService, setCallingService] = useState(false)
  const [serviceToast, setServiceToast] = useState<string | null>(null)
  const [serviceError, setServiceError] = useState<string | null>(null)

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestNotes, setGuestNotes] = useState('')
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [submittedOrder, setSubmittedOrder] = useState<any | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Customization drawer state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null)
  const [customSize, setCustomSize] = useState<'regular' | 'large'>('regular')
  const [customMilk, setCustomMilk] = useState<'whole' | 'oat' | 'almond' | 'skim' | 'none'>('whole')
  const [customSweetness, setCustomSweetness] = useState<'100%' | '50%' | '25%' | '0%'>('100%')
  const [customSpecialNote, setCustomSpecialNote] = useState('')

  useEffect(() => {
    document.title = `Table #${tableNumber} Express Dining | Dafaterkom`
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
  }, [tableNumber])

  // Poll submitted order status in real time
  useEffect(() => {
    if (!submittedOrder?.id) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${submittedOrder.id}`)
        if (res.ok) {
          const updated = await res.json()
          setSubmittedOrder(updated)
        }
      } catch (e) {
        console.error('Failed to poll order update:', e)
      }
    }, 4000)
    return () => clearInterval(interval)
  }, [submittedOrder?.id])

  const getItemImage = (item: MenuItem) => {
    if (item.imageUrl) return item.imageUrl
    const nameLower = item.name.toLowerCase()
    if (nameLower.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80'
    if (nameLower.includes('rib') || nameLower.includes('brisket') || nameLower.includes('steak') || nameLower.includes('bbq')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
    if (nameLower.includes('fries') || nameLower.includes('nachos')) return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80'
    if (nameLower.includes('latte') || nameLower.includes('coffee') || nameLower.includes('espresso') || nameLower.includes('cappuccino')) return 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80'
    if (nameLower.includes('mojito') || nameLower.includes('tea') || nameLower.includes('refresher')) return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80'
    if (nameLower.includes('cake') || nameLower.includes('toast') || nameLower.includes('dessert')) return 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80'
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'
  }

  // Call waiter or request bill
  const handleRequestService = async (type: 'call_waiter' | 'request_bill') => {
    setCallingService(true)
    setServiceError(null)
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
        setServiceError(data.error || 'Failed to alert staff. Please wave down a floor member.')
        setTimeout(() => setServiceError(null), 7000)
      }
    } catch (e) {
      console.error('Failed to call service:', e)
      setServiceError('Network error requesting service. Please inform floor staff.')
      setTimeout(() => setServiceError(null), 7000)
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
    setCheckoutError(null)

    const orderPayload = {
      orderNumber: `QR-T${tableNumber}-${Date.now().toString().slice(-5)}`,
      staffId: 'customer-self-service',
      subtotal: cartSubtotal,
      tax: estimatedTax,
      discount: 0,
      totalAmount: grandTotal,
      paymentMethod: 'cash',
      tableNumber: parseInt(tableNumber) || 1,
      customerName: guestName.trim() || `Table ${tableNumber} Guest`,
      notes: guestNotes ? `[Table Dining #${tableNumber}] ${guestNotes}` : `[Table Dining #${tableNumber}]`,
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
        const errData = await res.json().catch(() => null)
        setCheckoutError(errData?.error || 'Could not submit order. Please speak to staff.')
      }
    } catch (err: any) {
      console.error(err)
      setCheckoutError('Network error submitting order. Please check your connection.')
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 flex flex-col items-center gap-3 shadow-2xl">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-black flex items-center justify-center animate-pulse shadow-lg font-black">
            <Utensils className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold text-slate-200">Loading dining menu...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased pb-32">
      {/* Top Banner Header */}
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black font-black shadow-lg">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-sm tracking-tight text-white">
                Dafaterkom Smokehouse
              </h1>
              <p className="text-[11px] text-amber-400 font-bold">
                Table Self-Service Hub
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-500 text-black shadow-lg">
              Table #{tableNumber}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Service Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={callingService}
            onClick={() => handleRequestService('call_waiter')}
            className="py-3 px-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
          >
            <Bell className="w-4 h-4 text-amber-400 animate-bounce" />
            <span>Call Waiter</span>
          </button>
          <button
            type="button"
            disabled={callingService}
            onClick={() => handleRequestService('request_bill')}
            className="py-3 px-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shadow-lg"
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Request Bill</span>
          </button>
        </div>

        {/* Service Alerts */}
        {serviceToast && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">{serviceToast}</span>
            </div>
            <button onClick={() => setServiceToast(null)} className="p-1 hover:bg-white/10 rounded cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {serviceError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-bold">{serviceError}</span>
            </div>
            <button onClick={() => setServiceError(null)} className="p-1 hover:bg-white/10 rounded cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live 4-Stage Order Progress Tracker */}
        {submittedOrder && (
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-amber-500/40 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black text-xs shadow-md">
                  #{submittedOrder.orderNumber ? submittedOrder.orderNumber.slice(-4) : 'LIVE'}
                </div>
                <div>
                  <h2 className="font-black text-sm text-white">
                    Live Order Tracker
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    Auto-updates every 4 seconds
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  currentStage === 4
                    ? 'bg-slate-700 text-white'
                    : currentStage === 3
                    ? 'bg-emerald-500 text-black animate-pulse shadow-md'
                    : currentStage === 2
                    ? 'bg-amber-500 text-black animate-pulse shadow-md'
                    : 'bg-blue-600 text-white shadow-md'
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

            {/* Timeline */}
            <div className="grid grid-cols-4 gap-1 text-center relative pt-1">
              <div className="flex flex-col items-center space-y-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStage >= 1 ? 'bg-amber-500 text-black shadow-md' : 'bg-slate-800 text-slate-500'}`}>
                  <Check className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-300">Received</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStage >= 2 ? 'bg-amber-500 text-black shadow-md animate-bounce' : 'bg-slate-800 text-slate-500'}`}>
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-300">Preparing</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStage >= 3 ? 'bg-emerald-500 text-black shadow-md animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                  <Utensils className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-300">Ready!</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${currentStage >= 4 ? 'bg-white text-black shadow-md' : 'bg-slate-800 text-slate-500'}`}>
                  <PartyPopper className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-300">Enjoy!</span>
              </div>
            </div>
          </div>
        )}

        {/* Category Controls & View Switcher */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-black shadow-lg'
                  : 'bg-white/[0.06] border border-white/10 text-slate-300'
              }`}
            >
              All Items
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? 'bg-amber-500 text-black shadow-lg'
                    : 'bg-white/[0.06] border border-white/10 text-slate-300'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div className="flex items-center bg-white/[0.07] border border-white/15 rounded-2xl p-1 shrink-0">
            <button
              onClick={() => setViewMode('showcase')}
              className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${viewMode === 'showcase' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400'}`}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${viewMode === 'grid' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-xl text-xs transition-all cursor-pointer ${viewMode === 'list' ? 'bg-amber-500 text-black shadow-md' : 'text-slate-400'}`}
            >
              <Rows className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        {viewMode === 'showcase' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredItems.map((item) => {
              const inCartItems = cart.filter((ci) => ci.menuItem.id === item.id)
              const countInCart = inCartItems.reduce((s, ci) => s + ci.quantity, 0)
              const imageSrc = getItemImage(item)

              return (
                <div
                  key={item.id}
                  onClick={() => openCustomizer(item)}
                  className="group bg-slate-900/90 rounded-3xl border border-white/10 overflow-hidden shadow-lg hover:border-amber-500/50 transition-all flex flex-col cursor-pointer"
                >
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-950">
                    <img
                      src={imageSrc}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
                    <div className="absolute bottom-3 start-3">
                      <div className="px-3 py-1 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 text-amber-400 font-black text-sm font-mono">
                        ${item.price.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <h3 className="font-black text-base text-white group-hover:text-amber-400 transition-colors">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCustomizer(item)}
                        className="h-8 px-3 text-xs font-bold gap-1 rounded-xl border-white/20 text-slate-300 hover:text-white"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-amber-400" />
                        <span>Customize</span>
                      </Button>

                      {countInCart > 0 ? (
                        <div className="flex items-center gap-1.5 bg-amber-500/20 px-2 py-1 rounded-2xl border border-amber-500/40">
                          <span className="text-xs font-black text-amber-400">x{countInCart}</span>
                          <button
                            onClick={() => quickAddToCart(item)}
                            className="w-6 h-6 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold hover:bg-amber-400 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => quickAddToCart(item)}
                          className="px-4 py-2 rounded-2xl bg-amber-500 text-black font-black text-xs flex items-center gap-1 shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {viewMode === 'grid' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            {filteredItems.map((item) => {
              const inCartItems = cart.filter((ci) => ci.menuItem.id === item.id)
              const countInCart = inCartItems.reduce((s, ci) => s + ci.quantity, 0)
              const imageSrc = getItemImage(item)

              return (
                <div
                  key={item.id}
                  onClick={() => openCustomizer(item)}
                  className="group bg-slate-900/90 rounded-2xl border border-white/10 overflow-hidden shadow-md hover:border-amber-500/40 transition-all flex flex-col cursor-pointer"
                >
                  <div className="relative w-full aspect-square overflow-hidden bg-slate-950">
                    <img src={imageSrc} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute bottom-2 start-2">
                      <span className="px-2 py-0.5 rounded-lg bg-black/75 text-amber-400 font-black text-xs font-mono">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <h4 className="font-bold text-xs text-white truncate group-hover:text-amber-400">
                      {item.name}
                    </h4>
                    <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openCustomizer(item)}
                        className="text-[10px] text-amber-400 font-bold hover:underline"
                      >
                        Options
                      </button>
                      <button
                        onClick={() => quickAddToCart(item)}
                        className="w-7 h-7 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const inCartItems = cart.filter((ci) => ci.menuItem.id === item.id)
              const countInCart = inCartItems.reduce((s, ci) => s + ci.quantity, 0)
              const imageSrc = getItemImage(item)

              return (
                <div
                  key={item.id}
                  onClick={() => openCustomizer(item)}
                  className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-amber-500/40 flex items-center justify-between gap-3 shadow-sm transition-all cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-slate-950">
                    <img src={imageSrc} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-sm text-white truncate">{item.name}</h4>
                    <div className="font-black text-sm text-amber-400 font-mono mt-0.5">${item.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => openCustomizer(item)} className="h-8 px-2.5 text-xs rounded-xl border-white/20">
                      Options
                    </Button>
                    <button onClick={() => quickAddToCart(item)} className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-md">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Item Customizer Modal */}
      <Dialog open={!!customizingItem} onOpenChange={(open) => !open && setCustomizingItem(null)}>
        <DialogContent className="max-w-md bg-slate-900 border border-white/15 p-6 rounded-3xl text-slate-100 max-h-[90vh] overflow-y-auto">
          {customizingItem && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between text-base font-black text-white">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Customize {customizingItem.name}</span>
                  </div>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    ${getCustomizedPrice(customizingItem.price).toFixed(2)}
                  </span>
                </DialogTitle>
              </DialogHeader>

              {/* Size Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Size</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomSize('regular')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      customSize === 'regular'
                        ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                        : 'border-white/10 text-slate-400'
                    }`}
                  >
                    Regular Size
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomSize('large')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                      customSize === 'large'
                        ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                        : 'border-white/10 text-slate-400'
                    }`}
                  >
                    Large (+ $1.50)
                  </button>
                </div>
              </div>

              {/* Milk Preference */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Milk Option</Label>
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
                          ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                          : 'border-white/10 text-slate-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sweetness Level */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Sweetness</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['100%', '50%', '25%', '0%'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCustomSweetness(s)}
                      className={`py-1.5 px-1 rounded-xl border text-[11px] font-bold cursor-pointer transition-all ${
                        customSweetness === s
                          ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                          : 'border-white/10 text-slate-400'
                      }`}
                    >
                      {s === '0%' ? 'Zero Sugar' : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Note */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">Kitchen Instructions</Label>
                <Input
                  placeholder="e.g. Extra hot, ice on side..."
                  value={customSpecialNote}
                  onChange={(e) => setCustomSpecialNote(e.target.value)}
                  className="h-10 text-xs rounded-xl bg-white/[0.06] border-white/15 text-white"
                />
              </div>

              <Button
                onClick={handleAddCustomizedItem}
                className="w-full h-12 text-xs font-black gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-2xl shadow-xl hover:brightness-110 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add to Table Order • ${getCustomizedPrice(customizingItem.price).toFixed(2)}</span>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Floating View Cart Footer Bar */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-5 left-4 right-4 z-40 max-w-lg mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-4 px-5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-2xl shadow-amber-500/30 flex items-center justify-between text-black font-black text-sm cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all border border-amber-300/30"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-black text-amber-400 flex items-center justify-center text-xs font-black">
                {totalItemsCount}
              </div>
              <span>View Table Order</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-base">
              <span>${grandTotal.toFixed(2)}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Cart & Checkout Dialog */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md bg-slate-900 border border-white/15 p-6 rounded-3xl max-h-[90vh] overflow-y-auto text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-white">
              <span className="text-base font-black">Review Table #{tableNumber} Order</span>
              <span className="text-xs font-extrabold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                {totalItemsCount} items
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Cart items */}
          <div className="space-y-2.5 mt-3 max-h-56 overflow-y-auto pr-1">
            {cart.map((i) => (
              <div
                key={i.id}
                className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-white truncate">
                    {i.menuItem.name}
                  </div>
                  {i.notes && (
                    <div className="text-[10px] text-slate-400 italic truncate mt-0.5">
                      {i.notes}
                    </div>
                  )}
                  <div className="text-amber-400 font-black mt-0.5 font-mono">
                    ${(i.price * i.quantity).toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateCartItemQty(i.id, -1)}
                    className="w-7 h-7 rounded-xl bg-slate-800 border border-white/15 flex items-center justify-center font-bold text-white hover:bg-slate-700 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-4 text-center font-black text-white">{i.quantity}</span>
                  <button
                    onClick={() => updateCartItemQty(i.id, 1)}
                    className="w-7 h-7 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold hover:bg-amber-400 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Guest Name & Notes */}
          <div className="space-y-2.5 pt-3 border-t border-white/10">
            <div>
              <Label className="text-xs font-bold text-slate-300">Your Name (Optional)</Label>
              <Input
                placeholder="Guest name"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="mt-1 h-10 text-xs rounded-xl bg-white/[0.06] border-white/15 text-white"
              />
            </div>
            <div>
              <Label className="text-xs font-bold text-slate-300">Kitchen Instructions</Label>
              <Input
                placeholder="e.g. Bring food all at once..."
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
                className="mt-1 h-10 text-xs rounded-xl bg-white/[0.06] border-white/15 text-white"
              />
            </div>
          </div>

          {/* Checkout Error */}
          {checkoutError && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Order Summary */}
          <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span>${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Estimated Tax (15%):</span>
              <span>+${estimatedTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-white pt-1.5 border-t border-white/10">
              <span>Total:</span>
              <span className="text-amber-400 font-mono">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={handleSendOrder}
            disabled={orderSubmitting || cart.length === 0}
            className="w-full h-12 text-xs font-black gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-2xl shadow-xl hover:brightness-110 cursor-pointer active:scale-98 transition-all"
          >
            <ChefHat className="w-4 h-4" />
            <span>{orderSubmitting ? 'Sending to Kitchen...' : `Send Table #${tableNumber} Order • $${grandTotal.toFixed(2)}`}</span>
          </Button>
        </DialogContent>
      </Dialog>

      {/* Embedded Reusable Footer */}
      <div className="max-w-4xl mx-auto px-4 mt-16 opacity-80">
        <Footer />
      </div>
    </div>
  )
}

