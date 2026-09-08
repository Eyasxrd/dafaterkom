import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest, getTenantById } from '@/lib/tenant-context'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    
    const statusParam = searchParams.get('status')
    const limitParam = searchParams.get('limit')
    const sinceParam = searchParams.get('since')

    const whereClause: any = { tenantId }

    if (statusParam) {
      const statuses = statusParam.split(',').map(s => s.trim()).filter(Boolean)
      if (statuses.length > 0) {
        whereClause.orderStatus = { in: statuses }
      }
    }

    if (sinceParam) {
      const sinceDate = new Date(sinceParam)
      if (!isNaN(sinceDate.getTime())) {
        whereClause.createdAt = { gte: sinceDate }
      }
    }

    const limit = limitParam ? Math.min(Math.max(1, parseInt(limitParam)), 500) : 100

    const orders = await prisma.order.findMany({
      where: whereClause,
      take: limit,
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
      discount = 0,
      paymentMethod,
      tableNumber,
      customerName,
      customerEmail,
      customerId,
      deviceId,
      notes,
      items,
      redeemedPoints,
      promoCode
    } = body

    if (!orderNumber || !staffId || !items || !items.length) {
      return NextResponse.json({ error: 'Missing required order fields' }, { status: 400 })
    }

    // Idempotency check: if orderNumber already exists, return existing order cleanly (prevents sync stall)
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        customer: true,
        staff: { select: { id: true, name: true, role: true } },
        items: { include: { menuItem: true } }
      }
    })

    if (existingOrder) {
      return NextResponse.json(existingOrder)
    }

    const tenantInfo = await getTenantById(tenantId)
    const activeTaxRate = tenantInfo.taxRate ?? 15.0

    const order = await prisma.$transaction(async (tx) => {
      // 1. Fetch official menu item prices from DB for verified price calculation
      const itemIds = items.map((i: any) => i.menuItemId).filter(Boolean)
      const dbMenuItems = await tx.menuItem.findMany({
        where: { id: { in: itemIds }, tenantId }
      })
      const menuItemMap = new Map(dbMenuItems.map(m => [m.id, m]))

      // Calculate server-verified subtotal
      let verifiedSubtotal = 0
      const validatedItems = items.map((item: any) => {
        const dbItem = menuItemMap.get(item.menuItemId)
        const unitPrice = dbItem ? dbItem.price : parseFloat(item.price) || 0
        const quantity = parseInt(item.quantity) || 1
        const lineSubtotal = Math.round((unitPrice * quantity) * 100) / 100
        verifiedSubtotal += lineSubtotal

        return {
          menuItemId: item.menuItemId,
          quantity,
          price: unitPrice,
          subtotal: lineSubtotal,
          notes: item.notes || null
        }
      })

      // Calculate Promo Code discount
      let promoDiscount = 0
      const normalizedPromo = promoCode ? String(promoCode).trim().toUpperCase() : null
      if (normalizedPromo) {
        if (normalizedPromo === 'WELCOME10') {
          promoDiscount = Math.round((verifiedSubtotal * 0.10) * 100) / 100
        } else if (normalizedPromo === 'SUMMER20') {
          promoDiscount = Math.round((verifiedSubtotal * 0.20) * 100) / 100
        } else if (normalizedPromo === 'VIP15') {
          promoDiscount = Math.round((verifiedSubtotal * 0.15) * 100) / 100
        } else if (normalizedPromo === 'HAPPYHOUR') {
          promoDiscount = Math.round((verifiedSubtotal * 0.25) * 100) / 100
        } else if (normalizedPromo === 'COFFEE5') {
          promoDiscount = Math.min(5.00, verifiedSubtotal)
        }
      }

      // Calculate Loyalty Points redemption discount ($1 off per 100 points)
      let pointsDiscount = 0
      let actualDeductedPoints = 0
      const reqPoints = parseInt(redeemedPoints) || 0

      if (customerId && reqPoints > 0) {
        const custRecord = await tx.customer.findUnique({
          where: { id: customerId }
        })
        if (custRecord && custRecord.loyaltyPoints > 0) {
          const eligiblePoints = Math.min(custRecord.loyaltyPoints, reqPoints)
          const potentialDiscount = Math.round((eligiblePoints / 100) * 1.00 * 100) / 100
          const remainingAfterPromo = Math.max(0, verifiedSubtotal - promoDiscount)
          pointsDiscount = Math.min(potentialDiscount, remainingAfterPromo)
          actualDeductedPoints = Math.round(pointsDiscount * 100)
        }
      }

      const manualDiscount = Math.max(0, parseFloat(discount) || 0)
      const totalDiscountAmount = Math.min(
        verifiedSubtotal,
        Math.round((manualDiscount + promoDiscount + pointsDiscount) * 100) / 100
      )
      const taxableAmount = Math.max(0, verifiedSubtotal - totalDiscountAmount)
      const verifiedTax = Math.round((taxableAmount * (activeTaxRate / 100)) * 100) / 100
      const verifiedTotal = Math.round((taxableAmount + verifiedTax) * 100) / 100

      // Notes summary for discounts
      const discountNotesParts: string[] = []
      if (normalizedPromo && promoDiscount > 0) discountNotesParts.push(`Promo: ${normalizedPromo} (-$${promoDiscount.toFixed(2)})`)
      if (actualDeductedPoints > 0) discountNotesParts.push(`Redeemed ${actualDeductedPoints} pts (-$${pointsDiscount.toFixed(2)})`)
      const combinedNotes = [notes, discountNotesParts.length ? `[${discountNotesParts.join(' | ')}]` : null].filter(Boolean).join(' ')

      // 2. Create the order with verified pricing
      const createdOrder = await tx.order.create({
        data: {
          tenantId,
          orderNumber,
          staffId,
          subtotal: verifiedSubtotal,
          tax: verifiedTax,
          discount: totalDiscountAmount,
          totalAmount: verifiedTotal,
          paymentMethod: paymentMethod || 'cash',
          paymentStatus: 'completed',
          orderStatus: 'pending',
          tableNumber: tableNumber ? parseInt(tableNumber) : null,
          customerName: customerName || null,
          customerEmail: customerEmail || null,
          customerId: customerId || null,
          deviceId: deviceId || 'main-pos',
          notes: combinedNotes || null,
          items: {
            create: validatedItems
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

      // 3. Update customer loyalty points (deduct redeemed points and award earned points)
      if (customerId) {
        const earnedPoints = Math.max(1, Math.floor(verifiedTotal))
        const netChange = earnedPoints - actualDeductedPoints
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: netChange }
          }
        })
      }

      // 4. Deduct direct inventory and raw ingredients for each item
      for (const item of validatedItems) {
        const itemQuantity = item.quantity

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

      // 5. Create SyncEvent for offline/cloud delta sync
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
            itemsCount: validatedItems.length
          })
        }
      })

      return createdOrder
    })

    // 6. Log audit if discount applied
    if (parseFloat(discount) > 0) {
      await logAuditEvent({
        tenantId,
        staffId,
        action: 'discount_applied',
        entityType: 'order',
        entityId: order.id,
        afterValue: { discount: parseFloat(discount), totalAmount: order.totalAmount },
        notes: `Discount applied to order #${order.orderNumber}`
      })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
