import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { postWastageJournal } from '@/lib/accounting'

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

      const itemLoss = details.totalLoss ?? (details.financialLoss ?? 0)
      const itemQty = details.quantity ?? 0
      totalLossAmount += itemLoss
      totalItemsWasted += itemQty

      return {
        id: log.id,
        ingredientId: log.entityId,
        itemName: details.ingredientName || details.itemName || 'Raw Material',
        quantity: itemQty,
        unit: details.unit || 'units',
        unitCost: details.unitCost || 0,
        reason: details.reason || 'expired',
        totalLoss: itemLoss,
        notes: details.notes || log.notes || '',
        staffId: log.staffId,
        timestamp: log.timestamp
      }
    })

    return NextResponse.json({
      success: true,
      totalLossAmount: Math.round(totalLossAmount * 100) / 100,
      totalItemsWasted: Math.round(totalItemsWasted * 100) / 100,
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
    const { ingredientId, inventoryId, quantity, reason, notes, staffId } = body

    const targetId = ingredientId || inventoryId
    if (!targetId) {
      return NextResponse.json({ error: 'Ingredient ID is required' }, { status: 400 })
    }

    const wasteQty = parseFloat(quantity)
    if (isNaN(wasteQty) || wasteQty <= 0) {
      return NextResponse.json({ error: 'Valid waste quantity greater than zero is required' }, { status: 400 })
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Wastage reason is required' }, { status: 400 })
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: targetId }
    })

    if (!ingredient) {
      return NextResponse.json({ error: 'Ingredient record not found' }, { status: 404 })
    }

    if (ingredient.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Unauthorized access to ingredient' }, { status: 403 })
    }

    // New remaining quantity (floor at 0)
    const newQty = Math.max(0, Math.round((ingredient.quantity - wasteQty) * 1000) / 1000)
    const unitCost = ingredient.costPerUnit || 0
    const totalLoss = Math.round(wasteQty * unitCost * 100) / 100

    // 1. Update ingredient quantity
    const updatedIngredient = await prisma.ingredient.update({
      where: { id: targetId },
      data: {
        quantity: newQty
      }
    })

    // 2. Also record in StockMovement if desired
    try {
      await prisma.stockMovement.create({
        data: {
          tenantId,
          type: 'out_waste',
          ingredientId: targetId,
          quantity: wasteQty,
          unitCost,
          totalAmount: totalLoss,
          reference: `Waste: ${reason.trim()}`,
          notes: notes?.trim() || `Recorded wastage for ${ingredient.name}`,
          staffId: staffId || null
        }
      })
    } catch (smErr) {
      console.error('Warning: Failed to create stock movement for waste:', smErr)
    }

    // 3. Record immutable audit entry
    const audit = await prisma.auditLog.create({
      data: {
        tenantId,
        staffId: staffId || null,
        action: 'inventory_waste',
        entityType: 'ingredient',
        entityId: targetId,
        beforeValue: JSON.stringify({ quantity: ingredient.quantity }),
        afterValue: JSON.stringify({
          ingredientName: ingredient.name,
          quantity: wasteQty,
          unit: ingredient.unit,
          remainingQuantity: newQty,
          unitCost,
          totalLoss,
          financialLoss: totalLoss,
          reason: reason.trim(),
          notes: notes?.trim() || '',
          recordedAt: new Date().toISOString()
        }),
        notes: `[Wastage: ${reason.trim()}] ${wasteQty} ${ingredient.unit} of ${ingredient.name} (Loss: $${totalLoss.toFixed(2)})`
      }
    })

    // 4. Auto-post double-entry accounting journal
    try {
      await postWastageJournal(tenantId, totalLoss, audit.notes || undefined, audit.id)
    } catch (journalErr) {
      console.error('Warning: Failed to auto-post journal for wastage:', journalErr)
    }

    return NextResponse.json({
      success: true,
      updatedIngredient,
      loss: totalLoss,
      auditId: audit.id
    })
  } catch (error: any) {
    console.error('Failed to record inventory waste:', error)
    return NextResponse.json({ error: error.message || 'Failed to record inventory waste' }, { status: 500 })
  }
}
