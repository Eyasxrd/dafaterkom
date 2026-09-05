'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Minus, 
  AlertTriangle, 
  Package, 
  FileSpreadsheet, 
  PlusCircle, 
  RotateCcw,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface MenuItem {
  id: string
  name: string
  price: number
  category: { name: string }
}

interface InventoryItem {
  id: string
  quantity: number
  unit: string
  lowStockThreshold: number
  lastRestocked: string
  menuItem: MenuItem
}

interface InventoryManagerProps {
  onNavigateToImport?: () => void
}

export default function InventoryManager({ onNavigateToImport }: InventoryManagerProps) {
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Add Item / Stock Modal state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [creationMode, setCreationMode] = useState<'new_item' | 'existing_item'>('new_item')
  
  // New Item fields
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('5.00')
  const [newItemCategoryId, setNewItemCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newItemQuantity, setNewItemQuantity] = useState('50')
  const [newItemUnit, setNewItemUnit] = useState('pieces')
  const [newItemThreshold, setNewItemThreshold] = useState('10')
  const [newItemDesc, setNewItemDesc] = useState('')

  // Existing Item fields
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('')
  const [existingQuantity, setExistingQuantity] = useState('20')
  const [existingUnit, setExistingUnit] = useState('pieces')
  const [existingThreshold, setExistingThreshold] = useState('10')

  // Restock Quick Modal state
  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null)
  const [restockAmount, setRestockAmount] = useState('25')
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    fetchInventory()
    fetchMenuItems()
    fetchCategories()
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventory')
      const data = await response.json()
      if (Array.isArray(data)) {
        setInventory(data)
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu-items')
      const data = await response.json()
      if (Array.isArray(data)) {
        setMenuItems(data)
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (Array.isArray(data)) {
        setCategories(data)
        if (data.length > 0 && !newItemCategoryId) {
          setNewItemCategoryId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleCreateNewItemAndStock = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createNewItem: true,
          name: newItemName,
          price: newItemPrice,
          categoryId: newItemCategoryId === 'custom' ? undefined : newItemCategoryId,
          newCategoryName: newItemCategoryId === 'custom' ? newCategoryName : undefined,
          description: newItemDesc,
          quantity: newItemQuantity,
          unit: newItemUnit,
          lowStockThreshold: newItemThreshold
        })
      })

      const data = await response.json()
      if (response.ok) {
        setIsAddDialogOpen(false)
        setNewItemName('')
        setNewItemDesc('')
        setNewItemQuantity('50')
        fetchInventory()
        fetchMenuItems()
      } else {
        setActionError(data.error || 'Failed to create item and stock')
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to create item and stock')
    }
  }

  const handleAddStockToExisting = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionError(null)

    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId: selectedMenuItemId,
          quantity: existingQuantity,
          unit: existingUnit,
          lowStockThreshold: existingThreshold
        })
      })

      const data = await response.json()
      if (response.ok) {
        setIsAddDialogOpen(false)
        setSelectedMenuItemId('')
        fetchInventory()
      } else {
        setActionError(data.error || 'Failed to add stock')
      }
    } catch (err: any) {
      setActionError(err.message || 'Failed to add stock')
    }
  }

  const handleBatchRestock = async () => {
    if (!restockItem) return
    const addQty = parseInt(restockAmount, 10)
    if (isNaN(addQty) || addQty <= 0) return

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restock: true,
          inventoryId: restockItem.id,
          addQuantity: addQty
        })
      })

      if (res.ok) {
        setRestockItem(null)
        setRestockAmount('25')
        fetchInventory()
      }
    } catch (err) {
      console.error('Failed to restock:', err)
    }
  }

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    try {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      })
      if (response.ok) {
        fetchInventory()
      }
    } catch (error) {
      console.error('Failed to update quantity:', error)
    }
  }

  const isLowStock = (item: InventoryItem) => item.quantity <= item.lowStockThreshold

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading inventory...</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
            Inventory & Stock Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage sellable menu stock, batch restocks, and reorder alerts</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToImport}
              className="font-semibold gap-1.5 text-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Import from Excel</span>
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              setActionError(null)
              setIsAddDialogOpen(true)
            }}
            className="liquid-btn-primary font-bold gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item & Stock</span>
          </Button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Products</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-black text-slate-900 dark:text-white">{inventory.length}</p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Healthy Stock</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {inventory.filter(i => !isLowStock(i)).length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Low Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {inventory.filter(i => isLowStock(i)).length}
            </p>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Units</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {inventory.reduce((sum, i) => sum + i.quantity, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {inventory.map((item) => (
          <Card key={item.id} className={`glass-card ${isLowStock(item) ? 'border-rose-500/50 shadow-rose-500/10' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-start gap-2">
                <div>
                  <span className="text-base font-bold text-slate-900 dark:text-white leading-tight block">
                    {item.menuItem.name}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    ${item.menuItem.price.toFixed(2)} • {item.menuItem.category?.name || 'General'}
                  </span>
                </div>
                {isLowStock(item) && (
                  <span className="text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Low Stock</span>
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.05]">
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {item.quantity} <span className="text-xs font-semibold text-slate-400">{item.unit}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 rounded-lg"
                    onClick={() => handleUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-7 p-0 rounded-lg"
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setRestockItem(item)
                      setRestockAmount('25')
                    }}
                    className="h-7 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg ml-1"
                  >
                    + Restock
                  </Button>
                </div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Restocked: {new Date(item.lastRestocked).toLocaleDateString()}</span>
                <span>Alert: ≤ {item.lowStockThreshold} {item.unit}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Item & Stock Modal Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Item & Stock to Inventory</DialogTitle>
          </DialogHeader>

          {/* Mode Selector Toggle */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-2">
            <button
              type="button"
              onClick={() => setCreationMode('new_item')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                creationMode === 'new_item'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create New Product
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('existing_item')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                creationMode === 'existing_item'
                  ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Add to Existing Menu Item
            </button>
          </div>

          {actionError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
              {actionError}
            </div>
          )}

          {creationMode === 'new_item' ? (
            <form onSubmit={handleCreateNewItemAndStock} className="space-y-3 text-xs">
              <div>
                <Label className="text-xs font-semibold">Product Name</Label>
                <Input
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Croissant, Espresso Roast 250g"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Category</Label>
                  <Select value={newItemCategoryId} onValueChange={setNewItemCategoryId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                      <SelectItem value="custom">+ New Category...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Retail Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    placeholder="4.50"
                    className="mt-1"
                  />
                </div>
              </div>

              {newItemCategoryId === 'custom' && (
                <div>
                  <Label className="text-xs font-semibold">New Category Name</Label>
                  <Input
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Bakery, Cold Drinks"
                    className="mt-1"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Initial Stock</Label>
                  <Input
                    type="number"
                    required
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(e.target.value)}
                    placeholder="50"
                    className="mt-1 font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Unit</Label>
                  <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="grams">Grams (g)</SelectItem>
                      <SelectItem value="liters">Liters (L)</SelectItem>
                      <SelectItem value="ml">Milliliters (ml)</SelectItem>
                      <SelectItem value="cans">Cans / Bottles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Alert Below</Label>
                  <Input
                    type="number"
                    required
                    value={newItemThreshold}
                    onChange={(e) => setNewItemThreshold(e.target.value)}
                    placeholder="10"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold">Description (Optional)</Label>
                <Input
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Short item details"
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 liquid-btn-primary font-bold">
                  Create Product & Stock
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAddStockToExisting} className="space-y-3 text-xs">
              <div>
                <Label className="text-xs font-semibold">Select Menu Item</Label>
                <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose menu item..." />
                  </SelectTrigger>
                  <SelectContent>
                    {menuItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} (${item.price.toFixed(2)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs font-semibold">Stock Count</Label>
                  <Input
                    type="number"
                    required
                    value={existingQuantity}
                    onChange={(e) => setExistingQuantity(e.target.value)}
                    placeholder="20"
                    className="mt-1 font-bold"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Unit</Label>
                  <Select value={existingUnit} onValueChange={setExistingUnit}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pieces">Pieces</SelectItem>
                      <SelectItem value="kg">Kilograms (kg)</SelectItem>
                      <SelectItem value="grams">Grams (g)</SelectItem>
                      <SelectItem value="liters">Liters (L)</SelectItem>
                      <SelectItem value="ml">Milliliters (ml)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Alert Below</Label>
                  <Input
                    type="number"
                    required
                    value={existingThreshold}
                    onChange={(e) => setExistingThreshold(e.target.value)}
                    placeholder="10"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedMenuItemId} className="flex-1 liquid-btn-primary font-bold">
                  Save Stock
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Batch Restock Dialog */}
      <Dialog open={!!restockItem} onOpenChange={(open) => !open && setRestockItem(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Quick Restock: {restockItem?.menuItem.name}</DialogTitle>
          </DialogHeader>
          {restockItem && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Current Stock:</span>
                <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                  {restockItem.quantity} {restockItem.unit}
                </span>
              </div>

              <div>
                <Label className="text-xs font-semibold">Incoming Units to Add (+)</Label>
                <Input
                  type="number"
                  min="1"
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(e.target.value)}
                  className="mt-1 font-bold text-lg"
                />
              </div>

              {/* Quick Preset Chips */}
              <div className="flex gap-2">
                {['10', '25', '50', '100'].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setRestockAmount(chip)}
                    className="flex-1 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    +{chip}
                  </button>
                ))}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex justify-between items-center font-bold">
                <span className="text-slate-500">New Total after Restock:</span>
                <span className="text-blue-600 dark:text-blue-400 text-sm">
                  {restockItem.quantity + (parseInt(restockAmount, 10) || 0)} {restockItem.unit}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setRestockItem(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleBatchRestock} className="flex-1 liquid-btn-primary font-bold">
                  Confirm Restock
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
