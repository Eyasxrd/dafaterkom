import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)

    // Fetch all ingredients for the tenant as the source of truth for inventory
    const ingredients = await prisma.ingredient.findMany({
      where: { tenantId },
      include: {
        recipes: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                price: true,
                category: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedInventory = ingredients.map((ing) => {
      const recipesList = ing.recipes || []
      const valuation = Math.round(ing.quantity * (ing.costPerUnit || 0) * 100) / 100

      return {
        id: ing.id,
        name: ing.name,
        description: ing.description,
        quantity: ing.quantity,
        unit: ing.unit,
        lowStockThreshold: ing.lowStockThreshold,
        costPerUnit: ing.costPerUnit || 0,
        valuation,
        lastRestocked: ing.lastRestocked,
        recipesCount: recipesList.length,
        recipes: recipesList.map((r) => ({
          recipeId: r.id,
          menuItemId: r.menuItemId,
          menuItemName: r.menuItem?.name || 'Unknown Item',
          categoryName: r.menuItem?.category?.name || 'General',
          recipeQuantity: r.quantity
        })),
        createdAt: ing.createdAt,
        updatedAt: ing.updatedAt
      }
    })

    return NextResponse.json(formattedInventory)
  } catch (error: any) {
    console.error('Failed to fetch inventory ingredients:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const {
      name,
      description,
      quantity,
      unit,
      lowStockThreshold,
      costPerUnit,
      restock,
      ingredientId,
      inventoryId,
      addQuantity
    } = body

    const targetId = ingredientId || inventoryId

    // 1. Quick Restock Mode (Add to existing ingredient stock)
    if (restock && targetId && addQuantity) {
      const existing = await prisma.ingredient.findUnique({
        where: { id: targetId }
      })

      if (!existing || existing.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Ingredient inventory record not found' }, { status: 404 })
      }

      const numToAdd = parseFloat(addQuantity) || 0
      const updated = await prisma.ingredient.update({
        where: { id: targetId },
        data: {
          quantity: Math.max(0, Math.round((existing.quantity + numToAdd) * 1000) / 1000),
          lastRestocked: new Date()
        },
        include: {
          recipes: {
            include: {
              menuItem: true
            }
          }
        }
      })

      return NextResponse.json(updated)
    }

    // 2. Create New Ingredient / Inventory Item
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Ingredient name is required' }, { status: 400 })
    }

    const cleanName = name.trim()

    // Check if ingredient with this name already exists for this tenant
    const existing = await prisma.ingredient.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: cleanName
        }
      }
    })

    if (existing) {
      const numQty = parseFloat(quantity) || 0
      const updated = await prisma.ingredient.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + numQty,
          unit: unit || existing.unit,
          lowStockThreshold: lowStockThreshold !== undefined ? parseFloat(lowStockThreshold) : existing.lowStockThreshold,
          costPerUnit: costPerUnit !== undefined ? parseFloat(costPerUnit) : existing.costPerUnit,
          description: description !== undefined ? description?.trim() || null : existing.description,
          lastRestocked: new Date()
        }
      })
      return NextResponse.json(updated)
    }

    const newIngredient = await prisma.ingredient.create({
      data: {
        tenantId,
        name: cleanName,
        description: description?.trim() || null,
        quantity: parseFloat(quantity) || 0,
        unit: unit?.trim() || 'grams',
        lowStockThreshold: lowStockThreshold !== undefined ? parseFloat(lowStockThreshold) : 10,
        costPerUnit: costPerUnit !== undefined ? parseFloat(costPerUnit) : 0,
        lastRestocked: new Date()
      },
      include: {
        recipes: {
          include: {
            menuItem: true
          }
        }
      }
    })

    return NextResponse.json(newIngredient, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create/update inventory ingredient:', error)
    return NextResponse.json({ error: error.message || 'Failed to create inventory ingredient' }, { status: 500 })
  }
}
