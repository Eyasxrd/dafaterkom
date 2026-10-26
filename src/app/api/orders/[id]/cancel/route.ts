import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { reason = 'Order voided by cashier' } = body

    // 1. Fetch order with items and customer
    const order = await prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                inventory: true
              }
            }
          }
        },
        customer: true,
        staff: true
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.orderStatus === 'cancelled') {
      return NextResponse.json({ error: 'Order is already cancelled' }, { status: 400 })
    }

    // 2. Perform cancellation transaction
    const result = await prisma.$transaction(async (tx) => {
      // A. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'cancelled',
          notes: order.notes 
            ? `${order.notes} | [CANCELLED/VOIDED: ${reason.trim()}]` 
            : `[CANCELLED/VOIDED: ${reason.trim()}]`
        },
        include: {
          items: {
            include: {
              menuItem: true
            }
          },
          customer: true,
          staff: true
        }
      })

      // B. Restock items and recipe ingredients
      for (const item of order.items) {
        // Restock direct inventory if exists
        if (item.menuItem.inventory) {
          await tx.inventory.update({
            where: { id: item.menuItem.inventory.id },
            data: {
              quantity: { increment: item.quantity },
              lastRestocked: new Date()
            }
          })
        }

        // Restock raw recipe ingredients if exist
        const recipes = await tx.recipe.findMany({
          where: { menuItemId: item.menuItemId }
        })
        for (const recipe of recipes) {
          await tx.ingredient.update({
            where: { id: recipe.ingredientId },
            data: {
              quantity: { increment: recipe.quantity * item.quantity },
              lastRestocked: new Date()
            }
          })
        }
      }

      // C. Customer Loyalty Points Reversal
      if (order.customerId && order.customer) {
        const earnedPoints = Math.max(1, Math.floor(order.totalAmount))
        let redeemedPoints = 0
        const ptsMatch = order.notes?.match(/Redeemed:\s*(\d+)\s*pts/i)
        if (ptsMatch && ptsMatch[1]) {
          redeemedPoints = parseInt(ptsMatch[1], 10)
        }

        const netPointChange = redeemedPoints - earnedPoints
        const newBalance = Math.max(0, order.customer.loyaltyPoints + netPointChange)

        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            loyaltyPoints: newBalance
          }
        })
      }

      // D. Record in AuditLog
      await tx.auditLog.create({
        data: {
          tenantId,
          staffId: order.staffId,
          action: 'void',
          entityType: 'Order',
          entityId: order.id,
          beforeValue: JSON.stringify({
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            previousStatus: order.orderStatus
          }),
          afterValue: JSON.stringify({
            orderNumber: order.orderNumber,
            orderStatus: 'cancelled',
            reason: reason.trim()
          }),
          notes: `Voided/Cancelled order #${order.orderNumber} ($${order.totalAmount.toFixed(2)}) - Reason: ${reason.trim()}`
        }
      })

      return updatedOrder
    })

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} successfully voided`,
      order: result
    })
  } catch (error) {
    console.error('Failed to cancel order:', error)
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }
}
