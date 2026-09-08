'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/lib/store'
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal'
import KitchenTicketModal, { KitchenTicketData } from '@/components/KitchenTicketModal'
import AppleWalletButton from '@/components/loyalty/AppleWalletButton'
import SplitBillModal from '@/components/SplitBillModal'
import { offlineStore } from '@/lib/sync/offline-store'
import { syncEngine } from '@/lib/sync/sync-engine'
import { 
  SlidersHorizontal, 
  ShoppingBag, 
  ShoppingCart,
  Banknote, 
  CreditCard, 
  Smartphone, 
  Check, 
  Sparkles, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  UserPlus, 
  ArrowRight,
  Coffee,
  WifiOff,
  Divide,
  ChefHat,
  Tag,
  Gift,
  Printer
} from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  category: { name: string }
  imageUrl?: string
  isAvailable: boolean
  inventory?: {
    quantity: number
    lowStockThreshold: number
  } | null
  recipes?: {
    ingredient: {
      name: string
      unit: string
      quantity: number
      lowStockThreshold?: number
    }
    quantity: number
  }[]
}

interface CartItem {
  cartId: string
  menuItem: MenuItem
  quantity: number
  unitPrice: number
  subtotal: number
  modifiersSummary?: string
}

interface Staff {
  id: string
  name: string
  role: string
}

interface Customer {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  loyaltyPoints: number
}

