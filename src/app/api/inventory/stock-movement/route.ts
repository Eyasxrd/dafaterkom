import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const movements = await prisma.stockMovement.findMany({
      where: { tenantId },
      include: {
        ingredient: true
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json(movements)
  } catch (error) {
    console.error('Failed to fetch stock movements:', error)
    return NextResponse.json({ error: 'Failed to fetch stock movements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { 
      type = 'out_sale_b2b', // "out_sale_b2b", "adjustment", "out_waste"
      ingredientId,
      quantity,
      unitPrice,
      reference,
      notes,
      staffId
    } = body

    if (!ingredientId) {
      return NextResponse.json({ error: 'Ingredient is required' }, { status: 400 })
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Valid quantity greater than zero is required' }, { status: 400 })
    }

    const ingredient = await prisma.ingredient.findUnique({
      where: { id: ingredientId }
    })

    if (!ingredient || ingredient.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 })
    }

    const pricePerUnit = parseFloat(unitPrice) || ingredient.costPerUnit || 0
    const totalAmount = qty * pricePerUnit

    // Check available stock (allow negative or floor to 0 depending on type)
    const newQty = Math.max(0, ingredient.quantity - qty)

    // Update ingredient quantity
    const updatedIngredient = await prisma.ingredient.update({
      where: { id: ingredientId },
      data: {
        quantity: newQty
      }
    })

    // Create stock movement record
    const movement = await prisma.stockMovement.create({
      data: {
        tenantId,
        type,
        ingredientId,
        quantity: qty,
        unitCost: pricePerUnit,
        totalAmount,
        reference: reference || 'B2B Wholesale Customer',
        notes: notes || `Direct B2B sold: ${qty} ${ingredient.unit} of ${ingredient.name}`,
        staffId: staffId || null
      },
      include: {
        ingredient: true
      }
    })

    // Create Audit Log
    await prisma.auditLog.create({
      data: {
        tenantId,
        staffId: staffId || null,
        action: type === 'out_sale_b2b' ? 'inventory_b2b_sale' : 'inventory_adjustment',
        entityType: 'ingredient',
        entityId: ingredientId,
        beforeValue: JSON.stringify({ quantity: ingredient.quantity }),
        afterValue: JSON.stringify({
          ingredientName: ingredient.name,
          quantitySold: qty,
          remainingQuantity: newQty,
          unitPrice: pricePerUnit,
          totalAmount,
          reference,
          notes
        }),
        notes: `[B2B Wholesale / Sold] ${qty} ${ingredient.unit} of ${ingredient.name} sold to ${reference || 'Client'} for $${totalAmount.toFixed(2)}`
      }
    })

    return NextResponse.json({
      success: true,
      movement,
      updatedIngredient
    })
  } catch (error) {
    console.error('Failed to record stock movement:', error)
    return NextResponse.json({ error: 'Failed to record stock movement' }, { status: 500 })
  }
}
