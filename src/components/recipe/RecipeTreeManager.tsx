'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  QrCode, 
  Download, 
  RefreshCw, 
  Layers, 
  LayoutGrid, 
  FlaskConical, 
  Tag, 
  ChevronRight, 
  ChevronDown, 
  Square, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Sparkles, 
  Coffee, 
  ChefHat, 
  Scale, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  X, 
  Sliders, 
  Box, 
  AlertTriangle,
  Info,
  Check,
  Package,
  Edit,
  FolderPlus,
  Folder,
  FolderOpen,
  ArrowLeft,
  CornerDownRight
} from 'lucide-react'

export interface Ingredient {
  id: string
  name: string
  description?: string | null
  quantity: number
  unit: string
  lowStockThreshold: number
  costPerUnit: number
  lastRestocked?: string | null
}

export interface Category {
  id: string
  name: string
  description?: string | null
  parentId?: string | null
  children?: Category[]
}

export interface Recipe {
  id: string
  menuItemId: string
  ingredientId: string
  quantity: number
  sizeMultipliers?: string | null
  isOptional?: boolean
  ingredient: Ingredient
  menuItem?: any
}

export interface VariantSize {
  id?: string
  name: string
  volumeMl?: number
  extraPrice?: number
  price?: number
  ingredientMultiplier?: number
}

export interface MenuItem {
  id: string
  name: string
  price: number
  categoryId?: string
  category?: Category
  variants?: string | null
  options?: string | null
  recipes?: Recipe[]
  imageUrl?: string | null
  isAvailable?: boolean
}

interface RecipeTreeManagerProps {
  categories: Category[]
  menuItems: MenuItem[]
  ingredients: Ingredient[]
  recipes: Recipe[]
  storeName?: string
  onRefreshData?: () => void
  onRecipeUpdated?: () => void
}

