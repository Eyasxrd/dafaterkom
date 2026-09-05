import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

interface ImportRow {
  name: string
  category?: string
  quantity: number
  unit?: string
  price?: number
  threshold?: number
  description?: string
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { targetType = 'menu_items', duplicateMode = 'add', items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided for import' }, { status: 400 })
    }

    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    if (targetType === 'menu_items') {
      // Cache categories for tenant
      const existingCategories = await prisma.category.findMany({
        where: { tenantId }
      })
      const categoryMap = new Map<string, string>()
      existingCategories.forEach(c => categoryMap.set(c.name.toLowerCase(), c.id))

      for (let i = 0; i < items.length; i++) {
        const row: ImportRow = items[i]
        const rawName = row.name ? String(row.name).trim() : ''
        
        if (!rawName) {
          skippedCount++
          errors.push(`Row ${i + 1}: Missing item name`)
          continue
        }

        const qty = !isNaN(Number(row.quantity)) ? Math.max(0, Math.floor(Number(row.quantity))) : 0
        const price = !isNaN(Number(row.price)) ? Math.max(0, Number(row.price)) : 0
        const threshold = !isNaN(Number(row.threshold)) ? Math.max(0, Math.floor(Number(row.threshold))) : 10
        const unit = row.unit ? String(row.unit).trim().toLowerCase() : 'pieces'
        const categoryName = row.category ? String(row.category).trim() : 'General'

        // Resolve Category
        let categoryId = categoryMap.get(categoryName.toLowerCase())
        if (!categoryId) {
          try {
            const newCat = await prisma.category.create({
              data: { tenantId, name: categoryName }
            })
            categoryId = newCat.id
            categoryMap.set(categoryName.toLowerCase(), categoryId)
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

        // Check if MenuItem already exists
        const existingItem = await prisma.menuItem.findFirst({
          where: { tenantId, name: rawName },
          include: { inventory: true }
        })

        if (existingItem) {
          // Update existing item & stock
          if (existingItem.inventory) {
            const newQty = duplicateMode === 'add'
              ? existingItem.inventory.quantity + qty
              : qty

            await prisma.inventory.update({
              where: { id: existingItem.inventory.id },
              data: {
                quantity: newQty,
                unit: unit || existingItem.inventory.unit,
                lowStockThreshold: threshold || existingItem.inventory.lowStockThreshold,
                lastRestocked: new Date()
              }
            })
          } else {
            await prisma.inventory.create({
              data: {
                menuItemId: existingItem.id,
                quantity: qty,
                unit,
                lowStockThreshold: threshold,
                lastRestocked: new Date()
              }
            })
          }

          if (price > 0 && price !== existingItem.price) {
            await prisma.menuItem.update({
              where: { id: existingItem.id },
              data: { price }
            })
          }

          updatedCount++
        } else {
          // Create new MenuItem + Inventory
          await prisma.menuItem.create({
            data: {
              tenantId,
              name: rawName,
              description: row.description?.trim() || null,
              price,
              categoryId,
              isAvailable: true,
              inventory: {
                create: {
                  quantity: qty,
                  unit,
                  lowStockThreshold: threshold,
                  lastRestocked: new Date()
                }
              }
            }
          })
          createdCount++
        }
      }
    } else {
      // Import as Raw Ingredients for Recipes
      for (let i = 0; i < items.length; i++) {
        const row: ImportRow = items[i]
        const rawName = row.name ? String(row.name).trim() : ''

        if (!rawName) {
          skippedCount++
          errors.push(`Row ${i + 1}: Missing ingredient name`)
          continue
        }

        const qty = !isNaN(Number(row.quantity)) ? Math.max(0, Number(row.quantity)) : 0
        const threshold = !isNaN(Number(row.threshold)) ? Math.max(0, Number(row.threshold)) : 10
        const unit = row.unit ? String(row.unit).trim().toLowerCase() : 'grams'

        const existing = await prisma.ingredient.findFirst({
          where: { tenantId, name: rawName }
        })

        if (existing) {
          const newQty = duplicateMode === 'add'
            ? existing.quantity + qty
            : qty

          await prisma.ingredient.update({
            where: { id: existing.id },
            data: {
              quantity: newQty,
              unit: unit || existing.unit,
              lowStockThreshold: threshold || existing.lowStockThreshold,
              lastRestocked: new Date()
            }
          })
          updatedCount++
        } else {
          await prisma.ingredient.create({
            data: {
              tenantId,
              name: rawName,
              description: row.description?.trim() || null,
              quantity: qty,
              unit,
              lowStockThreshold: threshold,
              lastRestocked: new Date()
            }
          })
          createdCount++
        }
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
    console.error('Failed to import stock:', error)
    return NextResponse.json({ error: error.message || 'Failed to import stock' }, { status: 500 })
  }
}
