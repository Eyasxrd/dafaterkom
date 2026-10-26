'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/lib/store'
import ReceiptModal, { ReceiptData } from '@/components/ReceiptModal'
import KitchenTicketModal, { KitchenTicketData } from '@/components/KitchenTicketModal'
import PrinterSettingsModal from '@/components/PrinterSettingsModal'
import AppleWalletButton from '@/components/loyalty/AppleWalletButton'
import SplitBillModal from '@/components/SplitBillModal'
import { offlineStore } from '@/lib/sync/offline-store'
import { syncEngine } from '@/lib/sync/sync-engine'
import { formatCurrency, getCurrencySymbol } from '@/lib/currency'
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
  Printer,
  CheckCircle2,
  Phone,
  LayoutGrid,
  UserCheck,
  Milk,
  Sandwich,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import {
  parseItemCustomization,
  SelectedOption,
  formatModifiersSummary,
  ItemCustomizationConfig,
  DEFAULT_DRINK_SIZES,
  DEFAULT_FOOD_PORTIONS,
  DEFAULT_ICE_LEVELS,
  DEFAULT_SWEETNESS_LEVELS
} from '@/lib/item-customization'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  categoryId: string
  category: { name: string }
  isAvailable: boolean
  options?: string | null
  variants?: string | null
  inventory?: { quantity: number; lowStockThreshold: number } | null
  recipes?: {
    quantity: number
    ingredient: { name: string; quantity: number; unit: string; lowStockThreshold: number }
  }[]
}

interface CartItem {
  cartId: string
  menuItem: MenuItem
  quantity: number
  unitPrice: number
  subtotal: number
  modifiersSummary?: string
  isPromoGift?: boolean
  selectedOptions?: SelectedOption[]
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
  dateOfBirth?: string | null
  loyaltyPoints: number
}

