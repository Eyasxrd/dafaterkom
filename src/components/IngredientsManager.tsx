'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Minus, 
  Trash2, 
  AlertTriangle, 
  FlaskConical, 
  ChefHat, 
  PlusCircle, 
  Scale, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  Search, 
  LayoutGrid, 
  List, 
  Edit2, 
  PackagePlus, 
  ArrowUpDown, 
  Download, 
  AlertCircle, 
  Clock, 
  DollarSign,
  GripVertical,
  MoveDown,
  Sparkles,
  Layers,
  Utensils,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Box
} from 'lucide-react'
import { getDefaultDrinkConfig, getDefaultFoodConfig } from '@/lib/item-customization'
import RecipeTreeManager from '@/components/recipe/RecipeTreeManager'

interface Ingredient {
  id: string
  name: string
  description: string | null
  quantity: number
  unit: string
  lowStockThreshold: number
  costPerUnit: number
  lastRestocked: string | null
}

interface Category {
  id: string
  name: string
}

interface MenuItem {
  id: string
  name: string
  price: number
  categoryId?: string
  category?: Category
}

interface Recipe {
  id: string
  menuItemId: string
  ingredientId: string
  quantity: number
  sizeMultipliers?: string | null
  isOptional?: boolean
  ingredient: Ingredient
  menuItem: MenuItem
}