export default function RecipeTreeManager({
  categories = [],
  menuItems = [],
  ingredients = [],
  recipes = [],
  storeName,
  onRefreshData,
  onRecipeUpdated
}: RecipeTreeManagerProps) {
  // Top Tabs: Categories ,Items | Items | Variation Groups
  const [topTab, setTopTab] = useState<'categories_items' | 'items' | 'variation_groups'>('categories_items')
  
  // Toolbar state
  const [itemType, setItemType] = useState<'all' | 'product' | 'drinks' | 'food'>('product')
  const [viewMode, setViewMode] = useState<'tree' | 'grid'>('tree')
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Selection state for checkboxes (Tree and Bottom Actions)
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())

  // Tree Expansion state (Set of Category IDs and Item IDs that are expanded)
  const [expandedNodeIds, setExpandedNodeIds] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    categories.slice(0, 3).forEach(c => initial.add(`cat-${c.id}`))
    return initial
  })

  // Active Category Selection (e.g. for Category Panel matching image 2)
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(() => {
    return categories.length > 0 ? categories[0].id : null
  })

  // Auto-expand categories and items when loaded so all dishes are immediately visible
  useEffect(() => {
    if (categories.length > 0) {
      setExpandedNodeIds(prev => {
        const next = new Set(prev)
        categories.forEach(c => next.add(`cat-${c.id}`))
        menuItems.forEach(i => next.add(`item-${i.id}`))
        return next
      })
      setActiveCategoryId(prev => prev || categories[0].id)
    }
  }, [categories, menuItems])

  // Selected Target for the Split Formulation Side Drawer (Item or Variant/Size)
  const [activeTarget, setActiveTarget] = useState<{
    menuItemId: string
    sizeName?: string // e.g. "Matcha (M)" or "M"
    sizePrice?: number
  } | null>(null)

  // Modals
  const [isUnitsModalOpen, setIsUnitsModalOpen] = useState(false)
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
  
  // Raw Ingredient creation modal
  const [isAddIngredientModalOpen, setIsAddIngredientModalOpen] = useState(false)
  const [newIngredientName, setNewIngredientName] = useState('')
  const [newIngredientUnit, setNewIngredientUnit] = useState('grams')
  const [newIngredientCost, setNewIngredientCost] = useState('0')
  const [newIngredientStock, setNewIngredientStock] = useState('1000')

  // Create Item inside Category Modal
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false)
  const [targetCategoryForItem, setTargetCategoryForItem] = useState<Category | null>(null)
  const [newItemName, setNewItemName] = useState('')
  const [newItemPrice, setNewItemPrice] = useState('95')
  const [newItemType, setNewItemType] = useState<'drink' | 'food'>('drink')
  const [newItemVariants, setNewItemVariants] = useState<Array<{ name: string; price: number; volumeMl: number }>>([
    { name: 'M', price: 95, volumeMl: 350 },
    { name: 'L', price: 110, volumeMl: 500 }
  ])
  const [initialFormulation, setInitialFormulation] = useState<Array<{ ingredientId: string; quantity: number }>>([])
  const [selectedInitialIng, setSelectedInitialIng] = useState('')
  const [initialIngQty, setInitialIngQty] = useState('18')
  const [isSavingNewItem, setIsSavingNewItem] = useState(false)

  // Category Edit / Create Modals (Sub-category & Custom category)
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false)
  const [editingCategoryName, setEditingCategoryName] = useState('')
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryDescription, setNewCategoryDescription] = useState('')
  const [categoryModalParentId, setCategoryModalParentId] = useState<string>('')
  const [isSubcategoryMode, setIsSubcategoryMode] = useState(false)

  // Formulation workbench local state for the active target
  const [selectedIngredientToAdd, setSelectedIngredientToAdd] = useState<string>('')
  const [qtyToAdd, setQtyToAdd] = useState<string>('15')
  const [isSavingRecipe, setIsSavingRecipe] = useState(false)

  // Copy Recipe modal/dialog
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false)
  const [targetItemToCopyTo, setTargetItemToCopyTo] = useState<string>('')

  // Add Size / Variation Item inside an Item Modal
  const [isAddVariantModalOpen, setIsAddVariantModalOpen] = useState(false)
  const [variantModalItem, setVariantModalItem] = useState<MenuItem | null>(null)
  const [newVariantName, setNewVariantName] = useState('')
  const [newVariantPrice, setNewVariantPrice] = useState('')
  const [newVariantVolume, setNewVariantVolume] = useState('350')
  const [newVariantMultiplier, setNewVariantMultiplier] = useState('1.0')
  const [isSavingVariant, setIsSavingVariant] = useState(false)

  // Auto clear feedback after 3.5s
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  // Map recipes by menuItemId
  const recipesByMenuItem = useMemo(() => {
    const map = new Map<string, Recipe[]>()
    recipes.forEach(r => {
      const list = map.get(r.menuItemId) || []
      list.push(r)
      map.set(r.menuItemId, list)
    })
    return map
  }, [recipes])

  // Helper to parse variants from MenuItem
  const getItemVariants = (item: MenuItem): VariantSize[] => {
    if (!item.variants) {
      return [
        { name: 'M', volumeMl: 350, price: item.price, ingredientMultiplier: 1.0 },
        { name: 'L', volumeMl: 500, price: Math.round(item.price * 1.25), ingredientMultiplier: 1.4 }
      ]
    }
    try {
      const parsed = JSON.parse(item.variants)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((v: any) => ({
          id: v.id,
          name: v.name || v.size || 'Regular',
          volumeMl: v.volumeMl || v.weightGrams || 350,
          extraPrice: v.extraPrice || 0,
          price: v.price !== undefined ? v.price : (item.price + (v.extraPrice || 0)),
          ingredientMultiplier: v.ingredientMultiplier || 1.0
        }))
      }
    } catch {}

    return [
      { name: 'M', volumeMl: 350, price: item.price, ingredientMultiplier: 1.0 },
      { name: 'L', volumeMl: 500, price: Math.round(item.price * 1.25), ingredientMultiplier: 1.4 }
    ]
  }

  // Active Category Object
  const activeCategory = useMemo(() => {
    if (!activeCategoryId) return categories[0] || null
    return categories.find(c => c.id === activeCategoryId) || categories[0] || null
  }, [activeCategoryId, categories])

  // Sub-categories of active category
  const activeCategorySubCategories = useMemo(() => {
    if (!activeCategory) return []
    return categories.filter(c => c.parentId === activeCategory.id)
  }, [activeCategory, categories])

  // Active MenuItem object
  const activeMenuItem = useMemo(() => {
    if (!activeTarget) return null
    return menuItems.find(m => m.id === activeTarget.menuItemId) || null
  }, [activeTarget, menuItems])

  // Active recipes list for the selected menuItem
  const activeRecipes = useMemo(() => {
    if (!activeMenuItem) return []
    return recipesByMenuItem.get(activeMenuItem.id) || []
  }, [activeMenuItem, recipesByMenuItem])

  // Calculate COGS and Margins for active item / size
  const activeFinancials = useMemo(() => {
    if (!activeMenuItem) return { cogs: 0, price: 0, margin: 0, profit: 0 }
    
    let totalCogs = 0
    const currentSize = activeTarget?.sizeName || 'M'

    activeRecipes.forEach(r => {
      const unitCost = r.ingredient?.costPerUnit || 0
      let qty = r.quantity || 0

      if (r.sizeMultipliers) {
        try {
          const map = JSON.parse(r.sizeMultipliers)
          const matchedKey = Object.keys(map).find(k => 
            currentSize.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(currentSize.toLowerCase())
          )
          if (matchedKey && map[matchedKey] !== undefined) {
            qty = parseFloat(map[matchedKey])
          }
        } catch {}
      }

      totalCogs += qty * unitCost
    })

    const sellingPrice = activeTarget?.sizePrice !== undefined ? activeTarget.sizePrice : activeMenuItem.price
    const profit = Math.max(0, sellingPrice - totalCogs)
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0

    return {
      cogs: totalCogs,
      price: sellingPrice,
      margin: Math.round(margin * 10) / 10,
      profit
    }
  }, [activeMenuItem, activeRecipes, activeTarget])

  // Build Hierarchical Category Tree (Root categories with their nested children and items)
  interface CategoryTreeNode extends Category {
    subCategories: CategoryTreeNode[]
    items: MenuItem[]
  }

  const hierarchicalCategoryTree = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()

    // Helper to build node recursively
    const buildNode = (cat: Category): CategoryTreeNode => {
      let items = menuItems.filter(item => item.categoryId === cat.id)

      if (itemType === 'drinks') {
        items = items.filter(i => 
          cat.name.toLowerCase().includes('coffee') || 
          cat.name.toLowerCase().includes('tea') || 
          cat.name.toLowerCase().includes('matcha') || 
          cat.name.toLowerCase().includes('latte') || 
          cat.name.toLowerCase().includes('drink') ||
          cat.name.toLowerCase().includes('brew') ||
          i.name.toLowerCase().includes('latte') ||
          i.name.toLowerCase().includes('matcha') ||
          i.name.toLowerCase().includes('coffee') ||
          i.name.toLowerCase().includes('espresso') ||
          i.name.toLowerCase().includes('tea') ||
          i.name.toLowerCase().includes('americano') ||
          i.name.toLowerCase().includes('cortado')
        )
      } else if (itemType === 'food') {
        items = items.filter(i => 
          cat.name.toLowerCase().includes('food') || 
          cat.name.toLowerCase().includes('bakery') || 
          cat.name.toLowerCase().includes('sandwich') || 
          cat.name.toLowerCase().includes('cake') ||
          cat.name.toLowerCase().includes('pastr') ||
          cat.name.toLowerCase().includes('burger') ||
          i.name.toLowerCase().includes('croissant') ||
          i.name.toLowerCase().includes('sandwich') ||
          i.name.toLowerCase().includes('burger') ||
          i.name.toLowerCase().includes('nachos')
        )
      }

      if (q) {
        const matchesCat = cat.name.toLowerCase().includes(q)
        items = items.filter(item => {
          if (matchesCat) return true
          const matchesItem = item.name.toLowerCase().includes(q)
          const variants = getItemVariants(item)
          const matchesVariant = variants.some(v => v.name.toLowerCase().includes(q))
          const itemRecipes = recipesByMenuItem.get(item.id) || []
          const matchesIngredient = itemRecipes.some(r => r.ingredient?.name.toLowerCase().includes(q))
          return matchesItem || matchesVariant || matchesIngredient
        })
      }

      const directChildren = categories.filter(c => c.parentId === cat.id)
      const childNodes = directChildren.map(buildNode)

      return {
        ...cat,
        subCategories: childNodes,
        items
      }
    }

    // Top-level categories: categories without parentId or whose parent is not in categories list
    const rootCategories = categories.filter(c => !c.parentId || !categories.some(parent => parent.id === c.parentId))
    
    return rootCategories.map(buildNode)
  }, [categories, menuItems, itemType, searchQuery, recipesByMenuItem])

  // Toggle node expansion
  const toggleExpand = (nodeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setExpandedNodeIds(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  // Toggle selection checkbox
  const toggleSelectNode = (nodeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setSelectedNodeIds(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }

  // Deselect All
  const handleDeselectAll = () => {
    setSelectedNodeIds(new Set())
    setFeedback({ type: 'success', message: 'All items deselected' })
  }

  // Mark / Select All visible items
  const handleMarkAll = () => {
    const allIds = new Set<string>()
    const collectIds = (nodes: CategoryTreeNode[]) => {
      nodes.forEach(node => {
        allIds.add(`cat-${node.id}`)
        node.items.forEach(item => {
          allIds.add(`item-${item.id}`)
          const variants = getItemVariants(item)
          variants.forEach(v => allIds.add(`var-${item.id}-${v.name}`))
        })
        collectIds(node.subCategories)
      })
    }
    collectIds(hierarchicalCategoryTree)
    setSelectedNodeIds(allIds)
    setFeedback({ type: 'success', message: `Marked ${allIds.size} nodes in the tree` })
  }

  // Click on a Category row in the Tree
  const handleSelectCategory = (cat: Category) => {
    setActiveCategoryId(cat.id)
    setActiveTarget(null) // Switch right panel to category mode matching Image 2
  }

  // Select Item / Size for formulation in the Split Side Drawer
  const handleSelectTarget = (item: MenuItem, variant?: VariantSize) => {
    setActiveCategoryId(item.categoryId || null)
    if (variant) {
      setActiveTarget({
        menuItemId: item.id,
        sizeName: variant.name,
        sizePrice: variant.price
      })
    } else {
      const firstVar = getItemVariants(item)[0]
      setActiveTarget({
        menuItemId: item.id,
        sizeName: firstVar?.name || 'M',
        sizePrice: firstVar?.price || item.price
      })
    }
  }

  // Open "Create Item in Category" dialog
  const openCreateItemModal = (cat?: Category) => {
    const categoryToUse = cat || activeCategory || categories[0]
    if (!categoryToUse) {
      setFeedback({ type: 'error', message: 'Please create or select a category first' })
      return
    }
    setTargetCategoryForItem(categoryToUse)
    setNewItemName('')
    setNewItemPrice('95')
    setNewItemType('drink')
    setNewItemVariants([
      { name: 'M', price: 95, volumeMl: 350 },
      { name: 'L', price: 110, volumeMl: 500 }
    ])
    setInitialFormulation([])
    setSelectedInitialIng('')
    setInitialIngQty('18')
    setIsCreateItemModalOpen(true)
  }

  // Open "Create Category / Sub-Category" modal
  const openCreateCategoryModal = (asSubcategoryOf?: Category) => {
    setNewCategoryName('')
    setNewCategoryDescription('')
    if (asSubcategoryOf) {
      setCategoryModalParentId(asSubcategoryOf.id)
      setIsSubcategoryMode(true)
    } else {
      setCategoryModalParentId('')
      setIsSubcategoryMode(false)
    }
    setIsCreateCategoryModalOpen(true)
  }

  // Handle Create Category or Sub-Category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setFeedback({ type: 'error', message: 'Category name is required' })
      return
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
          parentId: categoryModalParentId || null
        })
      })

      if (!res.ok) throw new Error('Failed to create category')
      const created = await res.json()

      setIsCreateCategoryModalOpen(false)
      setNewCategoryName('')
      setNewCategoryDescription('')
      
      // Expand parent if it was a subcategory
      if (categoryModalParentId) {
        setExpandedNodeIds(prev => new Set(prev).add(`cat-${categoryModalParentId}`).add(`cat-${created.id}`))
      } else {
        setExpandedNodeIds(prev => new Set(prev).add(`cat-${created.id}`))
      }

      setActiveCategoryId(created.id)
      setActiveTarget(null)

      setFeedback({ 
        type: 'success', 
        message: categoryModalParentId 
          ? `Created sub-category "${created.name}"` 
          : `Created category "${created.name}"` 
      })

      if (onRefreshData) onRefreshData()
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error creating category' })
    }
  }

  // Handle Create Item Directly Inside Category
  const handleCreateItemInsideCategory = async () => {
    if (!targetCategoryForItem) return
    if (!newItemName.trim()) {
      setFeedback({ type: 'error', message: 'Item name is required' })
      return
    }

    const priceNum = parseFloat(newItemPrice)
    if (isNaN(priceNum) || priceNum < 0) {
      setFeedback({ type: 'error', message: 'Valid price is required' })
      return
    }

    setIsSavingNewItem(true)
    try {
      // Build variants
      const variantsPayload = newItemVariants.map(v => ({
        name: v.name,
        volumeMl: v.volumeMl,
        price: v.price,
        extraPrice: v.price - priceNum,
        ingredientMultiplier: v.name === 'L' ? 1.4 : 1.0
      }))

      // Build recipes
      const recipesPayload = initialFormulation.map(f => ({
        ingredientId: f.ingredientId,
        quantity: f.quantity
      }))

      const payload = {
        name: newItemName.trim(),
        price: priceNum,
        categoryId: targetCategoryForItem.id,
        isAvailable: true,
        variants: JSON.stringify(variantsPayload),
        recipes: recipesPayload
      }

      const res = await fetch('/api/menu-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create item')
      }

      const createdItem = await res.json()

      // Auto expand category in tree
      setExpandedNodeIds(prev => new Set(prev).add(`cat-${targetCategoryForItem.id}`))

      // Auto select new item for immediate recipe formulation
      setActiveCategoryId(targetCategoryForItem.id)
      setActiveTarget({
        menuItemId: createdItem.id,
        sizeName: 'M',
        sizePrice: priceNum
      })

      setIsCreateItemModalOpen(false)
      setFeedback({ 
        type: 'success', 
        message: `Successfully created "${createdItem.name}" inside ${targetCategoryForItem.name}!` 
      })

      if (onRefreshData) onRefreshData()
      if (onRecipeUpdated) onRecipeUpdated()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error creating menu item' })
    } finally {
      setIsSavingNewItem(false)
    }
  }

  // Open modal to add a size / variant item inside a product
  const openAddVariantModal = (item: MenuItem) => {
    setVariantModalItem(item)
    const existing = getItemVariants(item)
    const existingNames = existing.map(v => v.name.toUpperCase())
    let suggestedName = 'Small (S)'
    let suggestedMultiplier = 0.75
    let suggestedPrice = Math.max(1, Math.round(item.price * 0.85 * 100) / 100)

    if (existingNames.includes('S') || existingNames.some(n => n.includes('SMALL') || n.includes('(S)'))) {
      if (!existingNames.includes('XL') && !existingNames.some(n => n.includes('EXTRA') || n.includes('(XL)'))) {
        suggestedName = 'Extra Large (XL)'
        suggestedMultiplier = 1.5
        suggestedPrice = Math.round(item.price * 1.35 * 100) / 100
      } else {
        suggestedName = `Portion ${existing.length + 1}`
        suggestedMultiplier = 1.0
        suggestedPrice = item.price
      }
    }

    setNewVariantName(suggestedName)
    setNewVariantPrice(String(suggestedPrice))
    setNewVariantVolume('350')
    setNewVariantMultiplier(String(suggestedMultiplier))
    setIsAddVariantModalOpen(true)
  }

  // Handle saving new variant / size inside product
  const handleSaveVariant = async () => {
    if (!variantModalItem) return
    if (!newVariantName.trim()) {
      setFeedback({ type: 'error', message: 'Size / Item name is required' })
      return
    }
    const priceNum = parseFloat(newVariantPrice)
    if (isNaN(priceNum) || priceNum < 0) {
      setFeedback({ type: 'error', message: 'Valid price is required' })
      return
    }
    const multNum = parseFloat(newVariantMultiplier) || 1.0
    const volNum = parseFloat(newVariantVolume) || 350

    setIsSavingVariant(true)
    try {
      const existingVariants = getItemVariants(variantModalItem)
      const cleanName = newVariantName.trim()

      if (existingVariants.some(v => v.name.toLowerCase() === cleanName.toLowerCase())) {
        setFeedback({ type: 'error', message: `Item/Size "${cleanName}" already exists for this dish` })
        setIsSavingVariant(false)
        return
      }

      const updatedVariants = [
        ...existingVariants.map(v => ({
          name: v.name,
          price: v.price,
          volumeMl: v.volumeMl || 350,
          ingredientMultiplier: v.ingredientMultiplier || 1.0
        })),
        {
          name: cleanName,
          price: priceNum,
          volumeMl: volNum,
          ingredientMultiplier: multNum
        }
      ]

      // 1. Update menuItem variants in database
      const res = await fetch(`/api/menu-items/${variantModalItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: updatedVariants
        })
      })

      if (!res.ok) {
        throw new Error('Failed to update dish sizes')
      }

      // 2. Also update existing recipes for this dish to include the multiplier for the new size
      const itemRecipes = recipesByMenuItem.get(variantModalItem.id) || []
      for (const recipe of itemRecipes) {
        let sizeMultipliers: Record<string, number> = {}
        try {
          if (recipe.sizeMultipliers) sizeMultipliers = JSON.parse(recipe.sizeMultipliers)
        } catch {}
        
        const baseQty = recipe.quantity || 15
        sizeMultipliers[cleanName] = Math.round(baseQty * multNum * 10) / 10

        await fetch(`/api/recipes/${recipe.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sizeMultipliers: JSON.stringify(sizeMultipliers)
          })
        })
      }

      setIsAddVariantModalOpen(false)
      setFeedback({ type: 'success', message: `Added "${cleanName}" to ${variantModalItem.name}` })
      
      // Auto expand item in tree and select the new size
      setExpandedNodeIds(prev => new Set(prev).add(`item-${variantModalItem.id}`))
      setActiveTarget({
        menuItemId: variantModalItem.id,
        sizeName: cleanName,
        sizePrice: priceNum
      })

      if (onRecipeUpdated) onRecipeUpdated()
      if (onRefreshData) onRefreshData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error adding size to dish' })
    } finally {
      setIsSavingVariant(false)
    }
  }

  // Handle deleting a variant / size
  const handleDeleteVariant = async (item: MenuItem, variantName: string) => {
    const existingVariants = getItemVariants(item)
    if (existingVariants.length <= 1) {
      setFeedback({ type: 'error', message: 'A dish must have at least one size/variation' })
      return
    }

    try {
      const filtered = existingVariants.filter(v => v.name !== variantName)
      const res = await fetch(`/api/menu-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: filtered
        })
      })

      if (!res.ok) throw new Error('Failed to delete size')

      setFeedback({ type: 'success', message: `Deleted size "${variantName}"` })
      if (activeTarget?.sizeName === variantName) {
        setActiveTarget({
          menuItemId: item.id,
          sizeName: filtered[0].name,
          sizePrice: filtered[0].price
        })
      }

      if (onRefreshData) onRefreshData()
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error deleting size' })
    }
  }

  // Handle Refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      if (onRefreshData) {
        await onRefreshData()
      }
      setFeedback({ type: 'success', message: 'Tree and recipe data refreshed' })
    } catch {
      setFeedback({ type: 'error', message: 'Failed to refresh data' })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Category Actions
  const handleSaveCategoryName = async () => {
    if (!activeCategory || !editingCategoryName.trim()) return
    try {
      const res = await fetch(`/api/categories/${activeCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategoryName.trim() })
      })
      if (!res.ok) throw new Error('Failed to update category')
      setIsEditCategoryModalOpen(false)
      setFeedback({ type: 'success', message: `Category updated to "${editingCategoryName.trim()}"` })
      if (onRefreshData) onRefreshData()
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error updating category' })
    }
  }

  const handleDeleteCategory = async () => {
    if (!activeCategory) return
    if (!confirm(`Are you sure you want to delete category "${activeCategory.name}" and all its subcategories and dishes?`)) return
    try {
      const res = await fetch(`/api/categories/${activeCategory.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete category')
      setFeedback({ type: 'success', message: `Deleted category "${activeCategory.name}"` })
      setActiveCategoryId(null)
      setActiveTarget(null)
      if (onRefreshData) onRefreshData()
    } catch (e: any) {
      setFeedback({ type: 'error', message: e.message || 'Error deleting category' })
    }
  }

  // Add ingredient to active target's recipe
  const handleAddIngredient = async () => {
    if (!activeMenuItem || !selectedIngredientToAdd) {
      setFeedback({ type: 'error', message: 'Please select an ingredient to add' })
      return
    }

    const qty = parseFloat(qtyToAdd)
    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: 'error', message: 'Quantity must be greater than 0' })
      return
    }

    setIsSavingRecipe(true)
    try {
      const sizeKey = activeTarget?.sizeName || 'M'
      const multipliers: Record<string, number> = {
        [sizeKey]: qty,
        S: Math.round(qty * 0.75 * 10) / 10,
        M: qty,
        L: Math.round(qty * 1.4 * 10) / 10
      }

      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menuItemId: activeMenuItem.id,
          ingredientId: selectedIngredientToAdd,
          quantity: qty,
          sizeMultipliers: multipliers,
          isOptional: false
        })
      })

      if (!res.ok) throw new Error('Failed to add ingredient')

      setFeedback({ type: 'success', message: 'Ingredient added to formulation' })
      setSelectedIngredientToAdd('')
      if (onRecipeUpdated) onRecipeUpdated()
      if (onRefreshData) onRefreshData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving ingredient' })
    } finally {
      setIsSavingRecipe(false)
    }
  }

  // Update ingredient quantity inline
  const handleUpdateRecipeQty = async (recipe: Recipe, newQty: number) => {
    if (newQty <= 0) return
    try {
      let parsedMultipliers: any = {}
      try {
        if (recipe.sizeMultipliers) parsedMultipliers = JSON.parse(recipe.sizeMultipliers)
      } catch {}

      const activeSize = activeTarget?.sizeName || 'M'
      parsedMultipliers[activeSize] = newQty

      const res = await fetch(`/api/recipes/${recipe.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quantity: newQty,
          sizeMultipliers: parsedMultipliers
        })
      })

      if (res.ok) {
        if (onRecipeUpdated) onRecipeUpdated()
        if (onRefreshData) onRefreshData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Remove ingredient from recipe
  const handleRemoveRecipeIngredient = async (recipeId: string, ingName: string) => {
    try {
      const res = await fetch(`/api/recipes/${recipeId}`, { method: 'DELETE' })
      if (res.ok) {
        setFeedback({ type: 'success', message: `Removed ${ingName} from recipe` })
        if (onRecipeUpdated) onRecipeUpdated()
        if (onRefreshData) onRefreshData()
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to remove ingredient' })
    }
  }

  // Create new raw ingredient on the fly
  const handleCreateNewIngredient = async () => {
    if (!newIngredientName.trim()) {
      setFeedback({ type: 'error', message: 'Ingredient name is required' })
      return
    }

    try {
      const res = await fetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newIngredientName.trim(),
          unit: newIngredientUnit,
          costPerUnit: parseFloat(newIngredientCost) || 0,
          quantity: parseFloat(newIngredientStock) || 0,
          lowStockThreshold: 50
        })
      })

      if (!res.ok) throw new Error('Failed to create ingredient')
      const created = await res.json()

      setFeedback({ type: 'success', message: `Created "${created.name}"` })
      setIsAddIngredientModalOpen(false)
      setNewIngredientName('')
      setSelectedIngredientToAdd(created.id)
      if (onRefreshData) onRefreshData()
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error creating ingredient' })
    }
  }

  // Copy Recipe from active item to another item
  const handleCopyRecipeToTarget = async () => {
    if (!activeMenuItem || !targetItemToCopyTo) return
    setIsSavingRecipe(true)
    try {
      const sourceRecipes = recipesByMenuItem.get(activeMenuItem.id) || []
      if (sourceRecipes.length === 0) {
        setFeedback({ type: 'error', message: 'Source dish has no recipe to copy' })
        return
      }

      for (const r of sourceRecipes) {
        await fetch('/api/recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            menuItemId: targetItemToCopyTo,
            ingredientId: r.ingredientId,
            quantity: r.quantity,
            sizeMultipliers: r.sizeMultipliers,
            isOptional: r.isOptional
          })
        })
      }

      setFeedback({ type: 'success', message: 'Recipe formulation copied successfully!' })
      setIsCopyModalOpen(false)
      setTargetItemToCopyTo('')
      if (onRecipeUpdated) onRecipeUpdated()
      if (onRefreshData) onRefreshData()
    } catch {
      setFeedback({ type: 'error', message: 'Failed to copy recipe formulation' })
    } finally {
      setIsSavingRecipe(false)
    }
  }

  // Current items inside active category
  const activeCategoryItems = useMemo(() => {
    if (!activeCategory) return []
    return menuItems.filter(m => m.categoryId === activeCategory.id)
  }, [activeCategory, menuItems])

  // Recursive Category Tree Node Component for Unlimited Nesting
  const renderCategoryNode = (catNode: CategoryTreeNode, level: number = 0) => {
    const isCatExpanded = expandedNodeIds.has(`cat-${catNode.id}`)
    const isCatSelected = selectedNodeIds.has(`cat-${catNode.id}`)
    const isCatActive = activeCategoryId === catNode.id && !activeTarget

    return (
      <div key={catNode.id} className="space-y-1">
        
        {/* CATEGORY ROW */}
        <div 
          onClick={() => handleSelectCategory(catNode)}
          style={{ paddingLeft: `${Math.max(10, level * 18 + 10)}px` }}
          className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
            isCatActive
              ? 'bg-blue-600/25 border border-blue-500/60 text-white shadow-md'
              : isCatExpanded 
              ? 'bg-[#1e2330] border border-slate-700/60 text-slate-100' 
              : 'hover:bg-[#1a1e28] text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {/* Expand Chevron */}
            <button
              type="button"
              onClick={(e) => toggleExpand(`cat-${catNode.id}`, e)}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white"
            >
              {isCatExpanded ? (
                <ChevronDown className="w-4 h-4 text-blue-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-500" />
              )}
            </button>

            {/* Checkbox */}
            <button
              type="button"
              onClick={(e) => toggleSelectNode(`cat-${catNode.id}`, e)}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-blue-400"
            >
              {isCatSelected ? (
                <CheckSquare className="w-4 h-4 text-blue-400" />
              ) : (
                <Square className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Folder Icon indicating Subcategory vs Root */}
            {level > 0 ? (
              <Folder className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Layers className="w-3.5 h-3.5 text-slate-400" />
            )}

            {/* Category Name */}
            <span className="font-bold text-xs uppercase tracking-wide">
              {catNode.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {catNode.subCategories.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {catNode.subCategories.length} sub
              </span>
            )}
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
              {catNode.items.length} items
            </span>
          </div>
        </div>

        {/* EXPANDED CONTENT: Sub-categories + Menu Items */}
        {isCatExpanded && (
          <div 
            style={{ marginLeft: `${level * 14 + 14}px` }}
            className="pl-4 space-y-1.5 border-l-2 border-slate-800/80 my-1"
          >
            {/* Quick Actions Bar under Category */}
            <div className="py-1 flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openCreateItemModal(catNode)
                }}
                className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 cursor-pointer transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>+ Item in "{catNode.name}"</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  openCreateCategoryModal(catNode)
                }}
                className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 py-1 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 cursor-pointer transition-all"
              >
                <FolderPlus className="w-3 h-3" />
                <span>+ Sub-Category</span>
              </button>
            </div>

            {/* NESTED SUB-CATEGORIES (Recursive) */}
            {catNode.subCategories.length > 0 && (
              <div className="space-y-1">
                {catNode.subCategories.map(subNode => renderCategoryNode(subNode, level + 1))}
              </div>
            )}

            {/* ITEMS DIRECTLY IN THIS CATEGORY */}
            {catNode.items.map(item => {
              const itemRecipes = recipesByMenuItem.get(item.id) || []
              const variants = getItemVariants(item)
              const isItemExpanded = expandedNodeIds.has(`item-${item.id}`)
              const isItemSelected = selectedNodeIds.has(`item-${item.id}`)
              const isItemActive = activeTarget?.menuItemId === item.id && !activeTarget.sizeName

              return (
                <div key={item.id} className="space-y-1">
                  
                  {/* ITEM ROW */}
                  <div
                    onClick={() => handleSelectTarget(item)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                      isItemActive
                        ? 'bg-blue-600/30 border border-blue-400 text-white shadow-sm'
                        : 'hover:bg-[#1a1e28]/70 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Item Chevron for variants */}
                      <button
                        type="button"
                        onClick={(e) => toggleExpand(`item-${item.id}`, e)}
                        className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-white"
                      >
                        {isItemExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </button>

                      {/* Item Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelectNode(`item-${item.id}`, e)}
                        className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-blue-400"
                      >
                        {isItemSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </button>

                      {/* Item Name */}
                      <span className="font-bold text-xs uppercase tracking-tight text-slate-200">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Button to quickly add item / size inside this product */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openAddVariantModal(item)
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/25 text-blue-400 hover:text-blue-300 border border-blue-500/20 flex items-center gap-1 cursor-pointer transition-all"
                        title={`Add item / size inside "${item.name}"`}
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>+ Item</span>
                      </button>

                      {/* Recipe Count Badge */}
                      {itemRecipes.length > 0 ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <ChefHat className="w-2.5 h-2.5" />
                          <span>{itemRecipes.length} ing</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          No Recipe
                        </span>
                      )}

                      {/* Base Price */}
                      <span className="text-xs font-black text-blue-400">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* SIZES / VARIANTS UNDER ITEM (e.g. Matcha (M) - 95 $, Matcha (L) - 110 $) */}
                  {isItemExpanded && (
                    <div className="pl-6 space-y-1 border-l-2 border-blue-500/20 ml-3.5 my-1">
                      {variants.map(variant => {
                        const isVarActive = activeTarget?.menuItemId === item.id && activeTarget?.sizeName === variant.name
                        const isVarSelected = selectedNodeIds.has(`var-${item.id}-${variant.name}`)

                        return (
                          <div
                            key={variant.name}
                            onClick={() => handleSelectTarget(item, variant)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                              isVarActive
                                ? 'bg-blue-600/30 border border-blue-400 text-white font-bold'
                                : 'hover:bg-[#1f2433] text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Variant Checkbox */}
                              <button
                                type="button"
                                onClick={(e) => toggleSelectNode(`var-${item.id}-${variant.name}`, e)}
                                className="w-4 h-4 flex items-center justify-center text-slate-500 hover:text-blue-400"
                              >
                                {isVarSelected ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-blue-400" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-slate-600" />
                                )}
                              </button>

                              {/* Size name exactly like image: "Matcha (M) - 95 $" */}
                              <span className="text-xs font-semibold text-slate-200">
                                {item.name} ({variant.name}) - ${variant.price?.toFixed(0) || item.price}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {variant.volumeMl && (
                                <span className="text-[10px] text-slate-500 font-mono">
                                  {variant.volumeMl}ml
                                </span>
                              )}
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300">
                                {variant.name}
                              </span>
                            </div>
                          </div>
                        )
                      })}

                      {/* Button to add size / item inside this product */}
                      <div className="pt-1.5 pb-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openAddVariantModal(item)
                          }}
                          className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-dashed border-blue-500/30 cursor-pointer transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Add Item / Size in "{item.name}"</span>
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              )
            })}

          </div>
        )}

      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-md border text-sm font-semibold transition-all animate-in slide-in-from-bottom-3 ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-white/90 dark:bg-slate-900/90' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400 bg-white/90 dark:bg-slate-900/90'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Container styled exactly as the reference UI */}
      <div className="bg-[#1e222b] dark:bg-[#12161f] text-slate-100 rounded-3xl border border-slate-700/60 shadow-2xl overflow-hidden">
        
        {/* ========================================================================= */}
        {/* HEADER: Store Title & Main Navigation Tabs */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#161a23]/80">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            
            {/* Store Title */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-wide text-white flex items-center gap-2">
                  <span>Recipe Formulation Studio</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    Tree System
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Nested category hierarchy, custom categories & recipe formulation</p>
              </div>
            </div>

            {/* Primary View Tabs matching reference image */}
            <div className="flex items-center gap-1 bg-[#12161f] p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setTopTab('categories_items')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  topTab === 'categories_items'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Categories ,Items</span>
              </button>

              <button
                onClick={() => setTopTab('items')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  topTab === 'items'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Items</span>
              </button>

              <button
                onClick={() => setTopTab('variation_groups')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  topTab === 'variation_groups'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Variation Groups</span>
              </button>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOOLBAR: Item Type, Get, Tree/Grid, Units, Pricing Categories */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#1a1e28]/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Left Toolbar Cluster */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              
              {/* Item Type Selector */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12161f] border border-blue-500/30 text-xs">
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Item Type</span>
                <div className="h-4 w-px bg-slate-700 mx-1" />
                <button 
                  onClick={() => setItemType(itemType === 'product' ? 'drinks' : itemType === 'drinks' ? 'food' : itemType === 'food' ? 'all' : 'product')}
                  className="font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer"
                  title="Click to cycle item type filter"
                >
                  <Box className="w-3.5 h-3.5 text-blue-400" />
                  <span className="capitalize">{itemType}</span>
                </button>
              </div>

              {/* Get Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 px-3.5 rounded-xl bg-[#12161f] border-slate-700/80 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 text-xs font-bold gap-2 cursor-pointer"
              >
                <Download className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-bounce' : ''}`} />
                <span>Get</span>
              </Button>

              {/* Tree / Grid View Switcher */}
              <div className="flex items-center bg-[#12161f] p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setViewMode('tree')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'tree'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Hierarchical Tree Mode"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tree</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Grid Cards Mode"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
              </div>

              {/* Units Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsUnitsModalOpen(true)}
                className="h-9 px-3.5 rounded-xl bg-[#12161f] border-slate-700/80 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 text-xs font-bold gap-2 cursor-pointer"
              >
                <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
                <span>Units</span>
              </Button>

              {/* Pricing Categories Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPricingModalOpen(true)}
                className="h-9 px-3.5 rounded-xl bg-[#12161f] border-slate-700/80 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 text-xs font-bold gap-2 cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 text-blue-400" />
                <span>Pricing Categories</span>
              </Button>

            </div>

            {/* Right: + Custom Category & + Create Item Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openCreateCategoryModal()}
                className="h-9 px-3 rounded-xl bg-[#12161f] border-blue-500/40 text-blue-400 hover:bg-blue-500/10 text-xs font-bold gap-1.5 cursor-pointer"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Custom Category</span>
              </Button>

              <Button
                size="sm"
                onClick={() => openCreateItemModal()}
                className="h-9 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Item</span>
              </Button>
            </div>

          </div>

          {/* Search Bar matching reference image */}
          <div className="flex items-center gap-3 mt-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search here ..."
                className="pl-10 pr-10 h-10 rounded-2xl bg-[#12161f] border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-blue-500"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-400 cursor-pointer">
                <QrCode className="w-4 h-4" />
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (expandedNodeIds.size > 0) {
                  setExpandedNodeIds(new Set())
                } else {
                  const allIds = new Set<string>()
                  categories.forEach(c => allIds.add(`cat-${c.id}`))
                  menuItems.forEach(i => allIds.add(`item-${i.id}`))
                  setExpandedNodeIds(allIds)
                }
              }}
              className="h-10 px-3.5 rounded-2xl bg-[#12161f] border-slate-700/80 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 text-xs font-bold shrink-0 cursor-pointer"
            >
              {expandedNodeIds.size > 0 ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* MAIN BODY: Split Tree View (Left) + Category/Recipe Panel (Right) */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5">
          {topTab === 'categories_items' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              
              {/* LEFT: Tree View (7 Cols) */}
              <div className="lg:col-span-7 transition-all">
                <div className="bg-[#161a23] rounded-2xl border border-slate-800 p-4 min-h-[540px] max-h-[720px] overflow-y-auto">
                  
                  {hierarchicalCategoryTree.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Layers className="w-10 h-10 text-slate-600 mb-3" />
                      <p className="text-sm font-bold text-slate-400">No categories found</p>
                      <Button
                        size="sm"
                        onClick={() => openCreateCategoryModal()}
                        className="mt-3 bg-blue-600 text-xs font-bold"
                      >
                        Create Your First Custom Category
                      </Button>
                    </div>
                  ) : viewMode === 'tree' ? (
                    
                    /* NESTED CATEGORY & ITEM TREE HIERARCHY */
                    <div className="space-y-1.5">
                      {hierarchicalCategoryTree.map(rootNode => renderCategoryNode(rootNode, 0))}
                    </div>
                  ) : (
                    /* GRID CARDS VIEW */
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {menuItems.map(item => {
                        const itemRecipes = recipesByMenuItem.get(item.id) || []
                        const variants = getItemVariants(item)
                        return (
                          <div 
                            key={item.id}
                            onClick={() => handleSelectTarget(item)}
                            className="p-3 rounded-2xl bg-[#1e2330] border border-slate-700/60 hover:border-blue-500/50 cursor-pointer transition-all space-y-2"
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-black text-slate-100 uppercase">{item.name}</span>
                              <span className="text-xs font-bold text-blue-400">${item.price.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{variants.length} sizes</span>
                              <span className="text-emerald-400 font-semibold">{itemRecipes.length} ingredients</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                </div>

                {/* BOTTOM ACTION BAR: Deselect & Mark */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDeselectAll}
                      className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                    >
                      Deselect
                    </button>
                    <button
                      onClick={handleMarkAll}
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline cursor-pointer"
                    >
                      Mark
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium">
                    {selectedNodeIds.size} nodes selected
                  </span>
                </div>
              </div>

              {/* RIGHT: CATEGORY WORKBENCH OR RECIPE FORMULATION WORKBENCH */}
              <div className="lg:col-span-5 space-y-4">
                
                {/* CASE 1: SPECIFIC ITEM / SIZE SELECTED -> RECIPE FORMULATION WORKBENCH */}
                {activeTarget && activeMenuItem ? (
                  <div className="bg-[#161a23] rounded-2xl border border-blue-500/30 p-4 space-y-4 shadow-xl">
                    
                    {/* Drawer Header */}
                    <div className="flex justify-between items-start pb-3 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <ChefHat className="w-4 h-4 text-blue-400" />
                          <h3 className="text-sm font-black text-white uppercase tracking-tight">
                            {activeMenuItem.name}
                          </h3>
                        </div>
                        <p className="text-xs text-blue-400 font-semibold mt-0.5">
                          Selected Size: <span className="font-bold underline">{activeTarget.sizeName || 'M'}</span> (${activeFinancials.price.toFixed(2)})
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAddVariantModal(activeMenuItem)}
                          className="h-8 px-2.5 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-500/40 gap-1.5 font-bold cursor-pointer"
                          title={`Add item / size inside ${activeMenuItem.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Add Item</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (activeMenuItem.categoryId) {
                              setActiveCategoryId(activeMenuItem.categoryId)
                            }
                            setActiveTarget(null)
                          }}
                          className="h-8 px-2 text-xs text-slate-400 hover:text-blue-400 gap-1"
                          title="Back to category"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Category</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setIsCopyModalOpen(true)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                          title="Copy recipe to another dish"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveTarget(null)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                          title="Close panel"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* SIZES / ITEMS SELECTOR STRIP */}
                    <div className="p-2.5 rounded-xl bg-[#12161f] border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-blue-400" />
                          <span>Items / Sizes in this Product ({getItemVariants(activeMenuItem).length})</span>
                        </span>
                        <button
                          onClick={() => openAddVariantModal(activeMenuItem)}
                          className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Add Item</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {getItemVariants(activeMenuItem).map(v => {
                          const isSelected = (activeTarget?.sizeName || 'M') === v.name
                          return (
                            <div
                              key={v.name}
                              onClick={() => handleSelectTarget(activeMenuItem, v)}
                              className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-400'
                                  : 'bg-[#1a1e28] text-slate-300 hover:bg-[#222838] border border-slate-700/60'
                              }`}
                            >
                              <span>{v.name}</span>
                              <span className={`text-[10px] font-mono ${isSelected ? 'text-blue-200' : 'text-blue-400'}`}>
                                ${(v.price !== undefined ? v.price : (activeMenuItem.price || 0)).toFixed(2)}
                              </span>
                              {getItemVariants(activeMenuItem).length > 1 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteVariant(activeMenuItem, v.name)
                                  }}
                                  className="opacity-0 group-hover:opacity-100 hover:text-rose-400 ml-0.5 text-slate-400 transition-opacity"
                                  title={`Delete size ${v.name}`}
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )
                        })}
                        <button
                          onClick={() => openAddVariantModal(activeMenuItem)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-dashed border-blue-500/30 flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+ Add Size</span>
                        </button>
                      </div>
                    </div>

                    {/* Financial Metrics Strip */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#12161f] border border-slate-800 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">COGS Cost</span>
                        <p className="text-xs font-black text-slate-200 mt-0.5">${activeFinancials.cogs.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Profit</span>
                        <p className="text-xs font-black text-emerald-400 mt-0.5">${activeFinancials.profit.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Gross Margin</span>
                        <p className={`text-xs font-black mt-0.5 ${
                          activeFinancials.margin >= 70 ? 'text-emerald-400' : activeFinancials.margin >= 50 ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {activeFinancials.margin}%
                        </p>
                      </div>
                    </div>

                    {/* Formulated Ingredients List */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-300">
                        <span>Recipe Formulation ({activeRecipes.length})</span>
                        <span className="text-[10px] text-slate-500 font-normal">Base / Scaled Quantity</span>
                      </div>

                      {activeRecipes.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-500 space-y-1">
                          <p>No ingredients attached yet</p>
                          <p className="text-[10px] text-slate-600">Select an ingredient below to build this recipe</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                          {activeRecipes.map(recipe => {
                            let qtyForActiveSize = recipe.quantity
                            if (recipe.sizeMultipliers) {
                              try {
                                const map = JSON.parse(recipe.sizeMultipliers)
                                const key = activeTarget.sizeName || 'M'
                                if (map[key] !== undefined) qtyForActiveSize = parseFloat(map[key])
                              } catch {}
                            }

                            const lineCost = (qtyForActiveSize || 0) * (recipe.ingredient?.costPerUnit || 0)

                            return (
                              <div
                                key={recipe.id}
                                className="p-2.5 rounded-xl bg-[#1e2330] border border-slate-700/60 flex items-center justify-between gap-2"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold text-slate-200">{recipe.ingredient?.name}</span>
                                    <span className="text-[10px] text-slate-500 font-mono">({recipe.ingredient?.unit})</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Cost: ${lineCost.toFixed(3)}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Quantity Input */}
                                  <div className="flex items-center gap-1 bg-[#12161f] p-1 rounded-lg border border-slate-700">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRecipeQty(recipe, Math.max(1, qtyForActiveSize - 1))}
                                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={qtyForActiveSize}
                                      onChange={(e) => handleUpdateRecipeQty(recipe, parseFloat(e.target.value) || 0)}
                                      className="w-12 text-center text-xs font-bold bg-transparent text-white focus:outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateRecipeQty(recipe, qtyForActiveSize + 1)}
                                      className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white"
                                    >
                                      +
                                    </button>
                                  </div>

                                  {/* Remove Button */}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleRemoveRecipeIngredient(recipe.id, recipe.ingredient?.name || '')}
                                    className="h-7 w-7 p-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
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

                    {/* Quick Add Ingredient to this dish */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <span className="text-xs font-bold text-slate-300">Add Ingredient to {activeMenuItem.name}</span>
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-7">
                          <select
                            value={selectedIngredientToAdd}
                            onChange={(e) => setSelectedIngredientToAdd(e.target.value)}
                            className="w-full h-9 rounded-xl bg-[#12161f] border border-slate-700 text-xs text-slate-200 px-2.5 focus:outline-none focus:border-blue-500"
                          >
                            <option value="">Select ingredient...</option>
                            {ingredients.map(ing => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} ({ing.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <Input
                            type="number"
                            value={qtyToAdd}
                            onChange={(e) => setQtyToAdd(e.target.value)}
                            placeholder="Qty"
                            className="h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <Button
                            size="sm"
                            onClick={handleAddIngredient}
                            disabled={isSavingRecipe || !selectedIngredientToAdd}
                            className="w-full h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white p-0 flex items-center justify-center cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                  </div>
                ) : activeCategory ? (
                  
                  /* CASE 2: CATEGORY SELECTED -> CATEGORY WORKBENCH (EXACTLY MATCHING IMAGE 2) */
                  <div className="bg-[#161a23] rounded-2xl border border-blue-500/30 p-5 space-y-6 shadow-xl">
                    
                    {/* Category Title & Subtitle */}
                    <div className="space-y-1">
                      <h3 className="text-xl sm:text-2xl font-black text-blue-400 uppercase tracking-tight flex items-center gap-2">
                        <span>{activeCategory.name}</span>
                        {activeCategory.parentId && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Sub-Category
                          </span>
                        )}
                      </h3>
                      <div className="text-xs text-slate-400 font-semibold space-y-0.5">
                        <p>Items : <span className="text-slate-200 font-bold">{activeCategoryItems.length}</span></p>
                        <p>Sub Categories : <span className="text-slate-200 font-bold">{activeCategorySubCategories.length}</span></p>
                      </div>
                    </div>

                    {/* Action Buttons styled with glowing blue icons matching Image 2 */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      
                      {/* Edit Button */}
                      <button
                        onClick={() => {
                          setEditingCategoryName(activeCategory.name)
                          setIsEditCategoryModalOpen(true)
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#12161f] border border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/10 text-slate-200 hover:text-white transition-all cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                          <Edit className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold block">Edit</span>
                          <span className="text-[10px] text-slate-500">Rename category</span>
                        </div>
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={handleDeleteCategory}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#12161f] border border-rose-500/20 hover:border-rose-500/50 hover:bg-rose-500/10 text-slate-200 hover:text-white transition-all cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                          <Trash2 className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold block text-rose-400">Delete</span>
                          <span className="text-[10px] text-slate-500">Remove category</span>
                        </div>
                      </button>

                      {/* + Item Button (Creates Item inside Category directly) */}
                      <button
                        onClick={() => openCreateItemModal(activeCategory)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-blue-600/20 border border-blue-500/60 hover:border-blue-400 hover:bg-blue-600/30 text-white transition-all cursor-pointer group shadow-lg shadow-blue-500/10"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
                          <Plus className="w-5 h-5 font-black" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-black block text-blue-300">Item</span>
                          <span className="text-[10px] text-blue-200/80">Add inside {activeCategory.name}</span>
                        </div>
                      </button>

                      {/* + Category Button (Creates Sub-Category or New Category) */}
                      <button
                        onClick={() => openCreateCategoryModal(activeCategory)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-emerald-600/20 border border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-600/30 text-slate-200 hover:text-white transition-all cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                          <FolderPlus className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold block text-emerald-300">Category</span>
                          <span className="text-[10px] text-slate-400">+ Sub-category</span>
                        </div>
                      </button>

                      {/* Copy Button */}
                      <button
                        onClick={() => {
                          setFeedback({ type: 'success', message: `Category "${activeCategory.name}" structure copied to clipboard` })
                        }}
                        className="col-span-2 flex items-center gap-3 p-3 rounded-xl bg-[#12161f] border border-blue-500/30 hover:border-blue-400 hover:bg-blue-500/10 text-slate-200 hover:text-white transition-all cursor-pointer group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                          <Copy className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-bold block">Copy Category & Recipes</span>
                          <span className="text-[10px] text-slate-500">Duplicate formulation structure</span>
                        </div>
                      </button>

                    </div>

                    {/* Sub-Categories inside this Category */}
                    {activeCategorySubCategories.length > 0 && (
                      <div className="pt-3 border-t border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <Folder className="w-3.5 h-3.5" />
                            <span>Sub-Categories ({activeCategorySubCategories.length})</span>
                          </span>
                          <button
                            onClick={() => openCreateCategoryModal(activeCategory)}
                            className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Sub-Category</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {activeCategorySubCategories.map(sub => {
                            const subItems = menuItems.filter(m => m.categoryId === sub.id)
                            return (
                              <div
                                key={sub.id}
                                onClick={() => handleSelectCategory(sub)}
                                className="p-2.5 rounded-xl bg-[#12161f] border border-slate-700 hover:border-emerald-500/60 cursor-pointer transition-all space-y-1"
                              >
                                <span className="text-xs font-bold text-slate-200 block uppercase truncate">
                                  {sub.name}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {subItems.length} dishes
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Dishes inside this Category */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-300">
                          Dishes in {activeCategory.name} ({activeCategoryItems.length})
                        </span>
                        <button
                          onClick={() => openCreateItemModal(activeCategory)}
                          className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Item</span>
                        </button>
                      </div>

                      {activeCategoryItems.length === 0 ? (
                        <div className="p-5 rounded-xl border border-dashed border-slate-700 text-center text-xs text-slate-500 space-y-2">
                          <p>No dishes yet in this category.</p>
                          <Button
                            size="sm"
                            onClick={() => openCreateItemModal(activeCategory)}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                          >
                            + Create Item in {activeCategory.name}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {activeCategoryItems.map(item => {
                            const recs = recipesByMenuItem.get(item.id) || []
                            return (
                              <div
                                key={item.id}
                                onClick={() => handleSelectTarget(item)}
                                className="p-2.5 rounded-xl bg-[#12161f] border border-slate-700/60 hover:border-blue-500/50 flex justify-between items-center cursor-pointer transition-all"
                              >
                                <div>
                                  <span className="text-xs font-bold text-slate-200 uppercase">{item.name}</span>
                                  <span className="text-[10px] text-slate-400 block">${item.price.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                                    recs.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                  }`}>
                                    {recs.length > 0 ? `${recs.length} ing` : 'No Recipe'}
                                  </span>
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                ) : (
                  <div className="bg-[#161a23] rounded-2xl border border-slate-800 p-8 text-center text-slate-500 space-y-2">
                    <Layers className="w-10 h-10 mx-auto text-slate-600" />
                    <p className="text-xs font-semibold">Select a category or dish in the tree to manage formulation</p>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: FLAT ITEMS LIST */}
          {/* ========================================================================= */}
          {topTab === 'items' && (
            <div className="bg-[#161a23] rounded-2xl border border-slate-800 p-4 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300">Total Dishes: {menuItems.length}</span>
                <span className="text-xs text-blue-400 font-semibold">Click any row to configure formulation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {menuItems.map(item => {
                  const itemRecipes = recipesByMenuItem.get(item.id) || []
                  const variants = getItemVariants(item)
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setTopTab('categories_items')
                        handleSelectTarget(item)
                      }}
                      className="p-3.5 rounded-xl bg-[#1e2330] border border-slate-700/60 hover:border-blue-500 cursor-pointer space-y-2 transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-white uppercase">{item.name}</span>
                        <span className="text-xs font-black text-blue-400">${item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{variants.length} Sizes</span>
                        <span className={`font-semibold ${itemRecipes.length > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {itemRecipes.length > 0 ? `${itemRecipes.length} ingredients` : 'Unformulated'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: VARIATION GROUPS */}
          {/* ========================================================================= */}
          {topTab === 'variation_groups' && (
            <div className="bg-[#161a23] rounded-2xl border border-slate-800 p-5 space-y-4">
              <div>
                <h3 className="text-sm font-black text-white">Variation Groups & Size Scaling</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Manage standard drink cup sizes and food portions used to scale recipe ingredient grammages.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                
                {/* Group 1: Drink Sizes */}
                <div className="p-4 rounded-xl bg-[#1e2330] border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Coffee className="w-4 h-4" />
                    <span className="text-xs font-bold text-white">Cup Sizes (Drinks)</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#12161f] flex justify-between">
                      <span className="font-semibold text-slate-200">Small (S) - 250ml</span>
                      <span className="text-blue-400 font-mono">0.75x Multiplier</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#12161f] flex justify-between">
                      <span className="font-semibold text-slate-200">Medium (M) - 350ml</span>
                      <span className="text-blue-400 font-mono">1.0x (Base)</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#12161f] flex justify-between">
                      <span className="font-semibold text-slate-200">Large (L) - 500ml</span>
                      <span className="text-blue-400 font-mono">1.4x Multiplier</span>
                    </div>
                  </div>
                </div>

                {/* Group 2: Milk Variations */}
                <div className="p-4 rounded-xl bg-[#1e2330] border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <FlaskConical className="w-4 h-4" />
                    <span className="text-xs font-bold text-white">Milk Alternates</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#12161f] flex justify-between">
                      <span className="font-semibold text-slate-200">Whole Dairy Milk</span>
                      <span className="text-emerald-400 font-mono">+$0.00</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#12161f] flex justify-between">
                      <span className="font-semibold text-slate-200">Oat Milk</span>
                      <span className="text-blue-400 font-mono">+$0.75</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#12161f] flex justify-between">
                      <span className="font-semibold text-slate-200">Almond Milk</span>
                      <span className="text-blue-400 font-mono">+$0.75</span>
                    </div>
                  </div>
                </div>

                {/* Group 3: Syrups & Addons */}
                <div className="p-4 rounded-xl bg-[#1e2330] border border-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-blue-400">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-bold text-white">Syrups & Pumps</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-[#12161f] flex justify-between">
                      <span className="font-semibold text-slate-200">Vanilla Syrup (1 pump)</span>
                      <span className="text-slate-400 font-mono">15 ml</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#12161f] flex justify-between">
                      <span className="font-semibold text-slate-200">Caramel Syrup (1 pump)</span>
                      <span className="text-slate-400 font-mono">15 ml</span>
                    </div>
                    <div className="p-2 rounded-lg bg-[#12161f] flex justify-between">
                      <span className="font-semibold text-slate-200">Espresso Extra Shot</span>
                      <span className="text-slate-400 font-mono">18 g dose</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD SIZE / VARIANT ITEM INSIDE ITEM (User Request)                   */}
      {/* ========================================================================= */}
      {isAddVariantModalOpen && variantModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e222b] text-white rounded-3xl border border-blue-500/40 p-6 max-w-md w-full space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>Add Item / Size inside "{variantModalItem.name}"</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Base Dish: <span className="font-bold text-blue-400">{variantModalItem.name}</span> (${variantModalItem.price.toFixed(2)})
                </p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setIsAddVariantModalOpen(false)} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Size Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: 'Small (S)', price: Math.round(variantModalItem.price * 0.85 * 10) / 10, vol: '250', mult: '0.75' },
                  { name: 'Medium (M)', price: variantModalItem.price, vol: '350', mult: '1.0' },
                  { name: 'Large (L)', price: Math.round(variantModalItem.price * 1.25 * 10) / 10, vol: '500', mult: '1.4' },
                  { name: 'Extra Large (XL)', price: Math.round(variantModalItem.price * 1.5 * 10) / 10, vol: '650', mult: '1.8' },
                  { name: 'Single Slice', price: Math.round(variantModalItem.price * 0.7 * 10) / 10, vol: '150', mult: '0.7' },
                  { name: 'Double Portion', price: Math.round(variantModalItem.price * 1.8 * 10) / 10, vol: '700', mult: '2.0' }
                ].map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setNewVariantName(preset.name)
                      setNewVariantPrice(String(preset.price))
                      setNewVariantVolume(preset.vol)
                      setNewVariantMultiplier(preset.mult)
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#12161f] hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 border border-slate-700 hover:border-blue-500/40 cursor-pointer transition-all"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {/* Size Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Item / Size Name</label>
                <Input
                  value={newVariantName}
                  onChange={(e) => setNewVariantName(e.target.value)}
                  placeholder="e.g. Small (S), XL, Slice, Full Plate"
                  className="mt-1 h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                  autoFocus
                />
              </div>

              {/* Price & Volume */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Selling Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newVariantPrice}
                    onChange={(e) => setNewVariantPrice(e.target.value)}
                    placeholder="e.g. 9.50"
                    className="mt-1 h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Volume / Weight (ml or g)</label>
                  <Input
                    type="number"
                    value={newVariantVolume}
                    onChange={(e) => setNewVariantVolume(e.target.value)}
                    placeholder="e.g. 350"
                    className="mt-1 h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                  />
                </div>
              </div>

              {/* Recipe Grammage Multiplier */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Recipe Grammage Multiplier
                </label>
                <Input
                  type="number"
                  step="0.05"
                  value={newVariantMultiplier}
                  onChange={(e) => setNewVariantMultiplier(e.target.value)}
                  placeholder="e.g. 1.0 (base) or 1.4 for large"
                  className="mt-1 h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Scales ingredient quantities in the recipe formulation automatically for this size (e.g. 0.75 for Small, 1.4 for Large).
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsAddVariantModalOpen(false)}
                className="w-1/2 rounded-xl text-xs h-9 bg-transparent border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveVariant}
                disabled={isSavingVariant || !newVariantName.trim() || !newVariantPrice}
                className="w-1/2 rounded-xl text-xs h-9 bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                {isSavingVariant ? 'Adding...' : 'Add Size / Item'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE CUSTOM CATEGORY OR SUB-CATEGORY (User Request)             */}
      {/* ========================================================================= */}
      {isCreateCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e222b] text-white rounded-3xl border border-slate-700 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-black text-sm flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-emerald-400" />
                <span>
                  {categoryModalParentId 
                    ? `Create Sub-Category in "${categories.find(c => c.id === categoryModalParentId)?.name}"` 
                    : 'Create Custom Category'}
                </span>
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsCreateCategoryModalOpen(false)} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3 text-xs">
              {/* Parent Category Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Parent Category (Hierarchy Level)
                </label>
                <select
                  value={categoryModalParentId}
                  onChange={(e) => {
                    setCategoryModalParentId(e.target.value)
                    setIsSubcategoryMode(Boolean(e.target.value))
                  }}
                  className="w-full mt-1 h-9 rounded-xl bg-[#12161f] border border-slate-700 text-xs text-white px-2.5 focus:outline-none"
                >
                  <option value="">(None - Top Level Root Category)</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? `↳ ${c.name}` : c.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {categoryModalParentId 
                    ? 'This will nest this new category inside the selected parent category'
                    : 'This will create an independent top-level root category in the tree'}
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Category Name</label>
                <Input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Matcha Series, Iced Specialties, Bakery"
                  className="mt-1 h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Description (Optional)</label>
                <Input
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  placeholder="e.g. Artisanal specialty beverages"
                  className="mt-1 h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateCategoryModalOpen(false)}
                className="w-1/2 rounded-xl text-xs h-9 bg-transparent border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={!newCategoryName.trim()}
                className="w-1/2 rounded-xl text-xs h-9 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                {categoryModalParentId ? 'Create Sub-Category' : 'Create Category'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE ITEM INSIDE CATEGORY DIRECTLY                               */}
      {/* ========================================================================= */}
      {isCreateItemModalOpen && targetCategoryForItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e222b] text-white rounded-3xl border border-blue-500/40 p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-black text-base text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>Create Item in "{targetCategoryForItem.name}"</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Category: <span className="font-bold text-blue-400">{targetCategoryForItem.name}</span>
                </p>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setIsCreateItemModalOpen(false)} 
                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Basic Info */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Item Name</label>
                <Input
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. HOT MATCHA, HOT SPANISH LATTE"
                  className="mt-1 h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Base Selling Price ($)</label>
                  <Input
                    type="number"
                    value={newItemPrice}
                    onChange={(e) => {
                      const p = e.target.value
                      setNewItemPrice(p)
                      // update default variant prices
                      const num = parseFloat(p) || 0
                      setNewItemVariants([
                        { name: 'M', price: num, volumeMl: 350 },
                        { name: 'L', price: Math.round(num * 1.15), volumeMl: 500 }
                      ])
                    }}
                    className="mt-1 h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Item Type</label>
                  <select
                    value={newItemType}
                    onChange={(e) => setNewItemType(e.target.value as any)}
                    className="w-full mt-1 h-9 rounded-xl bg-[#12161f] border border-slate-700 text-xs text-white px-2.5 focus:outline-none"
                  >
                    <option value="drink">Drink (Beverage)</option>
                    <option value="food">Food / Pastry</option>
                  </select>
                </div>
              </div>

              {/* Sizes / Variants preview (matching image format) */}
              <div className="p-3 rounded-2xl bg-[#12161f] border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                  Sizes & Variant Pricing (Appears in Tree)
                </span>
                <div className="space-y-1.5">
                  {newItemVariants.map((v, idx) => (
                    <div key={v.name} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#1a1e28]">
                      <span className="font-bold text-xs text-slate-200">
                        {newItemName || 'Item'} ({v.name})
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono text-[10px]">{v.volumeMl}ml</span>
                        <div className="flex items-center gap-1 bg-[#12161f] px-2 py-1 rounded-lg border border-slate-700">
                          <span className="text-slate-500 text-[10px]">$</span>
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0
                              setNewItemVariants(prev => {
                                const next = [...prev]
                                next[idx] = { ...next[idx], price: val }
                                return next
                              })
                            }}
                            className="w-12 text-center text-xs font-bold bg-transparent text-blue-400 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Immediate Recipe Ingredients (Optional directly during creation) */}
              <div className="p-3 rounded-2xl bg-[#12161f] border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-300 uppercase">
                    Initial Recipe Ingredients (Optional)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {initialFormulation.length} added
                  </span>
                </div>

                {initialFormulation.length > 0 && (
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {initialFormulation.map((f, i) => {
                      const ing = ingredients.find(ing => ing.id === f.ingredientId)
                      return (
                        <div key={i} className="flex justify-between items-center p-1.5 rounded-lg bg-[#1a1e28] text-xs">
                          <span className="text-slate-200">{ing?.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-blue-400 font-mono">{f.quantity} {ing?.unit}</span>
                            <button
                              type="button"
                              onClick={() => setInitialFormulation(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-slate-500 hover:text-rose-400"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="grid grid-cols-12 gap-2 pt-1">
                  <div className="col-span-7">
                    <select
                      value={selectedInitialIng}
                      onChange={(e) => setSelectedInitialIng(e.target.value)}
                      className="w-full h-8 rounded-xl bg-[#1a1e28] border border-slate-700 text-xs text-white px-2 focus:outline-none"
                    >
                      <option value="">Pick raw ingredient...</option>
                      {ingredients.map(ing => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={initialIngQty}
                      onChange={(e) => setInitialIngQty(e.target.value)}
                      placeholder="Qty"
                      className="h-8 rounded-xl bg-[#1a1e28] border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (!selectedInitialIng) return
                        const q = parseFloat(initialIngQty) || 15
                        setInitialFormulation(prev => [...prev, { ingredientId: selectedInitialIng, quantity: q }])
                        setSelectedInitialIng('')
                      }}
                      className="w-full h-8 rounded-xl bg-blue-600 text-white p-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                onClick={() => setIsCreateItemModalOpen(false)}
                className="w-1/2 rounded-xl text-xs h-10 bg-transparent border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateItemInsideCategory}
                disabled={isSavingNewItem || !newItemName.trim()}
                className="w-1/2 rounded-xl text-xs h-10 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30"
              >
                {isSavingNewItem ? 'Creating...' : `Create Item in ${targetCategoryForItem.name}`}
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT CATEGORY NAME                                                 */}
      {/* ========================================================================= */}
      {isEditCategoryModalOpen && activeCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#1e222b] text-white rounded-3xl border border-slate-700 p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Edit className="w-4 h-4 text-blue-400" />
                <span>Rename Category</span>
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsEditCategoryModalOpen(false)} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 text-xs">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Category Name</label>
              <Input
                value={editingCategoryName}
                onChange={(e) => setEditingCategoryName(e.target.value)}
                placeholder="e.g. HOT MATCHA"
                className="h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsEditCategoryModalOpen(false)}
                className="w-1/2 rounded-xl text-xs h-9 bg-transparent border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCategoryName}
                disabled={!editingCategoryName.trim()}
                className="w-1/2 rounded-xl text-xs h-9 bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Units Reference */}
      {/* ========================================================================= */}
      {isUnitsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1e222b] text-white rounded-3xl border border-slate-700 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-black text-sm flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-blue-400" />
                <span>Recipe Units & Standards</span>
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsUnitsModalOpen(false)} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-2.5 rounded-xl bg-[#12161f] flex justify-between">
                <span className="font-bold">grams (g)</span>
                <span className="text-slate-400">Coffee beans, powder, matcha, dry toppings</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#12161f] flex justify-between">
                <span className="font-bold">milliliters (ml)</span>
                <span className="text-slate-400">Milk, syrups, water, juices</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#12161f] flex justify-between">
                <span className="font-bold">shots / pumps</span>
                <span className="text-slate-400">Espresso shots (18g), syrup pumps (15ml)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#12161f] flex justify-between">
                <span className="font-bold">pieces (pcs)</span>
                <span className="text-slate-400">Cups, lids, straws, sleeves, packaging</span>
              </div>
            </div>
            <Button onClick={() => setIsUnitsModalOpen(false)} className="w-full bg-blue-600 hover:bg-blue-500 font-bold text-xs h-9 rounded-xl">
              Close
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Pricing Categories */}
      {/* ========================================================================= */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1e222b] text-white rounded-3xl border border-slate-700 p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-400" />
                <span>Pricing & Margin Tiers</span>
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsPricingModalOpen(false)} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-[#12161f] border border-emerald-500/20">
                <div className="flex justify-between font-bold text-emerald-400">
                  <span>High Margin (Star Items)</span>
                  <span>&gt; 70% Gross Margin</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Recommended for high volume coffee & specialty drinks</p>
              </div>
              <div className="p-3 rounded-xl bg-[#12161f] border border-amber-500/20">
                <div className="flex justify-between font-bold text-amber-400">
                  <span>Target Margin (Standard)</span>
                  <span>50% - 70% Margin</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Standard cafe benchmark for milk-heavy drinks</p>
              </div>
              <div className="p-3 rounded-xl bg-[#12161f] border border-rose-500/20">
                <div className="flex justify-between font-bold text-rose-400">
                  <span>Low Margin (Review)</span>
                  <span>&lt; 50% Margin</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Dishes that may need recipe dose adjustment or price raise</p>
              </div>
            </div>
            <Button onClick={() => setIsPricingModalOpen(false)} className="w-full bg-blue-600 hover:bg-blue-500 font-bold text-xs h-9 rounded-xl">
              Done
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Quick Add Raw Ingredient */}
      {/* ========================================================================= */}
      {isAddIngredientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1e222b] text-white rounded-3xl border border-slate-700 p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Create Raw Ingredient</span>
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsAddIngredientModalOpen(false)} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Ingredient Name</label>
                <Input
                  value={newIngredientName}
                  onChange={(e) => setNewIngredientName(e.target.value)}
                  placeholder="e.g. Ceremonial Matcha Powder"
                  className="mt-1 h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Unit</label>
                  <select
                    value={newIngredientUnit}
                    onChange={(e) => setNewIngredientUnit(e.target.value)}
                    className="w-full mt-1 h-9 rounded-xl bg-[#12161f] border border-slate-700 text-xs text-white px-2"
                  >
                    <option value="grams">grams</option>
                    <option value="ml">ml</option>
                    <option value="pieces">pieces</option>
                    <option value="kg">kg</option>
                    <option value="liters">liters</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cost Per Unit ($)</label>
                  <Input
                    type="number"
                    step="0.001"
                    value={newIngredientCost}
                    onChange={(e) => setNewIngredientCost(e.target.value)}
                    className="mt-1 h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Initial Stock Quantity</label>
                <Input
                  type="number"
                  value={newIngredientStock}
                  onChange={(e) => setNewIngredientStock(e.target.value)}
                  className="mt-1 h-9 rounded-xl bg-[#12161f] border-slate-700 text-xs text-white"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsAddIngredientModalOpen(false)}
                className="w-1/2 rounded-xl text-xs h-9 bg-transparent border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateNewIngredient}
                className="w-1/2 rounded-xl text-xs h-9 bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: Copy Recipe */}
      {/* ========================================================================= */}
      {isCopyModalOpen && activeMenuItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1e222b] text-white rounded-3xl border border-slate-700 p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-black text-sm flex items-center gap-2">
                <Copy className="w-4 h-4 text-blue-400" />
                <span>Copy Formulation</span>
              </h3>
              <Button size="sm" variant="ghost" onClick={() => setIsCopyModalOpen(false)} className="h-7 w-7 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-slate-300">
              Copy recipe ingredients from <span className="font-bold text-blue-400">{activeMenuItem.name}</span> to:
            </p>
            <div>
              <select
                value={targetItemToCopyTo}
                onChange={(e) => setTargetItemToCopyTo(e.target.value)}
                className="w-full h-9 rounded-xl bg-[#12161f] border border-slate-700 text-xs text-white px-2.5 focus:outline-none"
              >
                <option value="">Select destination dish...</option>
                {menuItems.filter(m => m.id !== activeMenuItem.id).map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} (${m.price.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsCopyModalOpen(false)}
                className="w-1/2 rounded-xl text-xs h-9 bg-transparent border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCopyRecipeToTarget}
                disabled={!targetItemToCopyTo || isSavingRecipe}
                className="w-1/2 rounded-xl text-xs h-9 bg-blue-600 hover:bg-blue-500 text-white font-bold"
              >
                {isSavingRecipe ? 'Copying...' : 'Copy Recipe'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
