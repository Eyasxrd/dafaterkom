import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const orders = await prisma.order.findMany({
      where: { tenantId },
      include: {
        customer: true,
        staff: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        items: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return NextResponse.json(orders)
  } catch (error) {
    console.error('Failed to fetch orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const {
      orderNumber,
      staffId,
      subtotal,
      tax,
      discount,
      totalAmount,
      paymentMethod,
      tableNumber,
      customerName,
      customerEmail,
      customerId,
      deviceId,
      notes,
      items
    } = body

    if (!orderNumber || !staffId || !items || !items.length) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 })
    }

    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the order with items
      const createdOrder = await tx.order.create({
        data: {
          tenantId,
          orderNumber,
          staffId,
          subtotal: parseFloat(subtotal) || parseFloat(totalAmount),
          tax: parseFloat(tax) || 0,
          discount: parseFloat(discount) || 0,
          totalAmount: parseFloat(totalAmount),
          paymentMethod: paymentMethod || 'cash',
          paymentStatus: 'completed',
          orderStatus: 'pending',
          tableNumber: tableNumber ? parseInt(tableNumber) : null,
          customerName: customerName || null,
          customerEmail: customerEmail || null,
          customerId: customerId || null,
          deviceId: deviceId || 'main-pos',
          notes: notes || null,
          items: {
            create: items.map((item: any) => ({
              menuItemId: item.menuItemId,
              quantity: parseInt(item.quantity) || 1,
              price: parseFloat(item.price),
              subtotal: parseFloat(item.subtotal),
              notes: item.notes || null
            }))
          }
        },
        include: {
          customer: true,
          staff: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          items: {
            include: {
              menuItem: true
            }
          }
        }
      })

      // 2. Increment customer loyalty points if customer is selected (1 point per dollar)
      if (customerId) {
        const earnedPoints = Math.max(1, Math.floor(parseFloat(totalAmount)))
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: earnedPoints }
          }
        })
      }

      // 3. Deduct direct inventory and raw ingredients for each item
      for (const item of items) {
        const itemQuantity = parseInt(item.quantity) || 1

        // Deduct direct inventory if exists
        const directInventory = await tx.inventory.findUnique({
          where: { menuItemId: item.menuItemId }
        })

        if (directInventory) {
          await tx.inventory.update({
            where: { id: directInventory.id },
            data: {
              quantity: Math.max(0, directInventory.quantity - itemQuantity)
            }
          })
        }

        // Deduct raw ingredients if recipes exist
        const recipes = await tx.recipe.findMany({
          where: { menuItemId: item.menuItemId },
          include: { ingredient: true }
        })

        for (const recipe of recipes) {
          const totalIngredientQuantity = recipe.quantity * itemQuantity
          await tx.ingredient.update({
            where: { id: recipe.ingredientId },
            data: {
              quantity: Math.max(0, recipe.ingredient.quantity - totalIngredientQuantity)
            }
          })
        }
      }

      // 4. Create SyncEvent for offline/cloud delta sync
      await tx.syncEvent.create({
        data: {
          tenantId,
          deviceId: deviceId || 'main-pos',
          entityType: 'order',
          entityId: createdOrder.id,
          action: 'create',
          payload: JSON.stringify({
            orderNumber: createdOrder.orderNumber,
            totalAmount: createdOrder.totalAmount,
            status: createdOrder.orderStatus,
            itemsCount: items.length
          })
        }
      })

      return createdOrder
    })

    // 5. Log audit if discount applied
    if (parseFloat(discount) > 0) {
      await logAuditEvent({
        tenantId,
        staffId,
        action: 'discount_applied',
        entityType: 'order',
        entityId: order.id,
        afterValue: { discount: parseFloat(discount), totalAmount: parseFloat(totalAmount) },
        notes: `Discount applied to order #${order.orderNumber}`
      })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
