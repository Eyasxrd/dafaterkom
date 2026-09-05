import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const inventory = await prisma.inventory.findMany({
      where: {
        menuItem: {
          tenantId
        }
      },
      include: {
        menuItem: {
          include: {
            category: true
          }
        }
      },
      orderBy: {
        menuItem: {
          name: 'asc'
        }
      }
    })
    return NextResponse.json(inventory)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { 
      createNewItem, 
      name, 
      price, 
      categoryId, 
      newCategoryName, 
      description,
      menuItemId, 
      quantity, 
      unit, 
      lowStockThreshold,
      restock,
      inventoryId,
      addQuantity
    } = body

    // 1. Batch Restock mode: add stock to existing inventory item
    if (restock && inventoryId && addQuantity) {
      const existing = await prisma.inventory.findUnique({
        where: { id: inventoryId }
      })

      if (!existing) {
        return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 })
      }

      const updated = await prisma.inventory.update({
        where: { id: inventoryId },
        data: {
          quantity: existing.quantity + parseInt(addQuantity, 10),
          lastRestocked: new Date()
        },
        include: {
          menuItem: {
            include: { category: true }
          }
        }
      })

      return NextResponse.json(updated)
    }

    // 2. Create Brand New Menu Item + Initial Stock
    if (createNewItem) {
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Item name is required' }, { status: 400 })
      }

      let finalCategoryId = categoryId

      // If new category name provided, or if no category exists, create/find category
      if (!finalCategoryId) {
        const catName = newCategoryName?.trim() || 'General'
        let cat = await prisma.category.findFirst({
          where: { tenantId, name: catName }
        })
        if (!cat) {
          cat = await prisma.category.create({
            data: { tenantId, name: catName }
          })
        }
        finalCategoryId = cat.id
      }

      // Create MenuItem and Inventory together
      const newMenuItem = await prisma.menuItem.create({
        data: {
          tenantId,
          name: name.trim(),
          description: description?.trim() || null,
          price: parseFloat(price) || 0,
          categoryId: finalCategoryId,
          isAvailable: true,
          inventory: {
            create: {
              quantity: parseInt(quantity, 10) || 0,
              unit: unit || 'pieces',
              lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
              lastRestocked: new Date()
            }
          }
        },
        include: {
          category: true,
          inventory: true
        }
      })

      return NextResponse.json(newMenuItem.inventory, { status: 201 })
    }

    // 3. Add inventory to existing MenuItem
    if (!menuItemId) {
      return NextResponse.json({ error: 'MenuItem ID is required' }, { status: 400 })
    }

    // Check if inventory already exists for this menuItem
    const existing = await prisma.inventory.findUnique({
      where: { menuItemId }
    })

    if (existing) {
      const updated = await prisma.inventory.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + (parseInt(quantity, 10) || 0),
          unit: unit || existing.unit,
          lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold, 10) : existing.lowStockThreshold,
          lastRestocked: new Date()
        },
        include: {
          menuItem: {
            include: { category: true }
          }
        }
      })
      return NextResponse.json(updated)
    }

    const inventory = await prisma.inventory.create({
      data: {
        menuItemId,
        quantity: parseInt(quantity, 10) || 0,
        unit: unit || 'pieces',
        lowStockThreshold: parseInt(lowStockThreshold, 10) || 10,
        lastRestocked: new Date()
      },
      include: {
        menuItem: {
          include: { category: true }
        }
      }
    })

    return NextResponse.json(inventory, { status: 201 })
  } catch (error) {
    console.error('Failed to create/update inventory:', error)
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 })
  }
}
