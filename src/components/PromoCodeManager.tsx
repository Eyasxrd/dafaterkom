'use client'

import React, { useState, useEffect } from 'react'
import {
  Tag,
  Percent,
  Gift,
  DollarSign,
  Plus,
  Search,
  Trash2,
  Edit2,
  Copy,
  Check,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  X,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface MenuItemOption {
  id: string
  name: string
  price: number
  imageUrl?: string | null
  category?: { id: string; name: string } | null
}

interface PromoCodeData {
  id: string
  code: string
  description?: string | null
  discountType: 'percentage' | 'free_item' | 'fixed_amount'
  discountPercent?: number | null
  discountAmount?: number | null
  freeItemId?: string | null
  freeItem?: MenuItemOption | null
  minOrderAmount?: number | null
  maxDiscount?: number | null
  usageLimit?: number | null
  usedCount: number
  startDate?: string | null
  endDate?: string | null
  isActive: boolean
  createdAt: string
}

export default function PromoCodeManager() {
  const [promos, setPromos] = useState<PromoCodeData[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemOption[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'free_item' | 'fixed_amount'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoCodeData | null>(null)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Form fields
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'free_item' | 'fixed_amount'>('percentage')
  const [discountPercent, setDiscountPercent] = useState<number | string>(15)
  const [discountAmount, setDiscountAmount] = useState<number | string>(5)
  const [freeItemId, setFreeItemId] = useState('')
  const [minOrderAmount, setMinOrderAmount] = useState<number | string>(0)
  const [maxDiscount, setMaxDiscount] = useState<number | string>('')
  const [usageLimit, setUsageLimit] = useState<number | string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)

  const fetchPromos = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/promos')
      if (res.ok) {
        const data = await res.json()
        setPromos(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to load promo codes:', err)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    let isMounted = true
    const loadInitialData = async () => {
      try {
        const [promosRes, itemsRes] = await Promise.all([
          fetch('/api/promos'),
          fetch('/api/menu-items')
        ])
        if (promosRes.ok && isMounted) {
          const pData = await promosRes.json()
          setPromos(Array.isArray(pData) ? pData : [])
        }
        if (itemsRes.ok && isMounted) {
          const mData = await itemsRes.json()
          setMenuItems(Array.isArray(mData) ? mData : [])
        }
      } catch (err) {
        console.error('Failed to load initial data:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    loadInitialData()
    return () => {
      isMounted = false
    }
  }, [])

  const handleOpenCreate = () => {
    setEditingPromo(null)
    setCode('')
    setDescription('')
    setDiscountType('percentage')
    setDiscountPercent(15)
    setDiscountAmount(5)
    setFreeItemId(menuItems[0]?.id || '')
    setMinOrderAmount(0)
    setMaxDiscount('')
    setUsageLimit('')
    setStartDate('')
    setEndDate('')
    setIsActive(true)
    setErrorMessage(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (promo: PromoCodeData) => {
    setEditingPromo(promo)
    setCode(promo.code)
    setDescription(promo.description || '')
    setDiscountType(promo.discountType)
    setDiscountPercent(promo.discountPercent ?? 15)
    setDiscountAmount(promo.discountAmount ?? 5)
    setFreeItemId(promo.freeItemId || menuItems[0]?.id || '')
    setMinOrderAmount(promo.minOrderAmount ?? 0)
    setMaxDiscount(promo.maxDiscount ?? '')
    setUsageLimit(promo.usageLimit ?? '')
    setStartDate(promo.startDate ? promo.startDate.slice(0, 10) : '')
    setEndDate(promo.endDate ? promo.endDate.slice(0, 10) : '')
    setIsActive(promo.isActive)
    setErrorMessage(null)
    setIsModalOpen(true)
  }

  const handleGenerateCode = () => {
    const prefixes = ['DEAL', 'SAVE', 'GIFT', 'YUM', 'SUPER', 'TASTY', 'VIP']
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)]
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    setCode(`${randomPrefix}${randomNum}`)
  }

  const handleCopyCode = (promoCode: string) => {
    navigator.clipboard.writeText(promoCode)
    setCopiedCode(promoCode)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const handleToggleActive = async (promo: PromoCodeData) => {
    const newStatus = !promo.isActive
    // Optimistic update
    setPromos(prev =>
      prev.map(p => (p.id === promo.id ? { ...p, isActive: newStatus } : p))
    )

    try {
      const res = await fetch(`/api/promos/${promo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      })
      if (!res.ok) {
        // Revert on failure
        fetchPromos()
      }
    } catch (err) {
      console.error(err)
      fetchPromos()
    }
  }

  const handleDelete = async (promo: PromoCodeData) => {
    if (!window.confirm(`Are you sure you want to delete promo code "${promo.code}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/promos/${promo.id}`, { method: 'DELETE' })
      if (res.ok) {
        setPromos(prev => prev.filter(p => p.id !== promo.id))
      }
    } catch (err) {
      console.error('Failed to delete promo:', err)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const cleanCode = code.trim().toUpperCase()
    if (!cleanCode) {
      setErrorMessage('Please enter a promo code')
      return
    }

    if (discountType === 'percentage') {
      const pct = parseFloat(String(discountPercent))
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        setErrorMessage('Percentage must be between 1% and 100%')
        return
      }
    }

    if (discountType === 'free_item' && !freeItemId) {
      setErrorMessage('Please select a free menu item reward')
      return
    }

    if (discountType === 'fixed_amount') {
      const amt = parseFloat(String(discountAmount))
      if (isNaN(amt) || amt <= 0) {
        setErrorMessage('Discount amount must be greater than 0')
        return
      }
    }

    setSaving(true)

    const payload = {
      code: cleanCode,
      description: description.trim() || null,
      discountType,
      discountPercent: discountType === 'percentage' ? parseFloat(String(discountPercent)) : null,
      discountAmount: discountType === 'fixed_amount' ? parseFloat(String(discountAmount)) : null,
      freeItemId: discountType === 'free_item' ? freeItemId : null,
      minOrderAmount: minOrderAmount ? parseFloat(String(minOrderAmount)) : 0,
      maxDiscount: maxDiscount ? parseFloat(String(maxDiscount)) : null,
      usageLimit: usageLimit ? parseInt(String(usageLimit)) : null,
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
      isActive
    }

    try {
      const url = editingPromo ? `/api/promos/${editingPromo.id}` : '/api/promos'
      const method = editingPromo ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await res.json()

      if (!res.ok) {
        setErrorMessage(result.error || 'Failed to save promo code')
        setSaving(false)
        return
      }

      setIsModalOpen(false)
      await fetchPromos()
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  // Filtered list
  const filteredPromos = promos.filter(p => {
    const matchesSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.freeItem && p.freeItem.name.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = typeFilter === 'all' || p.discountType === typeFilter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && p.isActive) ||
      (statusFilter === 'inactive' && !p.isActive)

    return matchesSearch && matchesType && matchesStatus
  })

  // KPI calculations
  const totalPromos = promos.length
  const activeCount = promos.filter(p => p.isActive).length
  const percentageCount = promos.filter(p => p.discountType === 'percentage').length
  const freeItemCount = promos.filter(p => p.discountType === 'free_item').length

  const selectedFreeItem = menuItems.find(m => m.id === freeItemId)

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-blue-900/20 p-6 rounded-2xl border border-purple-500/20 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Tag className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Promo Codes & Rewards
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-300 border border-purple-500/20 font-medium">
                  Discounts & Gifts
                </span>
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                Create coupon codes offering percentage discounts or complimentary free gift items.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPromos}
            className="rounded-xl border-slate-300 dark:border-white/10"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="liquid-btn-primary rounded-xl flex items-center gap-2 shadow-lg shadow-purple-600/20"
          >
            <Plus className="w-4 h-4" />
            New Promo Code
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Promos
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalPromos}</p>
          <span className="text-[11px] text-slate-500">All registered coupons</span>
        </Card>

        <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Codes
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{activeCount}</p>
          <span className="text-[11px] text-slate-500">Ready to use at POS</span>
        </Card>

        <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              % Discounts
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">{percentageCount}</p>
          <span className="text-[11px] text-slate-500">Percentage off total</span>
        </Card>

        <Card className="p-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Free Item Gifts
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{freeItemCount}</p>
          <span className="text-[11px] text-slate-500">Complimentary rewards</span>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white/60 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-white/10 backdrop-blur-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search code, description, item..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-purple-500 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {/* Type Filter */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('percentage')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                typeFilter === 'percentage'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Percent className="w-3 h-3" /> Percentage
            </button>
            <button
              onClick={() => setTypeFilter('free_item')}
              className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                typeFilter === 'free_item'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Gift className="w-3 h-3" /> Free Item
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
            className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Promos Grid / List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-500" />
          <p>Loading promo codes...</p>
        </div>
      ) : filteredPromos.length === 0 ? (
        <div className="p-12 text-center bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-300 dark:border-white/10">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'No matching promo codes found'
              : 'No promo codes created yet'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Boost customer retention and drive sales by creating discount codes or offering complimentary treats.
          </p>
          <Button onClick={handleOpenCreate} className="liquid-btn-primary rounded-xl">
            <Plus className="w-4 h-4 mr-1.5" />
            Create Your First Promo Code
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPromos.map(promo => {
            const isExpired = promo.endDate && new Date() > new Date(promo.endDate)
            const isUpcoming = promo.startDate && new Date() < new Date(promo.startDate)

            return (
              <Card
                key={promo.id}
                className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg border ${
                  !promo.isActive || isExpired
                    ? 'opacity-70 bg-slate-100/50 dark:bg-slate-900/30 border-slate-200 dark:border-white/5'
                    : 'bg-white/80 dark:bg-slate-900/80 border-slate-200/80 dark:border-white/10 hover:border-purple-500/40'
                }`}
              >
                {/* Visual Top Banner depending on type */}
                <div
                  className={`h-2 w-full ${
                    promo.discountType === 'free_item'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                      : promo.discountType === 'percentage'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                      : 'bg-gradient-to-r from-emerald-400 to-teal-500'
                  }`}
                />

                <div className="p-5 space-y-4">
                  {/* Header: Code Voucher Badge & Status Switch */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-base font-black px-3 py-1 rounded-lg border-2 border-dashed border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 tracking-wider flex items-center gap-1.5">
                        {promo.code}
                        <button
                          onClick={() => handleCopyCode(promo.code)}
                          className="hover:text-purple-900 dark:hover:text-white transition-colors p-0.5"
                          title="Copy promo code"
                        >
                          {copiedCode === promo.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 opacity-60 hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleActive(promo)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                        promo.isActive
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>

                  {/* Reward Summary */}
                  <div>
                    {promo.discountType === 'percentage' && (
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                          {promo.discountPercent}% OFF
                        </span>
                        {promo.maxDiscount && (
                          <span className="text-xs text-slate-500">
                            (Up to ${promo.maxDiscount.toFixed(2)})
                          </span>
                        )}
                      </div>
                    )}

                    {promo.discountType === 'free_item' && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-sm">
                          <Gift className="w-4 h-4 shrink-0" />
                          <span>FREE GIFT ITEM</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-600">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-xs text-slate-900 dark:text-white">
                                {promo.freeItem ? promo.freeItem.name : 'Selected Free Item'}
                              </p>
                              {promo.freeItem?.category && (
                                <p className="text-[10px] text-slate-500">
                                  {promo.freeItem.category.name}
                                </p>
                              )}
                            </div>
                          </div>
                          {promo.freeItem && (
                            <span className="text-xs line-through text-slate-400 font-mono">
                              ${promo.freeItem.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {promo.discountType === 'fixed_amount' && (
                      <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                        ${promo.discountAmount?.toFixed(2)} OFF
                      </div>
                    )}

                    {promo.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                        {promo.description}
                      </p>
                    )}
                  </div>

                  {/* Conditions & Details */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center justify-between">
                      <span>Min. Spend:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {promo.minOrderAmount && promo.minOrderAmount > 0
                          ? `$${promo.minOrderAmount.toFixed(2)}`
                          : 'None'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Redemptions:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {promo.usedCount}
                        {promo.usageLimit ? ` / ${promo.usageLimit} max` : ' used'}
                      </span>
                    </div>

                    {(promo.startDate || promo.endDate) && (
                      <div className="flex items-center justify-between">
                        <span>Validity:</span>
                        <span className={`font-medium ${isExpired ? 'text-red-500' : isUpcoming ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {promo.endDate
                            ? isExpired
                              ? 'Expired'
                              : `Until ${new Date(promo.endDate).toLocaleDateString()}`
                            : 'Ongoing'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(promo)}
                      className="h-8 px-2.5 text-xs text-slate-600 dark:text-slate-300 hover:text-purple-600 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(promo)}
                      className="h-8 px-2.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create / Edit Promo Code Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {editingPromo ? `Edit Promo Code "${editingPromo.code}"` : 'Create New Promo Code'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto flex-1">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Code & Auto-generator */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Promo Code (Uppercase) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER20, FREECOFFEE"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono font-bold tracking-wider text-sm focus:ring-2 focus:ring-purple-500"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGenerateCode}
                    className="rounded-xl border-purple-500/30 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs font-semibold"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Random
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Marketing Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. 20% off all orders this weekend or Free cookie with latte"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Reward Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Reward Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percentage')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      discountType === 'percentage'
                        ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Percent className="w-5 h-5" />
                    <span className="text-xs">Percentage (%)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountType('free_item')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      discountType === 'free_item'
                        ? 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Gift className="w-5 h-5" />
                    <span className="text-xs">Free Gift Item</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDiscountType('fixed_amount')}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      discountType === 'fixed_amount'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold shadow-sm'
                        : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <DollarSign className="w-5 h-5" />
                    <span className="text-xs">Fixed Amount ($)</span>
                  </button>
                </div>
              </div>

              {/* Type-specific inputs */}
              {discountType === 'percentage' && (
                <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Discount Percentage (%) *
                      </label>
                      <span className="font-mono font-bold text-purple-600 text-sm">
                        {discountPercent}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={discountPercent}
                        onChange={e => setDiscountPercent(Number(e.target.value))}
                        className="flex-1 h-2 bg-purple-200 dark:bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={discountPercent}
                        onChange={e => setDiscountPercent(e.target.value)}
                        className="w-16 px-2 py-1 text-center rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Max Discount Cap ($) <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="e.g. 25.00 (leave blank for unlimited)"
                      value={maxDiscount}
                      onChange={e => setMaxDiscount(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-sm"
                    />
                  </div>
                </div>
              )}

              {discountType === 'free_item' && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Select Complimentary Free Item *
                    </label>
                    <select
                      value={freeItemId}
                      onChange={e => setFreeItemId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="" disabled>Choose a menu item to give for free...</option>
                      {menuItems.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} (${item.price.toFixed(2)}) {item.category ? `• ${item.category.name}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedFreeItem && (
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-amber-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                          <Gift className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            {selectedFreeItem.name}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Normal price: ${selectedFreeItem.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Customer pays $0.00
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-amber-700 dark:text-amber-400/90 italic">
                    When this code is entered at checkout or POS, this item will automatically be awarded to the customer with 100% discount.
                  </p>
                </div>
              )}

              {discountType === 'fixed_amount' && (
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Discount Amount ($) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="5.00"
                        value={discountAmount}
                        onChange={e => setDiscountAmount(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-white/10 text-sm font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Conditions: Min Order, Usage Limit, Expiration */}
              <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-white/10">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Rules & Limitations
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Min Order Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={minOrderAmount}
                      onChange={e => setMinOrderAmount(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Max Uses Limit (Total)
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Unlimited"
                      value={usageLimit}
                      onChange={e => setUsageLimit(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Valid From (Optional)
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                      Expiration Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="promoIsActive"
                    checked={isActive}
                    onChange={e => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="promoIsActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Activate promo code immediately
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="liquid-btn-primary rounded-xl flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {editingPromo ? 'Save Changes' : 'Create Promo Code'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
