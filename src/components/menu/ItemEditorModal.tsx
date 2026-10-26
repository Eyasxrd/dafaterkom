import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Sparkles, 
  Flame, 
  Utensils, 
  Clock, 
  Zap, 
  Plus, 
  Minus,
  Trash2, 
  Layers, 
  DollarSign, 
  Tag, 
  Check, 
  Search,
  Image as ImageIcon,
  ShieldAlert,
  AlertTriangle,
  Coffee,
  Milk,
  Sandwich,
  Package,
  Settings2,
  Scale,
  Box,
  ChefHat,
  PlusCircle,
  TrendingUp,
  Thermometer,
  Percent,
  Snowflake,
  Sun,
  Activity,
  Award,
  Sliders,
  CheckCircle2,
  Info,
  Heart,
  X,
  ArrowRight
} from 'lucide-react'
import DietaryBadge, { DIETARY_TAGS } from './DietaryBadge'
import {
  ItemType,
  DrinkSubtype,
  FoodSubtype,
  DrinkSizeOption,
  FoodPortionOption,
  DrinkCustomizationConfig,
  FoodCustomizationConfig,
  DrinkMilkOption,
  DrinkCoffeeOption,
  DrinkSweetenerOption,
  FoodModifierGroup,
  NutritionalFacts,
  DEFAULT_DRINK_SIZES,
  DEFAULT_FOOD_PORTIONS,
  DEFAULT_COFFEE_OPTIONS,
  DEFAULT_MILK_OPTIONS,
  DEFAULT_SWEETENER_OPTIONS,
  DEFAULT_TEMPERATURE_OPTIONS,
  DEFAULT_SWEETNESS_LEVELS,
  DEFAULT_ICE_LEVELS,
  COMMON_TASTE_PROFILES,
  getDefaultDrinkConfig,
  getDefaultFoodConfig,
  parseItemCustomization
} from '@/lib/item-customization'

interface ItemEditorModalProps {
  isOpen: boolean
  onClose: () => void
  itemToEdit?: any | null
  categories: Array<{ id: string; name: string }>
  menus: Array<{ id: string; name: string; type: string; slug: string }>
  onSaved: (item: any) => void
  onCategoryCreated?: (newCategory: any) => void
}

interface RecipeIngredientFormItem {
  ingredientId: string
  quantity: string
  name?: string
  unit?: string
  costPerUnit?: number
}

const COMMON_ALLERGENS = [
  'Dairy / Milk',
  'Tree Nuts',
  'Peanuts',
  'Gluten / Wheat',
  'Soy',
  'Eggs',
  'Sesame',
  'Fish / Seafood'
]

const DRINK_SUBTYPES: Array<{ key: DrinkSubtype; label: string }> = [
  { key: 'coffee', label: 'Coffee & Espresso' },
  { key: 'tea_matcha', label: 'Tea & Matcha' },
  { key: 'juice_smoothie', label: 'Fresh Juice & Smoothie' },
  { key: 'mocktail', label: 'Mocktail & Refresher' },
  { key: 'soda', label: 'Soda & Sparkler' },
  { key: 'shake_frappe', label: 'Frappe & Milkshake' },
  { key: 'water', label: 'Bottled Water' },
  { key: 'specialty', label: 'Specialty Beverage' }
]

const FOOD_SUBTYPES: Array<{ key: FoodSubtype; label: string }> = [
  { key: 'bakery', label: 'Pastry & Bakery' },
  { key: 'breakfast', label: 'Breakfast & Brunch' },
  { key: 'sandwich_wrap', label: 'Sandwich & Wrap' },
  { key: 'main_course', label: 'Main Dish / Entree' },
  { key: 'appetizer_side', label: 'Appetizer & Sides' },
  { key: 'salad_bowl', label: 'Salad & Healthy Bowl' },
  { key: 'dessert', label: 'Dessert & Cakes' },
  { key: 'pizza_pasta', label: 'Pizza & Pasta' },
  { key: 'other_food', label: 'Other Delicacy' }
]

