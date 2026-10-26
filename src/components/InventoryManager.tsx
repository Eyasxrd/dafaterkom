'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  AlertTriangle, 
  Package, 
  FileSpreadsheet, 
  Trash2,
  TrendingDown,
  ShieldAlert,
  CheckCircle2,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Truck,
  Edit2,
  ArrowUpDown,
  Filter,
  Check,
  X,
  AlertCircle,
  Clock,
  DollarSign,
  Layers,
  Utensils,
  Sparkles,
  Download,
  Flame,
  Scale
} from 'lucide-react'

export interface InventoryItem {
  id: string
  name: string
  description: string | null
  quantity: number
  unit: string
  lowStockThreshold: number
  costPerUnit: number
  valuation: number
  lastRestocked: string | null
  recipesCount: number
  recipes?: Array<{
    recipeId: string
    menuItemId: string
    menuItemName: string
    categoryName: string
    recipeQuantity: number
  }>
  createdAt?: string
  updatedAt?: string
}

interface Supplier {
  id: string
  name: string
  contactPerson?: string | null
  phone?: string | null
}

interface InventoryManagerProps {
  onNavigateToImport?: () => void
}

type StockFilterType = 'all' | 'low' | 'out' | 'healthy'
type SortOption = 'stock_asc' | 'stock_desc' | 'name_asc' | 'name_desc' | 'cost_desc' | 'val_desc' | 'restocked_desc'
type ViewMode = 'table' | 'grid'