export default function PointOfSale() {
  const { user } = useAuthStore()
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'
  const t = useTranslations('pos')
  const tCommon = useTranslations('common')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [itemSearch, setItemSearch] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Category slider & mouse drag scroll state
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeftState, setScrollLeftState] = useState(0)
  const [hasMoved, setHasMoved] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollability = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current
      setCanScrollLeft(scrollLeft > 2)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2)
    }
  }

  useEffect(() => {
    checkScrollability()
    const handleResize = () => checkScrollability()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [categories, menuItems])

  useEffect(() => {
    const el = categoryScrollRef.current
    if (!el) return
    const onWheelNative = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        el.scrollLeft += e.deltaY * 0.9
        checkScrollability()
      }
    }
    el.addEventListener('wheel', onWheelNative, { passive: false })
    return () => el.removeEventListener('wheel', onWheelNative)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!categoryScrollRef.current) return
    setIsDragging(true)
    setHasMoved(false)
    setStartX(e.pageX - categoryScrollRef.current.offsetLeft)
    setScrollLeftState(categoryScrollRef.current.scrollLeft)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !categoryScrollRef.current) return
    e.preventDefault()
    const x = e.pageX - categoryScrollRef.current.offsetLeft
    const walk = (x - startX) * 1.5
    if (Math.abs(walk) > 4) {
      setHasMoved(true)
    }
    categoryScrollRef.current.scrollLeft = scrollLeftState - walk
    checkScrollability()
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setTimeout(() => setHasMoved(false), 50)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const amount = direction === 'left' ? -240 : 240
      categoryScrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
      setTimeout(checkScrollability, 300)
    }
  }

  // Customization state
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null)
  const [selectedSizeId, setSelectedSizeId] = useState<string>('')
  const [itemSize, setItemSize] = useState<string>('Regular')
  const [itemTemperature, setItemTemperature] = useState<string>('hot')
  const [itemIceLevel, setItemIceLevel] = useState<string>('Regular Ice')
  const [selectedCoffeeOption, setSelectedCoffeeOption] = useState<string>('House Espresso Blend')
  const [selectedMilkOption, setSelectedMilkOption] = useState<string>('Whole Milk')
  const [selectedSweetenerOption, setSelectedSweetenerOption] = useState<string>('White Sugar')
  const [itemSugar, setItemSugar] = useState<string>('Normal (100%)')
  const [itemExtraShot, setItemExtraShot] = useState<boolean>(false)
  const [selectedFoodModifiers, setSelectedFoodModifiers] = useState<Record<string, string>>({})
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
  const [isCompact, setIsCompact] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', dateOfBirth: '' })

  // Checkout & Receipt state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false)
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null)
  const [orderSuccessMessage, setOrderSuccessMessage] = useState<string | null>(null)

  // Loyalty redemption state
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0)

  // Promo Coupon state
  const [promoInput, setPromoInput] = useState<string>('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [appliedPromoData, setAppliedPromoData] = useState<any | null>(null)
  const [isCheckingPromo, setIsCheckingPromo] = useState<boolean>(false)
  const [promoError, setPromoError] = useState<string | null>(null)

  // KOT Ticket state
  const [isKotOpen, setIsKotOpen] = useState(false)
  const [kotTicketData, setKotTicketData] = useState<KitchenTicketData | null>(null)

  // Hardware Printer Configuration Modal state
  const [isPrinterSettingsOpen, setIsPrinterSettingsOpen] = useState(false)

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
    const config = parseItemCustomization(menuItem.options)

    if (config.itemType === 'drink' && config.drinkConfig) {
      const sizes = config.drinkConfig.sizes && config.drinkConfig.sizes.length > 0 ? config.drinkConfig.sizes : DEFAULT_DRINK_SIZES
      const defSize = sizes.find(s => s.isDefault) || sizes[0]
      setSelectedSizeId(defSize?.id || 'size_s')
      setItemSize(defSize?.name || 'Small')

      const temps = config.drinkConfig.temperatureOptions && config.drinkConfig.temperatureOptions.length > 0 ? config.drinkConfig.temperatureOptions : ['hot', 'iced']
      setItemTemperature(temps[0] || 'hot')

      const ices = config.drinkConfig.iceLevels && config.drinkConfig.iceLevels.length > 0 ? config.drinkConfig.iceLevels : ['Regular Ice']
      setItemIceLevel(ices[0] || 'Regular Ice')

      const defaultBean = config.drinkConfig.coffeeOptions?.find(c => c.isDefault) || config.drinkConfig.coffeeOptions?.[0]
      setSelectedCoffeeOption(defaultBean?.name || 'House Espresso Blend')
      const defaultMilk = config.drinkConfig.milkOptions?.find(m => m.isDefault) || config.drinkConfig.milkOptions?.[0]
      setSelectedMilkOption(defaultMilk?.name || 'Whole Milk')
      const defaultSweetener = config.drinkConfig.sweetenerOptions?.find(s => s.isDefault) || config.drinkConfig.sweetenerOptions?.[0]
      setSelectedSweetenerOption(defaultSweetener?.name || 'White Sugar')
    } else if (config.itemType === 'food' && config.foodConfig) {
      const portions = config.foodConfig.portions && config.foodConfig.portions.length > 0 ? config.foodConfig.portions : DEFAULT_FOOD_PORTIONS
      const defPortion = portions.find(p => p.isDefault) || portions[0]
      setSelectedSizeId(defPortion?.id || 'portion_regular')
      setItemSize(defPortion?.name || 'Regular')

      if (config.foodConfig.modifierGroups) {
        const initialFoodMods: Record<string, string> = {}
        config.foodConfig.modifierGroups.forEach(g => {
          const defOpt = g.options.find(o => o.isDefault) || g.options[0]
          if (defOpt) initialFoodMods[g.id] = defOpt.id
        })
        setSelectedFoodModifiers(initialFoodMods)
      } else {
        setSelectedFoodModifiers({})
      }
    } else {
      setSelectedSizeId('standard')
      setItemSize('Standard')
      setSelectedFoodModifiers({})
    }

    setItemSugar('100% Normal')
    setItemExtraShot(false)
    setItemSpecialNote('')
  }

  // Add Customized Item to Cart
  const addCustomizedItemToCart = () => {
    if (!customizingItem) return
    const config = parseItemCustomization(customizingItem.options)
    const selectedOptions: SelectedOption[] = []
    let extraPrice = 0

    if (config.itemType === 'drink' && config.drinkConfig) {
      const sizes = config.drinkConfig.sizes && config.drinkConfig.sizes.length > 0 ? config.drinkConfig.sizes : DEFAULT_DRINK_SIZES
      const matchedSize = sizes.find(s => s.id === selectedSizeId || s.name === itemSize) || sizes[0]
      if (matchedSize) {
        if (matchedSize.extraPrice) extraPrice += matchedSize.extraPrice
        selectedOptions.push({
          groupName: 'Size',
          optionName: `${matchedSize.name} (${matchedSize.volumeMl}ml)`,
          extraPrice: matchedSize.extraPrice,
          quantityDeducted: matchedSize.ingredientMultiplier || 1.0
        })
      }

      // Temperature
      selectedOptions.push({
        groupName: 'Temperature',
        optionName: itemTemperature === 'hot' ? 'Hot 🔥' : itemTemperature === 'iced' ? 'Iced ❄️' : itemTemperature === 'blended' ? 'Blended 🥤' : 'Room Temp 🌡️'
      })

      // Link Packaging Cup & Lid based on Size and Temperature
      if (matchedSize) {
        const isHot = itemTemperature === 'hot' || itemTemperature === 'room_temp'
        const targetCupId = isHot
          ? (matchedSize.hotCupIngredientId || matchedSize.cupIngredientId)
          : (matchedSize.coldCupIngredientId || matchedSize.cupIngredientId)
        const targetCupName = isHot
          ? (matchedSize.hotCupIngredientName || matchedSize.cupIngredientName || 'Hot Cup')
          : (matchedSize.coldCupIngredientName || matchedSize.cupIngredientName || 'Cold Cup')

        if (targetCupId) {
          selectedOptions.push({
            groupName: 'Packaging Cup',
            optionName: targetCupName,
            ingredientId: targetCupId,
            quantityDeducted: 1,
            unit: 'pieces'
          })
        }

        const targetLidId = isHot
          ? (matchedSize.hotLidIngredientId || matchedSize.lidIngredientId)
          : (matchedSize.coldLidIngredientId || matchedSize.lidIngredientId)
        const targetLidName = isHot
          ? (matchedSize.hotLidIngredientName || matchedSize.lidIngredientName || 'Hot Lid')
          : (matchedSize.coldLidIngredientName || matchedSize.lidIngredientName || 'Cold Lid')

        if (targetLidId) {
          selectedOptions.push({
            groupName: 'Packaging Lid',
            optionName: targetLidName,
            ingredientId: targetLidId,
            quantityDeducted: 1,
            unit: 'pieces'
          })
        }
      }

      // Ice Level if iced or blended
      if (itemTemperature === 'iced' || itemTemperature === 'blended') {
        selectedOptions.push({
          groupName: 'Ice',
          optionName: itemIceLevel
        })
      }

      if (config.drinkConfig.isCoffeeBased) {
        const matchedBean = config.drinkConfig.coffeeOptions.find(c => c.name === selectedCoffeeOption)
        if (matchedBean) {
          if (matchedBean.extraPrice) extraPrice += matchedBean.extraPrice

          // Check if item recipe has cup size scaling
          let deducedCoffeeQty: number | null = null
          const matchedRecipe = (customizingItem.recipes as any[])?.find(r =>
            r.ingredient?.name?.toLowerCase().includes('bean') ||
            r.ingredient?.name?.toLowerCase().includes('espresso') ||
            r.ingredient?.name?.toLowerCase().includes('coffee')
          )

          if (matchedRecipe?.sizeMultipliers) {
            try {
              const multipliers = typeof matchedRecipe.sizeMultipliers === 'string'
                ? JSON.parse(matchedRecipe.sizeMultipliers)
                : matchedRecipe.sizeMultipliers
              const sName = (matchedSize?.name || '').toLowerCase()
              const sKey = sName.includes('extra') || sName.includes('xl')
                ? 'XL'
                : sName.includes('large') || sName.includes('lg')
                ? 'L'
                : sName.includes('small') || sName.includes('sm')
                ? 'S'
                : 'M'
              if (multipliers[sKey] !== undefined) {
                deducedCoffeeQty = parseFloat(multipliers[sKey])
              }
            } catch {}
          }

          if (deducedCoffeeQty === null) {
            deducedCoffeeQty = (matchedBean.doseGrams || 18) * (matchedSize?.ingredientMultiplier || 1.0)
          }

          selectedOptions.push({
            groupName: 'Coffee Bean',
            optionName: matchedBean.name,
            ingredientId: matchedBean.ingredientId || matchedRecipe?.ingredient?.id || matchedRecipe?.ingredientId,
            ingredientName: matchedBean.name,
            quantityDeducted: Math.round(deducedCoffeeQty * 10) / 10,
            unit: 'grams',
            extraPrice: matchedBean.extraPrice
          })
        }
      }

      if (config.drinkConfig.isMilkBased) {
        const matchedMilk = config.drinkConfig.milkOptions.find(m => m.name === selectedMilkOption)
        if (matchedMilk) {
          if (matchedMilk.extraPrice) extraPrice += matchedMilk.extraPrice

          // Check if this item has a recipe for this milk with cup size scaling
          let deducedMilkQty: number | null = null
          const matchedRecipe = (customizingItem.recipes as any[])?.find(r =>
            r.ingredient?.name?.toLowerCase().includes(matchedMilk.name.toLowerCase()) ||
            matchedMilk.name.toLowerCase().includes(r.ingredient?.name?.toLowerCase())
          )

          if (matchedRecipe) {
            if (matchedRecipe.sizeMultipliers) {
              try {
                const multipliers = typeof matchedRecipe.sizeMultipliers === 'string'
                  ? JSON.parse(matchedRecipe.sizeMultipliers)
                  : matchedRecipe.sizeMultipliers
                const sName = (matchedSize?.name || '').toLowerCase()
                const sKey = sName.includes('extra') || sName.includes('xl')
                  ? 'XL'
                  : sName.includes('large') || sName.includes('lg')
                  ? 'L'
                  : sName.includes('small') || sName.includes('sm')
                  ? 'S'
                  : 'M'
                if (multipliers[sKey] !== undefined) {
                  deducedMilkQty = parseFloat(multipliers[sKey])
                }
              } catch {}
            }
            if (deducedMilkQty === null && matchedRecipe.quantity) {
              deducedMilkQty = matchedRecipe.quantity * (matchedSize?.ingredientMultiplier || 1.0)
            }
          }

          // If no recipe override, use cup volume or matched milk volume
          if (deducedMilkQty === null) {
            if (matchedSize?.volumeMl && matchedSize.volumeMl > 0) {
              // Milk cannot exceed the cup size
              const espressoDose = config.drinkConfig.isCoffeeBased ? 30 : 0
              const remainingCupSpace = Math.max(10, matchedSize.volumeMl - espressoDose)
              deducedMilkQty = Math.min(remainingCupSpace, matchedMilk.volumeMl || remainingCupSpace)
            } else {
              deducedMilkQty = (matchedMilk.volumeMl || 220) * (matchedSize?.ingredientMultiplier || 1.0)
            }
          }

          selectedOptions.push({
            groupName: 'Milk',
            optionName: matchedMilk.name,
            ingredientId: matchedMilk.ingredientId || matchedRecipe?.ingredient?.id || matchedRecipe?.ingredientId,
            ingredientName: matchedMilk.name,
            quantityDeducted: Math.round(deducedMilkQty * 10) / 10,
            unit: 'ml',
            extraPrice: matchedMilk.extraPrice
          })
        }
      }

      const isZeroSugar = itemSugar.includes('0%') || itemSugar.toLowerCase().includes('sugar free')
      if (itemSugar && itemSugar !== '100% Normal') {
        selectedOptions.push({
          groupName: 'Sweetness',
          optionName: itemSugar
        })
      }

      if (!isZeroSugar && config.drinkConfig.sweetenerOptions && config.drinkConfig.sweetenerOptions.length > 0) {
        const matchedSweetener = config.drinkConfig.sweetenerOptions.find(s => s.name === selectedSweetenerOption)
        if (matchedSweetener) {
          if (matchedSweetener.extraPrice) extraPrice += matchedSweetener.extraPrice

          let factor = 1.0
          if (itemSugar.includes('25%')) factor = 0.25
          else if (itemSugar.includes('50%')) factor = 0.50
          else if (itemSugar.includes('75%')) factor = 0.75
          else if (itemSugar.includes('120%')) factor = 1.20

          const qtyToDeduct = Math.round((matchedSweetener.quantityPerServing || 10) * factor * 10) / 10

          selectedOptions.push({
            groupName: 'Sweetener',
            optionName: `${matchedSweetener.name} (${itemSugar})`,
            ingredientId: matchedSweetener.ingredientId,
            ingredientName: matchedSweetener.name,
            quantityDeducted: qtyToDeduct,
            unit: matchedSweetener.unit || 'g',
            extraPrice: matchedSweetener.extraPrice
          })
        }
      }

      if (itemExtraShot && config.drinkConfig.allowExtraShot) {
        const shotPrice = config.drinkConfig.extraShotPrice || 1.00
        extraPrice += shotPrice
        selectedOptions.push({
          groupName: 'Add-on',
          optionName: 'Extra Espresso Shot',
          quantityDeducted: 18,
          unit: 'grams',
          extraPrice: shotPrice
        })
      }
    } else if (config.itemType === 'food' && config.foodConfig) {
      const portions = config.foodConfig.portions && config.foodConfig.portions.length > 0 ? config.foodConfig.portions : DEFAULT_FOOD_PORTIONS
      const matchedPortion = portions.find(p => p.id === selectedSizeId || p.name === itemSize) || portions[0]
      if (matchedPortion) {
        if (matchedPortion.extraPrice) extraPrice += matchedPortion.extraPrice
        selectedOptions.push({
          groupName: 'Portion',
          optionName: `${matchedPortion.name}${matchedPortion.weightGrams ? ` (${matchedPortion.weightGrams}g)` : ''}`,
          extraPrice: matchedPortion.extraPrice,
          quantityDeducted: matchedPortion.ingredientMultiplier || 1.0
        })

        if (matchedPortion.packagingIngredientId) {
          selectedOptions.push({
            groupName: 'Packaging Box',
            optionName: matchedPortion.packagingIngredientName || 'Box Container',
            ingredientId: matchedPortion.packagingIngredientId,
            quantityDeducted: 1,
            unit: 'pieces'
          })
        }

        if (matchedPortion.secondaryPackagingIngredientId) {
          selectedOptions.push({
            groupName: 'Packaging Bag',
            optionName: matchedPortion.secondaryPackagingIngredientName || 'Bag / Wrap',
            ingredientId: matchedPortion.secondaryPackagingIngredientId,
            quantityDeducted: 1,
            unit: 'pieces'
          })
        }
      }

      if (config.foodConfig.modifierGroups) {
        config.foodConfig.modifierGroups.forEach(g => {
          const selectedOptId = selectedFoodModifiers[g.id]
          const opt = g.options.find(o => o.id === selectedOptId)
          if (opt) {
            if (opt.extraPrice) extraPrice += opt.extraPrice
            selectedOptions.push({
              groupId: g.id,
              groupName: g.name,
              optionId: opt.id,
              optionName: opt.name,
              ingredientId: opt.ingredientId,
              ingredientName: opt.name,
              quantityDeducted: opt.quantityDeducted,
              unit: opt.unit,
              extraPrice: opt.extraPrice
            })
          }
        })
      }
    }

    if (itemSpecialNote.trim()) {
      selectedOptions.push({
        groupName: 'Note',
        optionName: itemSpecialNote.trim()
      })
    }

    const modifiersSummary = formatModifiersSummary(selectedOptions)
    const unitPrice = customizingItem.price + extraPrice
    const cartId = `${customizingItem.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`

    setCart(prevCart => [
      ...prevCart,
      {
        cartId,
        menuItem: customizingItem,
        quantity: 1,
        unitPrice,
        subtotal: unitPrice,
        modifiersSummary,
        selectedOptions
      }
    ])

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
    if (appliedPromoData) {
      if (appliedPromoData.discountType === 'percentage' && appliedPromoData.discountPercent) {
        promoDiscount = Math.round((rawSubtotal * (appliedPromoData.discountPercent / 100)) * 100) / 100
        if (appliedPromoData.maxDiscount && promoDiscount > appliedPromoData.maxDiscount) {
          promoDiscount = appliedPromoData.maxDiscount
        }
      } else if (appliedPromoData.discountType === 'fixed_amount' && appliedPromoData.discountAmount) {
        promoDiscount = Math.min(rawSubtotal, appliedPromoData.discountAmount)
      } else if (appliedPromoData.discountType === 'free_item') {
        promoDiscount = 0
      }
    } else {
      if (appliedPromo === 'WELCOME10') promoDiscount = Math.round((rawSubtotal * 0.10) * 100) / 100
      else if (appliedPromo === 'SUMMER20') promoDiscount = Math.round((rawSubtotal * 0.20) * 100) / 100
      else if (appliedPromo === 'VIP15') promoDiscount = Math.round((rawSubtotal * 0.15) * 100) / 100
      else if (appliedPromo === 'HAPPYHOUR') promoDiscount = Math.round((rawSubtotal * 0.25) * 100) / 100
      else if (appliedPromo === 'COFFEE5') promoDiscount = Math.min(5.00, rawSubtotal)
    }
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

  const handleApplyPromo = async () => {
    setPromoError(null)
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    setIsCheckingPromo(true)

    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal: rawSubtotal })
      })
      const data = await res.json()

      if (!res.ok || !data.valid) {
        setPromoError(data.error || 'Invalid or expired promo code')
        return
      }

      setAppliedPromo(code)
      setAppliedPromoData(data.promo)
      setPromoInput('')

      // If it's a free item promo, automatically add the complimentary gift item to the cart
      if (data.promo?.discountType === 'free_item' && data.freeItem) {
        const giftItem = data.freeItem
        setCart(prev => {
          const filtered = prev.filter(item => !item.isPromoGift)
          return [
            ...filtered,
            {
              cartId: `promo-gift-${giftItem.id}-${Date.now()}`,
              menuItem: {
                id: giftItem.id,
                name: giftItem.name,
                description: 'Complimentary Free Promo Item',
                price: 0,
                categoryId: giftItem.category?.id || '',
                category: { name: giftItem.category?.name || 'Promo Gift' },
                imageUrl: giftItem.imageUrl,
                isAvailable: true
              },
              quantity: 1,
              unitPrice: 0,
              subtotal: 0,
              modifiersSummary: `🎁 Free Promo Item (${code})`,
              isPromoGift: true
            }
          ]
        })
      }
    } catch (err) {
      console.error(err)
      setPromoError('Failed to validate promo code')
    } finally {
      setIsCheckingPromo(false)
    }
  }

  const handleRemovePromo = () => {
    setAppliedPromo(null)
    setAppliedPromoData(null)
    setPromoError(null)
    // Remove any complimentary promo gift items
    setCart(prev => prev.filter(item => !item.isPromoGift))
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
        setNewCustomer({ name: '', phone: '', email: '', dateOfBirth: '' })
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
        notes: item.modifiersSummary || null,
        isPromoGift: Boolean(item.isPromoGift),
        selectedOptions: item.selectedOptions || []
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
      currency: tenantInfo?.currency || 'USD',
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
    setOrderSuccessMessage(`Order #${receiptObj.orderNumber} completed successfully!`)
    setCart([])
    setIsCheckoutOpen(false)
    setDiscountValue('0')
    setRedeemedPoints(0)
    setAppliedPromo(null)
    setAppliedPromoData(null)
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

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.isAvailable) return false
    if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) return false
    if (itemSearch.trim()) {
      const q = itemSearch.toLowerCase().trim()
      const matchName = item.name.toLowerCase().includes(q)
      const matchDesc = item.description ? item.description.toLowerCase().includes(q) : false
      const matchCat = item.category?.name ? item.category.name.toLowerCase().includes(q) : false
      return matchName || matchDesc || matchCat
    }
    return true
  })

  if (loading) {
    return <div className="p-6">{tCommon('loading')}</div>
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fast orders, item customizations & instant receipt printing</p>
        </div>
        <Button
          onClick={() => setIsCheckoutOpen(true)}
          disabled={cart.length === 0}
          className="liquid-btn-primary h-11 px-6 font-bold gap-2 text-sm shadow-lg w-full sm:w-auto cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{t('checkout')} ({cart.length}) • ${grandTotal.toFixed(2)}</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Order Completed Success Banner */}
      {orderSuccessMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{orderSuccessMessage}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsReceiptOpen(true)}
              className="underline font-bold hover:text-emerald-700 dark:hover:text-white cursor-pointer"
            >
              Re-open Receipt
            </button>
            <button
              onClick={() => setOrderSuccessMessage(null)}
              className="p-1 hover:bg-emerald-500/20 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

      {/* Top Search & Category Controls Bar */}
      <div className="space-y-3 pb-3 border-b border-slate-200/60 dark:border-white/[0.08]">
        {/* Row 1: Search Bar & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              placeholder={t('searchPlaceholder') || 'Search menu items by name, category...'}
              className="pl-10 pr-9 h-10 text-xs sm:text-sm bg-white/70 dark:bg-white/[0.05] border-slate-200/70 dark:border-white/10 rounded-xl focus-visible:ring-blue-500 shadow-sm"
            />
            {itemSearch && (
              <button
                type="button"
                onClick={() => setItemSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode & Printer Controls */}
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPrinterSettingsOpen(true)}
              className="h-10 px-3 text-xs font-semibold rounded-xl gap-1.5 cursor-pointer bg-white/60 dark:bg-white/[0.05] border-slate-200/60 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
              title="Hardware Printer Settings (إعدادات الطابعات)"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Printers</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCompact(!isCompact)}
              className="h-10 px-3 text-xs font-semibold rounded-xl gap-1.5 cursor-pointer bg-white/60 dark:bg-white/[0.05] border-slate-200/60 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
              title={isCompact ? t('normalView') || 'Standard View' : t('compactView') || 'Compact View'}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{isCompact ? (t('normalView') || 'Standard View') : (t('compactView') || 'Compact View')}</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Category Slider Navigation with Left/Right Buttons & Mouse Drag */}
        <div className="relative flex items-center group">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              className="absolute left-0 z-10 h-8 w-8 rounded-xl bg-white/95 dark:bg-slate-900/95 shadow-md border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center -ml-1 cursor-pointer backdrop-blur-sm active:scale-95"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Horizontal Scrollable Category Pills */}
          <div
            ref={categoryScrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onScroll={checkScrollability}
            className={`flex items-center gap-2 overflow-x-auto py-1 scroll-smooth no-scrollbar w-full select-none cursor-grab active:cursor-grabbing transition-all ${
              canScrollLeft ? 'pl-8' : 'pl-0'
            } ${canScrollRight ? 'pr-8' : 'pr-0'}`}
          >
            <button
              type="button"
              onClick={() => {
                if (!hasMoved) setSelectedCategory('all')
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                  : 'bg-white/60 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10'
              }`}
            >
              {t('allCategories')} ({menuItems.length})
            </button>
            {categories.map((category) => {
              const count = menuItems.filter(m => m.categoryId === category.id).length
              const isSelected = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    if (!hasMoved) setSelectedCategory(category.id)
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                      : 'bg-white/60 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-white/10 border border-slate-200/60 dark:border-white/10'
                  }`}
                >
                  <span>{category.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Scroll Right Button */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="absolute right-0 z-10 h-8 w-8 rounded-xl bg-white/95 dark:bg-slate-900/95 shadow-md border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center -mr-1 cursor-pointer backdrop-blur-sm active:scale-95"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Items Grid */}
        <div className="lg:col-span-2">
          {filteredMenuItems.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-white/10 glass-panel flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {t('noItemsFound') || 'No menu items found'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                {itemSearch 
                  ? `No items matching "${itemSearch}". Try another search term or reset filters.`
                  : (t('noItemsFoundDesc') || 'No available items found in this category.')}
              </p>
              {(itemSearch || selectedCategory !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setItemSearch('')
                    setSelectedCategory('all')
                  }}
                  className="mt-4 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Reset Filters
                </Button>
              )}
            </div>
          ) : isCompact ? (
            /* Compact Mode Grid (Dense, Touch-Friendly, Fast Ordering) */
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredMenuItems.map((item) => {
                const directStock = item.inventory ? item.inventory.quantity : null
                const isDirectOut = directStock !== null && directStock <= 0
                const isDirectLow = directStock !== null && directStock > 0 && directStock <= (item.inventory?.lowStockThreshold ?? 5)

                const depletedIngredient = item.recipes?.find(r => r.ingredient.quantity <= 0)
                const isUnavailable = isDirectOut || !!depletedIngredient

                return (
                  <div
                    key={item.id}
                    onClick={() => !isUnavailable && addToCart(item)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isUnavailable
                        ? 'opacity-60 cursor-not-allowed bg-slate-100/60 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5'
                        : 'glass-card hover:border-blue-500/50 hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1 mb-1">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-1 leading-snug">
                          {item.name}
                        </span>
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-lg shrink-0">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                          {item.category.name}
                        </span>
                        {(() => {
                          const cfg = parseItemCustomization(item.options)
                          return (
                            <>
                              {cfg.itemType === 'drink' && cfg.drinkConfig?.isMilkBased && (
                                <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                                  Milk
                                </span>
                              )}
                              {cfg.itemType === 'drink' && cfg.drinkConfig?.isCoffeeBased && (
                                <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 shrink-0">
                                  Coffee
                                </span>
                              )}
                              {cfg.itemType === 'food' && (
                                <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                                  Food
                                </span>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-white/5">
                      <span className={`text-[10px] font-semibold ${
                        isUnavailable ? 'text-rose-500' : isDirectLow ? 'text-amber-500' : 'text-slate-400'
                      }`}>
                        {isUnavailable ? 'Out of stock' : isDirectLow ? `${directStock} left` : 'Available'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openCustomizer(item)
                          }}
                          disabled={isUnavailable}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                          title={t('customize')}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isUnavailable}
                          className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 shadow-sm"
                          title={t('addToOrder')}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Standard Mode Grid (Detailed Cards with Descriptions & Recipe info) */
            <div className="grid gap-4 md:grid-cols-2">
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
          )}
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
                    onClick={() => {
                      setCart([])
                      setAppliedPromo(null)
                      setAppliedPromoData(null)
                    }}
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{item.menuItem.name}</p>
                            {item.isPromoGift && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                                <Gift className="w-2.5 h-2.5" /> FREE GIFT
                              </span>
                            )}
                          </div>
                          {item.selectedOptions && item.selectedOptions.length > 0 ? (
                            <div className="flex flex-wrap gap-1 my-1">
                              {item.selectedOptions.map((opt, oIdx) => (
                                <span
                                  key={oIdx}
                                  className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60"
                                >
                                  {opt.groupName ? `${opt.groupName}: ` : ''}{opt.optionName}
                                  {opt.extraPrice && opt.extraPrice > 0 ? ` (+$${opt.extraPrice.toFixed(2)})` : ''}
                                </span>
                              ))}
                            </div>
                          ) : item.modifiersSummary ? (
                            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                              {item.modifiersSummary}
                            </p>
                          ) : null}
                          <p className="text-xs text-slate-400">
                            {item.isPromoGift ? (
                              <span className="text-emerald-500 font-semibold">$0.00 (Promo Item)</span>
                            ) : (
                              `$${item.unitPrice.toFixed(2)} each`
                            )}
                          </p>
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
        <DialogContent className="max-w-md dark:bg-gray-800 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
          {(() => {
            const config = parseItemCustomization(customizingItem?.options)
            const isDrink = config.itemType === 'drink'
            const isFood = config.itemType === 'food'
            const isCoffee = isDrink && config.drinkConfig?.isCoffeeBased
            const isMilk = isDrink && config.drinkConfig?.isMilkBased

            // Live pricing preview in modal
            let previewExtra = 0
            if (isDrink && config.drinkConfig) {
              const sizes = config.drinkConfig.sizes && config.drinkConfig.sizes.length > 0 ? config.drinkConfig.sizes : DEFAULT_DRINK_SIZES
              const matchedSize = sizes.find(s => s.id === selectedSizeId || s.name === itemSize) || sizes[0]
              if (matchedSize?.extraPrice) previewExtra += matchedSize.extraPrice

              if (isCoffee) {
                const b = config.drinkConfig.coffeeOptions.find(c => c.name === selectedCoffeeOption)
                if (b?.extraPrice) previewExtra += b.extraPrice
              }
              if (isMilk) {
                const m = config.drinkConfig.milkOptions.find(x => x.name === selectedMilkOption)
                if (m?.extraPrice) previewExtra += m.extraPrice
              }
              if (config.drinkConfig.sweetenerOptions && !itemSugar.includes('0%') && !itemSugar.toLowerCase().includes('sugar free')) {
                const sw = config.drinkConfig.sweetenerOptions.find(s => s.name === selectedSweetenerOption)
                if (sw?.extraPrice) previewExtra += sw.extraPrice
              }
              if (itemExtraShot && config.drinkConfig.allowExtraShot) {
                previewExtra += (config.drinkConfig.extraShotPrice || 1.0)
              }
            } else if (isFood && config.foodConfig) {
              const portions = config.foodConfig.portions && config.foodConfig.portions.length > 0 ? config.foodConfig.portions : DEFAULT_FOOD_PORTIONS
              const matchedPortion = portions.find(p => p.id === selectedSizeId || p.name === itemSize) || portions[0]
              if (matchedPortion?.extraPrice) previewExtra += matchedPortion.extraPrice

              if (config.foodConfig.modifierGroups) {
                config.foodConfig.modifierGroups.forEach(g => {
                  const optId = selectedFoodModifiers[g.id]
                  const opt = g.options.find(o => o.id === optId)
                  if (opt?.extraPrice) previewExtra += opt.extraPrice
                })
              }
            }
            const previewTotal = (customizingItem?.price || 0) + previewExtra

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center justify-between text-base font-bold">
                    <span>Customize: {customizingItem?.name}</span>
                    <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                      ${previewTotal.toFixed(2)}
                    </span>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  {/* Drink Sizes or Food Portions */}
                  {isDrink && config.drinkConfig && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Beverage Size (Volume in ml)</span>
                        <span className="text-[10px] text-slate-400">Select serving size</span>
                      </Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {(config.drinkConfig.sizes && config.drinkConfig.sizes.length > 0 ? config.drinkConfig.sizes : DEFAULT_DRINK_SIZES).map((size) => {
                          const isSelected = selectedSizeId === size.id || itemSize === size.name
                          return (
                            <Button
                              key={size.id}
                              type="button"
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedSizeId(size.id)
                                setItemSize(size.name)
                              }}
                              className={`h-11 flex flex-col items-center justify-center p-1 text-xs cursor-pointer ${
                                isSelected ? 'bg-blue-600 text-white font-bold' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="truncate">{size.name}</span>
                              <span className="text-[10px] opacity-80 font-mono">
                                {size.volumeMl}ml {size.extraPrice ? `(+$${size.extraPrice.toFixed(2)})` : ''}
                              </span>
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Food Portions */}
                  {isFood && config.foodConfig && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                        <span>Portion / Serving Size</span>
                        <span className="text-[10px] text-slate-400">Select portion</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(config.foodConfig.portions && config.foodConfig.portions.length > 0 ? config.foodConfig.portions : DEFAULT_FOOD_PORTIONS).map((portion) => {
                          const isSelected = selectedSizeId === portion.id || itemSize === portion.name
                          return (
                            <Button
                              key={portion.id}
                              type="button"
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setSelectedSizeId(portion.id)
                                setItemSize(portion.name)
                              }}
                              className={`h-10 flex items-center justify-between px-3 text-xs cursor-pointer ${
                                isSelected ? 'bg-amber-600 text-white font-bold' : 'text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="truncate">{portion.name}</span>
                              <span className="text-[10px] opacity-80 font-mono">
                                {portion.weightGrams ? `${portion.weightGrams}g ` : ''}{portion.extraPrice ? `(+$${portion.extraPrice.toFixed(2)})` : ''}
                              </span>
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Temperature Selection (For drinks) */}
                  {isDrink && config.drinkConfig && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Temperature</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {(config.drinkConfig.temperatureOptions && config.drinkConfig.temperatureOptions.length > 0
                          ? config.drinkConfig.temperatureOptions
                          : ['hot', 'iced']
                        ).map((temp) => (
                          <Button
                            key={temp}
                            type="button"
                            variant={itemTemperature === temp ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setItemTemperature(temp)}
                            className={`h-8 text-xs font-semibold ${
                              itemTemperature === temp ? 'bg-blue-600 text-white' : ''
                            }`}
                          >
                            {temp === 'hot' ? '🔥 Hot' : temp === 'iced' ? '❄️ Iced' : temp === 'blended' ? '🥤 Blended' : '🌡️ Room'}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ice Level (Only when iced/blended) */}
                  {isDrink && (itemTemperature === 'iced' || itemTemperature === 'blended') && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Ice Level</Label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {(config.drinkConfig?.iceLevels || DEFAULT_ICE_LEVELS).map((ice) => (
                          <Button
                            key={ice}
                            type="button"
                            variant={itemIceLevel === ice ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setItemIceLevel(ice)}
                            className={`h-7 text-[11px] font-semibold ${
                              itemIceLevel === ice ? 'bg-cyan-600 text-white' : ''
                            }`}
                          >
                            {ice}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Coffee Bean Selection (Only for coffee-based drinks) */}
                  {isCoffee && config.drinkConfig?.coffeeOptions && config.drinkConfig.coffeeOptions.length > 0 && (
                    <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-2">
                      <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5 text-blue-600" />
                        <span>Coffee Bean Roast / Blend</span>
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {config.drinkConfig.coffeeOptions.map((bean) => (
                          <Button
                            key={bean.name}
                            type="button"
                            variant={selectedCoffeeOption === bean.name ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCoffeeOption(bean.name)}
                            className={`h-8 text-xs font-semibold justify-start ${
                              selectedCoffeeOption === bean.name
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="truncate">{bean.name}</span>
                            {bean.extraPrice ? <span className="ml-auto text-[10px] opacity-80">(+${bean.extraPrice.toFixed(2)})</span> : null}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milk Options (Only for milk-based drinks) */}
                  {isMilk && config.drinkConfig?.milkOptions && config.drinkConfig.milkOptions.length > 0 && (
                    <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 space-y-2">
                      <Label className="text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <Milk className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Milk Selection (Deducted from Inventory)</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {config.drinkConfig.milkOptions.map((milk) => (
                          <Button
                            key={milk.name}
                            type="button"
                            variant={selectedMilkOption === milk.name ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedMilkOption(milk.name)}
                            className={`h-8 text-xs font-semibold ${
                              selectedMilkOption === milk.name
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <span className="truncate">{milk.name}</span>
                            {milk.extraPrice ? <span className="ml-1 text-[10px] opacity-80">(+${milk.extraPrice.toFixed(2)})</span> : null}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sugar / Sweetener Selection (For drinks) */}
                  {isDrink && (
                    <div className="space-y-3 p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/30">
                      {/* Sweetener Variety (White Sugar, Stevia, Honey, etc.) */}
                      {config.drinkConfig?.sweetenerOptions && config.drinkConfig.sweetenerOptions.length > 0 && (
                        <div>
                          <Label className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5 mb-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span>Sweetener Variety</span>
                          </Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                            {config.drinkConfig.sweetenerOptions.map((sw) => {
                              const isSelected = selectedSweetenerOption === sw.name
                              const isZero = itemSugar.includes('0%') || itemSugar.toLowerCase().includes('sugar free')
                              return (
                                <Button
                                  key={sw.name}
                                  type="button"
                                  disabled={isZero}
                                  variant={isSelected ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setSelectedSweetenerOption(sw.name)}
                                  className={`h-8 text-xs font-semibold ${
                                    isSelected
                                      ? 'bg-purple-600 text-white'
                                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                                  } ${isZero ? 'opacity-40' : ''}`}
                                >
                                  <span className="truncate">{sw.name}</span>
                                  {sw.extraPrice ? <span className="ml-1 text-[10px] opacity-80">(+${sw.extraPrice.toFixed(2)})</span> : null}
                                </Button>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Sweetness Percentage Level */}
                      <div>
                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sweetness Level</Label>
                        <Select value={itemSugar} onValueChange={setItemSugar}>
                          <SelectTrigger className="mt-1 h-9 text-xs bg-white dark:bg-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(config.drinkConfig?.sweetnessLevels || DEFAULT_SWEETNESS_LEVELS).map((lvl) => (
                              <SelectItem key={lvl} value={lvl} className="text-xs">
                                {lvl}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {/* Extra Shot (For coffee drinks) */}
                  {isCoffee && config.drinkConfig?.allowExtraShot && (
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Extra Espresso Shot</p>
                        <p className="text-[10px] text-slate-400">
                          +${(config.drinkConfig.extraShotPrice || 1.0).toFixed(2)} (18g coffee beans)
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant={itemExtraShot ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setItemExtraShot(!itemExtraShot)}
                        className={`h-8 gap-1 font-semibold text-xs ${itemExtraShot ? 'liquid-btn-primary' : ''}`}
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
                  )}

                  {/* Food Modifier Groups (For food items) */}
                  {isFood && config.foodConfig?.modifierGroups && config.foodConfig.modifierGroups.map((group) => (
                    <div key={group.id} className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 space-y-2">
                      <Label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <Sandwich className="w-3.5 h-3.5 text-amber-600" />
                        <span>{group.name}</span>
                      </Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {group.options.map((opt) => {
                          const isSelected = selectedFoodModifiers[group.id] === opt.id
                          return (
                            <Button
                              key={opt.id}
                              type="button"
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedFoodModifiers(prev => ({ ...prev, [group.id]: opt.id }))}
                              className={`h-8 text-xs font-semibold ${
                                isSelected
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <span className="truncate">{opt.name}</span>
                              {opt.extraPrice ? <span className="ml-1 text-[10px] opacity-80">(+${opt.extraPrice.toFixed(2)})</span> : null}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Custom Special Note */}
                  <div>
                    <Label className="text-xs font-semibold">Custom Instructions / Special Notes</Label>
                    <Input
                      placeholder="e.g., extra hot, light ice, dressing on the side"
                      value={itemSpecialNote}
                      onChange={(e) => setItemSpecialNote(e.target.value)}
                      className="mt-1 h-9 text-xs"
                    />
                  </div>

                  <Button onClick={addCustomizedItemToCart} className="w-full liquid-btn-primary h-10 font-bold text-xs cursor-pointer shadow-sm">
                    Add to Order • ${previewTotal.toFixed(2)}
                  </Button>
                </div>
              </>
            )
          })()}
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
                      {selectedCustomer.phone ? (
                        <a
                          href={`tel:${selectedCustomer.phone}`}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold"
                          title="Call customer"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{selectedCustomer.phone}</span>
                        </a>
                      ) : (
                        <p className="text-xs text-gray-500 dark:text-gray-400">No phone</p>
                      )}
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

            {/* Cashier Badge (Auto-Assigned) */}
            <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block">
                    {t('staffMember') || 'Cashier'}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {user?.name || staff.find(s => s.id === orderDetails.staffId)?.name || 'Active Cashier'}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Logged In
              </span>
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
                  <SelectItem value="gift">
                    <span className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-amber-500" />
                      <span>{t('compGift') || 'Gift / Hospitality'}</span>
                    </span>
                  </SelectItem>
                  <SelectItem value="staff">
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-indigo-500" />
                      <span>{t('staffMeal') || 'Staff Meal'}</span>
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
                <div className={`mt-1 flex items-center justify-between p-2 rounded-md border ${
                  appliedPromoData?.discountType === 'free_item'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                    : 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-white font-mono text-xs px-2 py-0.5 rounded font-bold flex items-center gap-1 ${
                      appliedPromoData?.discountType === 'free_item' ? 'bg-amber-600' : 'bg-purple-600'
                    }`}>
                      {appliedPromoData?.discountType === 'free_item' && <Gift className="w-3 h-3" />}
                      {appliedPromo}
                    </span>
                    <span className={`text-xs font-medium ${
                      appliedPromoData?.discountType === 'free_item'
                        ? 'text-amber-800 dark:text-amber-300'
                        : 'text-purple-800 dark:text-purple-300'
                    }`}>
                      {appliedPromoData?.discountType === 'free_item'
                        ? `Free Gift: ${appliedPromoData.freeItem?.name || 'Item'} ($0.00)`
                        : appliedPromoData?.discountPercent
                        ? `${appliedPromoData.discountPercent}% off (-$${promoDiscount.toFixed(2)})`
                        : `Applied (-$${promoDiscount.toFixed(2)})`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-[11px] text-red-500 hover:underline font-medium cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-1 mt-1">
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Enter promo coupon code"
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase())
                        if (promoError) setPromoError(null)
                      }}
                      className="text-xs font-mono h-9 uppercase"
                      disabled={isCheckingPromo}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isCheckingPromo}
                      onClick={handleApplyPromo}
                      className="h-9 px-3 text-xs font-bold shrink-0 border-purple-200 text-purple-700 dark:text-purple-300 hover:bg-purple-50 cursor-pointer"
                    >
                      {isCheckingPromo ? 'Checking...' : 'Apply'}
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
                  placeholder="Table #"
                  value={orderDetails.tableNumber}
                  onChange={(e) => setOrderDetails(prev => ({ ...prev, tableNumber: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Walk-in Name ({tCommon('optional')})</Label>
                <Input
                  placeholder="Guest name (optional)"
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
              {appliedPromo && appliedPromoData?.discountType === 'free_item' && (
                <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400 font-medium">
                  <span>Promo Free Gift ({appliedPromo}):</span>
                  <span>{appliedPromoData.freeItem?.name || 'Complimentary Item'} ($0.00)</span>
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
        currency={tenantInfo?.currency || 'USD'}
        onCompleteSplit={(splits) => {
          const summary = splits.map((s, i) => `Guest ${i + 1}: ${formatCurrency(s.amount, tenantInfo?.currency || 'USD', isAr)} (${s.method})`).join(', ')
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
                placeholder="Enter customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Phone Number</Label>
              <Input
                placeholder="Mobile phone number"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Email</Label>
              <Input
                type="email"
                placeholder="Email address (optional)"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">{t('dateOfBirth') || 'Date of Birth'}</Label>
              <Input
                type="date"
                value={newCustomer.dateOfBirth}
                onChange={(e) => setNewCustomer(prev => ({ ...prev, dateOfBirth: e.target.value }))}
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

      {/* Hardware Printer Configuration Modal */}
      <PrinterSettingsModal
        isOpen={isPrinterSettingsOpen}
        onClose={() => setIsPrinterSettingsOpen(false)}
        initialConfig={tenantInfo?.printerConfig}
        onSaveConfig={async (config) => {
          await fetch('/api/tenant', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ printerConfig: config })
          })
          setTenantInfo((prev: any) => ({ ...prev, printerConfig: JSON.stringify(config) }))
        }}
      />
    </div>
  )
}
