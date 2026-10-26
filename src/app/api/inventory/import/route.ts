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
    const { targetType = 'ingredients', duplicateMode = 'add', items } = body

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided for import' }, { status: 400 })
    }

    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const errors: string[] = []

    if (targetType === 'ingredients') {
      // Import as Raw Materials / Ingredients (Primary Inventory)
      for (let i = 0; i < items.length; i++) {
        const row: ImportRow = items[i]
        const rawName = row.name ? String(row.name).trim() : ''

        if (!rawName) {
          skippedCount++
          errors.push(`Row ${i + 1}: Missing ingredient/material name`)
          continue
        }

        const qty = !isNaN(Number(row.quantity)) ? Math.max(0, Number(row.quantity)) : 0
        const threshold = !isNaN(Number(row.threshold)) ? Math.max(0, Number(row.threshold)) : 10
        const unit = row.unit ? String(row.unit).trim().toLowerCase() : 'grams'
        const costPerUnit = !isNaN(Number(row.price)) ? Math.max(0, Number(row.price)) : 0

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
              costPerUnit: costPerUnit > 0 ? costPerUnit : existing.costPerUnit,
              description: row.description?.trim() || existing.description,
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
              costPerUnit,
              lastRestocked: new Date()
            }
          })
          createdCount++
        }
      }
    } else {
      // Import as Menu Items
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

        const existingItem = await prisma.menuItem.findFirst({
          where: { tenantId, name: rawName },
          include: { inventory: true }
        })

        if (existingItem) {
          if (price > 0 && price !== existingItem.price) {
            await prisma.menuItem.update({
              where: { id: existingItem.id },
              data: { price }
            })
          }
          updatedCount++
        } else {
          await prisma.menuItem.create({
            data: {
              tenantId,
              name: rawName,
              description: row.description?.trim() || null,
              price,
              categoryId,
              isAvailable: true
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
