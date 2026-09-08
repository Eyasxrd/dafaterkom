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
    const body = await request.json()
    const { 
      reason = 'Customer refund requested', 
      restitution = 'restock', // 'restock' | 'waste' | 'none'
      notes = '' 
    } = body

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

    if (order.orderStatus === 'refunded' || order.paymentStatus === 'refunded') {
      return NextResponse.json({ error: 'Order has already been refunded' }, { status: 400 })
    }

    // 2. Perform refund transaction
    const result = await prisma.$transaction(async (tx) => {
      // A. Update order status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          orderStatus: 'refunded',
          paymentStatus: 'refunded',
          notes: order.notes 
            ? `${order.notes} | [REFUNDED: ${reason}${notes ? ` - ${notes}` : ''}]` 
            : `[REFUNDED: ${reason}${notes ? ` - ${notes}` : ''}]`
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

      // B. Stock Restitution Handling
      if (restitution === 'restock') {
        for (const item of order.items) {
          // 1. Restock direct inventory if exists
          if (item.menuItem.inventory) {
            await tx.inventory.update({
              where: { id: item.menuItem.inventory.id },
              data: {
                quantity: { increment: item.quantity },
                lastRestocked: new Date()
              }
            })
          }

          // 2. Restock raw recipe ingredients if exist
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
      } else if (restitution === 'waste') {
        // Record each item as food wastage / spoilage
        for (const item of order.items) {
          const itemFinancialLoss = Math.round(item.quantity * item.price * 100) / 100
          await tx.auditLog.create({
            data: {
              tenantId,
              staffId: order.staffId,
              action: 'inventory_waste',
              entityType: 'InventoryItem',
              entityId: item.menuItemId,
              notes: `Refund Write-off: ${item.quantity}x ${item.menuItem.name} (${reason}) - loss: $${itemFinancialLoss}`,
              afterValue: JSON.stringify({
                menuItemId: item.menuItemId,
                itemName: item.menuItem.name,
                quantity: item.quantity,
                reason: 'quality_rejection',
                financialLoss: itemFinancialLoss,
                refundOrderId: order.id,
                refundOrderNumber: order.orderNumber
              })
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

      // D. Record General Refund in AuditLog
      await tx.auditLog.create({
        data: {
          tenantId,
          staffId: order.staffId,
          action: 'refund',
          entityType: 'Order',
          entityId: order.id,
          beforeValue: JSON.stringify({
            orderNumber: order.orderNumber,
            totalAmount: order.totalAmount,
            previousStatus: order.orderStatus
          }),
          afterValue: JSON.stringify({
            orderNumber: order.orderNumber,
            refundedAmount: order.totalAmount,
            restitution,
            reason,
            notes
          }),
          notes: `Refunded order #${order.orderNumber} for $${order.totalAmount.toFixed(2)} (${restitution})`
        }
      })

      return updatedOrder
    })

    return NextResponse.json({
      success: true,
      message: `Order #${order.orderNumber} successfully refunded`,
      order: result
    })
  } catch (error) {
    console.error('Failed to process refund:', error)
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
  }
}