export default function IngredientsManager() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Raw Ingredients Tab States
  const [ingredientSearch, setIngredientSearch] = useState('')
  const [ingredientStatusFilter, setIngredientStatusFilter] = useState<'all' | 'low' | 'out' | 'normal'>('all')
  const [ingredientUnitFilter, setIngredientUnitFilter] = useState<string>('all')
  const [ingredientSort, setIngredientSort] = useState<'name_asc' | 'name_desc' | 'qty_asc' | 'qty_desc' | 'cost_desc' | 'restocked_desc'>('name_asc')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Modals for Ingredients
  const [isAddIngredientOpen, setIsAddIngredientOpen] = useState(false)
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    description: '',
    quantity: '500',
    unit: 'grams',
    lowStockThreshold: '50',
    costPerUnit: '0'
  })
  const [addIngredientError, setAddIngredientError] = useState<string | null>(null)

  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [isEditIngredientOpen, setIsEditIngredientOpen] = useState(false)
  const [editIngredientForm, setEditIngredientForm] = useState({
    name: '',
    description: '',
    quantity: '0',
    unit: 'grams',
    lowStockThreshold: '10',
    costPerUnit: '0'
  })
  const [editIngredientError, setEditIngredientError] = useState<string | null>(null)

  const [ingredientToDelete, setIngredientToDelete] = useState<Ingredient | null>(null)
  const [isDeleteIngredientOpen, setIsDeleteIngredientOpen] = useState(false)
  const [deleteIngredientError, setDeleteIngredientError] = useState<string | null>(null)

  // ================= RECIPE STUDIO / WORKBENCH STATES =================
  const [recipeStudioMode, setRecipeStudioMode] = useState<'studio' | 'cards'>('studio')
  const [selectedDishId, setSelectedDishId] = useState<string>('')
  const [dishSearchQuery, setDishSearchQuery] = useState('')
  const [isDishSelectorOpen, setIsDishSelectorOpen] = useState(false)
  const dishSelectorRef = useRef<HTMLDivElement>(null)

  const [shelfSearch, setShelfSearch] = useState('')
  const [shelfUnitFilter, setShelfUnitFilter] = useState<string>('all')
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState(false)
  const [draggedIngredientId, setDraggedIngredientId] = useState<string | null>(null)

  // Recipe Grid View States
  const [recipeSearch, setRecipeSearch] = useState('')
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<string>('all')
  const [recipeStatusFilter, setRecipeStatusFilter] = useState<'all' | 'formulated' | 'unformulated' | 'lowStock'>('all')

  // Sizing Modal States
  const [sizingModalRecipe, setSizingModalRecipe] = useState<Recipe | null>(null)
  const [sizingForm, setSizingForm] = useState<{ sQty: string; mQty: string; lQty: string }>({ sQty: '', mQty: '', lQty: '' })

  // Costing Tab States
  const [costingSearch, setCostingSearch] = useState('')
  const [costingMarginFilter, setCostingMarginFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')
  const [costingCategoryFilter, setCostingCategoryFilter] = useState<string>('all')
  const [costingSort, setCostingSort] = useState<'margin_desc' | 'margin_asc' | 'cost_desc' | 'price_desc' | 'name_asc'>('margin_desc')

  // Close dish combobox when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dishSelectorRef.current && !dishSelectorRef.current.contains(event.target as Node)) {
        setIsDishSelectorOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchIngredients(),
        fetchMenuItems(),
        fetchRecipes(),
        fetchCategories()
      ])
    } catch (error) {
      console.error('Failed to load ingredients data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients')
      const data = await response.json()
      if (Array.isArray(data)) setIngredients(data)
    } catch (error) {
      console.error('Failed to fetch ingredients:', error)
    }
  }

  const fetchMenuItems = async () => {
    try {
      const response = await fetch('/api/menu-items')
      const data = await response.json()
      if (Array.isArray(data)) {
        setMenuItems(data)
        if (data.length > 0 && !selectedDishId) {
          setSelectedDishId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch menu items:', error)
    }
  }

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes')
      const data = await response.json()
      if (Array.isArray(data)) setRecipes(data)
    } catch (error) {
      console.error('Failed to fetch recipes:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      if (Array.isArray(data)) setCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const getIngredientEffectiveCost = (ing: Ingredient): number => {
    if (ing.costPerUnit && ing.costPerUnit > 0) return ing.costPerUnit
    const lower = ing.name.toLowerCase()
    if (lower.includes('bean') || lower.includes('espresso') || lower.includes('coffee')) return 0.028
    if (lower.includes('oat') && lower.includes('milk')) return 0.0045
    if (lower.includes('milk')) return 0.0025
    if (lower.includes('syrup')) return 0.015
    if (lower.includes('matcha')) return 0.08
    if (lower.includes('chocolate') || lower.includes('cocoa')) return 0.02
    if (lower.includes('tea')) return 0.04
    if (lower.includes('sugar')) return 0.001
    if (lower.includes('dough') || lower.includes('croissant')) return 0.85
    if (lower.includes('butter')) return 0.012
    if (lower.includes('egg')) return 0.25
    if (lower.includes('flour')) return 0.0015
    if (ing.unit === 'grams' || ing.unit === 'g') return 0.015
    if (ing.unit === 'ml') return 0.003
    return 0.10
  }

  const isLowStock = (ingredient: Ingredient) => ingredient.quantity > 0 && ingredient.quantity <= ingredient.lowStockThreshold
  const isOutOfStock = (ingredient: Ingredient) => ingredient.quantity <= 0

  const getMenuItemRecipes = (menuItemId: string) => {
    return recipes.filter(r => r.menuItemId === menuItemId)
  }

  const calculateRecipeCogs = (itemRecipes: Recipe[]) => {
    return itemRecipes.reduce((sum, r) => {
      const ingCost = getIngredientEffectiveCost(r.ingredient)
      return sum + (r.quantity * ingCost)
    }, 0)
  }

  // Active dish in Recipe Studio Workbench
  const activeDish = useMemo(() => {
    return menuItems.find(m => m.id === selectedDishId) || menuItems[0] || null
  }, [menuItems, selectedDishId])

  // Filtered menu items for the searchable workbench selector
  const filteredDishesForSelector = useMemo(() => {
    if (!dishSearchQuery.trim()) return menuItems
    const q = dishSearchQuery.toLowerCase()
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.category?.name || '').toLowerCase().includes(q)
    )
  }, [menuItems, dishSearchQuery])

  const handlePrevDish = () => {
    if (menuItems.length === 0) return
    const currentIndex = menuItems.findIndex((m) => m.id === (activeDish?.id || selectedDishId))
    if (currentIndex > 0) {
      setSelectedDishId(menuItems[currentIndex - 1].id)
    } else {
      setSelectedDishId(menuItems[menuItems.length - 1].id)
    }
  }

  const handleNextDish = () => {
    if (menuItems.length === 0) return
    const currentIndex = menuItems.findIndex((m) => m.id === (activeDish?.id || selectedDishId))
    if (currentIndex >= 0 && currentIndex < menuItems.length - 1) {
      setSelectedDishId(menuItems[currentIndex + 1].id)
    } else {
      setSelectedDishId(menuItems[0].id)
    }
  }

  const activeDishRecipes = useMemo(() => {
    if (!activeDish) return []
    return recipes.filter(r => r.menuItemId === activeDish.id)
  }, [recipes, activeDish])

  const activeDishCogs = useMemo(() => {
    return calculateRecipeCogs(activeDishRecipes)
  }, [activeDishRecipes])

  // Calculate max servings preparable for active dish based on raw materials inventory
  const maxServingsAvailable = useMemo(() => {
    if (!activeDishRecipes || activeDishRecipes.length === 0) return 0
    let minServings = Infinity
    for (const r of activeDishRecipes) {
      if (r.quantity <= 0) continue
      const ing = ingredients.find(i => i.id === r.ingredientId) || r.ingredient
      const possible = Math.floor((ing?.quantity || 0) / r.quantity)
      if (possible < minServings) minServings = possible
    }
    return minServings === Infinity ? 0 : Math.max(0, minServings)
  }, [activeDishRecipes, ingredients])

  // --- CRUD Handlers ---

  const handleAddIngredient = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddIngredientError(null)
    try {
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIngredient)
      })
      if (response.ok) {
        setIsAddIngredientOpen(false)
        setFeedback({ type: 'success', message: `Ingredient "${newIngredient.name}" added successfully!` })
        setNewIngredient({ name: '', description: '', quantity: '500', unit: 'grams', lowStockThreshold: '50', costPerUnit: '0' })
        fetchIngredients()
      } else {
        const err = await response.json()
        setAddIngredientError(err.error || 'Failed to add ingredient')
      }
    } catch (error: any) {
      setAddIngredientError(error.message || 'Failed to add ingredient')
    }
  }

  const openEditIngredient = (ing: Ingredient) => {
    setEditingIngredient(ing)
    setEditIngredientForm({
      name: ing.name,
      description: ing.description || '',
      quantity: String(ing.quantity),
      unit: ing.unit,
      lowStockThreshold: String(ing.lowStockThreshold),
      costPerUnit: String(ing.costPerUnit || '0')
    })
    setEditIngredientError(null)
    setIsEditIngredientOpen(true)
  }

  const handleUpdateIngredient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingIngredient) return
    setEditIngredientError(null)
    try {
      const response = await fetch(`/api/ingredients/${editingIngredient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editIngredientForm)
      })
      if (response.ok) {
        setIsEditIngredientOpen(false)
        setFeedback({ type: 'success', message: `Ingredient "${editIngredientForm.name}" updated successfully!` })
        fetchIngredients()
        fetchRecipes()
      } else {
        const err = await response.json()
        setEditIngredientError(err.error || 'Failed to update ingredient')
      }
    } catch (error: any) {
      setEditIngredientError(error.message || 'Failed to update ingredient')
    }
  }

  const handleQuickQuantityDelta = async (ing: Ingredient, delta: number) => {
    const newQty = Math.max(0, Math.round((ing.quantity + delta) * 100) / 100)
    try {
      const response = await fetch(`/api/ingredients/${ing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQty })
      })
      if (response.ok) {
        fetchIngredients()
        setFeedback({ type: 'success', message: `${ing.name} stock adjusted to ${newQty} ${ing.unit}` })
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to adjust stock' })
    }
  }

  const openDeleteModal = (ing: Ingredient) => {
    setIngredientToDelete(ing)
    setDeleteIngredientError(null)
    setIsDeleteIngredientOpen(true)
  }

  const handleDeleteIngredient = async () => {
    if (!ingredientToDelete) return
    setDeleteIngredientError(null)
    try {
      const response = await fetch(`/api/ingredients/${ingredientToDelete.id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setIsDeleteIngredientOpen(false)
        setFeedback({ type: 'success', message: `Ingredient "${ingredientToDelete.name}" deleted.` })
        fetchIngredients()
      } else {
        const data = await response.json()
        setDeleteIngredientError(data.error || 'Cannot delete this ingredient because it is used in active recipes.')
      }
    } catch (error: any) {
      setDeleteIngredientError(error.message || 'Error deleting ingredient')
    }
  }

  // ================= DRAG AND DROP RECIPE HANDLERS =================

  // Add or attach ingredient to active dish (called via Drop or "+" button)
  const handleAddIngredientToActiveDish = async (ingredientId: string, defaultQty?: number) => {
    if (!activeDish) return
    const targetIngredient = ingredients.find(i => i.id === ingredientId)
    if (!targetIngredient) return

    // Check if ingredient is already in the recipe
    const existing = activeDishRecipes.find(r => r.ingredientId === ingredientId)
    const qtyToSet = existing ? existing.quantity + 5 : (defaultQty || (targetIngredient.unit === 'pieces' || targetIngredient.unit === 'shots' ? 1 : 15))

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId: activeDish.id,
          ingredientId: targetIngredient.id,
          quantity: qtyToSet
        })
      })
      if (response.ok) {
        fetchRecipes()
        setFeedback({ 
          type: 'success', 
          message: existing 
            ? `Updated ${targetIngredient.name} to ${qtyToSet} ${targetIngredient.unit} in ${activeDish.name}`
            : `Added ${targetIngredient.name} (${qtyToSet} ${targetIngredient.unit}) to ${activeDish.name}`
        })
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to add ingredient to recipe' })
    }
  }

  const handleUpdateRecipeQuantity = async (recipeId: string, qty: number) => {
    if (qty <= 0) {
      handleDeleteRecipe(recipeId)
      return
    }
    try {
      const response = await fetch(`/api/recipes/${recipeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: qty })
      })
      if (response.ok) {
        fetchRecipes()
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Could not update recipe quantity.' })
    }
  }

  const handleToggleRecipeOptional = async (recipe: Recipe) => {
    try {
      const newVal = !recipe.isOptional
      const response = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOptional: newVal })
      })
      if (response.ok) {
        fetchRecipes()
        setFeedback({ 
          type: 'success', 
          message: newVal 
            ? `Marked "${recipe.ingredient.name}" as an optional modifier` 
            : `Marked "${recipe.ingredient.name}" as a core base recipe item` 
        })
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to update recipe option status' })
    }
  }

  const openSizingModal = (recipe: Recipe) => {
    setSizingModalRecipe(recipe)
    let parsed: any = null
    try {
      if (recipe.sizeMultipliers) {
        parsed = JSON.parse(recipe.sizeMultipliers)
      }
    } catch {}

    const base = recipe.quantity || 15
    setSizingForm({
      sQty: parsed?.S !== undefined ? String(parsed.S) : String(Math.round(base * 0.75 * 10) / 10),
      mQty: parsed?.M !== undefined ? String(parsed.M) : String(base),
      lQty: parsed?.L !== undefined ? String(parsed.L) : String(Math.round(base * 1.5 * 10) / 10)
    })
  }

  const handleSaveSizing = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sizingModalRecipe) return
    const sizeMap = {
      S: parseFloat(sizingForm.sQty) || sizingModalRecipe.quantity,
      M: parseFloat(sizingForm.mQty) || sizingModalRecipe.quantity,
      L: parseFloat(sizingForm.lQty) || sizingModalRecipe.quantity
    }
    try {
      const response = await fetch(`/api/recipes/${sizingModalRecipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sizeMultipliers: sizeMap })
      })
      if (response.ok) {
        setSizingModalRecipe(null)
        fetchRecipes()
        setFeedback({ type: 'success', message: `Saved cup size scaling for ${sizingModalRecipe.ingredient.name}` })
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Failed to save size scaling' })
    }
  }

  const handleDeleteRecipe = async (id: string) => {
    try {
      const response = await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchRecipes()
        setFeedback({ type: 'success', message: 'Ingredient removed from formulation.' })
      }
    } catch (error) {
      setFeedback({ type: 'error', message: 'Error removing recipe ingredient.' })
    }
  }

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, ingredient: Ingredient) => {
    e.dataTransfer.setData('text/plain', ingredient.id)
    e.dataTransfer.setData('application/json', JSON.stringify(ingredient))
    setDraggedIngredientId(ingredient.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    if (!isDraggingOverCanvas) setIsDraggingOverCanvas(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOverCanvas(false)
  }

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOverCanvas(false)
    const ingredientId = e.dataTransfer.getData('text/plain')
    if (ingredientId) {
      handleAddIngredientToActiveDish(ingredientId)
    }
    setDraggedIngredientId(null)
  }

  // --- Export Helpers ---
  const exportIngredientsCSV = () => {
    const headers = ['Name', 'Description', 'Current Stock', 'Unit', 'Alert Threshold', 'Cost Per Unit', 'Total Valuation', 'Last Restocked']
    const rows = ingredients.map(ing => [
      `"${ing.name.replace(/"/g, '""')}"`,
      `"${(ing.description || '').replace(/"/g, '""')}"`,
      ing.quantity,
      ing.unit,
      ing.lowStockThreshold,
      (ing.costPerUnit || 0).toFixed(4),
      ((ing.costPerUnit || 0) * ing.quantity).toFixed(2),
      ing.lastRestocked ? new Date(ing.lastRestocked).toLocaleDateString() : 'N/A'
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `raw_ingredients_inventory_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportCostingCSV = () => {
    const headers = ['Menu Item', 'Category', 'Selling Price', 'Recipe COGS', 'Gross Profit', 'Food Cost %', 'Gross Margin %', 'Profit Rating']
    const rows = menuItems.map(item => {
      const itemRecipes = getMenuItemRecipes(item.id)
      const cogs = calculateRecipeCogs(itemRecipes)
      const grossProfit = Math.max(0, item.price - cogs)
      const foodCostRatio = item.price > 0 && itemRecipes.length > 0 ? (cogs / item.price) * 100 : 0
      const marginRatio = item.price > 0 && itemRecipes.length > 0 ? ((item.price - cogs) / item.price) * 100 : 0
      const rating = itemRecipes.length === 0 ? 'Unformulated' : marginRatio >= 70 ? 'High Profit Star' : marginRatio >= 50 ? 'Healthy Margin' : 'Review Price'
      return [
        `"${item.name.replace(/"/g, '""')}"`,
        `"${(item.category?.name || 'General').replace(/"/g, '""')}"`,
        item.price.toFixed(2),
        itemRecipes.length > 0 ? cogs.toFixed(2) : '0.00',
        itemRecipes.length > 0 ? grossProfit.toFixed(2) : '0.00',
        itemRecipes.length > 0 ? `${foodCostRatio.toFixed(1)}%` : '0%',
        itemRecipes.length > 0 ? `${marginRatio.toFixed(1)}%` : '0%',
        rating
      ]
    })
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `menu_costing_margins_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Available unique units for filtering
  const availableUnits = useMemo(() => {
    const unitsSet = new Set<string>()
    ingredients.forEach(i => { if (i.unit) unitsSet.add(i.unit) })
    return Array.from(unitsSet)
  }, [ingredients])

  // KPIs
  const totalIngredientsCount = ingredients.length
  const lowStockCount = ingredients.filter(i => isLowStock(i)).length
  const outOfStockCount = ingredients.filter(i => isOutOfStock(i)).length
  const inStockCount = ingredients.filter(i => !isLowStock(i) && !isOutOfStock(i)).length
  const totalValuation = ingredients.reduce((sum, i) => sum + (i.quantity * (i.costPerUnit || getIngredientEffectiveCost(i))), 0)

  const formulatedMenuItemsCount = menuItems.filter(m => getMenuItemRecipes(m.id).length > 0).length
  const formulationCoverage = menuItems.length > 0 ? Math.round((formulatedMenuItemsCount / menuItems.length) * 100) : 0

  // Filtered Raw Ingredients for Inventory Tab
  const filteredIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      if (ingredientSearch) {
        const query = ingredientSearch.toLowerCase()
        const matchName = ing.name.toLowerCase().includes(query)
        const matchDesc = (ing.description || '').toLowerCase().includes(query)
        if (!matchName && !matchDesc) return false
      }
      if (ingredientStatusFilter === 'low' && !isLowStock(ing)) return false
      if (ingredientStatusFilter === 'out' && !isOutOfStock(ing)) return false
      if (ingredientStatusFilter === 'normal' && (isLowStock(ing) || isOutOfStock(ing))) return false
      if (ingredientUnitFilter !== 'all' && ing.unit !== ingredientUnitFilter) return false

      return true
    }).sort((a, b) => {
      if (ingredientSort === 'name_asc') return a.name.localeCompare(b.name)
      if (ingredientSort === 'name_desc') return b.name.localeCompare(a.name)
      if (ingredientSort === 'qty_asc') return a.quantity - b.quantity
      if (ingredientSort === 'qty_desc') return b.quantity - a.quantity
      if (ingredientSort === 'cost_desc') return (b.costPerUnit || 0) - (a.costPerUnit || 0)
      if (ingredientSort === 'restocked_desc') {
        const dateA = a.lastRestocked ? new Date(a.lastRestocked).getTime() : 0
        const dateB = b.lastRestocked ? new Date(b.lastRestocked).getTime() : 0
        return dateB - dateA
      }
      return 0
    })
  }, [ingredients, ingredientSearch, ingredientStatusFilter, ingredientUnitFilter, ingredientSort])

  // Filtered Raw Materials for the Recipe Studio Shelf
  const filteredShelfIngredients = useMemo(() => {
    return ingredients.filter(ing => {
      if (shelfSearch) {
        const q = shelfSearch.toLowerCase()
        if (!ing.name.toLowerCase().includes(q) && !(ing.description || '').toLowerCase().includes(q)) return false
      }
      if (shelfUnitFilter !== 'all' && ing.unit !== shelfUnitFilter) return false
      return true
    })
  }, [ingredients, shelfSearch, shelfUnitFilter])

  // Filtered Menu Items for Recipe Cards View
  const filteredMenuItemsForRecipes = useMemo(() => {
    return menuItems.filter(item => {
      if (recipeSearch) {
        const query = recipeSearch.toLowerCase()
        if (!item.name.toLowerCase().includes(query)) return false
      }
      if (recipeCategoryFilter !== 'all' && item.categoryId !== recipeCategoryFilter) return false

      const itemRecipes = getMenuItemRecipes(item.id)
      if (recipeStatusFilter === 'formulated' && itemRecipes.length === 0) return false
      if (recipeStatusFilter === 'unformulated' && itemRecipes.length > 0) return false
      if (recipeStatusFilter === 'lowStock') {
        const hasLow = itemRecipes.some(r => isLowStock(r.ingredient) || isOutOfStock(r.ingredient))
        if (!hasLow) return false
      }
      return true
    })
  }, [menuItems, recipes, recipeSearch, recipeCategoryFilter, recipeStatusFilter])

  // Filtered Costing items
  const filteredCostingItems = useMemo(() => {
    return menuItems.filter(item => {
      if (costingSearch && !item.name.toLowerCase().includes(costingSearch.toLowerCase())) return false
      if (costingCategoryFilter !== 'all' && item.categoryId !== costingCategoryFilter) return false

      const itemRecipes = getMenuItemRecipes(item.id)
      const cogs = calculateRecipeCogs(itemRecipes)
      const margin = item.price > 0 ? ((item.price - cogs) / item.price) * 100 : 0

      if (costingMarginFilter === 'high' && (itemRecipes.length === 0 || margin < 70)) return false
      if (costingMarginFilter === 'medium' && (itemRecipes.length === 0 || margin < 50 || margin >= 70)) return false
      if (costingMarginFilter === 'low' && (itemRecipes.length === 0 || margin >= 50)) return false

      return true
    }).sort((a, b) => {
      const rA = getMenuItemRecipes(a.id)
      const rB = getMenuItemRecipes(b.id)
      const cogsA = calculateRecipeCogs(rA)
      const cogsB = calculateRecipeCogs(rB)
      const marginA = a.price > 0 && rA.length > 0 ? ((a.price - cogsA) / a.price) * 100 : -1
      const marginB = b.price > 0 && rB.length > 0 ? ((b.price - cogsB) / b.price) * 100 : -1

      if (costingSort === 'margin_desc') return marginB - marginA
      if (costingSort === 'margin_asc') return marginA - marginB
      if (costingSort === 'cost_desc') return cogsB - cogsA
      if (costingSort === 'price_desc') return b.price - a.price
      if (costingSort === 'name_asc') return a.name.localeCompare(b.name)
      return 0
    })
  }, [menuItems, recipes, costingSearch, costingCategoryFilter, costingMarginFilter, costingSort])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading inventory formulations...</p>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Executive Feedback Notification */}
      {feedback && (
        <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
          feedback.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-950 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header & KPI Summary Bar */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-2 border-b border-slate-200/70 dark:border-white/[0.08]">
          <div>
            <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
              Ingredients & Recipe Studio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Drag-and-drop recipe builder, raw stock inventory, and real-time margin engineering
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={exportIngredientsCSV}
              variant="outline"
              size="sm"
              className="text-xs font-semibold gap-1.5 glass-card"
              title="Export all raw ingredients and stock levels to a CSV spreadsheet"
              aria-label="Export raw ingredients CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </Button>
            <Button
              onClick={() => {
                setAddIngredientError(null)
                setIsAddIngredientOpen(true)
              }}
              className="liquid-btn-primary font-bold gap-2 text-xs shadow-md shadow-blue-500/20"
              title="Open dialog to create a new raw material/ingredient in inventory"
              aria-label="Add raw ingredient"
            >
              <Plus className="w-4 h-4" />
              <span>Add Raw Ingredient</span>
            </Button>
          </div>
        </div>

        {/* Recipe Studio Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="glass-card p-3.5">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider">Recipe Coverage</span>
              <ChefHat className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{formulationCoverage}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{formulatedMenuItemsCount} of {menuItems.length} dishes formulated</p>
          </Card>

          <Card className="glass-card p-3.5">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider">Total Menu Dishes</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{menuItems.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{categories.length} active menu categories</p>
          </Card>

          <Card className="glass-card p-3.5">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">Raw Material Shelf</span>
              <FlaskConical className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{ingredients.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Available formulation materials</p>
          </Card>

          <Card className="glass-card p-3.5">
            <div className="flex justify-between items-start">
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider">Active Recipes</span>
              <Award className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{recipes.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Total ingredient links & grammages</p>
          </Card>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <Tabs defaultValue="tree" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-xl mx-auto h-11 p-1 bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-300/40 dark:border-white/[0.08]">
          <TabsTrigger value="tree" className="gap-2 font-bold text-xs rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>Tree Recipe Builder</span>
          </TabsTrigger>
          <TabsTrigger value="interactive" className="gap-2 font-bold text-xs rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
            <ChefHat className="w-4 h-4 text-amber-500" />
            <span>Interactive Studio</span>
          </TabsTrigger>
          <TabsTrigger value="costing" className="gap-2 font-bold text-xs rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Costing & Margins</span>
          </TabsTrigger>
        </TabsList>

        {/* ========================================================================= */}
        {/* TAB 0: TREE-BASED HIERARCHICAL RECIPE SYSTEM (Category -> Item -> Sizes)  */}
        {/* ========================================================================= */}
        <TabsContent value="tree" className="space-y-4 pt-4">
          <RecipeTreeManager
            categories={categories}
            menuItems={menuItems}
            ingredients={ingredients}
            recipes={recipes}
            onRefreshData={fetchAllData}
            onRecipeUpdated={fetchRecipes}
          />
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 1: RECIPE BUILDER & INTERACTIVE DRAG-AND-DROP STUDIO */}
        {/* ========================================================================= */}
        <TabsContent value="interactive" className="space-y-4 pt-4">
          {/* Studio Header Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-3 bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Recipe Workbench
              </span>
              <span className="text-[11px] text-slate-400">
                • Drag & drop ingredients from the shelf or search & click "+" to assemble formulas
              </span>
            </div>

              {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-300/40 dark:border-white/[0.08]">
              <button
                onClick={() => setRecipeStudioMode('studio')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  recipeStudioMode === 'studio' 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Switch to interactive drag-and-drop recipe formulation workbench"
                aria-label="Interactive Studio view"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Interactive Studio</span>
              </button>
              <button
                onClick={() => setRecipeStudioMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  recipeStudioMode === 'cards' 
                    ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
                title="Switch to grid cards overview of all menu dishes and recipe formulations"
                aria-label="Overview Cards view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Overview Cards</span>
              </button>
            </div>
          </div>

          {/* ================= VIEW 1: INTERACTIVE SPLIT STUDIO ================= */}
          {recipeStudioMode === 'studio' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT COLUMN: RAW INGREDIENTS INVENTORY SHELF (5 Cols) */}
              <div className="lg:col-span-5 space-y-3">
                <Card className="glass-card flex flex-col h-[640px]">
                  <CardHeader className="p-4 pb-3 border-b border-slate-200/60 dark:border-white/[0.08]">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-900 dark:text-white">
                        <Box className="w-4 h-4 text-blue-500" />
                        <span>Inventory Shelf</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                          {filteredShelfIngredients.length} Items
                        </span>
                      </CardTitle>
                      <span className="text-[10px] text-slate-400 font-semibold">Drag or Click +</span>
                    </div>

                    {/* Shelf Search */}
                    <div className="relative mt-2">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={shelfSearch}
                        onChange={(e) => setShelfSearch(e.target.value)}
                        placeholder="Search inventory ingredients..."
                        className="pl-8 text-xs h-8 rounded-xl bg-white/80 dark:bg-slate-900/80"
                        title="Filter raw ingredients on shelf by name or description"
                      />
                      {shelfSearch && (
                        <button
                          onClick={() => setShelfSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
                          title="Clear search query"
                          aria-label="Clear shelf search"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Shelf Unit Filters */}
                    {availableUnits.length > 0 && (
                      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 no-scrollbar">
                        <button
                          onClick={() => setShelfUnitFilter('all')}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 transition-colors cursor-pointer ${
                            shelfUnitFilter === 'all'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                          title="Show all raw ingredient units"
                        >
                          All
                        </button>
                        {availableUnits.map(unit => (
                          <button
                            key={unit}
                            onClick={() => setShelfUnitFilter(unit)}
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 transition-colors cursor-pointer ${
                              shelfUnitFilter === unit
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                            }`}
                            title={`Filter raw materials by unit: ${unit}`}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                    )}
                  </CardHeader>

                  {/* Scrollable Draggable Shelf Items */}
                  <CardContent className="p-3 flex-1 overflow-y-auto space-y-2">
                    {filteredShelfIngredients.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-xs">
                        <FlaskConical className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold">No matching ingredients</p>
                        <p className="text-[10px] text-slate-400 mt-1">Try another search query or add a new raw material</p>
                      </div>
                    ) : (
                      filteredShelfIngredients.map((ing) => {
                        const isLow = isLowStock(ing)
                        const isOut = isOutOfStock(ing)
                        const effCost = ing.costPerUnit || getIngredientEffectiveCost(ing)
                        const inCurrentRecipe = activeDishRecipes.find(r => r.ingredientId === ing.id)

                        return (
                          <div
                            key={ing.id}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, ing)}
                            className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing select-none ${
                              inCurrentRecipe
                                ? 'bg-blue-500/10 border-blue-500/30 text-blue-950 dark:text-blue-200 shadow-xs'
                                : 'bg-white/60 dark:bg-white/[0.03] border-slate-200/60 dark:border-white/[0.06] hover:border-blue-500/40 hover:bg-blue-50/30 dark:hover:bg-blue-900/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <GripVertical className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-blue-500 transition-colors" />
                              <div className="truncate">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                                    {ing.name}
                                  </span>
                                  {isOut ? (
                                    <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-rose-500/15 text-rose-600">
                                      Out
                                    </span>
                                  ) : isLow ? (
                                    <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-500/15 text-amber-600">
                                      Low
                                    </span>
                                  ) : null}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  <span>{ing.quantity} {ing.unit} in stock</span>
                                  <span>•</span>
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                                    ${effCost.toFixed(3)}/{ing.unit}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Quick Action Button */}
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {inCurrentRecipe && (
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded bg-blue-500/15">
                                  {inCurrentRecipe.quantity}{ing.unit}
                                </span>
                              )}
                              <Button
                                size="sm"
                                variant={inCurrentRecipe ? "default" : "outline"}
                                onClick={() => handleAddIngredientToActiveDish(ing.id)}
                                className="h-7 px-2 text-[11px] font-bold gap-1 rounded-lg cursor-pointer"
                                title={`Add ${ing.name} to formulation (${activeDish?.name || 'current dish'})`}
                                aria-label={`Add ${ing.name} to recipe`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </Button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* RIGHT COLUMN: ACTIVE RECIPE CANVAS & DROP ZONE (7 Cols) */}
              <div className="lg:col-span-7 space-y-3">
                <Card className="glass-card flex flex-col h-[640px]">
                  {/* Dish Selector Header */}
                  <CardHeader className="p-4 pb-3 border-b border-slate-200/60 dark:border-white/[0.08]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Active Recipe Formulation
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Utensils className="w-4 h-4 text-amber-500" />
                          <h2 className="text-lg font-black text-slate-900 dark:text-white">
                            {activeDish?.name || 'Select a Menu Item'}
                          </h2>
                          {activeDish && (
                            <span className="text-xs font-bold text-slate-400">
                              (${activeDish.price.toFixed(2)})
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Searchable Dish Selector with Prev / Next Navigation */}
                      <div className="flex items-center gap-1.5 w-full sm:w-auto relative" ref={dishSelectorRef}>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={handlePrevDish}
                          disabled={menuItems.length <= 1}
                          className="h-8 w-8 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                          title="Previous menu item (switch dish)"
                          aria-label="Previous menu item"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </Button>

                        {/* Searchable Dropdown Button */}
                        <div className="relative w-full sm:w-[260px]">
                          <button
                            type="button"
                            onClick={() => setIsDishSelectorOpen(!isDishSelectorOpen)}
                            className="w-full h-8 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-bold flex items-center justify-between gap-2 shadow-xs hover:border-blue-500/50 transition-all text-left cursor-pointer"
                            title="Click to search and select any menu item to formulate its recipe"
                            aria-label="Search and select menu item"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Search className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                              <span className="truncate text-slate-800 dark:text-slate-200">
                                {activeDish ? `${activeDish.name} ($${activeDish.price.toFixed(2)})` : 'Search menu dish...'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">▼</span>
                          </button>

                          {/* Dropdown Popover */}
                          {isDishSelectorOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 z-50 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/15 shadow-xl space-y-2 animate-in fade-in zoom-in-95 duration-100">
                              <div className="relative">
                                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <Input
                                  autoFocus
                                  value={dishSearchQuery}
                                  onChange={(e) => setDishSearchQuery(e.target.value)}
                                  placeholder="Search by name or category..."
                                  className="h-8 pl-8 text-xs rounded-xl bg-slate-50 dark:bg-slate-800"
                                  title="Type to search menu dishes"
                                />
                                {dishSearchQuery && (
                                  <button
                                    onClick={() => setDishSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600"
                                    title="Clear search query"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>

                              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                                {filteredDishesForSelector.length === 0 ? (
                                  <div className="p-3 text-center text-xs text-slate-400">
                                    No menu items matching "{dishSearchQuery}"
                                  </div>
                                ) : (
                                  filteredDishesForSelector.map((item) => {
                                    const rCount = getMenuItemRecipes(item.id).length
                                    const isSelected = item.id === (activeDish?.id || selectedDishId)
                                    return (
                                      <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => {
                                          setSelectedDishId(item.id)
                                          setIsDishSelectorOpen(false)
                                          setDishSearchQuery('')
                                        }}
                                        className={`w-full p-2 rounded-xl text-left text-xs transition-all flex items-center justify-between gap-2 cursor-pointer ${
                                          isSelected
                                            ? 'bg-blue-600 text-white font-bold'
                                            : 'hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-800 dark:text-slate-200'
                                        }`}
                                        title={`Formulate recipe for ${item.name} (${item.category?.name || 'General'})`}
                                      >
                                        <div className="truncate">
                                          <div className="truncate font-semibold">{item.name}</div>
                                          <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {item.category?.name || 'Item'} • ${item.price.toFixed(2)}
                                          </div>
                                        </div>
                                        <div className="shrink-0 text-right">
                                          {rCount > 0 ? (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                              ✓ {rCount} ing
                                            </span>
                                          ) : (
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600'}`}>
                                              ⚠️ Needs Recipe
                                            </span>
                                          )}
                                        </div>
                                      </button>
                                    )
                                  })
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={handleNextDish}
                          disabled={menuItems.length <= 1}
                          className="h-8 w-8 p-0 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
                          title="Next menu item (switch dish)"
                          aria-label="Next menu item"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* Active Canvas Body (With Drop Zone) */}
                  <CardContent className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
                    {/* List of Ingredients in Recipe */}
                    <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                      {/* Top Drop Target Bar if items already exist */}
                      {activeDishRecipes.length > 0 && (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDropOnCanvas}
                          className={`p-2.5 rounded-xl border-2 border-dashed transition-all text-center text-xs font-semibold flex items-center justify-center gap-2 ${
                            isDraggingOverCanvas 
                              ? 'border-blue-500 bg-blue-500/10 text-blue-600 scale-[1.01]' 
                              : 'border-slate-200/80 dark:border-white/[0.08] text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <MoveDown className="w-3.5 h-3.5 text-blue-500 animate-bounce" />
                          <span>Drop ingredient here to add to recipe</span>
                        </div>
                      )}

                      {/* Empty State Drop Target */}
                      {activeDishRecipes.length === 0 ? (
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDropOnCanvas}
                          className={`h-[320px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all ${
                            isDraggingOverCanvas 
                              ? 'border-blue-500 bg-blue-500/15 text-blue-600 scale-[1.02] shadow-lg' 
                              : 'border-slate-300/80 dark:border-white/[0.1] bg-slate-50/50 dark:bg-white/[0.01]'
                          }`}
                        >
                          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-3">
                            <Layers className="w-7 h-7" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            Drop Ingredients Here
                          </h3>
                          <p className="text-xs text-slate-400 max-w-xs mt-1">
                            Drag any raw material from the inventory shelf on the left, or search and click <strong className="text-blue-500">+ Add</strong>.
                          </p>
                          <div className="flex items-center gap-2 mt-4 text-[11px] font-semibold text-slate-400">
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800">Precision Portions</span>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800">Auto Deductions</span>
                            <span>•</span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800">COGS Tracking</span>
                          </div>
                        </div>
                      ) : (
                        /* Formulated Ingredients List */
                        <div className="space-y-2">
                          {activeDishRecipes.map((r, idx) => {
                            const ing = ingredients.find(i => i.id === r.ingredientId) || r.ingredient
                            const isLow = ing ? isLowStock(ing) : false
                            const isOut = ing ? isOutOfStock(ing) : false
                            const unitCost = ing ? getIngredientEffectiveCost(ing) : 0
                            const totalLineCost = unitCost * r.quantity

                            return (
                              <div
                                key={r.id}
                                className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] shadow-xs hover:border-slate-300 transition-all text-xs"
                              >
                                {/* Index & Info */}
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <span className="w-5 h-5 rounded-full bg-slate-200/70 dark:bg-slate-800 text-[10px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <div className="truncate">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                        {ing?.name || 'Ingredient'}
                                      </span>
                                      {isOut ? (
                                        <span className="text-[8px] font-bold px-1 rounded bg-rose-500/15 text-rose-600">
                                          Out
                                        </span>
                                      ) : isLow ? (
                                        <span className="text-[8px] font-bold px-1 rounded bg-amber-500/15 text-amber-600">
                                          Low
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">
                                      Cost: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">${totalLineCost.toFixed(3)}</span> (${unitCost.toFixed(3)}/{ing?.unit})
                                    </div>
                                  </div>
                                </div>

                                {/* Stepper & Quantity Input */}
                                <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                  {/* Base Recipe vs Modifier Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleRecipeOptional(r)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                                      r.isOptional
                                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25'
                                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                                    }`}
                                    title="Click to toggle between Core Base Recipe (deducted by default) and Optional Customization Modifier"
                                  >
                                    {r.isOptional ? '✨ Modifier (Custom)' : '🔒 Base Recipe'}
                                  </button>

                                  {/* Cup Size Grams Config Button */}
                                  <button
                                    type="button"
                                    onClick={() => openSizingModal(r)}
                                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/20 transition-colors cursor-pointer"
                                    title="Configure grammage scaling for Small / Medium / Large cup sizes"
                                  >
                                    ☕ Cup Sizing (S/M/L)
                                  </button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateRecipeQuantity(r.id, Math.max(0, r.quantity - 5))}
                                    className="h-7 w-7 p-0 rounded-lg cursor-pointer"
                                    title={`Subtract 5 ${ing?.unit} from formulation`}
                                    aria-label="Decrease quantity"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>

                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      step="any"
                                      value={r.quantity}
                                      onChange={(e) => handleUpdateRecipeQuantity(r.id, parseFloat(e.target.value) || 0)}
                                      className="h-7 w-16 text-center text-xs font-bold p-1 rounded-lg"
                                      title="Formulation quantity"
                                    />
                                    <span className="text-[11px] font-semibold text-slate-500 min-w-[24px]">
                                      {ing?.unit}
                                    </span>
                                  </div>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateRecipeQuantity(r.id, r.quantity + 5)}
                                    className="h-7 w-7 p-0 rounded-lg cursor-pointer"
                                    title={`Add 5 ${ing?.unit} to formulation`}
                                    aria-label="Increase quantity"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteRecipe(r.id)}
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 rounded-lg ml-1 cursor-pointer"
                                    title="Remove this ingredient from recipe formulation"
                                    aria-label="Remove ingredient"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* LIVE RECIPE FINANCIALS & BOTTLENECK YIELD SUMMARY */}
                    {activeDish && (
                      <div className="pt-3 border-t border-slate-200/60 dark:border-white/[0.08] mt-2 space-y-2">
                        <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/50 dark:border-white/[0.05]">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Selling Price</span>
                            <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                              ${activeDish.price.toFixed(2)}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Recipe COGS</span>
                            <p className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono">
                              ${activeDishCogs.toFixed(2)}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Margin</span>
                            <p className={`text-sm font-black font-mono ${
                              activeDish.price > 0 && ((activeDish.price - activeDishCogs) / activeDish.price) >= 0.7
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-900 dark:text-white'
                            }`}>
                              {activeDish.price > 0 ? `${(((activeDish.price - activeDishCogs) / activeDish.price) * 100).toFixed(1)}%` : '0%'}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Portions in Stock</span>
                            <p className={`text-sm font-black font-mono ${
                              maxServingsAvailable === 0 ? 'text-rose-500' : maxServingsAvailable < 10 ? 'text-amber-500' : 'text-blue-600 dark:text-blue-400'
                            }`}>
                              {maxServingsAvailable} <span className="text-[10px] font-normal">servings</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ================= VIEW 2: OVERVIEW CARDS GRID ================= */}
          {recipeStudioMode === 'cards' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl backdrop-blur-md">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={recipeSearch}
                    onChange={(e) => setRecipeSearch(e.target.value)}
                    placeholder="Search menu items..."
                    className="pl-9 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80"
                    title="Search menu items by title"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {categories.length > 0 && (
                    <Select value={recipeCategoryFilter} onValueChange={setRecipeCategoryFilter}>
                      <SelectTrigger className="text-xs h-9 w-[140px] rounded-xl bg-white/80 dark:bg-slate-900/80 cursor-pointer" title="Filter menu items by category">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={recipeStatusFilter} onValueChange={(val: any) => setRecipeStatusFilter(val)}>
                    <SelectTrigger className="text-xs h-9 w-[150px] rounded-xl bg-white/80 dark:bg-slate-900/80 cursor-pointer" title="Filter by formulation status">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="unformulated">⚠️ Needs Recipe</SelectItem>
                      <SelectItem value="formulated">✓ Formulated</SelectItem>
                      <SelectItem value="lowStock">🚨 Has Low Stock Item</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMenuItemsForRecipes.map((menuItem) => {
                  const itemRecipes = getMenuItemRecipes(menuItem.id)
                  const hasRecipes = itemRecipes.length > 0
                  const anyLowStock = itemRecipes.some(r => isLowStock(r.ingredient) || isOutOfStock(r.ingredient))
                  const cogs = calculateRecipeCogs(itemRecipes)

                  return (
                    <Card
                      key={menuItem.id}
                      className={`glass-card flex flex-col justify-between ${
                        anyLowStock ? 'border-amber-500/40 shadow-amber-500/10' : ''
                      }`}
                    >
                      <div>
                        <CardHeader className="pb-3 border-b border-slate-200/60 dark:border-white/[0.08]">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                                {menuItem.name}
                              </CardTitle>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-bold text-slate-500">
                                  ${menuItem.price.toFixed(2)}
                                </span>
                                {menuItem.category && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                                    {menuItem.category.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            {hasRecipes ? (
                              <div className="text-right">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  anyLowStock 
                                    ? 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300'
                                }`}>
                                  {itemRecipes.length} Ingredients
                                </span>
                                <div className="text-[10px] font-mono font-semibold text-slate-400 mt-1">
                                  COGS: <strong className="text-slate-700 dark:text-slate-300">${cogs.toFixed(2)}</strong>
                                </div>
                              </div>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                No Recipe
                              </span>
                            )}
                          </div>
                        </CardHeader>

                        <CardContent className="pt-3 space-y-2">
                          {hasRecipes ? (
                            <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                              {itemRecipes.map((recipe) => (
                                <div
                                  key={recipe.id}
                                  className="flex justify-between items-center p-2 bg-white/50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.05] rounded-xl text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Scale className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                      {recipe.ingredient.name} ({recipe.quantity} {recipe.ingredient.unit})
                                    </span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleDeleteRecipe(recipe.id)}
                                    className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-slate-400 text-xs">
                              <p className="font-semibold">No raw ingredients attached</p>
                            </div>
                          )}
                        </CardContent>
                      </div>

                      <div className="p-3 pt-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDishId(menuItem.id)
                            setRecipeStudioMode('studio')
                          }}
                          className="w-full text-xs font-semibold gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                          <span>Open in Recipe Studio</span>
                        </Button>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ========================================================================= */}
        {/* TAB 2: COSTING & PROFIT MARGINS */}
        {/* ========================================================================= */}
        <TabsContent value="costing" className="space-y-4 pt-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] rounded-2xl backdrop-blur-md">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={costingSearch}
                onChange={(e) => setCostingSearch(e.target.value)}
                placeholder="Search dish profitability..."
                className="pl-9 text-xs rounded-xl bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-white/[0.08]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={costingMarginFilter} onValueChange={(val: any) => setCostingMarginFilter(val)}>
                <SelectTrigger className="text-xs h-9 w-[150px] rounded-xl bg-white/80 dark:bg-slate-900/80">
                  <SelectValue placeholder="Profit Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Profit Margins</SelectItem>
                  <SelectItem value="high">★ High Stars (&ge; 70%)</SelectItem>
                  <SelectItem value="medium">✓ Healthy (50%–70%)</SelectItem>
                  <SelectItem value="low">⚠️ Review Price (&lt; 50%)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={costingSort} onValueChange={(val: any) => setCostingSort(val)}>
                <SelectTrigger className="text-xs h-9 w-[160px] rounded-xl bg-white/80 dark:bg-slate-900/80">
                  <ArrowUpDown className="w-3 h-3 mr-1 text-slate-400" />
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="margin_desc">Highest Margin %</SelectItem>
                  <SelectItem value="margin_asc">Lowest Margin %</SelectItem>
                  <SelectItem value="cost_desc">Highest Food Cost ($)</SelectItem>
                  <SelectItem value="price_desc">Highest Selling Price</SelectItem>
                  <SelectItem value="name_asc">Name (A → Z)</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={exportCostingCSV}
                variant="outline"
                size="sm"
                className="text-xs font-semibold gap-1.5 h-9 rounded-xl"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Margins CSV</span>
              </Button>
            </div>
          </div>

          <Card className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/70 uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-white/[0.06]">
                  <tr>
                    <th className="px-4 py-3">Menu Item</th>
                    <th className="px-4 py-3">Recipe Formulation</th>
                    <th className="px-4 py-3 text-right">Selling Price</th>
                    <th className="px-4 py-3 text-right">Recipe Cost (COGS)</th>
                    <th className="px-4 py-3 text-right">Gross Profit</th>
                    <th className="px-4 py-3 text-center">Food Cost %</th>
                    <th className="px-4 py-3 text-center">Gross Margin</th>
                    <th className="px-4 py-3 text-center">Profit Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-white/[0.05]">
                  {filteredCostingItems.map((item) => {
                    const itemRecipes = getMenuItemRecipes(item.id)
                    const hasRecipe = itemRecipes.length > 0
                    const cogs = calculateRecipeCogs(itemRecipes)
                    const grossProfit = Math.max(0, item.price - cogs)
                    const foodCostRatio = item.price > 0 && hasRecipe ? Math.round((cogs / item.price) * 1000) / 10 : 0
                    const grossMarginRatio = item.price > 0 && hasRecipe ? Math.round(((item.price - cogs) / item.price) * 1000) / 10 : 0

                    let ratingBadge = (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Unformulated
                      </span>
                    )
                    if (hasRecipe) {
                      if (grossMarginRatio >= 70) {
                        ratingBadge = (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300">
                            ★ High Star
                          </span>
                        )
                      } else if (grossMarginRatio >= 50) {
                        ratingBadge = (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                            ✓ Healthy
                          </span>
                        )
                      } else {
                        ratingBadge = (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300">
                            ⚠️ Review Price
                          </span>
                        )
                      }
                    }

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block text-sm">
                            {item.name}
                          </span>
                          {item.category && (
                            <span className="text-[10px] text-slate-400">{item.category.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 max-w-[240px] truncate">
                          {hasRecipe ? (
                            itemRecipes.map(r => `${r.quantity}${r.ingredient.unit} ${r.ingredient.name}`).join(', ')
                          ) : (
                            <span className="italic text-slate-400">No formulation set</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                          {hasRecipe ? `$${cogs.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                          {hasRecipe ? `+$${grossProfit.toFixed(2)}` : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {hasRecipe ? (
                            <span className={`font-mono font-bold ${
                              foodCostRatio <= 30 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {foodCostRatio.toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {hasRecipe ? (
                            <span className={`font-mono font-bold ${
                              grossMarginRatio >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                            }`}>
                              {grossMarginRatio.toFixed(1)}%
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {ratingBadge}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================= MODAL: ADD RAW INGREDIENT ================= */}
      <Dialog open={isAddIngredientOpen} onOpenChange={setIsAddIngredientOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Raw Ingredient</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddIngredient} className="space-y-4 pt-2 text-xs">
            {addIngredientError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                {addIngredientError}
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">Ingredient Name *</Label>
              <Input
                required
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                placeholder="e.g., Espresso Beans, Whole Milk, Vanilla Syrup"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Description / Notes (Optional)</Label>
              <Input
                value={newIngredient.description}
                onChange={(e) => setNewIngredient({ ...newIngredient, description: e.target.value })}
                placeholder="Supplier, brand, or shelf location"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Starting Stock *</Label>
                <Input
                  type="number"
                  step="any"
                  required
                  value={newIngredient.quantity}
                  onChange={(e) => setNewIngredient({ ...newIngredient, quantity: e.target.value })}
                  className="mt-1 font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Measurement Unit *</Label>
                <Select
                  value={newIngredient.unit}
                  onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grams">Grams (g)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="ml">Milliliters (ml)</SelectItem>
                    <SelectItem value="liters">Liters (L)</SelectItem>
                    <SelectItem value="pieces">Pieces / Units</SelectItem>
                    <SelectItem value="shots">Shots / Portions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Low Stock Alert Below *</Label>
                <Input
                  type="number"
                  step="any"
                  required
                  value={newIngredient.lowStockThreshold}
                  onChange={(e) => setNewIngredient({ ...newIngredient, lowStockThreshold: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Cost Per Unit ($)</Label>
                <Input
                  type="number"
                  step="any"
                  value={newIngredient.costPerUnit}
                  onChange={(e) => setNewIngredient({ ...newIngredient, costPerUnit: e.target.value })}
                  placeholder="e.g. 0.02"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setIsAddIngredientOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 liquid-btn-primary font-bold">
                Create Ingredient
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: EDIT INGREDIENT ================= */}
      <Dialog open={isEditIngredientOpen} onOpenChange={setIsEditIngredientOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Ingredient: {editingIngredient?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateIngredient} className="space-y-4 pt-2 text-xs">
            {editIngredientError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                {editIngredientError}
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">Ingredient Name *</Label>
              <Input
                required
                value={editIngredientForm.name}
                onChange={(e) => setEditIngredientForm({ ...editIngredientForm, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Description / Notes</Label>
              <Input
                value={editIngredientForm.description}
                onChange={(e) => setEditIngredientForm({ ...editIngredientForm, description: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Current Stock Level</Label>
                <Input
                  type="number"
                  step="any"
                  required
                  value={editIngredientForm.quantity}
                  onChange={(e) => setEditIngredientForm({ ...editIngredientForm, quantity: e.target.value })}
                  className="mt-1 font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Unit</Label>
                <Select
                  value={editIngredientForm.unit}
                  onValueChange={(value) => setEditIngredientForm({ ...editIngredientForm, unit: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grams">Grams (g)</SelectItem>
                    <SelectItem value="kg">Kilograms (kg)</SelectItem>
                    <SelectItem value="ml">Milliliters (ml)</SelectItem>
                    <SelectItem value="liters">Liters (L)</SelectItem>
                    <SelectItem value="pieces">Pieces / Units</SelectItem>
                    <SelectItem value="shots">Shots / Portions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Low Stock Threshold</Label>
                <Input
                  type="number"
                  step="any"
                  required
                  value={editIngredientForm.lowStockThreshold}
                  onChange={(e) => setEditIngredientForm({ ...editIngredientForm, lowStockThreshold: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Cost Per Unit ($)</Label>
                <Input
                  type="number"
                  step="any"
                  value={editIngredientForm.costPerUnit}
                  onChange={(e) => setEditIngredientForm({ ...editIngredientForm, costPerUnit: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setIsEditIngredientOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 liquid-btn-primary font-bold">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      <Dialog open={isDeleteIngredientOpen} onOpenChange={setIsDeleteIngredientOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Delete Raw Ingredient</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2 text-xs">
            {deleteIngredientError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-medium">
                {deleteIngredientError}
              </div>
            )}
            <p className="text-slate-600 dark:text-slate-300">
              Are you sure you want to permanently delete <strong>{ingredientToDelete?.name}</strong>?
            </p>
            <p className="text-[11px] text-slate-400">
              Note: If this ingredient is actively used in any menu item recipes, you must first remove it from those recipes.
            </p>
            <div className="flex gap-2 pt-3">
              <Button type="button" variant="outline" onClick={() => setIsDeleteIngredientOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={handleDeleteIngredient} className="flex-1 font-bold">
                Yes, Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* ========================================================================= */}
      {/* MODAL: CUP SIZE GRAMMAGE & SCALING CONFIGURATION */}
      {/* ========================================================================= */}
      <Dialog open={!!sizingModalRecipe} onOpenChange={(open) => !open && setSizingModalRecipe(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Scale className="w-5 h-5" />
              <span>Cup Size Grammage Scaling</span>
            </DialogTitle>
          </DialogHeader>

          {sizingModalRecipe && (
            <form onSubmit={handleSaveSizing} className="space-y-4 pt-2 text-xs">
              <div className="p-3 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40">
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {sizingModalRecipe.ingredient.name}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Base recipe amount: <strong className="text-slate-800 dark:text-slate-200">{sizingModalRecipe.quantity} {sizingModalRecipe.ingredient.unit}</strong>
                </p>
                <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                  Adjust the exact grams/ml consumed for each cup size (e.g. Cappuccino Single vs Double shot grammage).
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Small Cup (S - 8oz / 250ml)</span>
                    <p className="text-[10px] text-slate-400">Single shot / compact portion</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={sizingForm.sQty}
                      onChange={(e) => setSizingForm({ ...sizingForm, sQty: e.target.value })}
                      className="w-20 h-8 text-center font-bold text-xs rounded-lg"
                    />
                    <span className="text-[11px] font-semibold text-slate-400 w-8">
                      {sizingModalRecipe.ingredient.unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/5 dark:bg-blue-500/10">
                  <div>
                    <span className="font-bold text-blue-900 dark:text-blue-200">Medium Cup (M - 12oz / 350ml)</span>
                    <p className="text-[10px] text-slate-400">Standard standard double shot</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={sizingForm.mQty}
                      onChange={(e) => setSizingForm({ ...sizingForm, mQty: e.target.value })}
                      className="w-20 h-8 text-center font-bold text-xs rounded-lg border-blue-500/40"
                    />
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 w-8">
                      {sizingModalRecipe.ingredient.unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Large Cup (L - 16oz / 500ml)</span>
                    <p className="text-[10px] text-slate-400">Extra volume / triple shot</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      required
                      value={sizingForm.lQty}
                      onChange={(e) => setSizingForm({ ...sizingForm, lQty: e.target.value })}
                      className="w-20 h-8 text-center font-bold text-xs rounded-lg"
                    />
                    <span className="text-[11px] font-semibold text-slate-400 w-8">
                      {sizingModalRecipe.ingredient.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.08]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSizingModalRecipe(null)}
                  className="flex-1 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20"
                >
                  Save Cup Size Scaling
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
