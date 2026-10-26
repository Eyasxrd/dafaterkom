'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Plus, 
  Search, 
  QrCode, 
  Sliders, 
  Sparkles, 
  Trash2, 
  Edit, 
  ExternalLink, 
  Utensils, 
  Layers, 
  Coffee, 
  Truck, 
  Smartphone,
  Eye,
  CheckCircle2,
  AlertCircle,
  Copy,
  Clock,
  Printer,
  UploadCloud
} from 'lucide-react'
import DietaryBadge, { MENU_CHANNELS } from './DietaryBadge'
import MenuEditorModal from './MenuEditorModal'
import ItemEditorModal from './ItemEditorModal'
import MenuQrModal from './MenuQrModal'
import MenuExcelImporterModal from './MenuExcelImporterModal'

export default function MenuManager() {
  const [menus, setMenus] = useState<any[]>([])
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedChannelFilter, setSelectedChannelFilter] = useState('all')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

  // Modals
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<any | null>(null)

  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null)

  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [qrModalMenu, setQrModalMenu] = useState<any | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [menusRes, itemsRes, catsRes] = await Promise.all([
        fetch('/api/menus'),
        fetch('/api/menu-items'),
        fetch('/api/categories')
      ])

      const [menusData, itemsData, catsData] = await Promise.all([
        menusRes.json(),
        itemsRes.json(),
        catsRes.json()
      ])

      if (Array.isArray(menusData)) setMenus(menusData)
      if (Array.isArray(itemsData)) setMenuItems(itemsData)
      if (Array.isArray(catsData)) setCategories(catsData)
    } catch (err) {
      console.error('Failed to load menu data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenNewMenu = () => {
    setEditingMenu(null)
    setIsMenuModalOpen(true)
  }

  const handleEditMenu = (menu: any) => {
    setEditingMenu(menu)
    setIsMenuModalOpen(true)
  }

  const handleDeleteMenu = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return
    try {
      const res = await fetch(`/api/menus/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMenus((prev) => prev.filter((m) => m.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleMenuStatus = async (menu: any) => {
    try {
      const updatedStatus = !menu.isActive
      const res = await fetch(`/api/menus/${menu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedStatus })
      })
      if (res.ok) {
        setMenus((prev) =>
          prev.map((m) => (m.id === menu.id ? { ...m, isActive: updatedStatus } : m))
        )
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenNewItem = () => {
    setEditingItem(null)
    setIsItemModalOpen(true)
  }

  const handleEditItem = (item: any) => {
    setEditingItem(item)
    setIsItemModalOpen(true)
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete item "${name}"?`)) return
    try {
      const res = await fetch(`/api/menu-items/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMenuItems((prev) => prev.filter((i) => i.id !== id))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleToggleItemAvailability = async (item: any) => {
    try {
      const updatedStatus = !item.isAvailable
      const res = await fetch(`/api/menu-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: updatedStatus })
      })
      if (res.ok) {
        setMenuItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, isAvailable: updatedStatus } : i))
        )
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Filtered menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.ingredients && item.ingredients.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory =
      selectedCategoryFilter === 'all' || item.categoryId === selectedCategoryFilter

    const matchesChannel =
      selectedChannelFilter === 'all' ||
      item.menus?.some((link: any) => link.menu?.type === selectedChannelFilter || link.menuId === selectedChannelFilter)

    return matchesSearch && matchesCategory && matchesChannel
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-3">
          <Coffee className="w-5 h-5 animate-spin text-blue-600" />
          <span className="text-sm font-medium">Loading menu builder & QR codes...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Banner */}
      <div className="glass-panel border border-slate-200/80 dark:border-white/10 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl liquid-btn-primary flex items-center justify-center text-white shadow-md">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight text-slate-900 dark:text-white">
              Menu Builder & QR Code Studio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage multiple menus concurrently (In-House, Delivery, Apps) with rich ingredients and instant QR stands.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleOpenNewMenu}
            variant="outline"
            title="Create a new digital menu channel (e.g. Dine-In QR, Takeaway, Delivery apps)"
            className="text-xs font-bold gap-1.5 h-9 rounded-xl border-slate-200 dark:border-white/15 cursor-pointer hover:border-blue-500/40"
          >
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            <span>New Menu Channel</span>
          </Button>
          <Button
            onClick={() => setIsImportModalOpen(true)}
            variant="outline"
            title="Bulk import items from an Excel spreadsheet or CSV file"
            className="text-xs font-bold gap-1.5 h-9 rounded-xl border-slate-200 dark:border-white/15 cursor-pointer hover:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10"
          >
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Import Menu</span>
          </Button>
          <Button
            onClick={handleOpenNewItem}
            title="Add a new beverage, food, or retail item with recipe bill of materials, sizes, and pricing"
            className="text-xs font-bold gap-1.5 h-9 rounded-xl liquid-btn-primary cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Menu Item</span>
          </Button>
        </div>
      </div>

      {/* Section 1: Active Menus Channels Row */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Active Menus ({menus.length})
            </h2>
            <span className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">
              Multi-Channel
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Each menu has its own public URL & printable QR stand
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {menus.map((menu) => {
            const channel = MENU_CHANNELS[menu.type] || MENU_CHANNELS.dine_in
            const IconComponent = channel.icon
            const assignedCount = menu.items?.length || 0

            return (
              <div
                key={menu.id}
                className="p-4 rounded-3xl glass-card border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between gap-3 shadow-xs hover:border-blue-500/40 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${channel.color}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          {channel.label}
                        </span>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white truncate max-w-[160px]">
                          {menu.name}
                        </h3>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <button
                      onClick={() => handleToggleMenuStatus(menu)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                        menu.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                      title={menu.isActive ? 'Status: Active (visible to customers). Click to switch to Draft' : 'Status: Draft (hidden from customers). Click to activate'}
                    >
                      {menu.isActive ? 'Active' : 'Draft'}
                    </button>
                  </div>

                  {menu.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {menu.description}
                    </p>
                  )}

                  {menu.badgeText && (
                    <div className="mt-2 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-lg inline-block truncate max-w-full">
                      {menu.badgeText}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 text-[11px]">
                    {assignedCount} {assignedCount === 1 ? 'item' : 'items'}
                  </span>

                  <div className="flex items-center gap-1">
                    {/* QR Code trigger */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setQrModalMenu(menu)}
                      className="h-8 px-2.5 text-[11px] font-bold gap-1 rounded-xl cursor-pointer hover:border-blue-500/40"
                      title="Open QR Code & Printable Table Stand Designer for this menu"
                    >
                      <QrCode className="w-3.5 h-3.5 text-blue-500" />
                      <span>QR Code</span>
                    </Button>

                    {/* Edit */}
                    <button
                      onClick={() => handleEditMenu(menu)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-500 dark:text-slate-400 cursor-pointer"
                      title="Edit Menu channel details and custom link"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    {menus.length > 1 && (
                      <button
                        onClick={() => handleDeleteMenu(menu.id, menu.name)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 cursor-pointer"
                        title="Delete this menu channel"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 2: Items Organizer & Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
              Menu Items Catalog ({filteredItems.length})
            </h2>
            <p className="text-xs text-slate-400">
              Include ingredients, dietary tags, allergens, and multi-channel prices.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute start-2.5 top-2.5 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, ingredients..."
                title="Search menu items by name, ingredients, or description"
                className="h-8 ps-8 text-xs rounded-xl"
              />
            </div>

            {/* Category filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              title="Filter items by category"
              className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Channel filter */}
            <select
              value={selectedChannelFilter}
              onChange={(e) => setSelectedChannelFilter(e.target.value)}
              title="Filter items by menu channel"
              className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer outline-none"
            >
              <option value="all">All Menus</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Menu Items Table / Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredItems.map((item) => {
            // Parse dietary tags
            let tags: string[] = []
            try {
              if (item.dietaryTags) {
                tags = typeof item.dietaryTags === 'string' ? JSON.parse(item.dietaryTags) : item.dietaryTags
              }
            } catch {
              tags = item.dietaryTags ? item.dietaryTags.split(',') : []
            }

            return (
              <div
                key={item.id}
                className="p-4 rounded-3xl glass-card border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between gap-3 shadow-xs hover:border-blue-500/30 transition-all"
              >
                <div>
                  <div className="flex items-start gap-3">
                    {/* Item thumbnail */}
                    {item.imageUrl ? (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-200/60 dark:border-white/10 shadow-xs">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-500/20">
                        <Coffee className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {item.name}
                        </h4>
                        <span className="font-black text-sm text-blue-600 dark:text-blue-400 font-mono">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>

                      <span className="text-[10px] font-semibold text-slate-400 block mt-0.5">
                        {item.category?.name || 'Beverages'}
                      </span>

                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* "What's Included / Ingredients" snippet */}
                  {item.ingredients && (
                    <div className="mt-2.5 p-2 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                      <span className="font-bold text-blue-600 dark:text-blue-400 me-1">
                        Includes:
                      </span>
                      {item.ingredients}
                    </div>
                  )}

                  {/* Dietary SVG Badges */}
                  {Array.isArray(tags) && tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {tags.slice(0, 4).map((tagKey) => (
                        <DietaryBadge key={tagKey} tagKey={tagKey} size="sm" />
                      ))}
                      {tags.length > 4 && (
                        <span className="text-[9px] font-bold text-slate-400 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                          +{tags.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Calories & Prep Time info */}
                  {(item.calories || item.prepTime) && (
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400 font-medium">
                      {item.calories && (
                        <span>🔥 {item.calories} kcal</span>
                      )}
                      {item.prepTime && (
                        <span>⏱️ {item.prepTime} mins</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Controls: Availability & Edit */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleItemAvailability(item)}
                    title={item.isAvailable ? 'Currently Available / In Stock. Click to mark as Sold Out / 86' : 'Currently Sold Out. Click to mark as In Stock'}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      item.isAvailable
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
                        : 'text-rose-600 dark:text-rose-400 bg-rose-500/10'
                    }`}
                  >
                    {item.isAvailable ? '● In Stock' : '○ Sold Out'}
                  </button>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditItem(item)}
                      title={`Edit ${item.name} (recipe, sizes, prices, allergens)`}
                      className="h-7 px-2.5 text-[11px] font-bold gap-1 rounded-xl cursor-pointer"
                    >
                      <Edit className="w-3 h-3 text-blue-500" />
                      <span>Edit</span>
                    </Button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                      title={`Delete ${item.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modals */}
      <MenuEditorModal
        isOpen={isMenuModalOpen}
        onClose={() => setIsMenuModalOpen(false)}
        menuToEdit={editingMenu}
        onSaved={loadData}
      />

      <ItemEditorModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        itemToEdit={editingItem}
        categories={categories}
        menus={menus}
        onSaved={loadData}
        onCategoryCreated={(newCat) => setCategories((prev) => [...prev, newCat])}
      />

      <MenuQrModal
        isOpen={!!qrModalMenu}
        onClose={() => setQrModalMenu(null)}
        menu={qrModalMenu}
      />

      <MenuExcelImporterModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        menus={menus}
        categories={categories}
        onImportComplete={loadData}
      />
    </div>
  )
}
