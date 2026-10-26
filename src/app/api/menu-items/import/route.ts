import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

interface ImportMenuItemRow {
  name: string
  price: number
  category?: string
  description?: string
  ingredients?: string
  type?: 'drink' | 'food' | 'retail' | 'other'
  subtype?: string
  imageUrl?: string
  calories?: number
  prepTime?: number
  sku?: string
  isAvailable?: boolean
  dietaryTags?: string | string[]
  allergens?: string | string[]
  // Nutrition Facts
  proteinG?: number
  carbsG?: number
  fatG?: number
  sugarG?: number
  sodiumMg?: number
  // Sensory & Notes
  originNote?: string
  storageNote?: string
  tasteProfile?: string | string[]
  // Drink Specifics
  caffeineType?: string
  temperatureOptions?: string | string[]
  sweetnessLevels?: string | string[]
  iceLevels?: string | string[]
  isCoffeeBased?: boolean
  isMilkBased?: boolean
  // Sizing / Portions
  sizes?: string
}

function parseList(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean)
  return String(val)
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseBoolean(val: any, fallback: boolean = true): boolean {
  if (val === undefined || val === null || val === '') return fallback
  const s = String(val).toLowerCase().trim()
  if (['false', '0', 'no', 'out of stock', 'unavailable', 'inactive', 'off'].includes(s)) return false
  if (['true', '1', 'yes', 'in stock', 'available', 'active', 'on'].includes(s)) return true
  return fallback
}