export default function InventoryManager({ onNavigateToImport }: InventoryManagerProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)

  // Navigation / Tabs: Active Stock vs Wastage Log vs Wholesale B2B
  const [activeTab, setActiveTab] = useState<'inventory' | 'waste_log' | 'b2b_sales'>('inventory')

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState<StockFilterType>('all')
  const [unitFilter, setUnitFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('stock_asc')
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  // Raw Ingredients list for Wholesale B2B
  const [stockMovements, setStockMovements] = useState<any[]>([])
  const [isSoldDialogOpen, setIsSoldDialogOpen] = useState(false)
  const [soldIngredientId, setSoldIngredientId] = useState('')
  const [soldQuantity, setSoldQuantity] = useState('1')
  const [soldUnitPrice, setSoldUnitPrice] = useState('12.00')
  const [soldCustomer, setSoldCustomer] = useState('')
  const [soldNotes, setSoldNotes] = useState('')
  const [soldSubmitting, setSoldSubmitting] = useState(false)
  const [soldError, setSoldError] = useState<string | null>(null)

  // Add Item / Stock Modal state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemDesc, setNewItemDesc] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState('500')
  const [newItemUnit, setNewItemUnit] = useState('grams')
  const [newItemThreshold, setNewItemThreshold] = useState('50')
  const [newItemCost, setNewItemCost] = useState('0.025')
  const [addIngredientError, setAddIngredientError] = useState<string | null>(null)
  const [addSubmitting, setAddSubmitting] = useState(false)

  // Edit Item Modal state
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editQuantity, setEditQuantity] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editThreshold, setEditThreshold] = useState('')
  const [editCost, setEditCost] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Supplier Restock Order Modal state
  const [supplierRestockItem, setSupplierRestockItem] = useState<InventoryItem | null>(null)
  const [selectedSupplierId, setSelectedSupplierId] = useState('')
  const [supplierOrderQty, setSupplierOrderQty] = useState('1000')
  const [supplierUnitCost, setSupplierUnitCost] = useState('0.025')
  const [supplierOrderNotes, setSupplierOrderNotes] = useState('')
  const [supplierOrderSubmitting, setSupplierOrderSubmitting] = useState(false)

  // Delete Confirmation state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<InventoryItem | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Waste & Spoilage Modal state
  const [wasteItem, setWasteItem] = useState<InventoryItem | null>(null)
  const [wasteQuantity, setWasteQuantity] = useState('50')
  const [wasteReason, setWasteReason] = useState('expired')
  const [wasteNotes, setWasteNotes] = useState('')
  const [wasteSubmitting, setWasteSubmitting] = useState(false)
  const [wasteError, setWasteError] = useState<string | null>(null)

  // Waste Log State
  const [wasteLogs, setWasteLogs] = useState<any[]>([])
  const [totalLossAmount, setTotalLossAmount] = useState(0)
  const [totalItemsWasted, setTotalItemsWasted] = useState(0)
  const [loadingWaste, setLoadingWaste] = useState(false)

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchInventory(),
        fetchSuppliers(),
        fetchWasteLogs(),
        fetchStockMovements()
      ])
    } catch (error) {
      console.error('Failed to load initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
      const data = await response.json()
      if (Array.isArray(data)) {
        setInventory(data)
        if (data.length > 0 && !soldIngredientId) {
          setSoldIngredientId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch inventory ingredients:', error)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setSuppliers(data)
          if (data.length > 0 && !selectedSupplierId) {
            setSelectedSupplierId(data[0].id)
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch suppliers:', error)
    }
  }

  const fetchWasteLogs = async () => {
    setLoadingWaste(true)
    try {
      const response = await fetch('/api/inventory/waste')
      const data = await response.json()
      if (data.success) {
        setWasteLogs(data.items || [])
        setTotalLossAmount(data.totalLossAmount || 0)
        setTotalItemsWasted(data.totalItemsWasted || 0)
      }
    } catch (error) {
      console.error('Failed to fetch waste logs:', error)
    } finally {
      setLoadingWaste(false)
    }
  }

  const fetchStockMovements = async () => {
    try {
      const response = await fetch('/api/inventory/stock-movement')
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          setStockMovements(data)
        }
      }
    } catch (error) {
      console.error('Failed to fetch stock movements:', error)
    }
  }

  // Stock condition helpers
  const isLowStock = (item: InventoryItem) => item.quantity > 0 && item.quantity <= item.lowStockThreshold
  const isOutOfStock = (item: InventoryItem) => item.quantity <= 0
  const isHealthyStock = (item: InventoryItem) => item.quantity > item.lowStockThreshold

  // Available unique units for filtering
  const availableUnits = useMemo(() => {
    const units = new Set<string>()
    inventory.forEach((i) => {
      if (i.unit) units.add(i.unit.toLowerCase())
    })
    return Array.from(units)
  }, [inventory])

  // Summary Metrics
  const totalItemsCount = inventory.length
  const lowStockCount = inventory.filter(isLowStock).length
  const outOfStockCount = inventory.filter(isOutOfStock).length
  const totalValuation = useMemo(() => {
    return inventory.reduce((sum, item) => sum + (item.quantity * (item.costPerUnit || 0)), 0)
  }, [inventory])

  // Filtered & Sorted Inventory
  const filteredInventory = useMemo(() => {
    return inventory
      .filter((item) => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim()
          const nameMatch = item.name.toLowerCase().includes(q)
          const descMatch = (item.description || '').toLowerCase().includes(q)
          const unitMatch = item.unit.toLowerCase().includes(q)
          const recipeMatch = item.recipes?.some(r => r.menuItemName.toLowerCase().includes(q))
          if (!nameMatch && !descMatch && !unitMatch && !recipeMatch) return false
        }

        // Unit filter
        if (unitFilter !== 'all' && item.unit.toLowerCase() !== unitFilter.toLowerCase()) {
          return false
        }

        // Stock condition filter
        if (stockFilter === 'low' && !isLowStock(item)) return false
        if (stockFilter === 'out' && !isOutOfStock(item)) return false
        if (stockFilter === 'healthy' && !isHealthyStock(item)) return false

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'stock_asc') return a.quantity - b.quantity
        if (sortBy === 'stock_desc') return b.quantity - a.quantity
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name)
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name)
        if (sortBy === 'cost_desc') return (b.costPerUnit || 0) - (a.costPerUnit || 0)
        if (sortBy === 'val_desc') return (b.quantity * (b.costPerUnit || 0)) - (a.quantity * (a.costPerUnit || 0))
        if (sortBy === 'restocked_desc') {
          const dateA = a.lastRestocked ? new Date(a.lastRestocked).getTime() : 0
          const dateB = b.lastRestocked ? new Date(b.lastRestocked).getTime() : 0
          return dateB - dateA
        }
        return 0
      })
  }, [inventory, searchQuery, unitFilter, stockFilter, sortBy])

  // Add New Ingredient Handler
  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddIngredientError(null)
    setAddSubmitting(true)

    try {
      if (!newItemName.trim()) {
        setAddIngredientError('Ingredient name is required')
        return
      }

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName.trim(),
          description: newItemDesc.trim() || undefined,
          quantity: parseFloat(newItemQuantity) || 0,
          unit: newItemUnit.trim() || 'grams',
          lowStockThreshold: parseFloat(newItemThreshold) || 10,
          costPerUnit: parseFloat(newItemCost) || 0
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to create ingredient inventory')
      }

      setIsAddDialogOpen(false)
      setNewItemName('')
      setNewItemDesc('')
      setNewItemQuantity('500')
      setNewItemUnit('grams')
      setNewItemThreshold('50')
      setNewItemCost('0.025')
      setFeedback({ type: 'success', message: `Ingredient "${newItemName}" added to inventory successfully!` })
      fetchInventory()
    } catch (err: any) {
      setAddIngredientError(err.message || 'Failed to create ingredient')
    } finally {
      setAddSubmitting(false)
    }
  }

  // Supplier Order and Auto-Restock Handler
  const handleSupplierOrder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supplierRestockItem || !selectedSupplierId) return
    setSupplierOrderSubmitting(true)

    try {
      const qty = parseFloat(supplierOrderQty) || 1
      const unitCost = parseFloat(supplierUnitCost) || 0

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          destinationWarehouse: 'raw_materials',
          status: 'received',
          notes: supplierOrderNotes?.trim() || `Restock order for raw ingredient: ${supplierRestockItem.name}`,
          items: [
            {
              ingredientId: supplierRestockItem.id,
              itemName: supplierRestockItem.name,
              quantity: qty,
              unit: supplierRestockItem.unit,
              unitPrice: unitCost
            }
          ]
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to process supplier purchase order')
      }

      setSupplierRestockItem(null)
      setSupplierOrderNotes('')
      setFeedback({
        type: 'success',
        message: `⚡ Purchase invoice created! Added +${qty} ${supplierRestockItem.unit} to "${supplierRestockItem.name}".`
      })
      fetchInventory()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to process purchase order' })
    } finally {
      setSupplierOrderSubmitting(false)
    }
  }

  // Edit Item Handler
  const handleOpenEdit = (item: InventoryItem) => {
    setEditItem(item)
    setEditName(item.name)
    setEditDesc(item.description || '')
    setEditQuantity(item.quantity.toString())
    setEditUnit(item.unit)
    setEditThreshold(item.lowStockThreshold.toString())
    setEditCost((item.costPerUnit || 0).toString())
    setEditError(null)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editItem) return
    setEditSubmitting(true)
    setEditError(null)

    try {
      const res = await fetch(`/api/inventory/${editItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim() || undefined,
          quantity: parseFloat(editQuantity) || 0,
          unit: editUnit.trim() || 'grams',
          lowStockThreshold: parseFloat(editThreshold) || 10,
          costPerUnit: parseFloat(editCost) || 0
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update ingredient')
      }

      setEditItem(null)
      setFeedback({ type: 'success', message: `Updated "${editName}" details successfully!` })
      fetchInventory()
    } catch (err: any) {
      setEditError(err.message || 'Failed to update ingredient')
    } finally {
      setEditSubmitting(false)
    }
  }

  // Delete Item Handler
  const handleDeleteItem = async () => {
    if (!deleteConfirmItem) return
    setDeleteSubmitting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`/api/inventory/${deleteConfirmItem.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setDeleteConfirmItem(null)
        setFeedback({ type: 'success', message: `Removed "${deleteConfirmItem.name}" from inventory tracking.` })
        fetchInventory()
      } else {
        const err = await res.json()
        setDeleteError(err.error || 'Failed to delete ingredient')
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete ingredient')
    } finally {
      setDeleteSubmitting(false)
    }
  }

  // Spoilage / Wastage Handler
  const handleRecordWaste = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wasteItem) return
    setWasteSubmitting(true)
    setWasteError(null)

    try {
      const wasteQty = parseFloat(wasteQuantity) || 0
      const res = await fetch('/api/inventory/waste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientId: wasteItem.id,
          quantity: wasteQty,
          reason: wasteReason,
          notes: wasteNotes
        })
      })

      const data = await res.json()
      if (res.ok) {
        setWasteItem(null)
        setWasteQuantity('50')
        setWasteNotes('')
        fetchInventory()
        fetchWasteLogs()
        setFeedback({ 
          type: 'success', 
          message: `Recorded ${wasteQty} ${wasteItem.unit} wastage for "${wasteItem.name}" ($${data.loss?.toFixed(2) || '0.00'} loss).` 
        })
      } else {
        setWasteError(data.error || 'Failed to record waste')
      }
    } catch (err: any) {
      setWasteError(err.message || 'Failed to record waste')
    } finally {
      setWasteSubmitting(false)
    }
  }

  // Wholesale / B2B Sold Handler
  const handleRecordSoldB2B = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!soldIngredientId) {
      setSoldError('Please select an ingredient / raw material')
      return
    }
    setSoldSubmitting(true)
    setSoldError(null)

    try {
      const res = await fetch('/api/inventory/stock-movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'out_sale_b2b',
          ingredientId: soldIngredientId,
          quantity: parseFloat(soldQuantity) || 1,
          unitPrice: parseFloat(soldUnitPrice) || 0,
          reference: soldCustomer.trim() || 'Wholesale Client',
          notes: soldNotes.trim()
        })
      })

      const data = await res.json()
      if (res.ok) {
        setIsSoldDialogOpen(false)
        setSoldCustomer('')
        setSoldNotes('')
        setFeedback({ 
          type: 'success', 
          message: `Wholesale direct sale recorded! Deducted ${soldQuantity} from raw stock.` 
        })
        fetchInventory()
        fetchStockMovements()
      } else {
        setSoldError(data.error || 'Failed to record wholesale sale')
      }
    } catch (err: any) {
      setSoldError(err.message || 'Failed to record wholesale sale')
    } finally {
      setSoldSubmitting(false)
    }
  }

  // Export Inventory CSV
  const handleExportCSV = () => {
    const headers = ['Ingredient / Material Name', 'Description', 'Current Stock', 'Unit', 'Alert Threshold', 'Cost Per Unit ($)', 'Total Valuation ($)', 'Used in Dishes', 'Last Restocked']
    const rows = inventory.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${(item.description || '').replace(/"/g, '""')}"`,
      item.quantity,
      item.unit,
      item.lowStockThreshold,
      (item.costPerUnit || 0).toFixed(4),
      ((item.costPerUnit || 0) * item.quantity).toFixed(2),
      item.recipesCount,
      item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'N/A'
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `ingredients_inventory_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-slate-400 space-y-3">
        <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Loading ingredients inventory & stock control...</p>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      {/* Feedback Alert Banner */}
      {feedback && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in duration-200 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-950 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
            Inventory & Stock Control
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time tracking of raw ingredients, coffee beans, dairy, syrups, packaging, supplier replenishment, and waste
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToImport}
              className="font-semibold gap-1.5 text-xs h-9 cursor-pointer rounded-xl"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Import Excel</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="font-semibold gap-1.5 text-xs h-9 cursor-pointer rounded-xl"
            title="Download CSV report"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setSoldError(null)
              if (inventory.length > 0 && !soldIngredientId) {
                setSoldIngredientId(inventory[0].id)
              }
              setIsSoldDialogOpen(true)
            }}
            className="font-bold gap-2 text-xs h-9 cursor-pointer shadow-md bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl"
          >
            <Truck className="w-4 h-4" />
            <span>Wholesale / Sold (B2B)</span>
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setAddIngredientError(null)
              setIsAddDialogOpen(true)
            }}
            className="liquid-btn-primary font-bold gap-2 text-xs h-9 cursor-pointer shadow-md rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ingredient & Stock</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="glass-card p-4 rounded-2xl border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Raw Ingredients</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalItemsCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Tracked in inventory</div>
          </div>
        </Card>

        <Card className="glass-card p-4 rounded-2xl border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Total Stock Value</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ${totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Asset valuation</div>
          </div>
        </Card>

        <Card className="glass-card p-4 rounded-2xl border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Low Stock Alerts</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{lowStockCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Below alert threshold</div>
          </div>
        </Card>

        <Card className="glass-card p-4 rounded-2xl border-slate-200/80 dark:border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Out of Stock</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{outOfStockCount}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Critical 0 balance</div>
          </div>
        </Card>

        <Card className="glass-card p-4 rounded-2xl border-slate-200/80 dark:border-white/10 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Total Waste Loss</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
              ${totalLossAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">{wasteLogs.length} incident logs</div>
          </div>
        </Card>
      </div>

      {/* Navigation View Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5 text-blue-500" />
          <span>Active Stock ({inventory.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('waste_log')
            fetchWasteLogs()
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'waste_log'
              ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          <span>Wastage & Spoilage Log ({wasteLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('b2b_sales')
            fetchStockMovements()
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'b2b_sales'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Truck className="w-3.5 h-3.5 text-indigo-500" />
          <span>Wholesale & Sold (B2B) ({stockMovements.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ACTIVE INVENTORY & STOCK */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 glass-panel p-3 rounded-2xl border border-slate-200/80 dark:border-white/10">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search raw ingredients, coffee beans, dairy, syrups, packaging..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs rounded-xl bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-white/10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Stock Status Filter */}
              <Select value={stockFilter} onValueChange={(v: any) => setStockFilter(v)}>
                <SelectTrigger className="h-9 text-xs rounded-xl font-semibold bg-white/60 dark:bg-slate-900/60 w-[130px]">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="healthy">Healthy Stock</SelectItem>
                  <SelectItem value="low">Low Stock ({lowStockCount})</SelectItem>
                  <SelectItem value="out">Out of Stock ({outOfStockCount})</SelectItem>
                </SelectContent>
              </Select>

              {/* Unit Filter */}
              {availableUnits.length > 0 && (
                <Select value={unitFilter} onValueChange={(v: any) => setUnitFilter(v)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl font-semibold bg-white/60 dark:bg-slate-900/60 w-[110px]">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {availableUnits.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Sort By */}
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="h-9 text-xs rounded-xl font-semibold bg-white/60 dark:bg-slate-900/60 w-[140px]">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock_asc">Stock: Low to High</SelectItem>
                  <SelectItem value="stock_desc">Stock: High to Low</SelectItem>
                  <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                  <SelectItem value="cost_desc">Highest Unit Cost</SelectItem>
                  <SelectItem value="val_desc">Highest Valuation</SelectItem>
                  <SelectItem value="restocked_desc">Recently Restocked</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                  title="Table View"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
                  title="Grid Cards View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'table' ? (
            <Card className="glass-panel rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                    <tr>
                      <th className="px-4 py-3">Raw Ingredient / Material</th>
                      <th className="px-4 py-3">Stock Level & Health</th>
                      <th className="px-4 py-3">Unit Cost</th>
                      <th className="px-4 py-3">Total Value</th>
                      <th className="px-4 py-3">Used in Recipes</th>
                      <th className="px-4 py-3">Last Restocked</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                          <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                          <p className="font-bold text-sm">No raw ingredients found</p>
                          <p className="text-[11px] mt-0.5">Try adjusting your filters or click "Add Ingredient & Stock" above.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => {
                        const low = isLowStock(item)
                        const out = isOutOfStock(item)
                        const maxVal = Math.max(item.lowStockThreshold * 2, item.quantity, 1)
                        const percent = Math.min(100, Math.round((item.quantity / maxVal) * 100))

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                            {/* Ingredient Name & Description */}
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900 dark:text-white text-xs">{item.name}</div>
                              {item.description && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[220px]">{item.description}</div>
                              )}
                            </td>

                            {/* Stock Level & Health Bar */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-black text-xs ${
                                  out ? 'text-rose-600 dark:text-rose-400' : low ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
                                }`}>
                                  {item.quantity.toLocaleString()} {item.unit}
                                </span>

                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  out 
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' 
                                    : low 
                                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {out ? 'Out of Stock' : low ? 'Low Stock' : 'Healthy'}
                                </span>
                              </div>

                              <div className="w-32 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    out ? 'bg-rose-500 w-0' : low ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${out ? 0 : percent}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-400 block mt-0.5">Alert at ≤ {item.lowStockThreshold} {item.unit}</span>
                            </td>

                            {/* Unit Cost */}
                            <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                              ${(item.costPerUnit || 0).toFixed(4)} / {item.unit}
                            </td>

                            {/* Total Valuation */}
                            <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">
                              ${((item.costPerUnit || 0) * item.quantity).toFixed(2)}
                            </td>

                            {/* Recipe Formulations */}
                            <td className="px-4 py-3">
                              {item.recipesCount > 0 ? (
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                                  <Utensils className="w-3 h-3" />
                                  <span>{item.recipesCount} Dishes</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                              )}
                            </td>

                            {/* Last Restocked */}
                            <td className="px-4 py-3 text-[11px] text-slate-400">
                              {item.lastRestocked ? new Date(item.lastRestocked).toLocaleDateString() : 'N/A'}
                            </td>

                            {/* Action Buttons */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSupplierRestockItem(item)
                                    setSupplierUnitCost(item.costPerUnit?.toString() || '0.025')
                                    setSupplierOrderQty(item.unit === 'grams' || item.unit === 'ml' ? '2000' : '50')
                                  }}
                                  className="h-7 text-[11px] px-2 rounded-xl font-bold gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                                  title="Create purchase invoice from supplier"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>PO</span>
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setWasteItem(item)
                                    setWasteQuantity(item.unit === 'grams' || item.unit === 'ml' ? '100' : '1')
                                    setWasteError(null)
                                  }}
                                  className="h-7 w-7 p-0 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                  title="Record spillage / wastage"
                                >
                                  <TrendingDown className="w-3.5 h-3.5" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEdit(item)}
                                  className="h-7 w-7 p-0 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                                  title="Edit ingredient properties"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setDeleteConfirmItem(item)
                                    setDeleteError(null)
                                  }}
                                  className="h-7 w-7 p-0 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                                  title="Delete ingredient"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* GRID CARDS VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.length === 0 ? (
                <div className="col-span-full py-16 text-center text-slate-400 glass-card rounded-2xl">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="font-bold text-sm">No ingredients match your search</p>
                </div>
              ) : (
                filteredInventory.map((item) => {
                  const low = isLowStock(item)
                  const out = isOutOfStock(item)
                  const maxVal = Math.max(item.lowStockThreshold * 2, item.quantity, 1)
                  const percent = Math.min(100, Math.round((item.quantity / maxVal) * 100))

                  return (
                    <Card key={item.id} className="glass-card p-4 rounded-2xl border-slate-200/80 dark:border-white/10 hover:border-blue-400/40 transition-all flex flex-col justify-between space-y-3">
                      <div>
                        {/* Header Badge Row */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{item.name}</h3>
                            {item.description && (
                              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{item.description}</p>
                            )}
                          </div>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                            out 
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' 
                              : low 
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' 
                              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {out ? 'Out of Stock' : low ? 'Low Stock' : 'Healthy'}
                          </span>
                        </div>

                        {/* Quantity Big Display */}
                        <div className="mt-3 flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl font-black text-slate-900 dark:text-white">
                              {item.quantity.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-slate-400 ml-1">{item.unit}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              ${((item.costPerUnit || 0) * item.quantity).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">${(item.costPerUnit || 0).toFixed(4)}/{item.unit}</span>
                          </div>
                        </div>

                        {/* Stock Progress Bar */}
                        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              out ? 'bg-rose-500 w-0' : low ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${out ? 0 : percent}%` }}
                          />
                        </div>

                        {/* Recipe Formulation Tag */}
                        <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Reorder Alert: ≤ {item.lowStockThreshold} {item.unit}</span>
                          {item.recipesCount > 0 ? (
                            <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Utensils className="w-3 h-3" />
                              <span>{item.recipesCount} Dishes</span>
                            </span>
                          ) : (
                            <span className="italic">Unassigned</span>
                          )}
                        </div>
                      </div>

                      {/* Card Action Controls */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.08] flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(item)}
                            className="h-7 w-7 p-0 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setWasteItem(item)
                              setWasteQuantity(item.unit === 'grams' || item.unit === 'ml' ? '100' : '1')
                              setWasteError(null)
                            }}
                            className="h-7 w-7 p-0 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                            title="Record wastage"
                          >
                            <TrendingDown className="w-3 h-3" />
                          </Button>
                        </div>
                    </Card>
                  )
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: WASTAGE & SPOILAGE LOG */}
      {/* ========================================================================= */}
      {activeTab === 'waste_log' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <div>
              <h2 className="text-base font-extrabold text-rose-950 dark:text-rose-200 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <span>Ingredients Wastage & Loss Audit</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every damaged, spoiled, or expired raw ingredient is automatically calculated against unit purchase cost and posted to general ledger.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Financial Loss</span>
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                ${totalLossAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <Card className="glass-panel rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Raw Ingredient</th>
                    <th className="px-4 py-3">Quantity Wasted</th>
                    <th className="px-4 py-3">Financial Loss</th>
                    <th className="px-4 py-3">Reason / Cause</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3">Operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
                  {wasteLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-60" />
                        <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No Spoilage / Waste Recorded</p>
                        <p className="text-[11px] mt-0.5">Excellent inventory control! All raw materials are fully accounted for.</p>
                      </td>
                    </tr>
                  ) : (
                    wasteLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {log.itemName}
                        </td>
                        <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">
                          {log.quantity} {log.unit || 'units'}
                        </td>
                        <td className="px-4 py-3 font-black text-rose-600 dark:text-rose-400">
                          ${(log.totalLoss || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {log.reason}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          {log.notes || '—'}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-400">
                          {log.staffId ? `Staff #${log.staffId.slice(0, 6)}` : 'Admin'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WHOLESALE & B2B DIRECT SALES */}
      {/* ========================================================================= */}
      {activeTab === 'b2b_sales' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
            <div>
              <h2 className="text-base font-extrabold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>Wholesale & Direct B2B Material Supply</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sell excess raw materials (e.g. coffee beans, syrups, milk) directly to partner cafes, distributors, or catering clients.
              </p>
            </div>
            <Button
              onClick={() => {
                setSoldError(null)
                if (inventory.length > 0 && !soldIngredientId) {
                  setSoldIngredientId(inventory[0].id)
                }
                setIsSoldDialogOpen(true)
              }}
              className="liquid-btn-primary font-bold text-xs h-9 rounded-xl shadow-md gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record Wholesale Sale</span>
            </Button>
          </div>

          <Card className="glass-panel rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Client / Reference</th>
                    <th className="px-4 py-3">Raw Material / Ingredient</th>
                    <th className="px-4 py-3">Quantity Sold</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Total B2B Revenue</th>
                    <th className="px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
                  {stockMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                        <Truck className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="font-bold text-sm">No wholesale material sales recorded yet</p>
                        <p className="text-[11px] mt-0.5">Click "Record Wholesale Sale" to dispatch stock to external buyers.</p>
                      </td>
                    </tr>
                  ) : (
                    stockMovements.map((move) => (
                      <tr key={move.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                          <span>{new Date(move.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-600 dark:text-indigo-400">
                          {move.reference || 'Wholesale Client'}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {move.ingredient?.name || 'Raw Material'}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {move.quantity} {move.ingredient?.unit || 'units'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300">
                          ${(move.unitCost || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-black text-emerald-600 dark:text-emerald-400">
                          ${(move.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-slate-400 truncate max-w-[200px]">
                          {move.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW INGREDIENT & STOCK */}
      {/* ========================================================================= */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl glass-panel p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Add Raw Ingredient to Inventory</span>
            </DialogTitle>
          </DialogHeader>

          {addIngredientError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addIngredientError}</span>
            </div>
          )}

          <form onSubmit={handleCreateIngredient} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-extrabold text-xs">Ingredient / Material Name *</Label>
              <Input
                placeholder="e.g. Specialty Espresso Beans, Whole Milk 1L, Madagascar Vanilla Syrup..."
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                required
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-xs text-slate-400">Description / Specifications</Label>
              <Input
                placeholder="e.g. Arabica single origin washed, 100% natural organic dairy"
                value={newItemDesc}
                onChange={(e) => setNewItemDesc(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-extrabold text-xs">Initial Stock Quantity *</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={newItemQuantity}
                  onChange={(e) => setNewItemQuantity(e.target.value)}
                  required
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-extrabold text-xs">Unit of Measure *</Label>
                <Select value={newItemUnit} onValueChange={(v) => setNewItemUnit(v)}>
                  <SelectTrigger className="h-9 text-xs rounded-xl font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grams">grams (g)</SelectItem>
                    <SelectItem value="kg">kilograms (kg)</SelectItem>
                    <SelectItem value="ml">milliliters (ml)</SelectItem>
                    <SelectItem value="liters">liters (L)</SelectItem>
                    <SelectItem value="pieces">pieces (pcs)</SelectItem>
                    <SelectItem value="shots">shots</SelectItem>
                    <SelectItem value="bags">bags</SelectItem>
                    <SelectItem value="boxes">boxes</SelectItem>
                    <SelectItem value="cans">cans</SelectItem>
                    <SelectItem value="bottles">bottles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-extrabold text-xs">Cost Per Unit ($) *</Label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  placeholder="0.025"
                  required
                  className="h-9 text-xs rounded-xl"
                />
                <span className="text-[10px] text-slate-400">Used for recipe COGS calculation</span>
              </div>

              <div className="space-y-1.5">
                <Label className="font-extrabold text-xs">Low Stock Alert Level *</Label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={newItemThreshold}
                  onChange={(e) => setNewItemThreshold(e.target.value)}
                  placeholder="50"
                  required
                  className="h-9 text-xs rounded-xl"
                />
                <span className="text-[10px] text-slate-400">Triggers reorder warning</span>
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="h-9 text-xs font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addSubmitting}
                className="liquid-btn-primary font-bold text-xs h-9 rounded-xl shadow-md"
              >
                {addSubmitting ? 'Saving...' : 'Add to Inventory'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 2: SUPPLIER PURCHASE ORDER & REPLENISHMENT */}
      {/* ========================================================================= */}
      <Dialog open={!!supplierRestockItem} onOpenChange={(open) => !open && setSupplierRestockItem(null)}>
        <DialogContent className="max-w-md rounded-3xl glass-panel p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <Truck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Purchase Order: {supplierRestockItem?.name}</span>
            </DialogTitle>
          </DialogHeader>

          {supplierRestockItem && (
            <form onSubmit={handleSupplierOrder} className="space-y-4 pt-2 text-xs">
              <div className="space-y-1.5">
                <Label className="font-extrabold text-xs">Select Supplier *</Label>
                {suppliers.length > 0 ? (
                  <Select value={selectedSupplierId} onValueChange={(v) => setSelectedSupplierId(v)}>
                    <SelectTrigger className="h-9 text-xs rounded-xl font-semibold">
                      <SelectValue placeholder="Choose Supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} {s.phone ? `(${s.phone})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px]">
                    No suppliers found. Please register suppliers in the Suppliers tab first.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-extrabold text-xs">Order Quantity ({supplierRestockItem.unit}) *</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0.1"
                    value={supplierOrderQty}
                    onChange={(e) => setSupplierOrderQty(e.target.value)}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-extrabold text-xs">Supplier Unit Cost ($) *</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={supplierUnitCost}
                    onChange={(e) => setSupplierUnitCost(e.target.value)}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Total Purchase Invoice:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  ${((parseFloat(supplierOrderQty) || 0) * (parseFloat(supplierUnitCost) || 0)).toFixed(2)}
                </span>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-xs text-slate-400">Order Notes / Delivery Details</Label>
                <Input
                  placeholder="e.g. Batch #402, Received at central kitchen store"
                  value={supplierOrderNotes}
                  onChange={(e) => setSupplierOrderNotes(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSupplierRestockItem(null)}
                  className="h-9 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={supplierOrderSubmitting || !selectedSupplierId}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 rounded-xl shadow-md"
                >
                  {supplierOrderSubmitting ? 'Processing...' : '⚡ Receive & Replenish Stock'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 4: SPOILAGE & WASTAGE RECORDING */}
      {/* ========================================================================= */}
      <Dialog open={!!wasteItem} onOpenChange={(open) => !open && setWasteItem(null)}>
        <DialogContent className="max-w-md rounded-3xl glass-panel p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-5 h-5" />
              <span>Record Ingredient Spoilage: {wasteItem?.name}</span>
            </DialogTitle>
          </DialogHeader>

          {wasteError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{wasteError}</span>
            </div>
          )}

          {wasteItem && (
            <form onSubmit={handleRecordWaste} className="space-y-4 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex justify-between items-center text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Stock</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {wasteItem.quantity.toLocaleString()} {wasteItem.unit}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Loss</span>
                  <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                    ${((parseFloat(wasteQuantity) || 0) * (wasteItem.costPerUnit || 0)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-extrabold text-xs">Quantity Damaged / Spoiled *</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0.01"
                    max={wasteItem.quantity}
                    value={wasteQuantity}
                    onChange={(e) => setWasteQuantity(e.target.value)}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                  <span className="text-[10px] text-slate-400">In {wasteItem.unit}</span>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-extrabold text-xs">Reason / Cause *</Label>
                  <Select value={wasteReason} onValueChange={(v) => setWasteReason(v)}>
                    <SelectTrigger className="h-9 text-xs rounded-xl font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expired">Expired Date / Stale</SelectItem>
                      <SelectItem value="spilled_dropped">Spilled / Physical Damage</SelectItem>
                      <SelectItem value="burnt_prep_error">Kitchen Error / Burnt</SelectItem>
                      <SelectItem value="quality_defect">Quality Defect / Sour</SelectItem>
                      <SelectItem value="training">Barista / Chef Training</SelectItem>
                      <SelectItem value="other">Other Incident</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-xs text-slate-400">Incident Notes</Label>
                <Input
                  placeholder="e.g. Milk bottle dropped during morning shift opening"
                  value={wasteNotes}
                  onChange={(e) => setWasteNotes(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWasteItem(null)}
                  className="h-9 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={wasteSubmitting}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-9 rounded-xl shadow-md"
                >
                  {wasteSubmitting ? 'Logging...' : 'Deduct & Log Spoilage'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 5: EDIT INGREDIENT */}
      {/* ========================================================================= */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md rounded-3xl glass-panel p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
              <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Edit Ingredient Details</span>
            </DialogTitle>
          </DialogHeader>

          {editError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{editError}</span>
            </div>
          )}

          {editItem && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2 text-xs">
              <div className="space-y-1.5">
                <Label className="font-extrabold text-xs">Ingredient Name *</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-bold text-xs text-slate-400">Description</Label>
                <Input
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-extrabold text-xs">Stock Quantity *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-extrabold text-xs">Unit of Measure *</Label>
                  <Input
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-extrabold text-xs">Unit Cost ($) *</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-extrabold text-xs">Low Stock Alert *</Label>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    value={editThreshold}
                    onChange={(e) => setEditThreshold(e.target.value)}
                    required
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditItem(null)}
                  className="h-9 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editSubmitting}
                  className="liquid-btn-primary font-bold text-xs h-9 rounded-xl shadow-md"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 6: DELETE INGREDIENT CONFIRMATION */}
      {/* ========================================================================= */}
      <Dialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <DialogContent className="max-w-md rounded-3xl glass-panel p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
              <span>Delete Ingredient: {deleteConfirmItem?.name}</span>
            </DialogTitle>
          </DialogHeader>

          {deleteError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <div className="space-y-3 pt-2 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              Are you sure you want to remove <strong>"{deleteConfirmItem?.name}"</strong> from your inventory?
            </p>
            {deleteConfirmItem && deleteConfirmItem.recipesCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>This ingredient is currently formulated in {deleteConfirmItem.recipesCount} dish recipe(s). Please unassign it first.</span>
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmItem(null)}
              className="h-9 text-xs font-semibold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteItem}
              disabled={deleteSubmitting}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-9 rounded-xl shadow-md"
            >
              {deleteSubmitting ? 'Deleting...' : 'Delete Ingredient'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL 7: WHOLESALE B2B SOLD */}
      {/* ========================================================================= */}
      <Dialog open={isSoldDialogOpen} onOpenChange={setIsSoldDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl glass-panel p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Truck className="w-5 h-5" />
              <span>Record Wholesale / B2B Supply Sale</span>
            </DialogTitle>
          </DialogHeader>

          {soldError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{soldError}</span>
            </div>
          )}

          <form onSubmit={handleRecordSoldB2B} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-extrabold text-xs">Select Raw Material / Ingredient *</Label>
              <Select value={soldIngredientId} onValueChange={(v) => setSoldIngredientId(v)}>
                <SelectTrigger className="h-9 text-xs rounded-xl font-semibold">
                  <SelectValue placeholder="Select raw ingredient..." />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((ing) => (
                    <SelectItem key={ing.id} value={ing.id}>
                      {ing.name} (Stock: {ing.quantity} {ing.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-extrabold text-xs">Client / Business Name *</Label>
              <Input
                placeholder="e.g. Downtown Coffee Roasters, Partner Bakery LLC"
                value={soldCustomer}
                onChange={(e) => setSoldCustomer(e.target.value)}
                required
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-extrabold text-xs">Quantity to Sell *</Label>
                <Input
                  type="number"
                  step="any"
                  min="0.1"
                  value={soldQuantity}
                  onChange={(e) => setSoldQuantity(e.target.value)}
                  required
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-extrabold text-xs">Selling Price Per Unit ($) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={soldUnitPrice}
                  onChange={(e) => setSoldUnitPrice(e.target.value)}
                  required
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Total B2B Sale Revenue:</span>
              <span className="font-black text-indigo-600 dark:text-indigo-400 text-sm">
                ${((parseFloat(soldQuantity) || 0) * (parseFloat(soldUnitPrice) || 0)).toFixed(2)}
              </span>
            </div>

            <div className="space-y-1.5">
              <Label className="font-bold text-xs text-slate-400">Notes / PO Reference</Label>
              <Input
                placeholder="e.g. Delivered 5 bags via courier, Invoice #B2B-109"
                value={soldNotes}
                onChange={(e) => setSoldNotes(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSoldDialogOpen(false)}
                className="h-9 text-xs font-semibold rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={soldSubmitting || !soldIngredientId}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-9 rounded-xl shadow-md"
              >
                {soldSubmitting ? 'Recording...' : 'Confirm B2B Sale'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