const PRESET_PHOTOS = [
  { label: 'Espresso', url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400&auto=format&fit=crop&q=60' },
  { label: 'Latte Art', url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&auto=format&fit=crop&q=60' },
  { label: 'Iced Coffee', url: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&auto=format&fit=crop&q=60' },
  { label: 'Matcha Bowl', url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&auto=format&fit=crop&q=60' },
  { label: 'Pastry Croissant', url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&auto=format&fit=crop&q=60' },
  { label: 'Artisan Sandwich', url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&auto=format&fit=crop&q=60' },
  { label: 'Healthy Bowl', url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=60' },
  { label: 'Dessert Cake', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&auto=format&fit=crop&q=60' }
]

export default function ItemEditorModal({
  isOpen,
  onClose,
  itemToEdit,
  categories,
  menus,
  onSaved,
  onCategoryCreated
}: ItemEditorModalProps) {
  // Active Tab for modal navigation
  const [activeTab, setActiveTab] = useState<'basics' | 'sizes' | 'recipe' | 'filters' | 'nutrition' | 'menus'>('basics')

  // Basic Information
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [price, setPrice] = useState('5.00')
  const [categoryId, setCategoryId] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)

  // Item Classification & Subtypes
  const [itemType, setItemType] = useState<ItemType>('drink')
  const [drinkSubtype, setDrinkSubtype] = useState<DrinkSubtype>('coffee')
  const [foodSubtype, setFoodSubtype] = useState<FoodSubtype>('sandwich_wrap')

  // Drink Sizes & Matrix
  const [drinkSizes, setDrinkSizes] = useState<DrinkSizeOption[]>(DEFAULT_DRINK_SIZES)
  const [drinkTempOptions, setDrinkTempOptions] = useState<Array<'hot' | 'iced' | 'blended' | 'room_temp'>>(DEFAULT_TEMPERATURE_OPTIONS)
  const [drinkSweetnessLevels, setDrinkSweetnessLevels] = useState<string[]>(DEFAULT_SWEETNESS_LEVELS)
  const [drinkIceLevels, setDrinkIceLevels] = useState<string[]>(DEFAULT_ICE_LEVELS)
  const [drinkCaffeine, setDrinkCaffeine] = useState<'regular' | 'decaf' | 'half_caf' | 'caffeine_free'>('regular')

  // Drink Coffee & Milk Configurations
  const [drinkConfig, setDrinkConfig] = useState<DrinkCustomizationConfig>(getDefaultDrinkConfig(true, true))
  const [drinkCoffeeOptions, setDrinkCoffeeOptions] = useState<DrinkCoffeeOption[]>(DEFAULT_COFFEE_OPTIONS)
  const [drinkMilkOptions, setDrinkMilkOptions] = useState<DrinkMilkOption[]>(DEFAULT_MILK_OPTIONS)
  const [drinkSweetenerOptions, setDrinkSweetenerOptions] = useState<DrinkSweetenerOption[]>(DEFAULT_SWEETENER_OPTIONS)

  // Food Portions & Modifiers
  const [foodPortions, setFoodPortions] = useState<FoodPortionOption[]>(DEFAULT_FOOD_PORTIONS)
  const [foodSpiceLevel, setFoodSpiceLevel] = useState<'none' | 'mild' | 'medium' | 'hot' | 'extra_spicy'>('none')
  const [foodServingTemp, setFoodServingTemp] = useState<'hot' | 'cold' | 'fresh' | 'baked' | 'grilled' | 'fried'>('hot')
  const [foodConfig, setFoodConfig] = useState<FoodCustomizationConfig>(getDefaultFoodConfig())

  // Nutritional Facts & Sourcing Specs
  const [calories, setCalories] = useState('')
  const [prepTime, setPrepTime] = useState('')
  const [proteinG, setProteinG] = useState('')
  const [carbsG, setCarbsG] = useState('')
  const [fatG, setFatG] = useState('')
  const [sugarG, setSugarG] = useState('')
  const [sodiumMg, setSodiumMg] = useState('')
  const [originNote, setOriginNote] = useState('')
  const [storageNote, setStorageNote] = useState('')

  // Taste Profiles, Dietary & Allergens
  const [selectedTasteProfiles, setSelectedTasteProfiles] = useState<string[]>(['Rich', 'Creamy'])
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>([])
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([])

  // Raw Inventory & Recipe formulation
  const [rawIngredientsList, setRawIngredientsList] = useState<Array<{ id: string; name: string; unit: string; quantity: number; costPerUnit?: number }>>([])
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientFormItem[]>([])
  const [selectedIngredientToAdd, setSelectedIngredientToAdd] = useState('')
  const [selectedQuantityToAdd, setSelectedQuantityToAdd] = useState('')
  const [ingredientPickerSearch, setIngredientPickerSearch] = useState('')
  const [ingredientPickerUnitFilter, setIngredientPickerUnitFilter] = useState<string>('all')


  // Multi-menu assignments
  const [menuAssignments, setMenuAssignments] = useState<Record<string, { selected: boolean; customPrice: string }>>({})

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch available raw ingredients from inventory
  useEffect(() => {
    async function fetchIngredients() {
      try {
        const res = await fetch('/api/ingredients')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setRawIngredientsList(data)
          }
        }
      } catch (e) {
        console.error('Failed to load raw ingredients for linking:', e)
      }
    }
    if (isOpen) {
      fetchIngredients()
    }
  }, [isOpen])

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name || '')
      setDescription(itemToEdit.description || '')
      setIngredients(itemToEdit.ingredients || '')
      setPrice(itemToEdit.price !== undefined ? itemToEdit.price.toString() : '5.00')
      setCategoryId(itemToEdit.categoryId || (categories[0]?.id || ''))
      setImageUrl(itemToEdit.imageUrl || '')
      setIsAvailable(itemToEdit.isAvailable !== false)
      setCalories(itemToEdit.calories ? itemToEdit.calories.toString() : '')
      setPrepTime(itemToEdit.prepTime ? itemToEdit.prepTime.toString() : '')

      // Parse structured customization options
      const parsedConfig = parseItemCustomization(itemToEdit.options)
      setItemType(parsedConfig.itemType)

      if (parsedConfig.drinkConfig) {
        setDrinkConfig(parsedConfig.drinkConfig)
        if (parsedConfig.drinkConfig.subtype) setDrinkSubtype(parsedConfig.drinkConfig.subtype)
        if (parsedConfig.drinkConfig.sizes && parsedConfig.drinkConfig.sizes.length > 0) {
          setDrinkSizes(parsedConfig.drinkConfig.sizes)
        }
        if (parsedConfig.drinkConfig.temperatureOptions) {
          setDrinkTempOptions(parsedConfig.drinkConfig.temperatureOptions)
        }
        if (parsedConfig.drinkConfig.sweetnessLevels) {
          setDrinkSweetnessLevels(parsedConfig.drinkConfig.sweetnessLevels)
        }
        if (parsedConfig.drinkConfig.iceLevels) {
          setDrinkIceLevels(parsedConfig.drinkConfig.iceLevels)
        }
        if (parsedConfig.drinkConfig.caffeineType) {
          setDrinkCaffeine(parsedConfig.drinkConfig.caffeineType)
        }
        if (parsedConfig.drinkConfig.coffeeOptions && parsedConfig.drinkConfig.coffeeOptions.length > 0) {
          setDrinkCoffeeOptions(parsedConfig.drinkConfig.coffeeOptions)
        }
        if (parsedConfig.drinkConfig.milkOptions && parsedConfig.drinkConfig.milkOptions.length > 0) {
          setDrinkMilkOptions(parsedConfig.drinkConfig.milkOptions)
        }
        if (parsedConfig.drinkConfig.sweetenerOptions && parsedConfig.drinkConfig.sweetenerOptions.length > 0) {
          setDrinkSweetenerOptions(parsedConfig.drinkConfig.sweetenerOptions)
        }
      }

      if (parsedConfig.foodConfig) {
        setFoodConfig(parsedConfig.foodConfig)
        if (parsedConfig.foodConfig.subtype) setFoodSubtype(parsedConfig.foodConfig.subtype)
        if (parsedConfig.foodConfig.portions && parsedConfig.foodConfig.portions.length > 0) {
          setFoodPortions(parsedConfig.foodConfig.portions)
        }
        if (parsedConfig.foodConfig.spiceLevel) {
          setFoodSpiceLevel(parsedConfig.foodConfig.spiceLevel)
        }
        if (parsedConfig.foodConfig.servingTemp) {
          setFoodServingTemp(parsedConfig.foodConfig.servingTemp)
        }
      }

      // Nutritional Specs
      if (parsedConfig.nutrition) {
        setProteinG(parsedConfig.nutrition.proteinG !== undefined ? String(parsedConfig.nutrition.proteinG) : '')
        setCarbsG(parsedConfig.nutrition.carbsG !== undefined ? String(parsedConfig.nutrition.carbsG) : '')
        setFatG(parsedConfig.nutrition.fatG !== undefined ? String(parsedConfig.nutrition.fatG) : '')
        setSugarG(parsedConfig.nutrition.sugarG !== undefined ? String(parsedConfig.nutrition.sugarG) : '')
        setSodiumMg(parsedConfig.nutrition.sodiumMg !== undefined ? String(parsedConfig.nutrition.sodiumMg) : '')
      } else {
        setProteinG('')
        setCarbsG('')
        setFatG('')
        setSugarG('')
        setSodiumMg('')
      }

      setOriginNote(parsedConfig.originNote || '')
      setStorageNote(parsedConfig.storageNote || '')
      setSelectedTasteProfiles(parsedConfig.tasteProfile || ['Sweet', 'Creamy'])

      // Parse tags
      let parsedTags: string[] = []
      try {
        if (itemToEdit.dietaryTags) {
          parsedTags = typeof itemToEdit.dietaryTags === 'string'
            ? JSON.parse(itemToEdit.dietaryTags)
            : itemToEdit.dietaryTags
        }
      } catch {
        parsedTags = itemToEdit.dietaryTags ? itemToEdit.dietaryTags.split(',') : []
      }
      setSelectedDietaryTags(Array.isArray(parsedTags) ? parsedTags : [])

      // Parse allergens
      let parsedAllergens: string[] = []
      try {
        if (itemToEdit.allergens) {
          parsedAllergens = typeof itemToEdit.allergens === 'string'
            ? JSON.parse(itemToEdit.allergens)
            : itemToEdit.allergens
        }
      } catch {
        parsedAllergens = itemToEdit.allergens ? itemToEdit.allergens.split(',') : []
      }
      setSelectedAllergens(Array.isArray(parsedAllergens) ? parsedAllergens : [])

      // Load recipe ingredients
      if (itemToEdit.recipes && Array.isArray(itemToEdit.recipes) && itemToEdit.recipes.length > 0) {
        setRecipeIngredients(
          itemToEdit.recipes.map((r: any) => ({
            ingredientId: r.ingredientId,
            quantity: String(r.quantity),
            name: r.ingredient?.name,
            unit: r.ingredient?.unit,
            costPerUnit: r.ingredient?.costPerUnit
          }))
        )
      } else if (itemToEdit.id) {
        fetch(`/api/recipes?menuItemId=${itemToEdit.id}`)
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setRecipeIngredients(
                data.map((r: any) => ({
                  ingredientId: r.ingredientId,
                  quantity: String(r.quantity),
                  name: r.ingredient?.name,
                  unit: r.ingredient?.unit,
                  costPerUnit: r.ingredient?.costPerUnit
                }))
              )
            }
          })
          .catch((err) => console.error('Failed to load item recipes:', err))
      } else {
        setRecipeIngredients([])
      }

      // Initialize menu assignments
      const assignMap: Record<string, { selected: boolean; customPrice: string }> = {}
      menus.forEach((m) => {
        const link = itemToEdit.menus?.find((l: any) => l.menuId === m.id || l.menu?.id === m.id)
        assignMap[m.id] = {
          selected: !!link,
          customPrice: link && link.customPrice !== null && link.customPrice !== undefined ? link.customPrice.toString() : ''
        }
      })
      setMenuAssignments(assignMap)
    } else {
      setName('')
      setDescription('')
      setIngredients('')
      setPrice('5.00')
      setCategoryId(categories[0]?.id || '')
      setImageUrl('')
      setIsAvailable(true)
      setItemType('drink')
      setDrinkSubtype('coffee')
      setFoodSubtype('sandwich_wrap')
      setDrinkSizes(DEFAULT_DRINK_SIZES)
      setDrinkTempOptions(DEFAULT_TEMPERATURE_OPTIONS)
      setDrinkSweetnessLevels(DEFAULT_SWEETNESS_LEVELS)
      setDrinkIceLevels(DEFAULT_ICE_LEVELS)
      setDrinkCaffeine('regular')
      setDrinkCoffeeOptions(DEFAULT_COFFEE_OPTIONS)
      setDrinkMilkOptions(DEFAULT_MILK_OPTIONS)
      setDrinkSweetenerOptions(DEFAULT_SWEETENER_OPTIONS)
      setDrinkConfig(getDefaultDrinkConfig(true, true))
      setFoodPortions(DEFAULT_FOOD_PORTIONS)
      setFoodSpiceLevel('none')
      setFoodServingTemp('hot')
      setFoodConfig(getDefaultFoodConfig())
      setSelectedDietaryTags(['bestseller'])
      setSelectedAllergens([])
      setCalories('160')
      setPrepTime('4')
      setProteinG('4')
      setCarbsG('18')
      setFatG('3.5')
      setSugarG('12')
      setSodiumMg('65')
      setOriginNote('Artisanal Specialty Beans')
      setStorageNote('Best enjoyed fresh within 15 minutes')
      setSelectedTasteProfiles(['Rich', 'Creamy'])
      setRecipeIngredients([])

      const assignMap: Record<string, { selected: boolean; customPrice: string }> = {}
      menus.forEach((m) => {
        assignMap[m.id] = {
          selected: true,
          customPrice: m.type === 'apps' ? '6.00' : ''
        }
      })
      setMenuAssignments(assignMap)
    }
    setError(null)
    setIsCreatingCategory(false)
    setNewCatName('')
    setSelectedIngredientToAdd('')
    setSelectedQuantityToAdd('')
    setActiveTab('basics')
  }, [itemToEdit, isOpen, categories, menus])

  // Filtered raw ingredients for the recipe builder shelf inside the modal
  const filteredRawIngredientsForModal = useMemo(() => {
    return rawIngredientsList.filter((ing) => {
      if (ingredientPickerSearch.trim()) {
        const q = ingredientPickerSearch.toLowerCase()
        if (!ing.name.toLowerCase().includes(q) && !((ing as any).description || '').toLowerCase().includes(q)) {
          return false
        }
      }
      if (ingredientPickerUnitFilter !== 'all' && ing.unit !== ingredientPickerUnitFilter) {
        return false
      }
      return true
    })
  }, [rawIngredientsList, ingredientPickerSearch, ingredientPickerUnitFilter])

  const handleDirectAddIngredientPortion = (ing: any, portionQty: number) => {
    const existingIndex = recipeIngredients.findIndex((r) => r.ingredientId === ing.id)
    if (existingIndex >= 0) {
      setRecipeIngredients((prev) =>
        prev.map((r, idx) =>
          idx === existingIndex
            ? { ...r, quantity: String(Math.round((parseFloat(r.quantity) + portionQty) * 100) / 100) }
            : r
        )
      )
    } else {
      setRecipeIngredients((prev) => [
        ...prev,
        {
          ingredientId: ing.id,
          quantity: String(portionQty),
          name: ing.name,
          unit: ing.unit,
          costPerUnit: ing.costPerUnit || 0
        }
      ])
    }
  }

  // Recipe helpers
  const handleAddIngredientToRecipe = () => {
    if (!selectedIngredientToAdd) return
    const found = rawIngredientsList.find((i) => i.id === selectedIngredientToAdd)
    if (!found) return
    const qty = parseFloat(selectedQuantityToAdd) || (found.unit === 'pieces' || found.unit === 'shots' ? 1 : found.unit === 'ml' ? 150 : 15)

    const existingIndex = recipeIngredients.findIndex((r) => r.ingredientId === selectedIngredientToAdd)
    if (existingIndex >= 0) {
      setRecipeIngredients((prev) =>
        prev.map((r, idx) =>
          idx === existingIndex
            ? { ...r, quantity: String(parseFloat(r.quantity) + qty) }
            : r
        )
      )
    } else {
      setRecipeIngredients((prev) => [
        ...prev,
        {
          ingredientId: found.id,
          quantity: String(qty),
          name: found.name,
          unit: found.unit,
          costPerUnit: found.costPerUnit || 0
        }
      ])
    }
    setSelectedIngredientToAdd('')
    setSelectedQuantityToAdd('')
  }

  const handleUpdateRecipeIngredientQty = (ingredientId: string, val: string) => {
    setRecipeIngredients((prev) =>
      prev.map((r) => (r.ingredientId === ingredientId ? { ...r, quantity: val } : r))
    )
  }

  const handleRemoveRecipeIngredient = (ingredientId: string) => {
    setRecipeIngredients((prev) => prev.filter((r) => r.ingredientId !== ingredientId))
  }

  // Automatic synchronization between Step 2 Customizations and Step 3 Recipe Formulation
  const syncCustomizationIngredient = (
    newIngredientId?: string,
    quantity?: number | string,
    oldIngredientId?: string,
    overrideUnit?: string
  ) => {
    setRecipeIngredients((prev) => {
      let next = [...prev]
      if (oldIngredientId && oldIngredientId !== newIngredientId) {
        next = next.filter((r) => r.ingredientId !== oldIngredientId)
      }
      if (!newIngredientId) return next
      const raw = rawIngredientsList.find((i) => i.id === newIngredientId)
      const qtyStr = quantity !== undefined && quantity !== '' && Number(quantity) > 0 ? String(quantity) : '1'
      const existingIdx = next.findIndex((r) => r.ingredientId === newIngredientId)
      if (existingIdx >= 0) {
        next[existingIdx] = {
          ...next[existingIdx],
          quantity: qtyStr,
          name: raw?.name || next[existingIdx].name,
          unit: overrideUnit || raw?.unit || next[existingIdx].unit,
          costPerUnit: raw?.costPerUnit ?? next[existingIdx].costPerUnit
        }
      } else {
        next.push({
          ingredientId: newIngredientId,
          quantity: qtyStr,
          name: raw?.name || 'Raw Material',
          unit: overrideUnit || raw?.unit || 'pc',
          costPerUnit: raw?.costPerUnit || 0
        })
      }
      return next
    })
  }

  const removeCustomizationIngredient = (ingredientId?: string) => {
    if (!ingredientId) return
    setRecipeIngredients((prev) => prev.filter((r) => r.ingredientId !== ingredientId))
  }

  // Coffee Beans Management
  const handleAddCoffeeOption = () => {
    const newBean: DrinkCoffeeOption = {
      id: `bean_${Date.now()}`,
      name: 'Specialty Roast',
      doseGrams: 18,
      extraPrice: 0.00,
      isDefault: drinkCoffeeOptions.length === 0
    }
    setDrinkCoffeeOptions((prev) => [...prev, newBean])
  }

  const handleUpdateCoffeeOption = (idOrIndex: string | number, patch: Partial<DrinkCoffeeOption>) => {
    const current = drinkCoffeeOptions.find((c, idx) => (c.id ? c.id === idOrIndex : idx === idOrIndex))
    if (current && drinkConfig.isCoffeeBased) {
      const oldIngId = current.ingredientId
      const newIngId = patch.ingredientId !== undefined ? patch.ingredientId : oldIngId
      const newDose = patch.doseGrams !== undefined ? patch.doseGrams : current.doseGrams || 18

      if (patch.ingredientId !== undefined) {
        if (newIngId) {
          syncCustomizationIngredient(newIngId, newDose, oldIngId, 'g')
        } else if (oldIngId) {
          removeCustomizationIngredient(oldIngId)
        }
      } else if (patch.doseGrams !== undefined && oldIngId) {
        syncCustomizationIngredient(oldIngId, newDose, undefined, 'g')
      }
    }

    setDrinkCoffeeOptions((prev) =>
      prev.map((c, idx) => {
        const matches = c.id ? c.id === idOrIndex : idx === idOrIndex
        return matches ? { ...c, ...patch } : c
      })
    )
  }

  const handleRemoveCoffeeOption = (idOrIndex: string | number) => {
    const current = drinkCoffeeOptions.find((c, idx) => (c.id ? c.id === idOrIndex : idx === idOrIndex))
    if (current?.ingredientId && drinkConfig.isCoffeeBased) {
      removeCustomizationIngredient(current.ingredientId)
    }
    setDrinkCoffeeOptions((prev) =>
      prev.filter((c, idx) => (c.id ? c.id !== idOrIndex : idx !== idOrIndex))
    )
  }

  // Milk Options Management
  const handleAddMilkOption = () => {
    const newMilk: DrinkMilkOption = {
      id: `milk_${Date.now()}`,
      name: 'Dairy / Plant Milk',
      volumeMl: 220,
      extraPrice: 0.00,
      isDefault: drinkMilkOptions.length === 0
    }
    setDrinkMilkOptions((prev) => [...prev, newMilk])
  }

  const handleUpdateMilkOption = (idOrIndex: string | number, patch: Partial<DrinkMilkOption>) => {
    const current = drinkMilkOptions.find((m, idx) => (m.id ? m.id === idOrIndex : idx === idOrIndex))
    if (current && drinkConfig.isMilkBased) {
      const oldIngId = current.ingredientId
      const newIngId = patch.ingredientId !== undefined ? patch.ingredientId : oldIngId
      const newVol = patch.volumeMl !== undefined ? patch.volumeMl : current.volumeMl || 220

      if (patch.ingredientId !== undefined) {
        if (newIngId) {
          syncCustomizationIngredient(newIngId, newVol, oldIngId, 'ml')
        } else if (oldIngId) {
          removeCustomizationIngredient(oldIngId)
        }
      } else if (patch.volumeMl !== undefined && oldIngId) {
        syncCustomizationIngredient(oldIngId, newVol, undefined, 'ml')
      }
    }

    setDrinkMilkOptions((prev) =>
      prev.map((m, idx) => {
        const matches = m.id ? m.id === idOrIndex : idx === idOrIndex
        return matches ? { ...m, ...patch } : m
      })
    )
  }

  const handleRemoveMilkOption = (idOrIndex: string | number) => {
    const current = drinkMilkOptions.find((m, idx) => (m.id ? m.id === idOrIndex : idx === idOrIndex))
    if (current?.ingredientId && drinkConfig.isMilkBased) {
      removeCustomizationIngredient(current.ingredientId)
    }
    setDrinkMilkOptions((prev) =>
      prev.filter((m, idx) => (m.id ? m.id !== idOrIndex : idx !== idOrIndex))
    )
  }

  // Sweetener / Sugar Options Management
  const handleAddSweetenerOption = () => {
    const newSweetener: DrinkSweetenerOption = {
      id: `sweetener_${Date.now()}`,
      name: 'Sugar / Sweetener',
      quantityPerServing: 10,
      unit: 'g',
      extraPrice: 0.00,
      isDefault: drinkSweetenerOptions.length === 0
    }
    setDrinkSweetenerOptions((prev) => [...prev, newSweetener])
  }

  const handleUpdateSweetenerOption = (id: string, patch: Partial<DrinkSweetenerOption>) => {
    const current = drinkSweetenerOptions.find((s) => s.id === id)
    if (current) {
      const oldIngId = current.ingredientId
      const newIngId = patch.ingredientId !== undefined ? patch.ingredientId : oldIngId
      const newQty = patch.quantityPerServing !== undefined ? patch.quantityPerServing : current.quantityPerServing || 10
      const newUnit = patch.unit || current.unit || 'g'

      if (patch.ingredientId !== undefined) {
        if (newIngId) {
          syncCustomizationIngredient(newIngId, newQty, oldIngId, newUnit)
        } else if (oldIngId) {
          removeCustomizationIngredient(oldIngId)
        }
      } else if ((patch.quantityPerServing !== undefined || patch.unit !== undefined) && oldIngId) {
        syncCustomizationIngredient(oldIngId, newQty, undefined, newUnit)
      }
    }

    setDrinkSweetenerOptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    )
  }

  const handleRemoveSweetenerOption = (id: string) => {
    const current = drinkSweetenerOptions.find((s) => s.id === id)
    if (current?.ingredientId) {
      removeCustomizationIngredient(current.ingredientId)
    }
    setDrinkSweetenerOptions((prev) => prev.filter((s) => s.id !== id))
  }

  const handleAutoFillDescriptionFromRecipe = () => {
    if (recipeIngredients.length === 0) return
    const names = recipeIngredients
      .map((r) => {
        const ing = rawIngredientsList.find((i) => i.id === r.ingredientId) || r
        return `${r.quantity}${ing.unit ? ` ${ing.unit}` : ''} ${ing.name || 'ingredient'}`
      })
      .join(', ')
    setIngredients(names)
  }

  // Size management helpers
  const handleUpdateDrinkSize = (id: string, patch: Partial<DrinkSizeOption>) => {
    const current = drinkSizes.find((s) => s.id === id)
    if (current) {
      const packagingFields: Array<{
        key: 'hotCupIngredientId' | 'hotLidIngredientId' | 'coldCupIngredientId' | 'coldLidIngredientId'
        unit: string
      }> = [
        { key: 'hotCupIngredientId', unit: 'pieces' },
        { key: 'hotLidIngredientId', unit: 'pieces' },
        { key: 'coldCupIngredientId', unit: 'pieces' },
        { key: 'coldLidIngredientId', unit: 'pieces' }
      ]

      packagingFields.forEach(({ key, unit }) => {
        if (patch[key] !== undefined) {
          const oldIngId = current[key]
          const newIngId = patch[key]
          if (newIngId) {
            syncCustomizationIngredient(newIngId, 1, oldIngId, unit)
          } else if (oldIngId) {
            removeCustomizationIngredient(oldIngId)
          }
        }
      })
    }

    setDrinkSizes((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s
        const updated = { ...s, ...patch }
        // Automatically sync ingredientMultiplier if volumeMl changed and multiplier was not explicitly set
        if (patch.volumeMl !== undefined && patch.ingredientMultiplier === undefined && patch.volumeMl > 0) {
          const baseMl = 250
          updated.ingredientMultiplier = Math.round((patch.volumeMl / baseMl) * 100) / 100
        }
        return updated
      })
    )
  }

  const handleAddDrinkSize = () => {
    const vol = 400
    const newSize: DrinkSizeOption = {
      id: `size_${Date.now()}`,
      name: 'Custom Size',
      volumeMl: vol,
      volumeOz: 14,
      extraPrice: 1.00,
      ingredientMultiplier: Math.round((vol / 250) * 100) / 100,
      isDefault: false
    }
    setDrinkSizes((prev) => [...prev, newSize])
  }

  const handleRemoveDrinkSize = (id: string) => {
    if (drinkSizes.length <= 1) return
    const current = drinkSizes.find((s) => s.id === id)
    if (current) {
      if (current.hotCupIngredientId) removeCustomizationIngredient(current.hotCupIngredientId)
      if (current.hotLidIngredientId) removeCustomizationIngredient(current.hotLidIngredientId)
      if (current.coldCupIngredientId) removeCustomizationIngredient(current.coldCupIngredientId)
      if (current.coldLidIngredientId) removeCustomizationIngredient(current.coldLidIngredientId)
    }
    setDrinkSizes((prev) => prev.filter((s) => s.id !== id))
  }

  const handleApplyDrinkSizesPreset = (type: 'standard3' | 'fourSizes' | 'single') => {
    if (type === 'standard3') {
      setDrinkSizes([
        { id: 'size_s', name: 'Small', volumeMl: 250, volumeOz: 8, extraPrice: 0, ingredientMultiplier: 1.0, isDefault: true },
        { id: 'size_m', name: 'Medium', volumeMl: 350, volumeOz: 12, extraPrice: 0.75, ingredientMultiplier: 1.4, isDefault: false },
        { id: 'size_l', name: 'Large', volumeMl: 500, volumeOz: 16, extraPrice: 1.50, ingredientMultiplier: 2.0, isDefault: false },
      ])
    } else if (type === 'fourSizes') {
      setDrinkSizes([
        { id: 'size_s', name: 'Small', volumeMl: 250, volumeOz: 8, extraPrice: 0, ingredientMultiplier: 1.0, isDefault: false },
        { id: 'size_m', name: 'Medium', volumeMl: 350, volumeOz: 12, extraPrice: 0.75, ingredientMultiplier: 1.4, isDefault: true },
        { id: 'size_l', name: 'Large', volumeMl: 500, volumeOz: 16, extraPrice: 1.50, ingredientMultiplier: 2.0, isDefault: false },
        { id: 'size_xl', name: 'Extra Large', volumeMl: 700, volumeOz: 24, extraPrice: 2.25, ingredientMultiplier: 2.5, isDefault: false },
      ])
    } else {
      setDrinkSizes([
        { id: 'size_std', name: 'Standard (12oz)', volumeMl: 350, volumeOz: 12, extraPrice: 0, ingredientMultiplier: 1.0, isDefault: true },
      ])
    }
  }

  const handleToggleSweetness = (level: string) => {
    setDrinkSweetnessLevels((prev) =>
      prev.includes(level)
        ? prev.length > 1
          ? prev.filter((l) => l !== level)
          : prev
        : [...prev, level]
    )
  }

  const handleToggleIceLevel = (ice: string) => {
    setDrinkIceLevels((prev) =>
      prev.includes(ice)
        ? prev.length > 1
          ? prev.filter((i) => i !== ice)
          : prev
        : [...prev, ice]
    )
  }

  // Food Portion management helpers
  const handleUpdateFoodPortion = (id: string, patch: Partial<FoodPortionOption>) => {
    const current = foodPortions.find((p) => p.id === id)
    if (current) {
      if (patch.packagingIngredientId !== undefined) {
        if (patch.packagingIngredientId) {
          syncCustomizationIngredient(patch.packagingIngredientId, 1, current.packagingIngredientId, 'pieces')
        } else if (current.packagingIngredientId) {
          removeCustomizationIngredient(current.packagingIngredientId)
        }
      }
      if (patch.secondaryPackagingIngredientId !== undefined) {
        if (patch.secondaryPackagingIngredientId) {
          syncCustomizationIngredient(patch.secondaryPackagingIngredientId, 1, current.secondaryPackagingIngredientId, 'pieces')
        } else if (current.secondaryPackagingIngredientId) {
          removeCustomizationIngredient(current.secondaryPackagingIngredientId)
        }
      }
    }
    setFoodPortions((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  const handleAddFoodPortion = () => {
    const newPortion: FoodPortionOption = {
      id: `portion_${Date.now()}`,
      name: 'Special Platter',
      weightGrams: 300,
      extraPrice: 3.00,
      ingredientMultiplier: 1.5,
      isDefault: false
    }
    setFoodPortions((prev) => [...prev, newPortion])
  }

  const handleRemoveFoodPortion = (id: string) => {
    if (foodPortions.length <= 1) return
    const current = foodPortions.find((p) => p.id === id)
    if (current) {
      if (current.packagingIngredientId) removeCustomizationIngredient(current.packagingIngredientId)
      if (current.secondaryPackagingIngredientId) removeCustomizationIngredient(current.secondaryPackagingIngredientId)
    }
    setFoodPortions((prev) => prev.filter((p) => p.id !== id))
  }

  // Temperature option toggle
  const handleToggleTemperature = (temp: 'hot' | 'iced' | 'blended' | 'room_temp') => {
    setDrinkTempOptions((prev) =>
      prev.includes(temp)
        ? prev.length > 1
          ? prev.filter((t) => t !== temp)
          : prev
        : [...prev, temp]
    )
  }

  // Taste profile toggle
  const toggleTasteProfile = (taste: string) => {
    setSelectedTasteProfiles((prev) =>
      prev.includes(taste) ? prev.filter((t) => t !== taste) : [...prev, taste]
    )
  }

  const toggleDietaryTag = (tagId: string) => {
    setSelectedDietaryTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    )
  }

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    )
  }

  const toggleMenuSelected = (menuId: string) => {
    setMenuAssignments((prev) => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        selected: !prev[menuId]?.selected
      }
    }))
  }

  const handleMenuCustomPrice = (menuId: string, val: string) => {
    setMenuAssignments((prev) => ({
      ...prev,
      [menuId]: {
        ...prev[menuId],
        customPrice: val
      }
    }))
  }

  const handleQuickCreateCategory = async () => {
    if (!newCatName.trim()) return
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() })
      })
      const created = await res.json()
      if (res.ok) {
        if (onCategoryCreated) onCategoryCreated(created)
        setCategoryId(created.id)
        setIsCreatingCategory(false)
        setNewCatName('')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Food Modifier Group handlers
  const handleAddFoodModifierGroup = () => {
    const newGroup: FoodModifierGroup = {
      id: `group_${Date.now()}`,
      name: 'Custom Topping / Choice',
      required: false,
      minSelections: 0,
      maxSelections: 1,
      options: [
        { id: `opt_${Date.now()}_1`, name: 'Choice 1', quantityDeducted: 1, unit: 'pcs', isDefault: true }
      ]
    }
    setFoodConfig((prev) => ({
      ...prev,
      modifierGroups: [...(prev.modifierGroups || []), newGroup]
    }))
  }

  const handleDeleteFoodModifierGroup = (groupId: string) => {
    setFoodConfig((prev) => ({
      ...prev,
      modifierGroups: (prev.modifierGroups || []).filter((g) => g.id !== groupId)
    }))
  }

  const handleAddOptionToGroup = (groupId: string) => {
    setFoodConfig((prev) => ({
      ...prev,
      modifierGroups: (prev.modifierGroups || []).map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: [
                ...g.options,
                { id: `opt_${Date.now()}`, name: 'New Choice', quantityDeducted: 1, unit: 'pcs', extraPrice: 0 }
              ]
            }
          : g
      )
    }))
  }

  const handleRemoveOptionFromGroup = (groupId: string, optionId: string) => {
    setFoodConfig((prev) => ({
      ...prev,
      modifierGroups: (prev.modifierGroups || []).map((g) =>
        g.id === groupId
          ? { ...g, options: g.options.filter((o) => o.id !== optionId) }
          : g
      )
    }))
  }

  const handleUpdateOption = (groupId: string, optionId: string, patch: Partial<any>) => {
    setFoodConfig((prev) => ({
      ...prev,
      modifierGroups: (prev.modifierGroups || []).map((g) =>
        g.id === groupId
          ? {
              ...g,
              options: g.options.map((o) =>
                o.id === optionId
                  ? {
                      ...o,
                      ...patch,
                      ingredientName: patch.ingredientId !== undefined
                        ? rawIngredientsList.find((i) => i.id === patch.ingredientId)?.name
                        : o.ingredientName
                    }
                  : o
              )
            }
          : g
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Item name is required')
      setActiveTab('basics')
      return
    }
    if (!categoryId) {
      setError('Please select or create a category')
      setActiveTab('basics')
      return
    }

    setSubmitting(true)
    setError(null)

    // Build drink & food configs
    const updatedDrinkConfig: DrinkCustomizationConfig = {
      ...drinkConfig,
      subtype: drinkSubtype,
      sizes: drinkSizes,
      temperatureOptions: drinkTempOptions,
      sweetnessLevels: drinkSweetnessLevels,
      iceLevels: drinkIceLevels,
      caffeineType: drinkCaffeine,
      coffeeOptions: drinkCoffeeOptions,
      milkOptions: drinkMilkOptions,
      sweetenerOptions: drinkSweetenerOptions
    }

    const updatedFoodConfig: FoodCustomizationConfig = {
      ...foodConfig,
      subtype: foodSubtype,
      portions: foodPortions,
      spiceLevel: foodSpiceLevel,
      servingTemp: foodServingTemp
    }

    const nutritionalFacts: NutritionalFacts = {
      calories: calories ? parseInt(calories) : undefined,
      proteinG: proteinG ? parseFloat(proteinG) : undefined,
      carbsG: carbsG ? parseFloat(carbsG) : undefined,
      fatG: fatG ? parseFloat(fatG) : undefined,
      sugarG: sugarG ? parseFloat(sugarG) : undefined,
      sodiumMg: sodiumMg ? parseFloat(sodiumMg) : undefined
    }

    // Build options config payload
    const structuredOptions = {
      itemType,
      drinkConfig: itemType === 'drink' ? updatedDrinkConfig : undefined,
      foodConfig: itemType === 'food' ? updatedFoodConfig : undefined,
      nutrition: nutritionalFacts,
      originNote: originNote.trim() || undefined,
      storageNote: storageNote.trim() || undefined,
      tasteProfile: selectedTasteProfiles
    }

    // Build menuAssignments payload
    const assignmentsPayload = Object.entries(menuAssignments)
      .filter(([_, val]) => val.selected)
      .map(([mId, val]) => ({
        menuId: mId,
        customPrice: val.customPrice.trim() ? parseFloat(val.customPrice) : null
      }))

    // Build recipes payload with safety auto-inclusion for active mapped customizations
    const activeCustomizationIngredients: Array<{ ingredientId: string; quantity: number }> = []

    if (itemType === 'drink') {
      if (updatedDrinkConfig.isMilkBased) {
        drinkMilkOptions.forEach((m) => {
          if (m.ingredientId) {
            activeCustomizationIngredients.push({
              ingredientId: m.ingredientId,
              quantity: m.volumeMl || 220
            })
          }
        })
      }

      if (updatedDrinkConfig.isCoffeeBased) {
        drinkCoffeeOptions.forEach((c) => {
          if (c.ingredientId) {
            activeCustomizationIngredients.push({
              ingredientId: c.ingredientId,
              quantity: c.doseGrams || 18
            })
          }
        })
      }

      drinkSweetenerOptions.forEach((sw) => {
        if (sw.ingredientId) {
          activeCustomizationIngredients.push({
            ingredientId: sw.ingredientId,
            quantity: sw.quantityPerServing || 10
          })
        }
      })

      drinkSizes.forEach((sz) => {
        if (sz.hotCupIngredientId) activeCustomizationIngredients.push({ ingredientId: sz.hotCupIngredientId, quantity: 1 })
        if (sz.hotLidIngredientId) activeCustomizationIngredients.push({ ingredientId: sz.hotLidIngredientId, quantity: 1 })
        if (sz.coldCupIngredientId) activeCustomizationIngredients.push({ ingredientId: sz.coldCupIngredientId, quantity: 1 })
        if (sz.coldLidIngredientId) activeCustomizationIngredients.push({ ingredientId: sz.coldLidIngredientId, quantity: 1 })
      })
    } else if (itemType === 'food') {
      foodPortions.forEach((fp) => {
        if (fp.packagingIngredientId) activeCustomizationIngredients.push({ ingredientId: fp.packagingIngredientId, quantity: 1 })
        if (fp.secondaryPackagingIngredientId) activeCustomizationIngredients.push({ ingredientId: fp.secondaryPackagingIngredientId, quantity: 1 })
      })
    }

    const mergedRecipeMap = new Map<string, number>()
    recipeIngredients
      .filter((r) => r.ingredientId && parseFloat(String(r.quantity)) > 0)
      .forEach((r) => {
        mergedRecipeMap.set(r.ingredientId, parseFloat(String(r.quantity)))
      })

    activeCustomizationIngredients.forEach((ac) => {
      if (!mergedRecipeMap.has(ac.ingredientId)) {
        mergedRecipeMap.set(ac.ingredientId, ac.quantity)
      }
    })

    const recipesPayload = Array.from(mergedRecipeMap.entries()).map(([ingredientId, quantity]) => ({
      ingredientId,
      quantity
    }))

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      ingredients: ingredients.trim() || null,
      price: parseFloat(price) || 0,
      categoryId,
      imageUrl: imageUrl.trim() || null,
      isAvailable,
      dietaryTags: selectedDietaryTags,
      allergens: selectedAllergens,
      calories: calories ? parseInt(calories) : null,
      prepTime: prepTime ? parseInt(prepTime) : null,
      options: JSON.stringify(structuredOptions),
      variants: JSON.stringify(itemType === 'drink' ? drinkSizes : foodPortions),
      recipes: recipesPayload,
      menuAssignments: assignmentsPayload
    }

    try {
      const url = itemToEdit ? `/api/menu-items/${itemToEdit.id}` : '/api/menu-items'
      const method = itemToEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save menu item')
      }

      onSaved(data)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving item')
    } finally {
      setSubmitting(false)
    }
  }

  // Formula COGS calculation
  const currentFormulaCOGS = recipeIngredients.reduce((sum, r) => {
    const matched = rawIngredientsList.find((i) => i.id === r.ingredientId)
    const cost = matched?.costPerUnit || r.costPerUnit || 0
    return sum + (parseFloat(r.quantity) || 0) * cost
  }, 0)
  const currentPrice = parseFloat(price) || 0
  const currentMargin = currentPrice > 0 ? ((currentPrice - currentFormulaCOGS) / currentPrice) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl xl:max-w-6xl w-[98vw] md:w-full glass-panel border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <DialogHeader className="pb-3 border-b border-slate-200/80 dark:border-white/10">
            <DialogTitle className="flex items-center justify-between text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl liquid-btn-primary flex items-center justify-center text-white shadow-md shrink-0">
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>{itemToEdit ? `Edit: ${itemToEdit.name}` : 'Build Informative Menu Item'}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Recipe & Menu Studio
                    </span>
                  </div>
                  <p className="text-xs font-normal text-slate-400 mt-0.5">
                    Create recipes from raw ingredients, configure sizes in ml/portions & set rich filters
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs px-3 py-1 rounded-full font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-900 font-mono">
                  ${(parseFloat(price) || 0).toFixed(2)} Base
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/15 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('basics')}
              title="Step 1: Edit title, category, base price, and photos"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'basics'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>1. Basics & Type</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sizes')}
              title="Step 2: Configure cup sizes in ml, temperature, coffee roasts, milks, or food portions"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sizes'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs ring-1 ring-slate-200 dark:ring-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>2. Sizes & Options ({itemType === 'drink' ? `${drinkSizes.length} Sizes` : `${foodPortions.length} Portions`})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('recipe')}
              title="Step 3: Link raw ingredients, calculate COGS, and setup automatic stock deduction"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'recipe'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-slate-200 dark:ring-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ChefHat className="w-3.5 h-3.5" />
              <span>3. Recipe Ingredients ({recipeIngredients.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('filters')}
              title="Step 4: Set dietary tags, taste profiles, and allergen warnings"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'filters'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs ring-1 ring-slate-200 dark:ring-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>4. Tags & Allergens</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('nutrition')}
              title="Step 5: Provide calories, macros, origin story, and serving notes"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'nutrition'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs ring-1 ring-slate-200 dark:ring-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>5. Nutrition & Story</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('menus')}
              title="Step 6: Assign digital menu channels and custom override prices"
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'menus'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs ring-1 ring-slate-200 dark:ring-white/10'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>6. Channels</span>
            </button>
          </div>

          {/* TAB 1: BASICS & ITEM TYPE */}
          {activeTab === 'basics' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Item Classification Selector */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 border border-blue-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Settings2 className="w-4 h-4 text-blue-500" />
                    <span>Item Category Type *</span>
                  </Label>
                  <span className="text-[10px] text-slate-400">Controls size options & ordering flow</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    title="Classify as a beverage with milliliter cup sizes, hot/iced variants, syrups and milks"
                    onClick={() => {
                      setItemType('drink')
                      setDrinkConfig(getDefaultDrinkConfig(true, true))
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      itemType === 'drink'
                        ? 'border-blue-600 bg-blue-600 text-white shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Coffee className="w-5 h-5" />
                    <span>Drink / Beverage</span>
                    <span className={`text-[10px] font-normal ${itemType === 'drink' ? 'text-blue-100' : 'text-slate-400'}`}>
                      Sizes in ml, Hot/Iced, Sweetness
                    </span>
                  </button>
                  <button
                    type="button"
                    title="Classify as food or bakery with portion weights in grams, heat level, and modifier choices"
                    onClick={() => {
                      setItemType('food')
                      setFoodConfig(getDefaultFoodConfig())
                    }}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      itemType === 'food'
                        ? 'border-amber-600 bg-amber-600 text-white shadow-md ring-2 ring-amber-500/20'
                        : 'border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Sandwich className="w-5 h-5" />
                    <span>Food / Bakery</span>
                    <span className={`text-[10px] font-normal ${itemType === 'food' ? 'text-amber-100' : 'text-slate-400'}`}>
                      Portions, Spice Levels, Modifiers
                    </span>
                  </button>
                  <button
                    type="button"
                    title="Classify as retail merch, bottled drinks, or packaged coffee beans"
                    onClick={() => setItemType('retail')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                      itemType === 'retail'
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-md ring-2 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Package className="w-5 h-5" />
                    <span>Retail / Merchandise</span>
                    <span className={`text-[10px] font-normal ${itemType === 'retail' ? 'text-indigo-100' : 'text-slate-400'}`}>
                      Packaged Goods & Coffee Bags
                    </span>
                  </button>
                </div>

                {/* Subtype Dropdown */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {itemType === 'drink' ? 'Drink Subtype Classification:' : itemType === 'food' ? 'Food Subtype Classification:' : 'Retail Type:'}
                  </span>
                  {itemType === 'drink' && (
                    <Select value={drinkSubtype} onValueChange={(val) => setDrinkSubtype(val as DrinkSubtype)}>
                      <SelectTrigger className="h-8 text-xs font-semibold w-56 rounded-xl bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Select Beverage Subtype" />
                      </SelectTrigger>
                      <SelectContent>
                        {DRINK_SUBTYPES.map((sub) => (
                          <SelectItem key={sub.key} value={sub.key}>
                            {sub.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {itemType === 'food' && (
                    <Select value={foodSubtype} onValueChange={(val) => setFoodSubtype(val as FoodSubtype)}>
                      <SelectTrigger className="h-8 text-xs font-semibold w-56 rounded-xl bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Select Food Subtype" />
                      </SelectTrigger>
                      <SelectContent>
                        {FOOD_SUBTYPES.map((sub) => (
                          <SelectItem key={sub.key} value={sub.key}>
                            {sub.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {itemType === 'retail' && (
                    <span className="text-xs font-mono text-slate-400">Standard Packaged Item</span>
                  )}
                </div>
              </div>

              {/* Core Fields: Name, Category, Base Price */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Item Title *
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Vanilla Oat Flat White"
                    className="h-9 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Category *
                    </Label>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      {isCreatingCategory ? 'Select Existing' : '+ New Category'}
                    </button>
                  </div>

                  {isCreatingCategory ? (
                    <div className="flex gap-1">
                      <Input
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        placeholder="New category name..."
                        className="h-9 text-xs rounded-xl"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleQuickCreateCategory}
                        className="h-9 px-2 text-xs liquid-btn-primary rounded-xl"
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <Select value={categoryId} onValueChange={setCategoryId}>
                      <SelectTrigger className="h-9 text-xs rounded-xl">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Base Price ($) *
                  </Label>
                  <div className="relative">
                    <span className="absolute start-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="5.00"
                      className="h-9 ps-7 text-xs font-bold rounded-xl"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description & Story */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Short Description / Chef's Note
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Silky textured milk poured gently over double ristretto specialty espresso."
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              {/* Image URL & Quick Presets */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>Item Photo URL & Quick Presets</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... (or choose a preset below)"
                    className="h-8 text-xs rounded-xl flex-1"
                  />
                  {imageUrl && (
                    <div className="w-8 h-8 rounded-xl overflow-hidden border shrink-0">
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                {/* Presets gallery */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {PRESET_PHOTOS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setImageUrl(p.url)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all shrink-0 cursor-pointer ${
                        imageUrl === p.url
                          ? 'border-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-300'
                          : 'border-slate-200 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Status & Prep Time */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.03]">
                  <input
                    type="checkbox"
                    id="isAvailable"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="isAvailable" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Available for Ordering (In Stock)
                  </label>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.03]">
                  <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                    Prep Time:
                  </span>
                  <Input
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="4"
                    className="h-7 w-16 text-xs text-center rounded-lg"
                  />
                  <span className="text-[10px] text-slate-400">mins</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SIZES, VOLUMES (ML / OZ), & CUSTOMIZATION OPTIONS */}
          {activeTab === 'sizes' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {itemType === 'drink' ? (
                /* DRINK SIZES (ML, OZ, SURCHARGES) */
                <div className="space-y-4">
                  {/* CARD 1: SIZE & VOLUME MATRIX */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-500/5 via-slate-50/50 to-indigo-500/5 dark:from-blue-950/30 dark:via-slate-900/40 dark:to-indigo-950/20 border border-blue-500/20 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-500/15">
                      <div>
                        <div className="flex items-center gap-2 text-blue-950 dark:text-blue-200 font-black text-sm">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                            <Scale className="w-4 h-4" />
                          </div>
                          <span>Drink Size Variants & Milliliters (ml) Matrix</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Set custom cup sizes in ml with automatic price calculations & portion scaling.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Quick Presets */}
                        <div className="flex items-center gap-1 bg-white/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/60 dark:border-white/10">
                          <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase">Presets:</span>
                          <button
                            type="button"
                            onClick={() => handleApplyDrinkSizesPreset('standard3')}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                          >
                            3 Sizes (S-M-L)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyDrinkSizesPreset('fourSizes')}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                          >
                            4 Sizes (+XL)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplyDrinkSizesPreset('single')}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                          >
                            Single Standard
                          </button>
                        </div>

                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddDrinkSize}
                          className="h-8 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white gap-1.5 rounded-xl shadow-sm"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Size</span>
                        </Button>
                      </div>
                    </div>

                    {/* Size Matrix Responsive Table */}
                    <div className="space-y-2">
                      {/* Column Header */}
                      <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <div className="col-span-4">Size Name / Label</div>
                        <div className="col-span-3">Volume (ml / oz)</div>
                        <div className="col-span-2">Surcharge (+$)</div>
                        <div className="col-span-2 text-right">Customer Price</div>
                        <div className="col-span-1 text-center">Action</div>
                      </div>

                      {/* Size Rows */}
                      {drinkSizes.map((size, idx) => {
                        const calculatedPrice = (parseFloat(price) || 0) + (size.extraPrice || 0)
                        return (
                          <div
                            key={size.id || idx}
                            className="p-3 sm:p-3.5 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-blue-500/40 transition-all space-y-3"
                          >
                            <div className="flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-2.5 sm:gap-3">
                              {/* Size Name */}
                              <div className="sm:col-span-4 flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center justify-center shrink-0 border border-blue-500/20">
                                  {size.name.charAt(0).toUpperCase() || 'S'}
                                </span>
                                <Input
                                  value={size.name}
                                  onChange={(e) => handleUpdateDrinkSize(size.id, { name: e.target.value })}
                                  placeholder="e.g. Medium (12oz)"
                                  className="h-8 text-xs font-bold rounded-xl flex-1 min-w-[120px]"
                                />
                              </div>

                              {/* Volume in ml */}
                              <div className="sm:col-span-3 flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={size.volumeMl || ''}
                                    onChange={(e) => handleUpdateDrinkSize(size.id, { volumeMl: parseInt(e.target.value) || 0 })}
                                    placeholder="350"
                                    className="h-8 pr-8 text-xs font-bold rounded-xl text-center"
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                                    ml
                                  </span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                                  ({Math.round((size.volumeMl || 350) / 29.57)}oz)
                                </span>
                              </div>

                              {/* Surcharge */}
                              <div className="sm:col-span-2 flex items-center">
                                <div className="relative w-full">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                                    +$
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={size.extraPrice}
                                    onChange={(e) => handleUpdateDrinkSize(size.id, { extraPrice: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="h-8 pl-7 text-xs font-bold rounded-xl text-center"
                                  />
                                </div>
                              </div>

                              {/* Customer Selling Price */}
                              <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                                <span className="text-xs text-slate-400 sm:hidden">Total Price:</span>
                                <span className="text-xs font-black font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  ${calculatedPrice.toFixed(2)}
                                </span>
                              </div>

                              {/* Delete Action */}
                              <div className="sm:col-span-1 flex items-center justify-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveDrinkSize(size.id)}
                                  disabled={drinkSizes.length <= 1}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  title="Remove size"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Dynamic Packaging & Disposables from Inventory */}
                            <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Box className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Packaging & Disposables (Inventory Deduction):</span>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {/* HOT DRINK PACKAGING */}
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-500/25 space-y-1.5">
                                  <div className="flex items-center gap-1 text-[11px] font-black text-amber-600 dark:text-amber-400">
                                    <Flame className="w-3 h-3" />
                                    <span>Hot Packaging (Paper Cup & Sip Lid)</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    <div>
                                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Hot Cup</label>
                                      <select
                                        value={size.hotCupIngredientId || ''}
                                        onChange={(e) => {
                                          const selId = e.target.value
                                          const found = rawIngredientsList.find(i => i.id === selId)
                                          handleUpdateDrinkSize(size.id, {
                                            hotCupIngredientId: selId || undefined,
                                            hotCupIngredientName: found?.name || undefined
                                          })
                                        }}
                                        className="w-full h-8 px-2 text-[11px] font-medium rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                      >
                                        <option value="">-- No Hot Cup --</option>
                                        {rawIngredientsList.map(ing => (
                                          <option key={ing.id} value={ing.id}>
                                            {ing.name} ({ing.quantity} {ing.unit})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Hot Lid</label>
                                      <select
                                        value={size.hotLidIngredientId || ''}
                                        onChange={(e) => {
                                          const selId = e.target.value
                                          const found = rawIngredientsList.find(i => i.id === selId)
                                          handleUpdateDrinkSize(size.id, {
                                            hotLidIngredientId: selId || undefined,
                                            hotLidIngredientName: found?.name || undefined
                                          })
                                        }}
                                        className="w-full h-8 px-2 text-[11px] font-medium rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                      >
                                        <option value="">-- No Hot Lid --</option>
                                        {rawIngredientsList.map(ing => (
                                          <option key={ing.id} value={ing.id}>
                                            {ing.name} ({ing.quantity} {ing.unit})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>

                                {/* COLD DRINK PACKAGING */}
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-cyan-500/25 space-y-1.5">
                                  <div className="flex items-center gap-1 text-[11px] font-black text-cyan-600 dark:text-cyan-400">
                                    <Snowflake className="w-3 h-3" />
                                    <span>Cold Packaging (Clear Cup & Cold Lid)</span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    <div>
                                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Cold Cup</label>
                                      <select
                                        value={size.coldCupIngredientId || ''}
                                        onChange={(e) => {
                                          const selId = e.target.value
                                          const found = rawIngredientsList.find(i => i.id === selId)
                                          handleUpdateDrinkSize(size.id, {
                                            coldCupIngredientId: selId || undefined,
                                            coldCupIngredientName: found?.name || undefined
                                          })
                                        }}
                                        className="w-full h-8 px-2 text-[11px] font-medium rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                      >
                                        <option value="">-- No Cold Cup --</option>
                                        {rawIngredientsList.map(ing => (
                                          <option key={ing.id} value={ing.id}>
                                            {ing.name} ({ing.quantity} {ing.unit})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Cold Lid</label>
                                      <select
                                        value={size.coldLidIngredientId || ''}
                                        onChange={(e) => {
                                          const selId = e.target.value
                                          const found = rawIngredientsList.find(i => i.id === selId)
                                          handleUpdateDrinkSize(size.id, {
                                            coldLidIngredientId: selId || undefined,
                                            coldLidIngredientName: found?.name || undefined
                                          })
                                        }}
                                        className="w-full h-8 px-2 text-[11px] font-medium rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                      >
                                        <option value="">-- No Cold Lid --</option>
                                        {rawIngredientsList.map(ing => (
                                          <option key={ing.id} value={ing.id}>
                                            {ing.name} ({ing.quantity} {ing.unit})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* CARD 2: PREPARATION, TEMPERATURE & CAFFEINE */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Temperature Options */}
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 space-y-3">
                      <div>
                        <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Thermometer className="w-4 h-4 text-rose-500" />
                          <span>Temperature Styles Offered</span>
                        </Label>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Select which temperature options customers can order for this beverage
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {(['hot', 'iced', 'blended', 'room_temp'] as const).map((temp) => {
                          const isSelected = drinkTempOptions.includes(temp)
                          const label = temp === 'hot' ? '🔥 Hot Drink' : temp === 'iced' ? '❄️ Iced Drink' : temp === 'blended' ? '🥤 Blended Frappe' : '🌡️ Room Temp'
                          return (
                            <button
                              key={temp}
                              type="button"
                              onClick={() => handleToggleTemperature(temp)}
                              className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30'
                                  : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                              }`}
                            >
                              <span>{label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Caffeine & Brewing Specs */}
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 space-y-3">
                      <div>
                        <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span>Caffeine Classification</span>
                        </Label>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Specify caffeine content for dietary & customer preference filters
                        </p>
                      </div>

                      <Select value={drinkCaffeine} onValueChange={(val: any) => setDrinkCaffeine(val)}>
                        <SelectTrigger className="h-10 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-white/10">
                          <SelectValue placeholder="Select Caffeine Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="regular">⚡ Regular Caffeinated (Standard)</SelectItem>
                          <SelectItem value="decaf">🌱 Swiss Water Decaf (99.9% Caffeine-Free)</SelectItem>
                          <SelectItem value="half_caf">⚖️ Half-Caf (50% Regular / 50% Decaf)</SelectItem>
                          <SelectItem value="caffeine_free">🍃 Naturally Caffeine-Free (Herbal/Tisane)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* CARD 3: SWEETNESS & ICE CUSTOMIZATION MATRIX */}
                  <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 space-y-3.5">
                    <div>
                      <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Percent className="w-4 h-4 text-purple-500" />
                        <span>Sweetness & Ice Customization Levels</span>
                      </Label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Toggle options that baristas and customers will see at Point of Sale and Digital Menu
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Sweetness Levels */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Allowed Sweetness Levels:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {['0% (Sugar Free)', '25% (Less Sweet)', '50% (Half Sweet)', '75% (Low Sweet)', '100% (Standard)', '120% (Extra Sweet)'].map((level) => {
                            const isSelected = drinkSweetnessLevels.includes(level)
                            return (
                              <button
                                key={level}
                                type="button"
                                onClick={() => handleToggleSweetness(level)}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  isSelected
                                    ? 'border-purple-500 bg-purple-500/15 text-purple-700 dark:text-purple-300'
                                    : 'border-slate-200 dark:border-white/10 text-slate-400 opacity-60 hover:opacity-100'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                                <span>{level}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Ice Levels */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          Allowed Ice Levels:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {['No Ice', 'Less Ice', 'Regular Ice', 'Extra Ice'].map((ice) => {
                            const isSelected = drinkIceLevels.includes(ice)
                            return (
                              <button
                                key={ice}
                                type="button"
                                onClick={() => handleToggleIceLevel(ice)}
                                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  isSelected
                                    ? 'border-cyan-500 bg-cyan-500/15 text-cyan-700 dark:text-cyan-300'
                                    : 'border-slate-200 dark:border-white/10 text-slate-400 opacity-60 hover:opacity-100'
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                                <span>{ice}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Sweetener & Sugar Types (Inventory-Linked) */}
                    <div className="pt-3 border-t border-slate-200/60 dark:border-white/5 space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                            <span>Sweetener & Sugar Types (Inventory-Linked):</span>
                          </span>
                          <p className="text-[10px] text-slate-400">
                            Configure sugar varieties (e.g. Stevia, White Sugar, Honey) deducted automatically based on chosen sweetness %
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAddSweetenerOption}
                          className="h-7 text-[10px] font-bold text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/10 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          + Add Sugar / Sweetener
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {drinkSweetenerOptions.map((sw, sIdx) => (
                          <div
                            key={sw.id || `sw_${sIdx}`}
                            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-2"
                          >
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                              {/* Name */}
                              <div className="sm:col-span-5">
                                <label className="text-[9px] font-semibold text-slate-400 block mb-0.5">Sweetener Name</label>
                                <Input
                                  value={sw.name}
                                  onChange={(e) => handleUpdateSweetenerOption(sw.id, { name: e.target.value })}
                                  placeholder="e.g. Stevia, White Sugar"
                                  className="h-7 text-xs rounded-lg"
                                />
                              </div>

                              {/* Serving Size & Unit */}
                              <div className="sm:col-span-3">
                                <label className="text-[9px] font-semibold text-slate-400 block mb-0.5">Serving (100% Sweet)</label>
                                <div className="flex gap-1">
                                  <Input
                                    type="number"
                                    value={sw.quantityPerServing}
                                    onChange={(e) => handleUpdateSweetenerOption(sw.id, { quantityPerServing: parseFloat(e.target.value) || 0 })}
                                    className="h-7 w-14 text-xs rounded-lg text-center"
                                  />
                                  <select
                                    value={sw.unit}
                                    onChange={(e) => handleUpdateSweetenerOption(sw.id, { unit: e.target.value })}
                                    className="h-7 px-1 text-[10px] font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                                  >
                                    <option value="g">g</option>
                                    <option value="packets">packets</option>
                                    <option value="ml">ml</option>
                                    <option value="pumps">pumps</option>
                                  </select>
                                </div>
                              </div>

                              {/* Extra Price */}
                              <div className="sm:col-span-3">
                                <label className="text-[9px] font-semibold text-slate-400 block mb-0.5">Extra Price ($)</label>
                                <Input
                                  type="number"
                                  step="0.05"
                                  value={sw.extraPrice !== undefined ? sw.extraPrice : ''}
                                  onChange={(e) => handleUpdateSweetenerOption(sw.id, { extraPrice: parseFloat(e.target.value) || 0 })}
                                  placeholder="0.00"
                                  className="h-7 text-xs rounded-lg"
                                />
                              </div>

                              {/* Remove button */}
                              <div className="sm:col-span-1 flex items-center justify-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveSweetenerOption(sw.id)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 rounded-lg"
                                  title="Remove sweetener"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Inventory Link Dropdown */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-200/40 dark:border-white/5">
                              <span className="text-[10px] font-bold text-slate-500 shrink-0">📦 Deduct Stock:</span>
                              <select
                                value={sw.ingredientId || ''}
                                onChange={(e) => {
                                  const selId = e.target.value
                                  const found = rawIngredientsList.find(i => i.id === selId)
                                  handleUpdateSweetenerOption(sw.id, {
                                    ingredientId: selId || undefined,
                                    ingredientName: found?.name || undefined
                                  })
                                }}
                                className="flex-1 h-7 px-2 text-[10px] font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                              >
                                <option value="">-- No Inventory Deduction (Visual Note Only) --</option>
                                {rawIngredientsList.map(ing => (
                                  <option key={ing.id} value={ing.id}>
                                    {ing.name} ({ing.quantity} {ing.unit})
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* CARD 4: COFFEE ROASTS & MILK SELECTIONS */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Coffee Roasts */}
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={drinkConfig.isCoffeeBased}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setDrinkConfig((prev) => ({ ...prev, isCoffeeBased: checked }))
                              if (!checked) {
                                drinkCoffeeOptions.forEach((c) => {
                                  if (c.ingredientId) removeCustomizationIngredient(c.ingredientId)
                                })
                              } else {
                                drinkCoffeeOptions.forEach((c) => {
                                  if (c.ingredientId) {
                                    syncCustomizationIngredient(c.ingredientId, c.doseGrams || 18, undefined, 'g')
                                  }
                                })
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            Coffee Bean Roasts Selection
                          </span>
                        </label>
                        {drinkConfig.isCoffeeBased && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddCoffeeOption}
                            className="h-6 text-[10px] font-bold text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            + Add Bean
                          </Button>
                        )}
                      </div>

                      {drinkConfig.isCoffeeBased ? (
                        <div className="space-y-2 pt-1">
                          {drinkCoffeeOptions.map((c, cIdx) => (
                            <div
                              key={c.id || `c_${cIdx}`}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-1.5 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-400 shrink-0">☕</span>
                                <Input
                                  value={c.name}
                                  onChange={(e) => handleUpdateCoffeeOption(c.id || cIdx, { name: e.target.value })}
                                  placeholder="Bean Name (e.g. Ethiopian Blend)"
                                  className="h-7 text-xs flex-1 rounded-lg"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                  <Input
                                    type="number"
                                    value={c.doseGrams}
                                    onChange={(e) => handleUpdateCoffeeOption(c.id || cIdx, { doseGrams: parseFloat(e.target.value) || 18 })}
                                    className="h-7 w-12 text-xs text-center rounded-lg"
                                    title="Dose in grams"
                                  />
                                  <span className="text-[10px] text-slate-400">g</span>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <span className="text-[10px] text-slate-400">+$</span>
                                  <Input
                                    type="number"
                                    step="0.25"
                                    value={c.extraPrice !== undefined ? c.extraPrice : ''}
                                    onChange={(e) => handleUpdateCoffeeOption(c.id || cIdx, { extraPrice: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="h-7 w-14 text-xs rounded-lg"
                                    title="Extra Price"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveCoffeeOption(c.id || cIdx)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 rounded-lg shrink-0"
                                  title="Remove roast"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>

                              {/* Inventory Ingredient Link */}
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/40 dark:border-white/5">
                                <span className="text-[10px] font-bold text-slate-500 shrink-0">📦 Deduct Stock:</span>
                                <select
                                  value={c.ingredientId || ''}
                                  onChange={(e) => {
                                    const selId = e.target.value
                                    const found = rawIngredientsList.find(i => i.id === selId)
                                    handleUpdateCoffeeOption(c.id || cIdx, {
                                      ingredientId: selId || undefined,
                                      ingredientName: found?.name || undefined
                                    })
                                  }}
                                  className="flex-1 h-7 px-2 text-[10px] font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                >
                                  <option value="">-- Match by Name or Recipe --</option>
                                  {rawIngredientsList.map(ing => (
                                    <option key={ing.id} value={ing.id}>
                                      {ing.name} ({ing.quantity} {ing.unit})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1">
                          Disabled. This drink will not prompt for espresso bean roast selection.
                        </p>
                      )}
                    </div>

                    {/* Milk Options */}
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={drinkConfig.isMilkBased}
                            onChange={(e) => {
                              const checked = e.target.checked
                              setDrinkConfig((prev) => ({ ...prev, isMilkBased: checked }))
                              if (!checked) {
                                drinkMilkOptions.forEach((m) => {
                                  if (m.ingredientId) removeCustomizationIngredient(m.ingredientId)
                                })
                              } else {
                                drinkMilkOptions.forEach((m) => {
                                  if (m.ingredientId) {
                                    syncCustomizationIngredient(m.ingredientId, m.volumeMl || 220, undefined, 'ml')
                                  }
                                })
                              }
                            }}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                            Milk & Plant-Based Dairy
                          </span>
                        </label>
                        {drinkConfig.isMilkBased && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleAddMilkOption}
                            className="h-6 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer"
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            + Add Milk
                          </Button>
                        )}
                      </div>

                      {drinkConfig.isMilkBased ? (
                        <div className="space-y-2 pt-1">
                          {drinkMilkOptions.map((m, mIdx) => (
                            <div
                              key={m.id || `m_${mIdx}`}
                              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-1.5 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-400 shrink-0">🥛</span>
                                <Input
                                  value={m.name}
                                  onChange={(e) => handleUpdateMilkOption(m.id || mIdx, { name: e.target.value })}
                                  placeholder="Milk Name (e.g. Oat Milk)"
                                  className="h-7 text-xs flex-1 rounded-lg"
                                />
                                <div className="flex items-center gap-1 shrink-0">
                                  <Input
                                    type="number"
                                    value={m.volumeMl}
                                    onChange={(e) => handleUpdateMilkOption(m.id || mIdx, { volumeMl: parseFloat(e.target.value) || 220 })}
                                    className="h-7 w-14 text-xs text-center rounded-lg"
                                    title="Volume in ml"
                                  />
                                  <span className="text-[10px] text-slate-400">ml</span>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <span className="text-[10px] text-slate-400">+$</span>
                                  <Input
                                    type="number"
                                    step="0.25"
                                    value={m.extraPrice !== undefined ? m.extraPrice : ''}
                                    onChange={(e) => handleUpdateMilkOption(m.id || mIdx, { extraPrice: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="h-7 w-14 text-xs rounded-lg"
                                    title="Extra Price"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveMilkOption(m.id || mIdx)}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 rounded-lg shrink-0"
                                  title="Remove milk"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>

                              {/* Inventory Ingredient Link */}
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/40 dark:border-white/5">
                                <span className="text-[10px] font-bold text-slate-500 shrink-0">📦 Deduct Stock:</span>
                                <select
                                  value={m.ingredientId || ''}
                                  onChange={(e) => {
                                    const selId = e.target.value
                                    const found = rawIngredientsList.find(i => i.id === selId)
                                    handleUpdateMilkOption(m.id || mIdx, {
                                      ingredientId: selId || undefined,
                                      ingredientName: found?.name || undefined
                                    })
                                  }}
                                  className="flex-1 h-7 px-2 text-[10px] font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                >
                                  <option value="">-- Match by Name or Recipe --</option>
                                  {rawIngredientsList.map(ing => (
                                    <option key={ing.id} value={ing.id}>
                                      {ing.name} ({ing.quantity} {ing.unit})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic py-1">
                          Disabled. This drink will not prompt for dairy or plant milk alternatives.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : itemType === 'food' ? (
                /* FOOD PORTIONS & MODIFIERS */
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20">
                      <div>
                        <div className="flex items-center gap-2 text-amber-950 dark:text-amber-200 font-black text-sm">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Sandwich className="w-4 h-4" />
                          </div>
                          <span>Food Portions & Serving Sizes (Grams)</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Set portion sizes (e.g. Regular, Large Platter, Double) with weights and price adjustments.
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddFoodPortion}
                        className="h-8 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white gap-1.5 rounded-xl shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Portion</span>
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <div className="hidden sm:grid grid-cols-12 gap-3 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <div className="col-span-4">Portion Label</div>
                        <div className="col-span-3">Serving Weight (g)</div>
                        <div className="col-span-2">Surcharge (+$)</div>
                        <div className="col-span-2 text-right">Customer Price</div>
                        <div className="col-span-1 text-center">Action</div>
                      </div>

                      {foodPortions.map((portion, idx) => {
                        const calculatedPrice = (parseFloat(price) || 0) + (portion.extraPrice || 0)
                        return (
                          <div
                            key={portion.id || idx}
                            className="p-3 sm:p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-xs space-y-3"
                          >
                            <div className="flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-2.5 sm:gap-3">
                              <div className="sm:col-span-4 flex items-center gap-2.5">
                                <span className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black flex items-center justify-center shrink-0">
                                  {portion.name.charAt(0).toUpperCase() || 'P'}
                                </span>
                                <Input
                                  value={portion.name}
                                  onChange={(e) => handleUpdateFoodPortion(portion.id, { name: e.target.value })}
                                  placeholder="e.g. Regular Portion"
                                  className="h-8 text-xs font-bold rounded-xl flex-1 min-w-[120px]"
                                />
                              </div>

                              <div className="sm:col-span-3 flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    value={portion.weightGrams || ''}
                                    onChange={(e) => handleUpdateFoodPortion(portion.id, { weightGrams: parseInt(e.target.value) || undefined })}
                                    placeholder="250"
                                    className="h-8 pr-8 text-xs font-bold rounded-xl text-center"
                                  />
                                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                                    g
                                  </span>
                                </div>
                              </div>

                              <div className="sm:col-span-2 flex items-center">
                                <div className="relative w-full">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400 pointer-events-none">
                                    +$
                                  </span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={portion.extraPrice}
                                    onChange={(e) => handleUpdateFoodPortion(portion.id, { extraPrice: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="h-8 pl-7 text-xs font-bold rounded-xl text-center"
                                  />
                                </div>
                              </div>

                              <div className="sm:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                                <span className="text-xs font-black font-mono px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  ${calculatedPrice.toFixed(2)}
                                </span>
                              </div>

                              <div className="sm:col-span-1 flex items-center justify-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveFoodPortion(portion.id)}
                                  disabled={foodPortions.length <= 1}
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 rounded-lg"
                                  title="Remove portion"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Portion Packaging & Containers */}
                            <div className="pt-2.5 border-t border-slate-200/60 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 p-2.5 rounded-xl space-y-2">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                  <Box className="w-3.5 h-3.5 text-amber-500" />
                                  <span>Portion Packaging (Boxes, Containers & Bags from Inventory):</span>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-1">
                                  <label className="text-[10px] font-semibold text-slate-500 block">Primary Box / Meal Container</label>
                                  <select
                                    value={portion.packagingIngredientId || ''}
                                    onChange={(e) => {
                                      const selId = e.target.value
                                      const found = rawIngredientsList.find(i => i.id === selId)
                                      handleUpdateFoodPortion(portion.id, {
                                        packagingIngredientId: selId || undefined,
                                        packagingIngredientName: found?.name || undefined
                                      })
                                    }}
                                    className="w-full h-8 px-2 text-[11px] font-medium rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  >
                                    <option value="">-- No Box / Plate --</option>
                                    {rawIngredientsList.map(ing => (
                                      <option key={ing.id} value={ing.id}>
                                        {ing.name} ({ing.quantity} {ing.unit})
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-1">
                                  <label className="text-[10px] font-semibold text-slate-500 block">Secondary Bag / Paper Liner</label>
                                  <select
                                    value={portion.secondaryPackagingIngredientId || ''}
                                    onChange={(e) => {
                                      const selId = e.target.value
                                      const found = rawIngredientsList.find(i => i.id === selId)
                                      handleUpdateFoodPortion(portion.id, {
                                        secondaryPackagingIngredientId: selId || undefined,
                                        secondaryPackagingIngredientName: found?.name || undefined
                                      })
                                    }}
                                    className="w-full h-8 px-2 text-[11px] font-medium rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                  >
                                    <option value="">-- No Bag / Wrap --</option>
                                    {rawIngredientsList.map(ing => (
                                      <option key={ing.id} value={ing.id}>
                                        {ing.name} ({ing.quantity} {ing.unit})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Spice Level & Preparation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 space-y-2.5">
                      <Label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-rose-500" />
                        <span>Spice / Heat Level</span>
                      </Label>
                      <Select value={foodSpiceLevel} onValueChange={(val: any) => setFoodSpiceLevel(val)}>
                        <SelectTrigger className="h-10 text-xs font-bold rounded-xl">
                          <SelectValue placeholder="Select Spice Level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">🟢 Non-Spicy / Mild</SelectItem>
                          <SelectItem value="mild">🟡 Mild Spice</SelectItem>
                          <SelectItem value="medium">🟠 Medium Spice</SelectItem>
                          <SelectItem value="hot">🔴 Hot Spicy</SelectItem>
                          <SelectItem value="extra_spicy">🔥 Extra Fiery</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 space-y-2.5">
                      <Label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-amber-500" />
                        <span>Preparation & Serving Style</span>
                      </Label>
                      <Select value={foodServingTemp} onValueChange={(val: any) => setFoodServingTemp(val)}>
                        <SelectTrigger className="h-10 text-xs font-bold rounded-xl">
                          <SelectValue placeholder="Serving Style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hot">🔥 Served Hot / Freshly Cooked</SelectItem>
                          <SelectItem value="cold">❄️ Served Chilled / Cold</SelectItem>
                          <SelectItem value="fresh">🥗 Raw & Fresh</SelectItem>
                          <SelectItem value="baked">🥖 Freshly Oven-Baked</SelectItem>
                          <SelectItem value="grilled">🥩 Charcoal Grilled</SelectItem>
                          <SelectItem value="fried">🍟 Golden Fried</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Food Modifier Groups */}
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                          Custom Choice Groups (e.g. Bread Option, Dressings, Add-ons)
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Options that customers can customize per item
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddFoodModifierGroup}
                        className="h-8 text-xs font-bold rounded-xl"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Group</span>
                      </Button>
                    </div>

                    {foodConfig.modifierGroups && foodConfig.modifierGroups.length > 0 ? (
                      foodConfig.modifierGroups.map((group) => (
                        <div key={group.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <Input
                              value={group.name}
                              onChange={(e) => {
                                const val = e.target.value
                                setFoodConfig((prev) => ({
                                  ...prev,
                                  modifierGroups: (prev.modifierGroups || []).map((g) => (g.id === group.id ? { ...g, name: val } : g))
                                }))
                              }}
                              placeholder="Group Name (e.g. Choice of Bread)"
                              className="h-8 text-xs font-bold rounded-xl flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFoodModifierGroup(group.id)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="space-y-1.5 pl-3 border-l-2 border-amber-300 dark:border-amber-800">
                            {group.options.map((opt) => (
                              <div key={opt.id} className="flex items-center gap-2 text-xs">
                                <Input
                                  value={opt.name}
                                  onChange={(e) => handleUpdateOption(group.id, opt.id, { name: e.target.value })}
                                  placeholder="Choice name"
                                  className="h-8 text-xs rounded-xl flex-1"
                                />
                                <div className="flex items-center gap-1 w-24">
                                  <span className="text-[10px] text-slate-400">+$</span>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={opt.extraPrice ?? ''}
                                    onChange={(e) => handleUpdateOption(group.id, opt.id, { extraPrice: parseFloat(e.target.value) || 0 })}
                                    placeholder="0.00"
                                    className="h-8 text-xs rounded-xl w-full"
                                  />
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveOptionFromGroup(group.id, opt.id)}
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500 rounded-lg"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddOptionToGroup(group.id)}
                              className="h-7 text-xs font-semibold text-amber-700 dark:text-amber-300 gap-1 px-2"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Choice</span>
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic block text-center py-3">
                        No modifier groups configured yet.
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-center text-slate-400 text-xs">
                  Retail items use standard single-pack pricing and barcode inventory.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RECIPE INGREDIENTS & BILL OF MATERIALS */}
          {activeTab === 'recipe' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header & Quick Starter Templates */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-50/50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-slate-900/40 border border-emerald-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-black text-sm">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <ChefHat className="w-4 h-4" />
                      </div>
                      <span>Formulate from Raw Ingredients (Bill of Materials)</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Specify ingredients deducted automatically from inventory on every sale.
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Auto-Sync Active: Any milk, coffee roast, sugar/sweetener, or cup & lid mapped in Step 2 is automatically linked to this recipe.</span>
                    </div>
                  </div>
                </div>

                {/* Formulated Ingredients List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Formulated Recipe Items ({recipeIngredients.length})</span>
                    </span>
                    {recipeIngredients.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setRecipeIngredients([])}
                        title="Clear all ingredients from this recipe formulation"
                        className="text-[10px] text-rose-500 hover:underline font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {recipeIngredients.length > 0 ? (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {recipeIngredients.map((r, idx) => {
                        const matched = rawIngredientsList.find((i) => i.id === r.ingredientId)
                        const unitName = matched?.unit || r.unit || 'units'
                        const costPerUnit = matched?.costPerUnit || r.costPerUnit || 0
                        const currentQty = parseFloat(r.quantity) || 0
                        const lineCost = currentQty * costPerUnit

                        return (
                          <div
                            key={r.ingredientId || idx}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 text-xs shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <div className="truncate">
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                  {matched?.name || r.name || 'Raw Material'}
                                </span>
                                {matched && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Stock: {matched.quantity} {matched.unit} • ${costPerUnit.toFixed(3)}/{unitName}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Quantity stepper controls */}
                              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-white/5">
                                <button
                                  type="button"
                                  title={`Decrease ${matched?.name || 'ingredient'} quantity`}
                                  onClick={() => {
                                    const step = unitName === 'pieces' || unitName === 'shots' ? 1 : unitName === 'grams' ? 5 : 10
                                    const next = Math.max(0, Math.round((currentQty - step) * 100) / 100)
                                    handleUpdateRecipeIngredientQty(r.ingredientId, String(next))
                                  }}
                                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                                >
                                  -
                                </button>
                                <Input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={r.quantity}
                                  onChange={(e) => handleUpdateRecipeIngredientQty(r.ingredientId, e.target.value)}
                                  placeholder="Qty"
                                  className="h-6 w-14 text-center text-xs font-bold rounded-md p-0 border-0 bg-transparent"
                                />
                                <button
                                  type="button"
                                  title={`Increase ${matched?.name || 'ingredient'} quantity`}
                                  onClick={() => {
                                    const step = unitName === 'pieces' || unitName === 'shots' ? 1 : unitName === 'grams' ? 5 : 10
                                    const next = Math.round((currentQty + step) * 100) / 100
                                    handleUpdateRecipeIngredientQty(r.ingredientId, String(next))
                                  }}
                                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
                                >
                                  +
                                </button>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 px-1">
                                  {unitName}
                                </span>
                              </div>

                              {costPerUnit > 0 && (
                                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 min-w-[55px] text-right">
                                  ${lineCost.toFixed(3)}
                                </span>
                              )}

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                title={`Remove ${matched?.name || 'ingredient'} from recipe`}
                                onClick={() => handleRemoveRecipeIngredient(r.ingredientId)}
                                className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500 rounded-lg"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-emerald-500/30 text-center bg-white/40 dark:bg-slate-900/40 space-y-1">
                      <Box className="w-6 h-6 text-emerald-500/60 mx-auto" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No raw ingredients attached to this item yet
                      </p>
                      <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                        Pick items from the Raw Materials Shelf below. (To add new raw materials or update costs, visit the Recipe Studio & Costing page).
                      </p>
                    </div>
                  )}
                </div>

                {/* SEARCHABLE RAW MATERIALS SHELF WITH 1-CLICK PORTION CHIPS */}
                <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/10 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      <Search className="w-3.5 h-3.5 text-blue-500" />
                      <span>Raw Materials Shelf (Click to Add / Increment)</span>
                    </div>

                    {/* Unit Filters */}
                    <div className="flex items-center gap-1">
                      {['all', 'grams', 'ml', 'pieces'].map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          onClick={() => setIngredientPickerUnitFilter(unit)}
                          title={`Filter inventory by ${unit}`}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                            ingredientPickerUnitFilter === unit
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/10 hover:bg-slate-100'
                          }`}
                        >
                          {unit === 'all' ? 'All Units' : unit}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search bar */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={ingredientPickerSearch}
                      onChange={(e) => setIngredientPickerSearch(e.target.value)}
                      placeholder="Search inventory raw materials by name..."
                      className="h-8 pl-8 text-xs rounded-xl bg-white dark:bg-slate-900"
                    />
                  </div>

                  {/* Quick-Pick Ingredient Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[190px] overflow-y-auto pr-1">
                    {filteredRawIngredientsForModal.map((ing) => {
                      const isAlreadyInRecipe = recipeIngredients.some((r) => r.ingredientId === ing.id)
                      const isGrams = ing.unit === 'grams' || ing.unit === 'g' || ing.unit === 'kg'
                      const isMl = ing.unit === 'ml' || ing.unit === 'liters'
                      const isPcs = ing.unit === 'pieces' || ing.unit === 'pcs' || ing.unit === 'shots'

                      return (
                        <div
                          key={ing.id}
                          className={`p-2 rounded-xl border text-xs flex flex-col justify-between gap-1.5 transition-all ${
                            isAlreadyInRecipe
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                              : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-white/10 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {ing.name}
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 shrink-0">
                              {ing.quantity} {ing.unit}
                            </span>
                          </div>

                          {/* 1-Click Portion Chips */}
                          <div className="flex items-center gap-1 flex-wrap">
                            {isGrams && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDirectAddIngredientPortion(ing, 5)}
                                  title={`Add 5g of ${ing.name}`}
                                  className="px-1.5 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                  +5g
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDirectAddIngredientPortion(ing, 18)}
                                  title={`Add 18g of ${ing.name} (standard double shot)`}
                                  className="px-1.5 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                  +18g
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDirectAddIngredientPortion(ing, 30)}
                                  title={`Add 30g of ${ing.name}`}
                                  className="px-1.5 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                  +30g
                                </button>
                              </>
                            )}
                            {isMl && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDirectAddIngredientPortion(ing, 15)}
                                  title={`Add 15ml of ${ing.name} (1 syrup pump)`}
                                  className="px-1.5 py-0.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                  +15ml
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDirectAddIngredientPortion(ing, 30)}
                                  title={`Add 30ml of ${ing.name}`}
                                  className="px-1.5 py-0.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                  +30ml
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDirectAddIngredientPortion(ing, 200)}
                                  title={`Add 200ml of ${ing.name}`}
                                  className="px-1.5 py-0.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                  +200ml
                                </button>
                              </>
                            )}
                            {isPcs && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleDirectAddIngredientPortion(ing, 1)}
                                  title={`Add 1 ${ing.unit} of ${ing.name}`}
                                  className="px-1.5 py-0.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                  +1 {ing.unit}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDirectAddIngredientPortion(ing, 2)}
                                  title={`Add 2 ${ing.unit} of ${ing.name}`}
                                  className="px-1.5 py-0.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                  +2 {ing.unit}
                                </button>
                              </>
                            )}
                            {!isGrams && !isMl && !isPcs && (
                              <button
                                type="button"
                                onClick={() => handleDirectAddIngredientPortion(ing, 1)}
                                title={`Add 1 portion of ${ing.name}`}
                                className="px-2 py-0.5 rounded-md bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold transition-all active:scale-95 cursor-pointer"
                              >
                                +1 {ing.unit}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {filteredRawIngredientsForModal.length === 0 && (
                      <div className="col-span-full py-4 text-center text-xs text-slate-400">
                        No raw materials match "{ingredientPickerSearch}". To add new raw materials or modify stock, visit the Recipe Studio & Costing page.
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial COGS & Margin Summary */}
                {recipeIngredients.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-gradient-to-r from-emerald-500/15 to-teal-500/15 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-500/30 text-center">
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Formula COGS</span>
                      <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        ${currentFormulaCOGS.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Selling Price</span>
                      <p className="text-sm font-black text-slate-900 dark:text-white font-mono">
                        ${currentPrice.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider">Gross Margin</span>
                      <p className={`text-sm font-black font-mono ${currentMargin >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                        {currentMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* What's Included / Ingredients text */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-bold text-xs">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Customer-Facing Ingredients & What's Included</span>
                  </div>
                  {recipeIngredients.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoFillDescriptionFromRecipe}
                      title="Generate a friendly customer ingredient description automatically from the raw materials above"
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                    >
                      ⚡ Auto-fill from recipe
                    </button>
                  )}
                </div>
                <textarea
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="e.g. Double shot specialty espresso, fresh steamed whole milk, artisanal vanilla syrup."
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: TAGS, ALLERGENS & TASTE PROFILES */}
          {activeTab === 'filters' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Dietary & Lifestyle Badges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    <span>Dietary & Lifestyle Badges (SVG Icons)</span>
                  </Label>
                  <span className="text-[10px] text-slate-400">Tap to toggle on item card & filters</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(DIETARY_TAGS).map(([key, def]) => {
                    const isSelected = selectedDietaryTags.includes(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleDietaryTag(key)}
                        className={`cursor-pointer transition-all transform active:scale-95 ${
                          isSelected ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900' : 'opacity-45 hover:opacity-80 grayscale'
                        }`}
                      >
                        <DietaryBadge tagKey={key} size="sm" />
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Taste Profile Badges */}
              <div className="space-y-2 p-3 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Flavor & Taste Profile Filters</span>
                  </Label>
                  <span className="text-[10px] text-purple-600 dark:text-purple-300">
                    Helps customers filter by cravings on the digital menu
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {COMMON_TASTE_PROFILES.map((taste) => {
                    const isSelected = selectedTasteProfiles.includes(taste)
                    return (
                      <button
                        key={taste}
                        type="button"
                        onClick={() => toggleTasteProfile(taste)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                            : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        {taste}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Allergens Checklist */}
              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-white/5">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  <span>Allergens Warning & Safety Notice</span>
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {COMMON_ALLERGENS.map((allergen) => {
                    const isChecked = selectedAllergens.includes(allergen)
                    return (
                      <label
                        key={allergen}
                        className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                          isChecked
                            ? 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                            : 'border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAllergen(allergen)}
                          className="w-3.5 h-3.5 text-amber-600 rounded"
                        />
                        <span className="truncate">{allergen}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NUTRITION & STORY */}
          {activeTab === 'nutrition' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-extrabold text-xs">
                    <Activity className="w-4 h-4 text-amber-600" />
                    <span>Nutritional Breakdown (Per Serving)</span>
                  </div>
                  <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold">
                    Displayed in foodie inspector modal
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Calories (kcal)</Label>
                    <Input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      placeholder="160"
                      className="h-8 text-xs font-bold text-center rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Protein (g)</Label>
                    <Input
                      type="number"
                      step="any"
                      value={proteinG}
                      onChange={(e) => setProteinG(e.target.value)}
                      placeholder="4"
                      className="h-8 text-xs font-bold text-center rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Carbs (g)</Label>
                    <Input
                      type="number"
                      step="any"
                      value={carbsG}
                      onChange={(e) => setCarbsG(e.target.value)}
                      placeholder="18"
                      className="h-8 text-xs font-bold text-center rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Total Fat (g)</Label>
                    <Input
                      type="number"
                      step="any"
                      value={fatG}
                      onChange={(e) => setFatG(e.target.value)}
                      placeholder="3.5"
                      className="h-8 text-xs font-bold text-center rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Sugar (g)</Label>
                    <Input
                      type="number"
                      step="any"
                      value={sugarG}
                      onChange={(e) => setSugarG(e.target.value)}
                      placeholder="12"
                      className="h-8 text-xs font-bold text-center rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Sodium (mg)</Label>
                    <Input
                      type="number"
                      step="any"
                      value={sodiumMg}
                      onChange={(e) => setSodiumMg(e.target.value)}
                      placeholder="65"
                      className="h-8 text-xs font-bold text-center rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Origin & Sourcing Story */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Sourcing & Origin Story
                  </Label>
                  <Input
                    value={originNote}
                    onChange={(e) => setOriginNote(e.target.value)}
                    placeholder="e.g. Single Origin Ethiopian Yirgacheffe, harvested by smallholders."
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Storage & Consumption Recommendation
                  </Label>
                  <Input
                    value={storageNote}
                    onChange={(e) => setStorageNote(e.target.value)}
                    placeholder="e.g. Best enjoyed fresh within 15 minutes. Refrigerate unused portion."
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MULTI-MENU CHANNELS & OVERRIDES */}
          {activeTab === 'menus' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    <span>Multi-Menu Channels & Price Overrides</span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Assign which digital menus show this item with custom channel prices
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {menus.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-white/10 text-center space-y-1">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        No digital menu channels created yet
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Create a menu channel (like In-House Dine-In or Delivery) from the Menu Builder to assign channel-specific pricing.
                      </p>
                    </div>
                  ) : (
                    menus.map((m) => {
                      const assigned = menuAssignments[m.id]?.selected ?? false
                      const customPrice = menuAssignments[m.id]?.customPrice ?? ''
                      return (
                        <div
                          key={m.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            assigned
                              ? 'border-blue-500/40 bg-blue-500/5 dark:bg-blue-500/10'
                              : 'border-slate-200/60 dark:border-white/5 opacity-50'
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                            <input
                              type="checkbox"
                              checked={assigned}
                              onChange={() => toggleMenuSelected(m.id)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {m.name}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                /menu/{m.slug}
                              </div>
                            </div>
                          </label>

                          {assigned && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-slate-500 font-semibold">Price:</span>
                              <div className="relative w-24">
                                <span className="absolute start-2 top-1.5 text-[10px] text-slate-400 font-bold">$</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={customPrice}
                                  onChange={(e) => handleMenuCustomPrice(m.id, e.target.value)}
                                  placeholder={price || '5.00'}
                                  className="h-7 ps-5 text-xs font-bold rounded-lg"
                                  title="Leave blank to use base price"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 gap-2 border-t border-slate-200/60 dark:border-white/5">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 text-xs font-bold liquid-btn-primary rounded-xl px-5"
            >
              {submitting ? 'Saving...' : itemToEdit ? 'Update Menu Item' : 'Create Menu Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