function parseSizes(sizesStr: any, itemType: string) {
  if (!sizesStr || typeof sizesStr !== 'string') return null
  const parts = sizesStr.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean)
  if (parts.length === 0) return null

  if (itemType === 'drink') {
    return parts.map((part, idx) => {
      const [rawName, rawExtra] = part.split(':').map((s) => s.trim())
      const name = rawName || `Size ${idx + 1}`
      const extraPrice = !isNaN(Number(rawExtra)) ? Math.max(0, Number(rawExtra)) : 0
      const baseMl = 250 + idx * 100
      return {
        id: `size_${idx + 1}`,
        name,
        volumeMl: baseMl,
        volumeOz: Math.round(baseMl / 29.57),
        extraPrice,
        ingredientMultiplier: Math.round((baseMl / 250) * 100) / 100,
        isDefault: idx === 0
      }
    })
  } else if (itemType === 'food') {
    return parts.map((part, idx) => {
      const [rawName, rawExtra] = part.split(':').map((s) => s.trim())
      const name = rawName || `Portion ${idx + 1}`
      const extraPrice = !isNaN(Number(rawExtra)) ? Math.max(0, Number(rawExtra)) : 0
      const baseWeight = 250 + idx * 150
      return {
        id: `portion_${idx + 1}`,
        name,
        weightGrams: baseWeight,
        extraPrice,
        ingredientMultiplier: Math.round((baseWeight / 250) * 100) / 100,
        isDefault: idx === 0
      }
    })
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { duplicateMode = 'overwrite', targetMenuId = null, items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided for import' }, { status: 400 })
    }

    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    // Fetch existing categories for tenant
    const existingCategories = await prisma.category.findMany({
      where: { tenantId }
    })
    const categoryMap = new Map<string, string>()
    existingCategories.forEach((c) => categoryMap.set(c.name.trim().toLowerCase(), c.id))

    // Fetch existing menus to link to if targetMenuId is not explicitly specified
    const existingMenus = await prisma.menu.findMany({
      where: { tenantId },
      select: { id: true }
    })

    // Process rows
    for (let i = 0; i < items.length; i++) {
      const row: ImportMenuItemRow = items[i]
      const rawName = row.name ? String(row.name).trim() : ''

      if (!rawName) {
        skippedCount++
        errors.push(`Row ${i + 1}: Missing item name`)
        continue
      }

      const price = !isNaN(Number(row.price)) ? Math.max(0, Number(row.price)) : 0
      const categoryName = row.category && String(row.category).trim() ? String(row.category).trim() : 'General'
      const catKey = categoryName.toLowerCase()

      // Resolve or create category
      let categoryId = categoryMap.get(catKey)
      if (!categoryId) {
        try {
          const newCat = await prisma.category.create({
            data: {
              tenantId,
              name: categoryName
            }
          })
          categoryId = newCat.id
          categoryMap.set(catKey, categoryId)
        } catch {
          const fallback = await prisma.category.findFirst({ where: { tenantId } })
          categoryId = fallback?.id
        }
      }

      if (!categoryId) {
        skippedCount++
        errors.push(`Row ${i + 1} (${rawName}): Could not assign category`)
        continue
      }

      // Check if item already exists
      const existing = await prisma.menuItem.findFirst({
        where: { tenantId, name: rawName }
      })

      // Clean empty fields — empty stuff stays empty!
      const description = row.description && String(row.description).trim() ? String(row.description).trim() : null
      const ingredients = row.ingredients && String(row.ingredients).trim() ? String(row.ingredients).trim() : null
      const imageUrl = row.imageUrl && String(row.imageUrl).trim() ? String(row.imageUrl).trim() : null
      const calories = row.calories && !isNaN(Number(row.calories)) ? Math.round(Number(row.calories)) : null
      const prepTime = row.prepTime && !isNaN(Number(row.prepTime)) ? Math.round(Number(row.prepTime)) : null
      const isAvailable = parseBoolean(row.isAvailable, true)

      // Dietary & Allergens arrays
      const dietaryTagsList = parseList(row.dietaryTags)
      const formattedDietaryTags = dietaryTagsList.length > 0 ? JSON.stringify(dietaryTagsList) : null

      const allergensList = parseList(row.allergens)
      const formattedAllergens = allergensList.length > 0 ? JSON.stringify(allergensList) : null

      // Item type classification
      const rawType = row.type ? String(row.type).toLowerCase().trim() : ''
      const cleanType: 'drink' | 'food' | 'retail' =
        rawType.includes('food') || rawType.includes('bakery') || rawType.includes('sandwich') ? 'food' :
        rawType.includes('retail') || rawType.includes('bag') || rawType.includes('bean') ? 'retail' : 'drink'

      // Nutrition facts
      const nutritionObj: any = {}
      if (calories !== null) nutritionObj.calories = calories
      if (row.proteinG !== undefined && !isNaN(Number(row.proteinG))) nutritionObj.proteinG = Number(row.proteinG)
      if (row.carbsG !== undefined && !isNaN(Number(row.carbsG))) nutritionObj.carbsG = Number(row.carbsG)
      if (row.fatG !== undefined && !isNaN(Number(row.fatG))) nutritionObj.fatG = Number(row.fatG)
      if (row.sugarG !== undefined && !isNaN(Number(row.sugarG))) nutritionObj.sugarG = Number(row.sugarG)
      if (row.sodiumMg !== undefined && !isNaN(Number(row.sodiumMg))) nutritionObj.sodiumMg = Number(row.sodiumMg)

      // Sensory & Customizations
      const tasteList = parseList(row.tasteProfile)
      const tempOptions = parseList(row.temperatureOptions)
      const sweetLevels = parseList(row.sweetnessLevels)
      const iceLvls = parseList(row.iceLevels)
      const originNote = row.originNote ? String(row.originNote).trim() : undefined
      const storageNote = row.storageNote ? String(row.storageNote).trim() : undefined
      const sku = row.sku ? String(row.sku).trim() : undefined

      // Parse multi-size variants if provided
      const parsedVariants = row.sizes ? parseSizes(row.sizes, cleanType) : null
      const formattedVariants = parsedVariants ? JSON.stringify(parsedVariants) : null

      // Auto-detect isCoffeeBased & isMilkBased for drinks if not explicitly provided
      const isCoffeeBased = row.isCoffeeBased !== undefined
        ? Boolean(row.isCoffeeBased)
        : Boolean(
            row.subtype?.toLowerCase().includes('espresso') ||
            row.subtype?.toLowerCase().includes('coffee') ||
            rawName.toLowerCase().includes('latte') ||
            rawName.toLowerCase().includes('espresso') ||
            rawName.toLowerCase().includes('coffee') ||
            rawName.toLowerCase().includes('cappuccino') ||
            rawName.toLowerCase().includes('americano') ||
            rawName.toLowerCase().includes('v60')
          )

      const isMilkBased = row.isMilkBased !== undefined
        ? Boolean(row.isMilkBased)
        : Boolean(
            rawName.toLowerCase().includes('latte') ||
            rawName.toLowerCase().includes('cappuccino') ||
            rawName.toLowerCase().includes('flat white') ||
            rawName.toLowerCase().includes('macchiato') ||
            rawName.toLowerCase().includes('cortado') ||
            rawName.toLowerCase().includes('milk')
          )

      // Build structured options config payload
      const structuredOptions: any = {
        itemType: cleanType
      }

      if (cleanType === 'drink') {
        structuredOptions.drinkConfig = {
          subtype: row.subtype ? String(row.subtype).toLowerCase().trim() : undefined,
          isCoffeeBased,
          isMilkBased,
          caffeineType: row.caffeineType ? String(row.caffeineType).toLowerCase().trim() : undefined,
          temperatureOptions: tempOptions.length > 0 ? tempOptions : undefined,
          sweetnessLevels: sweetLevels.length > 0 ? sweetLevels : undefined,
          iceLevels: iceLvls.length > 0 ? iceLvls : undefined
        }
      } else if (cleanType === 'food') {
        structuredOptions.foodConfig = {
          subtype: row.subtype ? String(row.subtype).toLowerCase().trim() : undefined
        }
      }

      if (Object.keys(nutritionObj).length > 0) structuredOptions.nutrition = nutritionObj
      if (originNote) structuredOptions.originNote = originNote
      if (storageNote) structuredOptions.storageNote = storageNote
      if (tasteList.length > 0) structuredOptions.tasteProfile = tasteList
      if (sku) structuredOptions.sku = sku

      const optionsJson = JSON.stringify(structuredOptions)

      if (existing) {
        if (duplicateMode === 'skip') {
          skippedCount++
          continue
        }

        // Overwrite / Update existing item
        const updatedItem = await prisma.menuItem.update({
          where: { id: existing.id },
          data: {
            price,
            categoryId,
            description: description !== null ? description : existing.description,
            ingredients: ingredients !== null ? ingredients : existing.ingredients,
            imageUrl: imageUrl !== null ? imageUrl : existing.imageUrl,
            calories: calories !== null ? calories : existing.calories,
            prepTime: prepTime !== null ? prepTime : existing.prepTime,
            isAvailable: row.isAvailable !== undefined ? isAvailable : existing.isAvailable,
            dietaryTags: formattedDietaryTags !== null ? formattedDietaryTags : existing.dietaryTags,
            allergens: formattedAllergens !== null ? formattedAllergens : existing.allergens,
            variants: formattedVariants !== null ? formattedVariants : existing.variants,
            options: optionsJson !== null ? optionsJson : existing.options
          }
        })

        // Link to target menu channel if specified
        if (targetMenuId) {
          const existingLink = await prisma.menuOnItem.findUnique({
            where: {
              menuId_menuItemId: {
                menuId: targetMenuId,
                menuItemId: updatedItem.id
              }
            }
          })
          if (!existingLink) {
            await prisma.menuOnItem.create({
              data: {
                menuId: targetMenuId,
                menuItemId: updatedItem.id
              }
            })
          }
        }

        updatedCount++
      } else {
        // Create new item
        const newItem = await prisma.menuItem.create({
          data: {
            tenantId,
            name: rawName,
            price,
            categoryId,
            description,
            ingredients,
            imageUrl,
            calories,
            prepTime,
            isAvailable,
            dietaryTags: formattedDietaryTags,
            allergens: formattedAllergens,
            variants: formattedVariants,
            options: optionsJson
          }
        })

        // Link to menu channels
        if (targetMenuId) {
          await prisma.menuOnItem.create({
            data: {
              menuId: targetMenuId,
              menuItemId: newItem.id
            }
          })
        } else if (existingMenus.length > 0) {
          // Link to all tenant menus by default
          await prisma.menuOnItem.createMany({
            data: existingMenus.map((m, idx) => ({
              menuId: m.id,
              menuItemId: newItem.id,
              sortOrder: idx,
              isAvailable: true
            }))
          })
        }

        createdCount++
      }
    }

    return NextResponse.json({
      success: true,
      createdCount,
      updatedCount,
      skippedCount,
      totalProcessed: items.length,
      errors
    })
  } catch (error: any) {
    console.error('Failed to import menu items:', error)
    return NextResponse.json({ error: error.message || 'Failed to import menu items' }, { status: 500 })
  }
}