export default function PointOfSale() {
  const { user } = useAuthStore()
  const t = useTranslations('pos')
  const tCommon = useTranslations('common')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  // Customization state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null)
  const [itemSize, setItemSize] = useState<'Regular' | 'Large'>('Regular')
  const [itemMilk, setItemMilk] = useState<string>('Regular')
  const [itemSugar, setItemSugar] = useState<string>('Normal (100%)')
  const [itemExtraShot, setItemExtraShot] = useState<boolean>(false)
  const [itemSpecialNote, setItemSpecialNote] = useState<string>('')

  // Tax & Tenant state
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState<string>('0')
  const [tenantInfo, setTenantInfo] = useState<any>(null)
  const taxRate = tenantInfo?.taxRate ?? 15
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null)

  // Customer state
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' })

  // Checkout & Receipt state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null)

  // Loyalty redemption state
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0)

  // Promo Coupon state
  const [promoInput, setPromoInput] = useState<string>('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [promoError, setPromoError] = useState<string | null>(null)

  // KOT Ticket state
  const [isKotOpen, setIsKotOpen] = useState(false)
  const [kotTicketData, setKotTicketData] = useState<KitchenTicketData | null>(null)

  const [orderDetails, setOrderDetails] = useState({
    staffId: user?.id || '',
    paymentMethod: 'cash',
    tableNumber: '',
    customerName: '',
    notes: ''
  })

  useEffect(() => {
    if (user?.id && !orderDetails.staffId) {
      setOrderDetails(prev => ({ ...prev, staffId: user.id }))
    }
  }, [user, orderDetails.staffId])

  useEffect(() => {
    fetchMenuItems()
    fetchCategories()
    fetchStaff()
    fetchTenant()
  }, [])

  const fetchTenant = async () => {
    try {
      const res = await fetch('/api/tenant')
      if (res.ok) {
        const data = await res.json()
        setTenantInfo(data)
        offlineStore.cacheTenant(data)
      } else {
        const cached = offlineStore.getCachedTenant()
        if (cached) setTenantInfo(cached)
      }
    } catch {
      const cached = offlineStore.getCachedTenant()
      if (cached) setTenantInfo(cached)
    }
  }

  useEffect(() => {
    if (customerSearch.trim().length > 1) {
      const timer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/customers?search=${encodeURIComponent(customerSearch.trim())}`)
          const data = await res.json()
          setCustomerResults(data)
        } catch (e) {
          console.error(e)
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setCustomerResults([])
    }
  }, [customerSearch])

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu-items')
      if (response.ok) {
        const data = await response.json()
        setMenuItems(data)
        offlineStore.cacheCatalog(categories, data)
      } else {
        const cached = offlineStore.getCachedCatalog()
        if (cached.menuItems.length) setMenuItems(cached.menuItems)
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error)
      const cached = offlineStore.getCachedCatalog()
      if (cached.menuItems.length) setMenuItems(cached.menuItems)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      } else {
        const cached = offlineStore.getCachedCatalog()
        if (cached.categories.length) setCategories(cached.categories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      const cached = offlineStore.getCachedCatalog()
      if (cached.categories.length) setCategories(cached.categories)
    }
  }

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff')
      const data = await response.json()
      setStaff(data)
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  // Quick Add Item (default options)
  const addToCart = (menuItem: MenuItem) => {
    const cartId = `${menuItem.id}-default`
    setCart(prevCart => {
      const existing = prevCart.find(item => item.cartId === cartId)
      if (existing) {
        return prevCart.map(item =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unitPrice }
            : item
        )
      }
      return [
        ...prevCart,
        {
          cartId,
          menuItem,
          quantity: 1,
          unitPrice: menuItem.price,
          subtotal: menuItem.price,
          modifiersSummary: ''
        }
      ]
    })
  }

  // Open Customization Modal
  const openCustomizer = (menuItem: MenuItem) => {
    setCustomizingItem(menuItem)
    setItemSize('Regular')
    setItemMilk('Regular')
    setItemSugar('Normal (100%)')
    setItemExtraShot(false)
    setItemSpecialNote('')
  }

  // Add Customized Item to Cart
  const addCustomizedItemToCart = () => {
    if (!customizingItem) return

    let extraPrice = 0
    const parts: string[] = []

    if (itemSize === 'Large') {
      extraPrice += 1.0
      parts.push('Large (+$1.00)')
    }
    if (itemMilk === 'Oat Milk' || itemMilk === 'Almond Milk') {
      extraPrice += 0.75
      parts.push(`${itemMilk} (+$0.75)`)
    } else if (itemMilk !== 'Regular') {
      parts.push(itemMilk)
    }
    if (itemSugar !== 'Normal (100%)') {
      parts.push(`Sugar: ${itemSugar}`)
    }
    if (itemExtraShot) {
      extraPrice += 1.0
      parts.push('Extra Shot (+$1.00)')
    }
    if (itemSpecialNote.trim()) {
      parts.push(`"${itemSpecialNote.trim()}"`)
    }

    const modifiersSummary = parts.join(' • ')
    const unitPrice = customizingItem.price + extraPrice
    const cartId = `${customizingItem.id}-${itemSize}-${itemMilk}-${itemSugar}-${itemExtraShot}-${itemSpecialNote.trim()}`

    setCart(prevCart => {
      const existing = prevCart.find(item => item.cartId === cartId)
      if (existing) {
        return prevCart.map(item =>
          item.cartId === cartId
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * unitPrice }
            : item
        )
      }
      return [
        ...prevCart,
        {
          cartId,
          menuItem: customizingItem,
          quantity: 1,
          unitPrice,
          subtotal: unitPrice,
          modifiersSummary
        }
      ]
    })

    setCustomizingItem(null)
  }

  const removeFromCart = (cartId: string) => {
    setCart(prevCart => prevCart.filter(item => item.cartId !== cartId))
  }

  const updateQuantity = (cartId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartId)
      return
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.cartId === cartId
          ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.unitPrice }
          : item
      )
    )
  }

  // Financial Calculations
  const rawSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)

  // Promo code discount
  let promoDiscount = 0
  if (appliedPromo) {
    if (appliedPromo === 'WELCOME10') promoDiscount = Math.round((rawSubtotal * 0.10) * 100) / 100
    else if (appliedPromo === 'SUMMER20') promoDiscount = Math.round((rawSubtotal * 0.20) * 100) / 100
    else if (appliedPromo === 'VIP15') promoDiscount = Math.round((rawSubtotal * 0.15) * 100) / 100
    else if (appliedPromo === 'HAPPYHOUR') promoDiscount = Math.round((rawSubtotal * 0.25) * 100) / 100
    else if (appliedPromo === 'COFFEE5') promoDiscount = Math.min(5.00, rawSubtotal)
  }

  // Loyalty points discount ($1 off per 100 points)
  const pointsDiscount = Math.min(Math.max(0, rawSubtotal - promoDiscount), (redeemedPoints / 100) * 1.00)

  const discountNumber = parseFloat(discountValue) || 0
  const manualDiscount = discountType === 'percent'
    ? (rawSubtotal * Math.min(100, Math.max(0, discountNumber))) / 100
    : Math.min(rawSubtotal, Math.max(0, discountNumber))

  const totalDiscount = Math.min(rawSubtotal, Math.round((manualDiscount + promoDiscount + pointsDiscount) * 100) / 100)
  const netSubtotal = Math.max(0, rawSubtotal - totalDiscount)
  const taxAmount = Math.round(((netSubtotal * taxRate) / 100) * 100) / 100
  const grandTotal = Math.round((netSubtotal + taxAmount) * 100) / 100

  const handleApplyPromo = () => {
    setPromoError(null)
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    const validCodes = ['WELCOME10', 'SUMMER20', 'VIP15', 'HAPPYHOUR', 'COFFEE5']
    if (validCodes.includes(code)) {
      setAppliedPromo(code)
      setPromoInput('')
    } else {
      setPromoError('Invalid code. Try WELCOME10, SUMMER20, VIP15, or COFFEE5')
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setPromoError(null)
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim()) return
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCustomer)
      })
      if (res.ok) {
        const created = await res.json()
        setSelectedCustomer(created)
        setOrderDetails(prev => ({ ...prev, customerName: created.name }))
        setIsNewCustomerModalOpen(false)
        setNewCustomer({ name: '', phone: '', email: '' })
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleCheckout = async () => {
    const orderNumber = `ORD-${Date.now()}`
    const activeStaffId = orderDetails.staffId || user?.id || staff[0]?.id || ''
    const staffObj = staff.find(s => s.id === activeStaffId)

    const orderPayload = {
      orderNumber,
      staffId: activeStaffId,
      subtotal: rawSubtotal,
      tax: taxAmount,
      discount: totalDiscount,
      totalAmount: grandTotal,
      paymentMethod: orderDetails.paymentMethod,
      tableNumber: orderDetails.tableNumber ? parseInt(orderDetails.tableNumber) : null,
      customerName: selectedCustomer?.name || orderDetails.customerName || null,
      customerId: selectedCustomer?.id || null,
      notes: orderDetails.notes,
      redeemedPoints: redeemedPoints > 0 ? redeemedPoints : undefined,
      promoCode: appliedPromo || undefined,
      items: cart.map(item => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
        price: item.unitPrice,
        subtotal: item.subtotal,
        notes: item.modifiersSummary || null
      }))
    }

    const receiptObj: ReceiptData = {
      orderNumber,
      createdAt: new Date(),
      staffName: staffObj?.name || user?.name || 'Cashier',
      tableNumber: orderDetails.tableNumber ? parseInt(orderDetails.tableNumber) : null,
      customerName: selectedCustomer?.name || orderDetails.customerName || null,
      customerId: selectedCustomer?.id || null,
      customerLoyaltyPoints: selectedCustomer ? (selectedCustomer.loyaltyPoints - redeemedPoints + Math.max(1, Math.floor(grandTotal))) : null,
      subtotal: rawSubtotal,
      discount: totalDiscount,
      tax: taxAmount,
      taxRate: taxRate,
      totalAmount: grandTotal,
      paymentMethod: orderDetails.paymentMethod,
      notes: orderDetails.notes,
      businessName: tenantInfo?.businessName,
      taxNumber: tenantInfo?.taxNumber,
      receiptHeader: tenantInfo?.receiptHeader,
      receiptFooter: tenantInfo?.receiptFooter,
      items: cart.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.unitPrice,
        subtotal: item.subtotal,
        notes: item.modifiersSummary || null
      }))
    }

    // Prepare KOT Ticket Data
    const kotData: KitchenTicketData = {
      orderNumber,
      createdAt: new Date(),
      tableNumber: orderDetails.tableNumber ? parseInt(orderDetails.tableNumber) : null,
      customerName: selectedCustomer?.name || orderDetails.customerName || null,
      staffName: staffObj?.name || user?.name || 'Cashier',
      station: 'BARISTA & KITCHEN',
      notes: orderDetails.notes,
      items: cart.map(i => ({
        name: i.menuItem.name,
        quantity: i.quantity,
        notes: i.modifiersSummary || null,
        category: i.menuItem.category?.name
      }))
    }
    setKotTicketData(kotData)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      })

      if (response.ok) {
        const createdOrder = await response.json()
        if (createdOrder.orderNumber) {
          receiptObj.orderNumber = createdOrder.orderNumber
        }
        setOfflineNotice(null)
      } else {
        // Enqueue offline
        offlineStore.enqueue({
          deviceId: 'main-pos',
          entityType: 'order',
          action: 'create',
          payload: orderPayload
        })
        setOfflineNotice('Offline mode: Order saved locally. Will sync automatically when connected.')
      }
    } catch {
      // Network/offline error - save locally
      offlineStore.enqueue({
        deviceId: 'main-pos',
        entityType: 'order',
        action: 'create',
        payload: orderPayload
      })
      setOfflineNotice('Offline mode: Order saved locally. Will sync automatically when connected.')
    }

    setLastReceipt(receiptObj)
    setCart([])
    setIsCheckoutOpen(false)
    setDiscountValue('0')
    setRedeemedPoints(0)
    setAppliedPromo(null)
    setPromoInput('')
    setSelectedCustomer(null)
    setCustomerSearch('')
    setOrderDetails({
      staffId: user?.id || '',
      paymentMethod: 'cash',
      tableNumber: '',
      customerName: '',
      notes: ''
    })
    setIsReceiptOpen(true)
  }

  const filteredMenuItems = selectedCategory === 'all'
    ? menuItems.filter(item => item.isAvailable)
    : menuItems.filter(item => item.categoryId === selectedCategory && item.isAvailable)

  if (loading) {
    return <div className="p-6">{tCommon('loading')}</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fast orders, item customizations & instant receipt printing</p>
        </div>
        <Button
          onClick={() => setIsCheckoutOpen(true)}
          disabled={cart.length === 0}
          className="liquid-btn-primary h-11 px-6 font-bold gap-2 text-sm shadow-lg"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{t('checkout')} ({cart.length}) • ${grandTotal.toFixed(2)}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {offlineNotice && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 animate-pulse" />
            <span>{offlineNotice}</span>
          </div>
          <button
            onClick={() => setOfflineNotice(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Category selector */}
      <div className="flex gap-4 mb-4">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-60 glass-panel">
            <SelectValue placeholder={t('category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items Grid */}
        <div className="lg:col-span-2 grid gap-4 md:grid-cols-2">
          {filteredMenuItems.map((item) => {
            const directStock = item.inventory ? item.inventory.quantity : null
            const isDirectOut = directStock !== null && directStock <= 0
            const isDirectLow = directStock !== null && directStock > 0 && directStock <= (item.inventory?.lowStockThreshold ?? 5)

            const depletedIngredient = item.recipes?.find(r => r.ingredient.quantity <= 0)
            const lowIngredient = !depletedIngredient 
              ? item.recipes?.find(r => r.ingredient.quantity <= (r.ingredient.lowStockThreshold ?? 5))
              : null

            const isUnavailable = isDirectOut || !!depletedIngredient

            return (
              <Card key={item.id} className={`glass-card flex flex-col justify-between ${isUnavailable ? 'opacity-75 border-rose-200 dark:border-rose-900/40' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-tight">{item.name}</CardTitle>
                    <span className="text-sm font-extrabold px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300 shrink-0">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{item.category.name}</p>
                    {isDirectOut && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        Out of Stock
                      </span>
                    )}
                    {depletedIngredient && !isDirectOut && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400">
                        ⚠️ {depletedIngredient.ingredient.name} Empty
                      </span>
                    )}
                    {isDirectLow && !isDirectOut && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        Only {directStock} left
                      </span>
                    )}
                    {lowIngredient && !isUnavailable && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        Low {lowIngredient.ingredient.name}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">{item.description}</p>
                  
                  {item.recipes && item.recipes.length > 0 && (
                    <div className="p-2 rounded-xl bg-slate-100/60 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.05] text-[11px] text-slate-600 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Ingredients: </span>
                      {item.recipes.map((r, i) => (
                        <span key={i} className={r.ingredient.quantity <= 0 ? 'text-rose-500 font-bold' : ''}>
                          {r.ingredient.name} ({r.quantity} {r.ingredient.unit})
                          {i < item.recipes!.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.08]">
                    <Button
                      onClick={() => addToCart(item)}
                      disabled={isUnavailable}
                      className={`flex-1 gap-1.5 font-bold ${
                        isUnavailable 
                          ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400' 
                          : 'liquid-btn-primary'
                      }`}
                      size="sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isUnavailable ? 'Depleted' : t('addToOrder')}</span>
                    </Button>
                    <Button
                      onClick={() => openCustomizer(item)}
                      disabled={isUnavailable}
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      title="Customize sizes, milk, sugar & add-ons"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>{t('customize')}</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Current Order Cart Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 glass-panel shadow-xl">
            <CardHeader className="pb-3 border-b border-slate-200/60 dark:border-white/[0.08]">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <CardTitle className="text-base font-bold">{t('currentOrder')}</CardTitle>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{t('clearOrder')}</span>
                  </button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <div className="w-16 h-16 rounded-2xl glass-pill flex items-center justify-center mx-auto mb-2 text-slate-300 dark:text-slate-600">
                    <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <p className="text-sm font-medium">{t('noItemsInCart')}</p>
                  <p className="text-xs text-slate-400">Select items from the menu to start order</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {cart.map((item) => (
                      <div key={item.cartId} className="flex justify-between items-start border-b border-slate-200/60 dark:border-white/[0.08] pb-2.5">
                        <div className="flex-1 pr-2">
                          <p className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{item.menuItem.name}</p>
                          {item.modifiersSummary && (
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                              {item.modifiersSummary}
                            </p>
                          )}
                          <p className="text-xs text-slate-400">${item.unitPrice.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 rounded-lg"
                            onClick={() => updateQuantity(item.cartId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 rounded-lg"
                            onClick={() => updateQuantity(item.cartId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <span className="w-14 text-right font-bold text-sm ml-1 text-slate-800 dark:text-slate-200">
                            ${item.subtotal.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Discount & Tax Controls */}
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t('discount')}:</span>
                      <div className="flex items-center gap-1">
                        <div className="flex border rounded overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setDiscountType('percent')}
                            className={`px-2 py-0.5 text-[10px] ${discountType === 'percent' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            onClick={() => setDiscountType('fixed')}
                            className={`px-2 py-0.5 text-[10px] ${discountType === 'fixed' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
                          >
                            $
                          </button>
                        </div>
                        <Input
                          type="number"
                          min="0"
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          className="h-6 w-16 text-right px-1 text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Breakdown summary */}
                  <div className="border-t dark:border-gray-700 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>{t('subtotal')}:</span>
                      <span>${rawSubtotal.toFixed(2)}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-green-600 dark:text-green-400">
                        <span>{t('discount')}:</span>
                        <span>-${totalDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-600 dark:text-gray-400">
                      <span>{t('tax')} ({taxRate}% VAT):</span>
                      <span>+${taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-extrabold border-t dark:border-gray-700 pt-2">
                      <span>{t('total')}:</span>
                      <span className="text-blue-600 dark:text-blue-400">${grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    onClick={() => setIsCheckoutOpen(true)}
                    className="w-full bg-green-600 hover:bg-green-700 h-11 text-base font-bold shadow"
                  >
                    {t('checkout')} (${grandTotal.toFixed(2)})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Item Customization Modal */}
      <Dialog open={!!customizingItem} onOpenChange={(open) => !open && setCustomizingItem(null)}>
        <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Customize: {customizingItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Size */}
            <div>
              <Label className="text-xs font-semibold">Size</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Button
                  type="button"
                  variant={itemSize === 'Regular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setItemSize('Regular')}
                  className={itemSize === 'Regular' ? 'bg-blue-600' : ''}
                >
                  Regular
                </Button>
                <Button
                  type="button"
                  variant={itemSize === 'Large' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setItemSize('Large')}
                  className={itemSize === 'Large' ? 'bg-blue-600' : ''}
                >
                  Large (+$1.00)
                </Button>
              </div>
            </div>

            {/* Milk */}
            <div>
              <Label className="text-xs font-semibold">Milk Options</Label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {['Regular', 'Skim Milk', 'Oat Milk', 'Almond Milk'].map((milk) => (
                  <Button
                    key={milk}
                    type="button"
                    variant={itemMilk === milk ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setItemMilk(milk)}
                    className={itemMilk === milk ? 'bg-blue-600 text-xs' : 'text-xs'}
                  >
                    {milk} {milk.includes('Milk') && milk !== 'Skim Milk' && milk !== 'Regular' ? '(+$0.75)' : ''}
                  </Button>
                ))}
              </div>
            </div>

            {/* Sugar */}
            <div>
              <Label className="text-xs font-semibold">Sugar Level</Label>
              <Select value={itemSugar} onValueChange={setItemSugar}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal (100%)">Normal (100%)</SelectItem>
                  <SelectItem value="Half (50%)">Half (50%)</SelectItem>
                  <SelectItem value="Less (25%)">Less (25%)</SelectItem>
                  <SelectItem value="No Sugar (0%)">No Sugar (0%)</SelectItem>
                  <SelectItem value="Extra Sweet (150%)">Extra Sweet (150%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Extra Shot */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Extra Espresso Shot</p>
                <p className="text-xs text-slate-400">+$1.00</p>
              </div>
              <Button
                type="button"
                variant={itemExtraShot ? 'default' : 'outline'}
                size="sm"
                onClick={() => setItemExtraShot(!itemExtraShot)}
                className={`gap-1 font-semibold ${itemExtraShot ? 'liquid-btn-primary' : ''}`}
              >
                {itemExtraShot ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Added</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </>
                )}
              </Button>
            </div>

            {/* Note */}
            <div>
              <Label className="text-xs font-semibold">Custom Instructions</Label>
              <Input
                placeholder="e.g., extra hot, light ice"
                value={itemSpecialNote}
                onChange={(e) => setItemSpecialNote(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button onClick={addCustomizedItemToCart} className="w-full bg-blue-600 hover:bg-blue-700 font-bold">
              Add to Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal with Customer Loyalty */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t('completeOrder')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {/* Customer Lookup & Loyalty */}
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-900 space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-blue-900 dark:text-blue-300">
                  Customer Loyalty
                </Label>
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(true)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  + Add New Customer
                </button>
              </div>

              {selectedCustomer ? (
                <div className="space-y-2 bg-white dark:bg-gray-800 p-2.5 rounded border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{selectedCustomer.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selectedCustomer.phone || 'No phone'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                        {selectedCustomer.loyaltyPoints} pts
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null)
                          setOrderDetails(prev => ({ ...prev, customerName: '' }))
                        }}
                        className="block text-[10px] text-red-500 hover:underline mt-1 ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Cashier Apple Wallet pass share action */}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Apple Wallet:</span>
                    <AppleWalletButton
                      customerId={selectedCustomer.id}
                      customerName={selectedCustomer.name}
                      buttonText="Show Pass QR"
                      className="py-1 px-3 text-xs rounded-xl shadow-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    placeholder="Search customer by name or phone..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="text-xs h-9 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  />
                  {customerResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-lg max-h-40 overflow-y-auto">
                      {customerResults.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomer(c)
                            setOrderDetails(prev => ({ ...prev, customerName: c.name }))
                            setCustomerSearch('')
                            setCustomerResults([])
                          }}
                          className="p-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/40 cursor-pointer flex justify-between border-b border-gray-200 dark:border-gray-700 last:border-0"
                        >
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">{c.name}</span>
                            {c.phone && <span className="text-gray-400 ml-2">({c.phone})</span>}
                          </div>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{c.loyaltyPoints} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {selectedCustomer && (
                <div className="mt-2 p-2 bg-blue-50/60 dark:bg-blue-950/40 rounded-lg border border-blue-100 dark:border-blue-900/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Redeem Points
                    </span>
                    <span className="text-[11px] text-blue-700 dark:text-blue-400 font-bold">
                      {selectedCustomer.loyaltyPoints} pts (${(selectedCustomer.loyaltyPoints / 100).toFixed(2)})
                    </span>
                  </div>
                  {selectedCustomer.loyaltyPoints >= 100 ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {[100, 200, 500].filter(pts => pts <= selectedCustomer.loyaltyPoints).map(pts => (
                        <button
                          key={pts}
                          type="button"
                          onClick={() => setRedeemedPoints(redeemedPoints === pts ? 0 : pts)}
                          className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors ${
                            redeemedPoints === pts
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100/50'
                          }`}
                        >
                          {pts} pts (-${(pts / 100).toFixed(2)})
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const maxPts = Math.min(
                            Math.floor(selectedCustomer.loyaltyPoints / 100) * 100,
                            Math.floor(rawSubtotal) * 100
                          )
                          setRedeemedPoints(redeemedPoints === maxPts ? 0 : maxPts)
                        }}
                        className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors ${
                          redeemedPoints > 500 || (redeemedPoints > 0 && redeemedPoints === Math.min(Math.floor(selectedCustomer.loyaltyPoints / 100) * 100, Math.floor(rawSubtotal) * 100))
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100/50'
                        }`}
                      >
                        Max ({Math.min(Math.floor(selectedCustomer.loyaltyPoints / 100) * 100, Math.floor(rawSubtotal) * 100)} pts)
                      </button>
                      {redeemedPoints > 0 && (
                        <button
                          type="button"
                          onClick={() => setRedeemedPoints(0)}
                          className="text-[10px] text-red-500 hover:underline ml-1"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Minimum 100 points required to redeem.
                    </p>
                  )}
                </div>
              )}

              {selectedCustomer && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>This customer will earn +{Math.max(1, Math.floor(grandTotal))} loyalty points on this order!</span>
                </p>
              )}
            </div>

            {/* Staff Selector */}
            <div>
              <Label className="text-xs font-semibold">{t('staffMember')}</Label>
              <Select
                value={orderDetails.staffId}
                onValueChange={(val) => setOrderDetails(prev => ({ ...prev, staffId: val }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('selectStaff')} />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div>
              <Label className="text-xs font-semibold">{t('paymentMethod')}</Label>
              <Select
                value={orderDetails.paymentMethod}
                onValueChange={(val) => setOrderDetails(prev => ({ ...prev, paymentMethod: val }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('selectPaymentMethod')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <span className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-emerald-500" />
                      <span>{t('cash')}</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="card">
                    <span className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-500" />
                      <span>{t('card')}</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="mobile">
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-purple-500" />
                      <span>{t('mobilePayment')}</span>
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Promo Voucher / Coupon Code */}
            <div>
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                Promo Code / Voucher
              </Label>
              {appliedPromo ? (
                <div className="mt-1 flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-md">
                  <div className="flex items-center gap-2">
                    <span className="bg-purple-600 text-white font-mono text-xs px-2 py-0.5 rounded font-bold">{appliedPromo}</span>
                    <span className="text-xs text-purple-800 dark:text-purple-300 font-medium">
                      Applied (-${promoDiscount.toFixed(2)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-[11px] text-red-500 hover:underline font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-1 mt-1">
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="e.g. WELCOME10, SUMMER20, VIP15, COFFEE5"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase())
                        if (promoError) setPromoError(null)
                      }}
                      className="text-xs font-mono h-9 uppercase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyPromo}
                      className="h-9 px-3 text-xs font-bold shrink-0 border-purple-200 text-purple-700 dark:text-purple-300 hover:bg-purple-50"
                    >
                      Apply
                    </Button>
                  </div>
                  {promoError && (
                    <p className="text-[10px] text-red-500 font-medium">{promoError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Table Number */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">{t('tableNumber')} ({tCommon('optional')})</Label>
                <Input
                  type="number"
                  placeholder="e.g. 5"
                  value={orderDetails.tableNumber}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, tableNumber: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Walk-in Name ({tCommon('optional')})</Label>
                <Input
                  placeholder="Guest name"
                  value={orderDetails.customerName}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, customerName: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs font-semibold">{t('notes')} ({tCommon('optional')})</Label>
              <Input
                placeholder="Kitchen notes, allergy alerts..."
                value={orderDetails.notes}
                onChange={(e) => setOrderDetails(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1"
              />
            </div>

            {/* Order Summary & Complete Button */}
            <div className="border-t dark:border-gray-700 pt-3 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal:</span>
                <span>${rawSubtotal.toFixed(2)}</span>
              </div>
              {manualDiscount > 0 && (
                <div className="flex justify-between text-xs text-green-600">
                  <span>Cart Discount:</span>
                  <span>-${manualDiscount.toFixed(2)}</span>
                </div>
              )}
              {promoDiscount > 0 && (
                <div className="flex justify-between text-xs text-purple-600 dark:text-purple-400">
                  <span>Promo Discount ({appliedPromo}):</span>
                  <span>-${promoDiscount.toFixed(2)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                  <span>Points Redeemed ({redeemedPoints} pts):</span>
                  <span>-${pointsDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-gray-500">
                <span>VAT (15%):</span>
                <span>+${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold border-t dark:border-gray-700 pt-2">
                <span>{t('total')}:</span>
                <span className="text-blue-600 dark:text-blue-400">${grandTotal.toFixed(2)}</span>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSplitBillOpen(true)}
                  className="flex-1 border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold gap-1.5 h-11 text-xs"
                >
                  <Divide className="w-4 h-4" />
                  <span>Split Bill</span>
                </Button>
                <Button
                  onClick={handleCheckout}
                  className="flex-[2] bg-green-600 hover:bg-green-700 h-11 text-base font-bold"
                >
                  {t('completeOrder')} • ${grandTotal.toFixed(2)}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Split Bill & Multi-Tender Modal */}
      <SplitBillModal
        isOpen={isSplitBillOpen}
        onClose={() => setIsSplitBillOpen(false)}
        totalAmount={grandTotal}
        onCompleteSplit={(splits) => {
          const summary = splits.map((s, i) => `Guest ${i + 1}: $${s.amount.toFixed(2)} (${s.method})`).join(', ')
          setOrderDetails(prev => ({
            ...prev,
            paymentMethod: 'split',
            notes: prev.notes ? `${prev.notes} | Split: ${summary}` : `Split: ${summary}`
          }))
          handleCheckout()
        }}
      />

      {/* Quick Add Customer Modal */}
      <Dialog open={isNewCustomerModalOpen} onOpenChange={setIsNewCustomerModalOpen}>
        <DialogContent className="max-w-sm dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle>Register Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs font-semibold">Name *</Label>
              <Input
                placeholder="Customer full name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Phone Number</Label>
              <Input
                placeholder="e.g. +1 555-0192"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Email</Label>
              <Input
                type="email"
                placeholder="customer@email.com"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleCreateCustomer}
              disabled={!newCustomer.name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 font-bold"
            >
              Save Customer & Select
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Thermal Receipt Print Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={lastReceipt}
        onPrintKot={() => setIsKotOpen(true)}
      />

      {/* Kitchen & Barista Order Ticket (KOT) Modal */}
      <KitchenTicketModal
        isOpen={isKotOpen}
        onClose={() => setIsKotOpen(false)}
        ticket={kotTicketData}
      />
    </div>
  )
}
