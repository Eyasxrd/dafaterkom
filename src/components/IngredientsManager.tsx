'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
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
  Sparkles, 
  PlusCircle,
  Scale,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Award
} from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  description: string | null
  quantity: number
  unit: string
  lowStockThreshold: number
  lastRestocked: string | null
}

interface MenuItem {
  id: string
  name: string
  price: number
}

interface Recipe {
  id: string
  menuItemId: string
  ingredientId: string
  quantity: number
  ingredient: Ingredient
  menuItem: MenuItem
}

export default function IngredientsManager() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  // Add Ingredient dialog
  const [isAddIngredientDialogOpen, setIsAddIngredientDialogOpen] = useState(false)
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    description: '',
    quantity: '500',
    unit: 'grams',
    lowStockThreshold: '50'
  })

  // Add Recipe dialog
  const [isAddRecipeDialogOpen, setIsAddRecipeDialogOpen] = useState(false)
  const [newRecipe, setNewRecipe] = useState({
    menuItemId: '',
    ingredientId: '',
    quantity: '15'
  })
  const [recipeError, setRecipeError] = useState<string | null>(null)

  useEffect(() => {
    fetchIngredients()
    fetchMenuItems()
    fetchRecipes()
  }, [])

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients')
      const data = await response.json()
      if (Array.isArray(data)) {
        setIngredients(data)
      }
    } catch (error) {
      console.error('Failed to fetch ingredients:', error)
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

  const fetchRecipes = async () => {
    try {
      const response = await fetch('/api/recipes')
      const data = await response.json()
      if (Array.isArray(data)) {
        setRecipes(data)
      }
    } catch (error) {
      console.error('Failed to fetch recipes:', error)
    }
  }

  const handleAddIngredient = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    try {
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newIngredient)
      })
      if (response.ok) {
        setIsAddIngredientDialogOpen(false)
        setNewIngredient({ name: '', description: '', quantity: '500', unit: 'grams', lowStockThreshold: '50' })
        fetchIngredients()
      }
    } catch (error) {
      console.error('Failed to add ingredient:', error)
    }
  }

  const handleUpdateIngredientQuantity = async (id: string, newQuantity: number) => {
    try {
      const response = await fetch(`/api/ingredients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      })
      if (response.ok) {
        fetchIngredients()
      }
    } catch (error) {
      console.error('Failed to update ingredient quantity:', error)
    }
  }

  const handleAddRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    setRecipeError(null)

    if (!newRecipe.menuItemId || !newRecipe.ingredientId) {
      setRecipeError('Please select both a menu item and an ingredient')
      return
    }

    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecipe)
      })
      const data = await response.json()
      if (response.ok) {
        setIsAddRecipeDialogOpen(false)
        setNewRecipe({ menuItemId: newRecipe.menuItemId, ingredientId: '', quantity: '15' })
        fetchRecipes()
      } else {
        setRecipeError(data.error || 'Failed to save recipe item')
      }
    } catch (error: any) {
      setRecipeError(error.message || 'Failed to add recipe')
    }
  }

  const handleDeleteRecipe = async (id: string) => {
    try {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchRecipes()
      }
    } catch (error) {
      console.error('Failed to delete recipe:', error)
    }
  }

  const isLowStock = (ingredient: Ingredient) => ingredient.quantity <= ingredient.lowStockThreshold

  const getMenuItemRecipes = (menuItemId: string) => {
    return recipes.filter(r => r.menuItemId === menuItemId)
  }

  const getIngredientUnitCost = (name: string, unit: string): number => {
    const lower = name.toLowerCase()
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
    if (unit === 'g') return 0.02
    if (unit === 'ml') return 0.003
    return 0.10
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading ingredients and recipes...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <Tabs defaultValue="recipes" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 max-w-xl mx-auto">
          <TabsTrigger value="recipes" className="gap-2 font-bold text-xs">
            <ChefHat className="w-4 h-4" />
            <span>Recipe Builder</span>
          </TabsTrigger>
          <TabsTrigger value="ingredients" className="gap-2 font-bold text-xs">
            <FlaskConical className="w-4 h-4" />
            <span>Raw Ingredients</span>
          </TabsTrigger>
          <TabsTrigger value="costing" className="gap-2 font-bold text-xs">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Costing & Margins</span>
          </TabsTrigger>
        </TabsList>

        {/* Recipes & Bill of Materials Tab */}
        <TabsContent value="recipes" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
                Recipe Builder & Formulations
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Define what raw ingredients and exact measurements are used to prepare each menu item
              </p>
            </div>

            <Button
              onClick={() => {
                setRecipeError(null)
                setIsAddRecipeDialogOpen(true)
              }}
              className="liquid-btn-primary font-bold gap-2 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add / Edit Recipe</span>
            </Button>
          </div>

          {/* Recipes Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((menuItem) => {
              const itemRecipes = getMenuItemRecipes(menuItem.id)
              const hasRecipes = itemRecipes.length > 0
              const anyLowStock = itemRecipes.some(r => isLowStock(r.ingredient))

              return (
                <Card
                  key={menuItem.id}
                  className={`glass-card ${anyLowStock ? 'border-amber-500/40 shadow-amber-500/10' : ''}`}
                >
                  <CardHeader className="pb-3 border-b border-slate-200/60 dark:border-white/[0.08]">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                          {menuItem.name}
                        </CardTitle>
                        <span className="text-[11px] font-semibold text-slate-400">
                          ${menuItem.price.toFixed(2)}
                        </span>
                      </div>

                      {hasRecipes ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          anyLowStock 
                            ? 'bg-amber-500/15 text-amber-600 dark:bg-amber-400/20 dark:text-amber-300'
                            : 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300'
                        }`}>
                          {itemRecipes.length} {itemRecipes.length === 1 ? 'Ingredient' : 'Ingredients'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          No Recipe
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-3 space-y-3">
                    {hasRecipes ? (
                      <div className="space-y-2">
                        {itemRecipes.map((recipe) => {
                          const ingredientLow = isLowStock(recipe.ingredient)
                          return (
                            <div
                              key={recipe.id}
                              className="flex justify-between items-center p-2.5 bg-white/50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/[0.05] rounded-xl text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Scale className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                <div className="truncate">
                                  <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                    {recipe.ingredient.name}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    Uses {recipe.quantity} {recipe.ingredient.unit} per order
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {ingredientLow && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center gap-0.5" title="Raw ingredient stock low">
                                    <AlertTriangle className="w-2.5 h-2.5" />
                                    <span>Low</span>
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteRecipe(recipe.id)}
                                  className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                                  title="Remove Ingredient from Recipe"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400 text-xs">
                        <p className="font-medium">No formulation set</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Click below to add raw ingredients</p>
                      </div>
                    )}

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setNewRecipe({ menuItemId: menuItem.id, ingredientId: '', quantity: '15' })
                        setRecipeError(null)
                        setIsAddRecipeDialogOpen(true)
                      }}
                      className="w-full text-xs font-semibold gap-1.5 mt-2"
                    >
                      <Plus className="w-3.5 h-3.5 text-blue-500" />
                      <span>{hasRecipes ? 'Add Ingredient' : 'Create Recipe'}</span>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Raw Ingredients Stock Tab */}
        <TabsContent value="ingredients" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
                Raw Ingredients Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Raw materials, bulk inventory, and low-supply warnings</p>
            </div>

            <Button
              onClick={() => setIsAddIngredientDialogOpen(true)}
              className="liquid-btn-primary font-bold gap-2 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add Raw Ingredient</span>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ingredients.map((ingredient) => (
              <Card key={ingredient.id} className={`glass-card ${isLowStock(ingredient) ? 'border-rose-500/50 shadow-rose-500/10' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-start gap-2">
                    <span className="text-base font-bold text-slate-900 dark:text-white leading-tight">{ingredient.name}</span>
                    {isLowStock(ingredient) && (
                      <span className="text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300 px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shrink-0">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Low Stock</span>
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ingredient.description && (
                    <p className="text-xs text-slate-400">{ingredient.description}</p>
                  )}
                  <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.05]">
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {ingredient.quantity} <span className="text-xs font-semibold text-slate-400">{ingredient.unit}</span>
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-lg"
                        onClick={() => handleUpdateIngredientQuantity(ingredient.id, Math.max(0, ingredient.quantity - 10))}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0 rounded-lg"
                        onClick={() => handleUpdateIngredientQuantity(ingredient.id, ingredient.quantity + 10)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Alert Threshold: ≤ {ingredient.lowStockThreshold} {ingredient.unit}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Menu Costing & Profit Margins Tab */}
        <TabsContent value="costing" className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
                Menu Engineering & Recipe Margins
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Calculated Bill of Materials (COGS), gross margins, and food cost profitability metrics
              </p>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="glass-card">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Menu Items with Recipes
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {menuItems.filter(m => getMenuItemRecipes(m.id).length > 0).length} / {menuItems.length}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Recipes engineered</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  High-Margin Stars
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {menuItems.filter(m => {
                    const rList = getMenuItemRecipes(m.id)
                    if (rList.length === 0) return false
                    const cogs = rList.reduce((sum, r) => sum + (r.quantity * getIngredientUnitCost(r.ingredient.name, r.ingredient.unit)), 0)
                    const margin = m.price > 0 ? ((m.price - cogs) / m.price) * 100 : 0
                    return margin >= 70
                  }).length}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">&ge; 70% gross profit margin</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Average Food Cost
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {(() => {
                    const engineered = menuItems.filter(m => getMenuItemRecipes(m.id).length > 0 && m.price > 0)
                    if (engineered.length === 0) return '0%'
                    const totalRatio = engineered.reduce((sum, m) => {
                      const rList = getMenuItemRecipes(m.id)
                      const cogs = rList.reduce((s, r) => s + (r.quantity * getIngredientUnitCost(r.ingredient.name, r.ingredient.unit)), 0)
                      return sum + ((cogs / m.price) * 100)
                    }, 0)
                    return `${(totalRatio / engineered.length).toFixed(1)}%`
                  })()}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Industry benchmark: 25%–35%</p>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Review Price Alerts
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {menuItems.filter(m => {
                    const rList = getMenuItemRecipes(m.id)
                    if (rList.length === 0) return false
                    const cogs = rList.reduce((sum, r) => sum + (r.quantity * getIngredientUnitCost(r.ingredient.name, r.ingredient.unit)), 0)
                    const foodCostRatio = m.price > 0 ? (cogs / m.price) * 100 : 0
                    return foodCostRatio > 35
                  }).length}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Food cost &gt; 35% of price</p>
              </CardContent>
            </Card>
          </div>

          {/* Menu Costing Table */}
          <Card className="glass-card">
            <CardHeader className="pb-2 border-b border-slate-200/60 dark:border-white/[0.08]">
              <CardTitle className="text-base font-bold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <span>Item Profitability & Food Cost Breakdown</span>
                </span>
                <span className="text-xs font-normal text-slate-400">
                  Estimates based on recipe bill of materials
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200/60 dark:border-white/[0.06]">
                    <tr>
                      <th className="px-4 py-3">Menu Item</th>
                      <th className="px-4 py-3">Recipe Formulation</th>
                      <th className="px-4 py-3 text-right">Selling Price</th>
                      <th className="px-4 py-3 text-right">Recipe Cost (COGS)</th>
                      <th className="px-4 py-3 text-right">Gross Profit</th>
                      <th className="px-4 py-3 text-center">Food Cost %</th>
                      <th className="px-4 py-3 text-center">Profit Rating</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/[0.05]">
                    {menuItems.map((item) => {
                      const itemRecipes = getMenuItemRecipes(item.id)
                      const hasRecipe = itemRecipes.length > 0
                      const cogs = itemRecipes.reduce((sum, r) => sum + (r.quantity * getIngredientUnitCost(r.ingredient.name, r.ingredient.unit)), 0)
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
                              ★ High Profit Star
                            </span>
                          )
                        } else if (grossMarginRatio >= 50) {
                          ratingBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300">
                              ✓ Healthy Margin
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
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 max-w-[200px] truncate">
                            {hasRecipe ? (
                              itemRecipes.map(r => `${r.quantity}${r.ingredient.unit} ${r.ingredient.name}`).join(', ')
                            ) : (
                              <span className="italic text-slate-400">No ingredients linked</span>
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
                            {ratingBadge}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Recipe Ingredient Dialog */}
      <Dialog open={isAddRecipeDialogOpen} onOpenChange={setIsAddRecipeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Ingredient to Recipe</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddRecipe} className="space-y-4 pt-2 text-xs">
            {recipeError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {recipeError}
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">Menu Item</Label>
              <Select
                value={newRecipe.menuItemId}
                onValueChange={(value) => setNewRecipe({ ...newRecipe, menuItemId: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select menu item" />
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <Label className="text-xs font-semibold">Ingredient Used</Label>
                <button
                  type="button"
                  onClick={() => setIsAddIngredientDialogOpen(true)}
                  className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3 h-3" />
                  <span>New Raw Ingredient</span>
                </button>
              </div>
              <Select
                value={newRecipe.ingredientId}
                onValueChange={(value) => setNewRecipe({ ...newRecipe, ingredientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select raw ingredient" />
                </SelectTrigger>
                <SelectContent>
                  {ingredients.map((ingredient) => (
                    <SelectItem key={ingredient.id} value={ingredient.id}>
                      {ingredient.name} ({ingredient.quantity} {ingredient.unit} in stock)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-semibold">Quantity Needed per Serving</Label>
              <Input
                type="number"
                step="any"
                required
                value={newRecipe.quantity}
                onChange={(e) => setNewRecipe({ ...newRecipe, quantity: e.target.value })}
                placeholder="e.g. 18"
                className="mt-1 font-bold"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Deducted automatically from ingredient stock whenever this menu item is prepared.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddRecipeDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 liquid-btn-primary font-bold">
                Save to Recipe
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add New Raw Ingredient Dialog */}
      <Dialog open={isAddIngredientDialogOpen} onOpenChange={setIsAddIngredientDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Raw Ingredient</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddIngredient} className="space-y-4 pt-2 text-xs">
            <div>
              <Label className="text-xs font-semibold">Ingredient Name</Label>
              <Input
                required
                value={newIngredient.name}
                onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
                placeholder="e.g., Espresso Beans, Oat Milk, Brown Sugar"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Description (Optional)</Label>
              <Input
                value={newIngredient.description}
                onChange={(e) => setNewIngredient({ ...newIngredient, description: e.target.value })}
                placeholder="Brand, supplier, or packaging notes"
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold">Starting Quantity</Label>
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
                <Label className="text-xs font-semibold">Unit of Measurement</Label>
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
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs font-semibold">Low Stock Alert Below</Label>
              <Input
                type="number"
                step="any"
                required
                value={newIngredient.lowStockThreshold}
                onChange={(e) => setNewIngredient({ ...newIngredient, lowStockThreshold: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddIngredientDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 liquid-btn-primary font-bold">
                Create Ingredient
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
