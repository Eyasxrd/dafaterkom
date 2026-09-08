import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)

    // Only fetch active kitchen orders
    const activeOrders = await prisma.order.findMany({
      where: {
        tenantId,
        orderStatus: { in: ['pending', 'preparing', 'ready'] }
      },
      select: {
        id: true,
        orderNumber: true,
        tableNumber: true,
        customerName: true,
        notes: true,
        orderStatus: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            quantity: true,
            notes: true,
            menuItem: {
              select: {
                name: true,
                category: {
                  select: { name: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 100
    })

    return NextResponse.json(activeOrders)
  } catch (error) {
    console.error('Failed to fetch kitchen orders:', error)
    return NextResponse.json({ error: 'Failed to fetch kitchen orders' }, { status: 500 })
  }
}
