'use client'

import React, { useState, useEffect, use, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { 
  Coffee, 
  Search, 
  Sparkles, 
  Clock, 
  Flame, 
  Plus, 
  Minus, 
  ArrowRight, 
  Check, 
  ShoppingBag, 
  Utensils, 
  Info,
  ShieldAlert,
  Zap,
  Globe,
  Share2,
  X,
  Phone,
  AlertCircle,
  Star,
  MapPin,
  Wifi,
  LayoutGrid,
  Rows,
  Maximize2,
  CheckCircle2,
  Heart,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react'
import DietaryBadge, { DIETARY_TAGS, MENU_CHANNELS } from '@/components/menu/DietaryBadge'
import { parseItemCustomization, COMMON_TASTE_PROFILES } from '@/lib/item-customization'
import Link from 'next/link'
import Footer from '@/components/Footer'

interface MenuItem {
  id: string
  name: string
  description?: string | null
  ingredients?: string | null
  price: number
  basePrice: number
  hasPriceOverride: boolean
  imageUrl?: string | null
  dietaryTags: string[]
  allergens: string[]
  calories?: number | null
  prepTime?: number | null
  variants?: any[]
  options?: any[]
  categoryId: string
  categoryName: string
}

interface MenuCategory {
  id: string
  name: string
  description?: string | null
  items: MenuItem[]
}

interface PublicMenuData {
  menu: {
    id: string
    name: string
    slug: string
    description?: string | null
    type: string
    badgeText?: string | null
    currency: string
    qrColor?: string | null
    orderingEnabled: boolean
    isActive: boolean
  }
  tenant: {
    id: string
    businessName: string
    slug: string
    currency: string
    taxRate: number
    receiptHeader?: string | null
  }
  categories: MenuCategory[]
}

type ViewMode = 'showcase' | 'grid' | 'list'

export default function PublicDigitalMenuPage({
  params
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const resolvedParams = use(params)
  const { locale, slug } = resolvedParams

  const [menuData, setMenuData] = useState<PublicMenuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // View Mode: 'showcase' (huge cards), 'grid' (2-column), 'list' (compact)
  const [viewMode, setViewMode] = useState<ViewMode>('showcase')

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'drink' | 'food' | 'retail'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDietaryFilter, setSelectedDietaryFilter] = useState<string>('all')
  const [selectedTasteFilter, setSelectedTasteFilter] = useState<string>('all')

  // Selected item modal (Foodie Inspector)
  const [inspectedItem, setInspectedItem] = useState<MenuItem | null>(null)
  const [modalItemQty, setModalItemQty] = useState(1)
  const [modalSpecialNotes, setModalSpecialNotes] = useState('')
  const [modalSelectedSize, setModalSelectedSize] = useState<any | null>(null)
  const [modalTemperature, setModalTemperature] = useState<string>('hot')

  // Quick Cart state for contactless ordering
  const [cart, setCart] = useState<Array<{ item: MenuItem; quantity: number; notes?: string }>>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [tableNumber, setTableNumber] = useState('1')
  const [guestName, setGuestName] = useState('')
  const [guestNotes, setGuestNotes] = useState('')
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState<any | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  // Toast / Share notification
  const [shareToast, setShareToast] = useState(false)
  const [wifiModalOpen, setWifiModalOpen] = useState(false)

  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoading(true)
        const res = await fetch(`/api/menus/public/${slug}`)
        if (!res.ok) {
          throw new Error('Menu not found or currently unavailable')
        }
        const data = await res.json()
        setMenuData(data)
        if (data?.tenant?.businessName && data?.menu?.name) {
          document.title = `${data.tenant.businessName} - ${data.menu.name} | Digital Menu`
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load menu')
      } finally {
        setLoading(false)
      }
    }
    fetchMenu()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-white/10 flex flex-col items-center gap-3 shadow-2xl backdrop-blur-md">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center animate-pulse text-white shadow-lg">
            <Utensils className="w-5 h-5" />
          </div>
          <span className="text-sm font-bold tracking-wide text-slate-200">
            Loading delicious menu...
          </span>
        </div>
      </div>
    )
  }

  if (error || !menuData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="p-8 rounded-3xl max-w-sm text-center space-y-4 bg-slate-900/90 border border-white/10 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <Info className="w-7 h-7" />
          </div>
          <h2 className="font-extrabold text-lg text-white">
            Menu Unavailable
          </h2>
          <p className="text-xs text-slate-400">{error || 'This menu is currently inactive or draft.'}</p>
          <Link href={`/${locale}`}>
            <Button variant="outline" className="text-xs rounded-xl mt-2 border-white/20">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const { menu, tenant, categories } = menuData
  const channel = MENU_CHANNELS[menu.type] || MENU_CHANNELS.dine_in
  const ChannelIcon = channel.icon

  // Flatten items for global searches or filtering
  const allItems: MenuItem[] = categories.flatMap((c) => c.items)

  const filteredCategories = categories.map((cat) => {
    const items = cat.items.filter((item) => {
      const config = parseItemCustomization(item.options)
      const matchesSearch =
        !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.ingredients && item.ingredients.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesType =
        selectedTypeFilter === 'all' || config.itemType === selectedTypeFilter

      const matchesDietary =
        selectedDietaryFilter === 'all' ||
        item.dietaryTags?.includes(selectedDietaryFilter)

      const matchesTaste =
        selectedTasteFilter === 'all' ||
        (config.tasteProfile && config.tasteProfile.includes(selectedTasteFilter))

      return matchesSearch && matchesType && matchesDietary && matchesTaste
    })
    return { ...cat, items }
  }).filter((cat) => selectedCategory === 'all' || cat.id === selectedCategory ? cat.items.length > 0 : false)

  const totalFilteredItemsCount = filteredCategories.reduce((acc, c) => acc + c.items.length, 0)

  // Cart operations
  const addToCart = (item: MenuItem, qty: number = 1, notes?: string) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === item.id)
      if (existing) {
        return prev.map((ci) =>
          ci.item.id === item.id ? { ...ci, quantity: ci.quantity + qty, notes: notes || ci.notes } : ci
        )
      }
      return [...prev, { item, quantity: qty, notes }]
    })
  }

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev.find((ci) => ci.item.id === itemId)
      if (!existing) return prev
      const newQty = existing.quantity + delta
      if (newQty <= 0) {
        return prev.filter((ci) => ci.item.id !== itemId)
      }
      return prev.map((ci) => (ci.item.id === itemId ? { ...ci, quantity: newQty } : ci))
    })
  }

  const openItemModal = (item: MenuItem) => {
    setInspectedItem(item)
    setModalItemQty(1)
    setModalSpecialNotes('')
    const config = parseItemCustomization(item.options)
    if (config.itemType === 'drink' && config.drinkConfig?.sizes && config.drinkConfig.sizes.length > 0) {
      const def = config.drinkConfig.sizes.find((s: any) => s.isDefault) || config.drinkConfig.sizes[0]
      setModalSelectedSize(def)
      setModalTemperature(config.drinkConfig.temperatureOptions?.[0] || 'hot')
    } else if (config.itemType === 'food' && config.foodConfig?.portions && config.foodConfig.portions.length > 0) {
      const def = config.foodConfig.portions.find((p: any) => p.isDefault) || config.foodConfig.portions[0]
      setModalSelectedSize(def)
      setModalTemperature(config.foodConfig.servingTemp || 'hot')
    } else {
      setModalSelectedSize(null)
      setModalTemperature('hot')
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${tenant.businessName} - ${menu.name}`,
          text: `Check out the delicious menu at ${tenant.businessName}!`,
          url: window.location.href
        })
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href)
      setShareToast(true)
      setTimeout(() => setShareToast(false), 3000)
    }
  }

  const totalItemsCount = cart.reduce((sum, ci) => sum + ci.quantity, 0)
  const cartSubtotal = cart.reduce((sum, ci) => sum + ci.item.price * ci.quantity, 0)
  const cartTax = Math.round(cartSubtotal * (tenant.taxRate / 100) * 100) / 100
  const cartGrandTotal = Math.round((cartSubtotal + cartTax) * 100) / 100

  const handleSendContactlessOrder = async () => {
    if (cart.length === 0 || orderSubmitting) return
    setOrderSubmitting(true)
    setCheckoutError(null)

    const orderPayload = {
      orderNumber: `QR-${menu.slug.toUpperCase()}-${Date.now().toString().slice(-5)}`,
      staffId: 'customer-self-service',
      subtotal: cartSubtotal,
      tax: cartTax,
      discount: 0,
      totalAmount: cartGrandTotal,
      paymentMethod: 'cash',
      tableNumber: parseInt(tableNumber) || 1,
      customerName: guestName.trim() || `QR Guest (${menu.name})`,
      notes: `[Contactless Menu: ${menu.name}] ${guestNotes ? 'Notes: ' + guestNotes : ''}`,
      deviceId: `qr-menu-${menu.slug}`,
      items: cart.map((ci) => ({
        menuItemId: ci.item.id,
        quantity: ci.quantity,
        price: ci.item.price,
        subtotal: ci.item.price * ci.quantity,
        notes: ci.notes || null
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
        setOrderPlaced(created)
        setCart([])
        setIsCartOpen(false)
      } else {
        const errData = await res.json().catch(() => null)
        setCheckoutError(errData?.error || 'Could not submit order. Please speak to our staff.')
      }
    } catch (e: any) {
      console.error(e)
      setCheckoutError('Network error submitting order. Please check your connection.')
    } finally {
      setOrderSubmitting(false)
    }
  }

  // Fallback image helper if item has none
  const getItemImage = (item: MenuItem) => {
    if (item.imageUrl) return item.imageUrl
    const nameLower = item.name.toLowerCase()
    if (nameLower.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80'
    if (nameLower.includes('rib') || nameLower.includes('brisket') || nameLower.includes('steak') || nameLower.includes('meat') || nameLower.includes('bbq')) return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
    if (nameLower.includes('fries') || nameLower.includes('nachos') || nameLower.includes('wing')) return 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80'
    if (nameLower.includes('latte') || nameLower.includes('coffee') || nameLower.includes('espresso') || nameLower.includes('cappuccino')) return 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80'
    if (nameLower.includes('mojito') || nameLower.includes('tea') || nameLower.includes('refresher') || nameLower.includes('juice')) return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80'
    if (nameLower.includes('cake') || nameLower.includes('toast') || nameLower.includes('dessert') || nameLower.includes('sweet')) return 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80'
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80'
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased font-sans pb-32 selection:bg-amber-500 selection:text-black">
      {/* 1. HERO COVER BANNER (Oldies Style) */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden bg-slate-900">
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&auto=format&fit=crop&q=85"
          alt="Restaurant Ambiance Cover"
          className="w-full h-full object-cover object-center filter brightness-[0.65] contrast-[1.05] scale-105 transform hover:scale-100 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/40" />

        {/* Top Floating Utility Bar */}
        <div className="absolute top-0 left-0 right-0 max-w-4xl mx-auto p-4 flex items-center justify-between z-20">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/15 text-xs font-bold text-white hover:bg-black/60 transition-all cursor-pointer shadow-lg"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>{tenant.businessName}</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWifiModalOpen(true)}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer shadow-lg"
              title="Guest Wi-Fi Info"
            >
              <Wifi className="w-4 h-4 text-emerald-400" />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/15 flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer shadow-lg"
              title="Share Menu"
            >
              <Share2 className="w-4 h-4 text-cyan-300" />
            </button>
          </div>
        </div>

        {/* Brand Identity & Header Info */}
        <div className="absolute bottom-4 left-0 right-0 max-w-4xl mx-auto px-4 z-20">
          <div className="flex items-end gap-3 sm:gap-4">
            {/* Restaurant Avatar / Logo */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-900 border-2 border-amber-500/40 p-1.5 shadow-2xl shrink-0 backdrop-blur-md overflow-hidden flex items-center justify-center">
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center text-white shadow-inner font-black text-2xl tracking-tighter">
                {tenant.businessName.slice(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Titles & Badges */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md truncate">
                  {tenant.businessName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-black shadow-xs">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified Kitchen
                </span>
              </div>

              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                {menu.description || 'Artisan dining, slow-smoked cuts, craft burgers & specialty coffee'}
              </p>

              {/* Status Chips */}
              <div className="flex items-center gap-2 sm:gap-3 mt-2 text-[11px] font-semibold text-slate-300 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Open Now
                </span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  15-25 min prep
                </span>
                <span className="inline-flex items-center gap-1 text-slate-300">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  4.9 (1.2k+ reviews)
                </span>
                {menu.badgeText && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    ✨ {menu.badgeText}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-black px-4 py-2 rounded-2xl font-black text-xs shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4" />
          <span>Menu link copied to clipboard!</span>
        </div>
      )}

      {/* 2. STICKY CATEGORY & SEARCH CONTROLS */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-white/10 shadow-xl transition-all">
        <div className="max-w-4xl mx-auto px-4 py-2.5 space-y-2.5">
          {/* Search Bar & View Mode Switcher */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute start-3.5 top-3 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search burgers, ribs, lattes, ingredients..."
                className="h-10 ps-10 pe-9 text-xs rounded-2xl bg-white/[0.07] border-white/15 text-white placeholder:text-slate-400 focus:bg-white/[0.12] focus:border-amber-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute end-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Mode Toggle Switch */}
            <div className="flex items-center bg-white/[0.07] border border-white/15 rounded-2xl p-1 shrink-0">
              <button
                onClick={() => setViewMode('showcase')}
                title="Large Photo Showcase"
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'showcase'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="2-Column Grid Cards"
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                title="Compact List"
                className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Rows className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Horizontal Scrolling Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : 'bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-300'
              }`}
            >
              <span>🔥 All Items</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedCategory === 'all' ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-400'
              }`}>
                {allItems.length}
              </span>
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  selectedCategory === c.id
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : 'bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-300'
                }`}
              >
                <span>{c.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedCategory === c.id ? 'bg-black/20 text-black' : 'bg-white/10 text-slate-400'
                }`}>
                  {c.items.length}
                </span>
              </button>
            ))}
          </div>

          {/* Item Type Quick Filters (Drinks vs Food vs Retail) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedTypeFilter === 'all'
                  ? 'bg-white text-slate-950 shadow-md font-extrabold'
                  : 'bg-white/[0.06] text-slate-300 hover:bg-white/10'
              }`}
            >
              <span>🌟 All Types</span>
            </button>
            <button
              onClick={() => setSelectedTypeFilter('drink')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedTypeFilter === 'drink'
                  ? 'bg-blue-600 text-white shadow-md font-extrabold'
                  : 'bg-white/[0.06] text-slate-300 hover:bg-white/10'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Beverages & Drinks</span>
            </button>
            <button
              onClick={() => setSelectedTypeFilter('food')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedTypeFilter === 'food'
                  ? 'bg-amber-600 text-white shadow-md font-extrabold'
                  : 'bg-white/[0.06] text-slate-300 hover:bg-white/10'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Food & Kitchen</span>
            </button>
            <button
              onClick={() => setSelectedTypeFilter('retail')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                selectedTypeFilter === 'retail'
                  ? 'bg-indigo-600 text-white shadow-md font-extrabold'
                  : 'bg-white/[0.06] text-slate-300 hover:bg-white/10'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Retail & Coffee Bags</span>
            </button>
          </div>

          {/* Quick Dietary & Flavor Filter Tag Pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => {
                setSelectedDietaryFilter('all')
                setSelectedTasteFilter('all')
              }}
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all cursor-pointer shrink-0 ${
                selectedDietaryFilter === 'all' && selectedTasteFilter === 'all'
                  ? 'bg-white/20 border-white/40 text-white shadow-xs'
                  : 'border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Diets & Flavors
            </button>
            {Object.entries(DIETARY_TAGS).map(([key, def]) => {
              const isSelected = selectedDietaryFilter === key
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDietaryFilter(isSelected ? 'all' : key)}
                  className={`cursor-pointer transition-all shrink-0 ${
                    isSelected ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-950 scale-105' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  <DietaryBadge tagKey={key} size="sm" />
                </button>
              )
            })}
            {COMMON_TASTE_PROFILES.slice(0, 6).map((taste) => {
              const isSelected = selectedTasteFilter === taste
              return (
                <button
                  key={taste}
                  onClick={() => setSelectedTasteFilter(isSelected ? 'all' : taste)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-purple-600 border-purple-500 text-white shadow-xs'
                      : 'border-white/10 bg-white/[0.04] text-purple-300 hover:text-white'
                  }`}
                >
                  ✨ {taste}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 3. ORDER SUBMITTED TOAST BANNER */}
      {orderPlaced && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/40 text-emerald-200 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">
                  Order Dispatched to Kitchen!
                </h4>
                <p className="text-xs text-emerald-300">
                  Ticket #{orderPlaced.orderNumber || '001'} is now being grilled & crafted fresh.
                </p>
              </div>
            </div>
            <button
              onClick={() => setOrderPlaced(null)}
              className="p-2 hover:bg-white/10 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN MENU FEED (Multi-Category Display) */}
      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-10">
        {totalFilteredItemsCount === 0 ? (
          <div className="text-center py-20 bg-slate-900/60 rounded-3xl border border-white/10 space-y-3">
            <Utensils className="w-12 h-12 mx-auto text-slate-500" />
            <h3 className="text-base font-bold text-slate-200">No dishes match your filter</h3>
            <p className="text-xs text-slate-400">Try clearing search terms or dietary filters</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedDietaryFilter('all')
                setSelectedCategory('all')
              }}
              className="rounded-xl border-white/20 text-xs"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <section key={cat.id} className="space-y-4">
              {/* Category Header */}
              <div className="flex items-baseline justify-between border-b border-white/10 pb-2.5">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {cat.description}
                    </p>
                  )}
                </div>
                <span className="text-xs font-bold text-amber-400">
                  {cat.items.length} {cat.items.length === 1 ? 'dish' : 'dishes'}
                </span>
              </div>

              {/* ITEMS LAYOUT BASED ON VIEW MODE */}

              {/* A. SHOWCASE MODE (Huge Pics - Clean & Easy to Look At) */}
              {viewMode === 'showcase' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {cat.items.map((item) => {
                    const inCart = cart.find((ci) => ci.item.id === item.id)
                    const imageSrc = getItemImage(item)

                    return (
                      <div
                        key={item.id}
                        onClick={() => openItemModal(item)}
                        className="group bg-slate-900/90 rounded-3xl border border-white/10 overflow-hidden shadow-lg hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/5 transition-all duration-300 flex flex-col cursor-pointer"
                      >
                        {/* Huge Image Container */}
                        <div className="relative w-full aspect-[16/10] overflow-hidden bg-slate-950">
                          <img
                            src={imageSrc}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                          {/* Top Badges on Image */}
                          <div className="absolute top-3 start-3 end-3 flex items-center justify-between gap-2 pointer-events-none">
                            <div className="flex flex-wrap gap-1.5">
                              {item.dietaryTags?.includes('bestseller') && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-black shadow-md">
                                  <Flame className="w-3 h-3 fill-black" />
                                  BESTSELLER
                                </span>
                              )}
                              {item.dietaryTags?.includes('chef_special') && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-md">
                                  <Star className="w-3 h-3 fill-white" />
                                  CHEF&apos;S CHOICE
                                </span>
                              )}
                              {item.dietaryTags?.includes('new_item') && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-600 text-white shadow-md">
                                  <Sparkles className="w-3 h-3" />
                                  NEW
                                </span>
                              )}
                            </div>

                            {item.calories && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-slate-200 border border-white/15">
                                <Zap className="w-3 h-3 text-amber-400" />
                                {item.calories} kcal
                              </span>
                            )}
                          </div>

                          {/* Price Tag Floating over image */}
                          <div className="absolute bottom-3 start-3">
                            <div className="px-3 py-1 rounded-2xl bg-black/70 backdrop-blur-md border border-white/20 text-amber-400 font-black text-sm tracking-tight font-mono shadow-md">
                              ${item.price.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="font-black text-base text-white group-hover:text-amber-400 transition-colors">
                                {item.name}
                              </h3>
                              {item.prepTime && (
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {item.prepTime}m
                                </span>
                              )}
                            </div>

                            {item.description && (
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                {item.description}
                              </p>
                            )}

                            {/* What's included snippet */}
                            {item.ingredients && (
                              <p className="text-[11px] text-amber-400/90 line-clamp-1 font-medium pt-0.5">
                                ✦ {item.ingredients}
                              </p>
                            )}
                          </div>

                          {/* Bottom Row: Dietary badges & Add button */}
                          <div className="pt-2 border-t border-white/[0.07] flex items-center justify-between gap-2">
                            <div className="flex flex-wrap gap-1">
                              {item.dietaryTags?.filter(t => !['bestseller', 'chef_special', 'new_item'].includes(t)).slice(0, 3).map((tagKey) => (
                                <DietaryBadge key={tagKey} tagKey={tagKey} size="sm" />
                              ))}
                            </div>

                            {menu.orderingEnabled && (
                              <div onClick={(e) => e.stopPropagation()}>
                                {inCart ? (
                                  <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 px-2 py-1 rounded-2xl">
                                    <button
                                      onClick={() => updateCartQty(item.id, -1)}
                                      className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold hover:bg-slate-700 cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-5 text-center text-xs font-black text-amber-400">
                                      {inCart.quantity}
                                    </span>
                                    <button
                                      onClick={() => updateCartQty(item.id, 1)}
                                      className="w-7 h-7 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold hover:bg-amber-400 cursor-pointer shadow-md"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => addToCart(item)}
                                    className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs flex items-center gap-1.5 shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* B. GRID MODE (2-Column Visual Shopping) */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  {cat.items.map((item) => {
                    const inCart = cart.find((ci) => ci.item.id === item.id)
                    const imageSrc = getItemImage(item)

                    return (
                      <div
                        key={item.id}
                        onClick={() => openItemModal(item)}
                        className="group bg-slate-900/90 rounded-2xl border border-white/10 overflow-hidden shadow-md hover:border-amber-500/40 transition-all flex flex-col cursor-pointer"
                      >
                        {/* Photo */}
                        <div className="relative w-full aspect-square overflow-hidden bg-slate-950">
                          <img
                            src={imageSrc}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                          <div className="absolute bottom-2 start-2">
                            <span className="px-2 py-0.5 rounded-lg bg-black/75 text-amber-400 font-black text-xs font-mono">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h4 className="font-bold text-xs text-white group-hover:text-amber-400 transition-colors line-clamp-1">
                              {item.name}
                            </h4>
                            {item.description && (
                              <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {menu.orderingEnabled && (
                            <div className="pt-1 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                              <span className="text-[10px] text-slate-400">
                                {item.calories ? `${item.calories} kcal` : ''}
                              </span>
                              {inCart ? (
                                <div className="flex items-center gap-1 bg-amber-500/20 px-1.5 py-0.5 rounded-xl border border-amber-500/30">
                                  <button
                                    onClick={() => updateCartQty(item.id, -1)}
                                    className="w-5 h-5 rounded-lg bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="w-3 text-center text-[10px] font-black text-amber-400">
                                    {inCart.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateCartQty(item.id, 1)}
                                    className="w-5 h-5 rounded-lg bg-amber-500 text-black flex items-center justify-center text-[10px] font-bold"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-7 h-7 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold hover:brightness-110 active:scale-95 transition-all shadow-md"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* C. LIST MODE (Compact Fast Scanning) */}
              {viewMode === 'list' && (
                <div className="space-y-3">
                  {cat.items.map((item) => {
                    const inCart = cart.find((ci) => ci.item.id === item.id)
                    const imageSrc = getItemImage(item)

                    return (
                      <div
                        key={item.id}
                        onClick={() => openItemModal(item)}
                        className="group p-3 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-amber-500/40 flex items-center justify-between gap-3 shadow-sm transition-all cursor-pointer"
                      >
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-slate-950">
                          <img
                            src={imageSrc}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-extrabold text-sm text-white truncate group-hover:text-amber-400 transition-colors">
                              {item.name}
                            </h4>
                            <span className="font-black text-sm text-amber-400 font-mono">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                              {item.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-1.5">
                            {item.calories && (
                              <span className="text-[10px] text-slate-400">
                                🔥 {item.calories} kcal
                              </span>
                            )}
                            {item.prepTime && (
                              <span className="text-[10px] text-slate-400">
                                ⏱️ {item.prepTime}m
                              </span>
                            )}
                          </div>
                        </div>

                        {menu.orderingEnabled && (
                          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                            {inCart ? (
                              <div className="flex items-center gap-1 bg-amber-500/20 p-1 rounded-xl border border-amber-500/30">
                                <button
                                  onClick={() => updateCartQty(item.id, -1)}
                                  className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-bold"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-4 text-center text-xs font-bold text-amber-400">
                                  {inCart.quantity}
                                </span>
                                <button
                                  onClick={() => updateCartQty(item.id, 1)}
                                  className="w-6 h-6 rounded-lg bg-amber-500 text-black flex items-center justify-center font-bold"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          ))
        )}
      </main>

      {/* 5. ITEM DETAIL FOODIE MODAL (Bottom Sheet / Dialog) */}
      <Dialog open={!!inspectedItem} onOpenChange={(open) => !open && setInspectedItem(null)}>
        <DialogContent className="max-w-lg bg-slate-900 border border-white/15 p-0 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col text-slate-100">
          {inspectedItem && (
            <div className="flex flex-col h-full overflow-y-auto">
              {/* Huge Modal Header Image */}
              <div className="relative w-full h-64 sm:h-72 bg-slate-950 shrink-0">
                <img
                  src={getItemImage(inspectedItem)}
                  alt={inspectedItem.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

                <button
                  onClick={() => setInspectedItem(null)}
                  className="absolute top-4 end-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-black/80 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-4 start-4 end-4 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                      {inspectedItem.categoryName}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white mt-1 drop-shadow-md">
                      {inspectedItem.name}
                    </h3>
                  </div>
                  <div className="text-xl font-black text-amber-400 font-mono bg-black/70 backdrop-blur-md px-3 py-1 rounded-2xl border border-white/20 shadow-lg">
                    ${inspectedItem.price.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 space-y-4">
                {(() => {
                  const config = parseItemCustomization(inspectedItem.options)
                  const isDrink = config.itemType === 'drink'
                  const isFood = config.itemType === 'food'
                  const extraPrice = modalSelectedSize?.extraPrice || 0
                  const effectiveSinglePrice = inspectedItem.price + extraPrice
                  const effectiveTotal = effectiveSinglePrice * modalItemQty

                  return (
                    <>
                      {/* Description */}
                      {inspectedItem.description && (
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                          {inspectedItem.description}
                        </p>
                      )}

                      {/* Drink Size / Food Portion Picker */}
                      {isDrink && config.drinkConfig?.sizes && config.drinkConfig.sizes.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                          <span className="text-[11px] font-bold text-amber-400 block">
                            Select Serving Size (Volume in ml)
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                            {config.drinkConfig.sizes.map((size: any) => {
                              const isSelected = modalSelectedSize?.id === size.id || modalSelectedSize?.name === size.name
                              return (
                                <button
                                  key={size.id}
                                  type="button"
                                  onClick={() => setModalSelectedSize(size)}
                                  className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                                    isSelected
                                      ? 'border-amber-500 bg-amber-500 text-black shadow-md'
                                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                                  }`}
                                >
                                  <span className="truncate">{size.name}</span>
                                  <span className="text-[10px] opacity-80 font-mono">
                                    {size.volumeMl}ml {size.extraPrice ? `(+$${size.extraPrice.toFixed(2)})` : ''}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Food Portion Picker */}
                      {isFood && config.foodConfig?.portions && config.foodConfig.portions.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                          <span className="text-[11px] font-bold text-amber-400 block">
                            Select Portion Size
                          </span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {config.foodConfig.portions.map((portion: any) => {
                              const isSelected = modalSelectedSize?.id === portion.id || modalSelectedSize?.name === portion.name
                              return (
                                <button
                                  key={portion.id}
                                  type="button"
                                  onClick={() => setModalSelectedSize(portion)}
                                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                                    isSelected
                                      ? 'border-amber-500 bg-amber-500 text-black shadow-md'
                                      : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/10'
                                  }`}
                                >
                                  <span className="truncate">{portion.name}</span>
                                  <span className="text-[10px] opacity-80 font-mono">
                                    {portion.weightGrams ? `${portion.weightGrams}g ` : ''}{portion.extraPrice ? `(+$${portion.extraPrice.toFixed(2)})` : ''}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Taste Profile Badges */}
                      {config.tasteProfile && config.tasteProfile.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-400">Flavor & Taste Notes</span>
                          <div className="flex flex-wrap gap-1.5">
                            {config.tasteProfile.map((t: string) => (
                              <span key={t} className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
                                ✨ {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* What's Included & Ingredients Card */}
                      {inspectedItem.ingredients && (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                            <Sparkles className="w-4 h-4" />
                            <span>Fresh Ingredients & Recipe Details</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-medium">
                            {inspectedItem.ingredients}
                          </p>
                        </div>
                      )}

                      {/* Nutritional Facts Breakdown */}
                      {(config.nutrition || inspectedItem.calories) && (
                        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-amber-300">
                            <span className="flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-amber-400" />
                              <span>Nutritional Facts</span>
                            </span>
                            <span className="text-[10px] text-slate-400">Per standard serving</span>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-xs">
                            <div className="p-1.5 rounded-xl bg-white/[0.04]">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">Energy</span>
                              <span className="font-mono font-black text-white text-[11px]">
                                {config.nutrition?.calories || inspectedItem.calories || '—'} kcal
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-white/[0.04]">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">Protein</span>
                              <span className="font-mono font-black text-white text-[11px]">
                                {config.nutrition?.proteinG !== undefined ? `${config.nutrition.proteinG}g` : '—'}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-white/[0.04]">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">Carbs</span>
                              <span className="font-mono font-black text-white text-[11px]">
                                {config.nutrition?.carbsG !== undefined ? `${config.nutrition.carbsG}g` : '—'}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-white/[0.04]">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">Fat</span>
                              <span className="font-mono font-black text-white text-[11px]">
                                {config.nutrition?.fatG !== undefined ? `${config.nutrition.fatG}g` : '—'}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-white/[0.04]">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">Sugar</span>
                              <span className="font-mono font-black text-white text-[11px]">
                                {config.nutrition?.sugarG !== undefined ? `${config.nutrition.sugarG}g` : '—'}
                              </span>
                            </div>
                            <div className="p-1.5 rounded-xl bg-white/[0.04]">
                              <span className="text-[9px] text-slate-400 font-bold block uppercase">Sodium</span>
                              <span className="font-mono font-black text-white text-[11px]">
                                {config.nutrition?.sodiumMg !== undefined ? `${config.nutrition.sodiumMg}mg` : '—'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Origin & Sourcing Story */}
                      {config.originNote && (
                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
                          <strong>🌿 Sourcing & Origin:</strong> {config.originNote}
                        </div>
                      )}

                      {/* Dietary Tags */}
                      {inspectedItem.dietaryTags?.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-slate-400">Dietary Specifications</span>
                          <div className="flex flex-wrap gap-1.5">
                            {inspectedItem.dietaryTags.map((t) => (
                              <DietaryBadge key={t} tagKey={t} size="md" />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Allergens Warning */}
                      {inspectedItem.allergens?.length > 0 && (
                        <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            <span>Contains Allergens</span>
                          </div>
                          <p className="text-xs text-rose-200 font-semibold">
                            {inspectedItem.allergens.join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Special Request Notes */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-xs font-bold text-slate-300">
                          Special Kitchen Request (optional)
                        </label>
                        <Input
                          placeholder="e.g. Extra hot, light ice, dressing on the side..."
                          value={modalSpecialNotes}
                          onChange={(e) => setModalSpecialNotes(e.target.value)}
                          className="h-10 text-xs rounded-xl bg-white/[0.06] border-white/15 text-white"
                        />
                      </div>

                      {/* Quantity & Add Action */}
                      {menu.orderingEnabled && (
                        <div className="pt-3 border-t border-white/10 flex items-center gap-3">
                          {/* Quantity counter */}
                          <div className="flex items-center gap-2 bg-white/[0.08] border border-white/15 p-1.5 rounded-2xl">
                            <button
                              onClick={() => setModalItemQty((q) => Math.max(1, q - 1))}
                              className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white hover:bg-slate-700 cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-6 text-center text-sm font-black text-white">
                              {modalItemQty}
                            </span>
                            <button
                              onClick={() => setModalItemQty((q) => q + 1)}
                              className="w-8 h-8 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold hover:bg-amber-400 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <Button
                            onClick={() => {
                              const notesWithCustomizations = [
                                modalSelectedSize ? `Size: ${modalSelectedSize.name}${modalSelectedSize.volumeMl ? ` (${modalSelectedSize.volumeMl}ml)` : ''}` : '',
                                modalSpecialNotes.trim()
                              ].filter(Boolean).join(' • ')

                              addToCart(
                                { ...inspectedItem, price: effectiveSinglePrice },
                                modalItemQty,
                                notesWithCustomizations
                              )
                              setInspectedItem(null)
                            }}
                            className="flex-1 h-12 text-xs font-black gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-2xl shadow-xl hover:brightness-110 cursor-pointer active:scale-98 transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add to Order • ${effectiveTotal.toFixed(2)}</span>
                          </Button>
                        </div>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 6. GUEST WI-FI INFO MODAL */}
      <Dialog open={wifiModalOpen} onOpenChange={setWifiModalOpen}>
        <DialogContent className="max-w-xs bg-slate-900 border border-white/15 p-6 rounded-3xl text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
            <Wifi className="w-6 h-6" />
          </div>
          <DialogTitle className="text-base font-black text-white">
            Guest Wi-Fi Network
          </DialogTitle>
          <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 space-y-1.5 text-xs">
            <div className="text-slate-400">Network: <strong className="text-white">{tenant.businessName} Guest</strong></div>
            <div className="text-slate-400">Password: <strong className="text-amber-400 font-mono">oldies2026</strong></div>
          </div>
          <p className="text-[11px] text-slate-400">Enjoy high-speed optical fiber while browsing our delicious menu.</p>
        </DialogContent>
      </Dialog>

      {/* 7. FLOATING BOTTOM CART BAR */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-5 left-4 right-4 z-40 max-w-lg mx-auto animate-in slide-in-from-bottom-5 duration-300">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-4 px-5 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-2xl shadow-amber-500/30 flex items-center justify-between text-black font-black text-sm cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all border border-amber-300/30"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-black text-amber-400 flex items-center justify-center text-xs font-black shadow-inner">
                {totalItemsCount}
              </div>
              <span className="tracking-tight">View Your Order</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-base">
              <span>${cartGrandTotal.toFixed(2)}</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* 8. CONTACTLESS CHECKOUT ORDER DIALOG */}
      <Dialog open={isCartOpen} onOpenChange={setIsCartOpen}>
        <DialogContent className="max-w-md bg-slate-900 border border-white/15 p-6 rounded-3xl max-h-[90vh] overflow-y-auto text-slate-100">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-white">
              <span className="text-base font-black">Review Order</span>
              <span className="text-xs font-extrabold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                {totalItemsCount} items
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Cart items list */}
          <div className="space-y-2.5 mt-3 max-h-56 overflow-y-auto pr-1">
            {cart.map((ci) => (
              <div
                key={ci.item.id}
                className="p-3 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-white truncate">
                    {ci.item.name}
                  </div>
                  <div className="text-amber-400 font-black mt-0.5 font-mono">
                    ${(ci.item.price * ci.quantity).toFixed(2)}
                  </div>
                  {ci.notes && (
                    <div className="text-[10px] text-slate-400 italic truncate mt-0.5">
                      Note: {ci.notes}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateCartQty(ci.item.id, -1)}
                    className="w-7 h-7 rounded-xl bg-slate-800 border border-white/15 flex items-center justify-center font-bold text-white hover:bg-slate-700 cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-4 text-center font-black text-white">{ci.quantity}</span>
                  <button
                    onClick={() => updateCartQty(ci.item.id, 1)}
                    className="w-7 h-7 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold hover:bg-amber-400 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Table / Guest details */}
          <div className="space-y-2.5 pt-3 border-t border-white/10">
            {menu.type === 'dine_in' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">
                  Table Number
                </label>
                <Input
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="1"
                  className="h-10 text-xs rounded-xl bg-white/[0.06] border-white/15 text-white"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                Your Name
              </label>
              <Input
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Guest name (optional)"
                className="h-10 text-xs rounded-xl bg-white/[0.06] border-white/15 text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">
                Kitchen Instructions
              </label>
              <Input
                value={guestNotes}
                onChange={(e) => setGuestNotes(e.target.value)}
                placeholder="e.g. Extra napkins, serve drinks first..."
                className="h-10 text-xs rounded-xl bg-white/[0.06] border-white/15 text-white"
              />
            </div>
          </div>

          {/* Checkout Error Message */}
          {checkoutError && (
            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Bill summary */}
          <div className="p-3.5 rounded-2xl bg-white/[0.06] border border-white/10 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span>${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tax ({tenant.taxRate}%):</span>
              <span>${cartTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-white pt-1.5 border-t border-white/10">
              <span>Total:</span>
              <span className="text-amber-400 font-mono">
                ${cartGrandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <Button
            onClick={handleSendContactlessOrder}
            disabled={orderSubmitting || cart.length === 0}
            className="w-full h-12 text-xs font-black gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-black rounded-2xl shadow-xl hover:brightness-110 cursor-pointer active:scale-98 transition-all"
          >
            {orderSubmitting ? 'Dispatching to Kitchen...' : `Send Order to Kitchen • $${cartGrandTotal.toFixed(2)}`}
          </Button>
        </DialogContent>
      </Dialog>

      {/* 9. REUSABLE FOOTER */}
      <div className="max-w-4xl mx-auto px-4 mt-16 opacity-80">
        <Footer />
      </div>
    </div>
  )
}
