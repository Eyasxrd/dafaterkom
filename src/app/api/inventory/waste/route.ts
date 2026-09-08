import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)

    const wasteLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        action: 'inventory_waste'
      },
      orderBy: { timestamp: 'desc' },
      take: 100
    })

    let totalLossAmount = 0
    let totalItemsWasted = 0

    const items = wasteLogs.map((log) => {
      let details: any = {}
      try {
        details = log.afterValue ? JSON.parse(log.afterValue) : {}
      } catch {}

      const itemLoss = details.totalLoss ?? 0
      const itemQty = details.quantity ?? 0
      totalLossAmount += itemLoss
      totalItemsWasted += itemQty

      return {
        id: log.id,
        inventoryId: log.entityId,
        itemName: details.itemName || 'Item',
        quantity: itemQty,
        reason: details.reason || 'unspecified',
        totalLoss: itemLoss,
        notes: details.notes || log.notes || '',
        staffId: log.staffId,
        timestamp: log.timestamp
      }
    })

    return NextResponse.json({
      success: true,
      totalLossAmount,
      totalItemsWasted,
      items
    })
  } catch (error) {
    console.error('Failed to fetch inventory waste logs:', error)
    return NextResponse.json({ error: 'Failed to fetch waste records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { inventoryId, quantity, reason, notes, staffId } = body

    if (!inventoryId) {
      return NextResponse.json({ error: 'inventoryId is required' }, { status: 400 })
    }

    const wasteQty = parseFloat(quantity)
    if (isNaN(wasteQty) || wasteQty <= 0) {
      return NextResponse.json({ error: 'Valid waste quantity greater than zero is required' }, { status: 400 })
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Wastage reason is required' }, { status: 400 })
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId },
      include: {
        menuItem: true
      }
    })

    if (!inventory) {
      return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 })
    }

    if (inventory.menuItem.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized access to inventory' }, { status: 403 })
    }

    // New remaining quantity (safe floor at 0)
    const newQty = Math.max(0, inventory.quantity - Math.round(wasteQty))
    const unitCost = inventory.menuItem.price
    const totalLoss = wasteQty * unitCost

    // Update inventory quantity
    const updated = await prisma.inventory.update({
      where: { id: inventoryId },
      data: {
        quantity: newQty
      },
      include: {
        menuItem: {
          include: { category: true }
        }
      }
    })

    // Record immutable audit entry
    const audit = await prisma.auditLog.create({
      data: {
        tenantId,
        staffId: staffId || null,
        action: 'inventory_waste',
        entityType: 'inventory',
        entityId: inventoryId,
        beforeValue: JSON.stringify({ quantity: inventory.quantity }),
        afterValue: JSON.stringify({
          itemName: inventory.menuItem.name,
          quantity: wasteQty,
          remainingQuantity: newQty,
          unitCost,
          totalLoss,
          reason: reason.trim(),
          notes: notes?.trim() || '',
          recordedAt: new Date().toISOString()
        }),
        notes: `[Wastage: ${reason.trim()}] ${wasteQty}x ${inventory.menuItem.name} (Estimated Loss: $${totalLoss.toFixed(2)})`
      }
    })

    return NextResponse.json({
      success: true,
      updatedInventory: updated,
      loss: totalLoss,
      auditId: audit.id
    })
  } catch (error) {
    console.error('Failed to record inventory waste:', error)
    return NextResponse.json({ error: 'Failed to record inventory waste' }, { status: 500 })
  }
}
