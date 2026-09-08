import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'today'

    const now = new Date()
    let startDate: Date | undefined = undefined

    if (timeRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    } else if (timeRange === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
    } else if (timeRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    }

    const baseWhere: any = { tenantId }
    if (startDate) {
      baseWhere.createdAt = { gte: startDate }
    }

    const nonCancelledWhere = {
      ...baseWhere,
      orderStatus: { not: 'cancelled' }
    }

    // 1. Total revenue & financial aggregates
    const revenueAgg = await prisma.order.aggregate({
      where: nonCancelledWhere,
      _sum: {
        totalAmount: true,
        subtotal: true,
        tax: true,
        discount: true
      },
      _count: {
        id: true
      }
    })

    // 2. Order counts by status
    const [totalOrders, completedOrders, cancelledOrders] = await Promise.all([
      prisma.order.count({ where: baseWhere }),
      prisma.order.count({ where: { ...baseWhere, orderStatus: 'completed' } }),
      prisma.order.count({ where: { ...baseWhere, orderStatus: 'cancelled' } })
    ])

    // 3. Payment method distribution
    const paymentGroups = await prisma.order.groupBy({
      by: ['paymentMethod'],
      where: nonCancelledWhere,
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    })

    const paymentMethods = paymentGroups.map(p => ({
      method: p.paymentMethod,
      amount: p._sum.totalAmount || 0,
      count: p._count.id
    }))

    // 4. Popular menu items in period
    const topOrderItems = await prisma.orderItem.groupBy({
      by: ['menuItemId'],
      where: {
        order: nonCancelledWhere
      },
      _sum: {
        quantity: true,
        subtotal: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 10
    })

    // Fetch menuItem names for the top items
    const menuItemIds = topOrderItems.map(i => i.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: menuItemIds } },
      select: { id: true, name: true, price: true }
    })
    const menuMap = new Map(menuItems.map(m => [m.id, m]))

    const popularItems = topOrderItems.map(item => ({
      name: menuMap.get(item.menuItemId)?.name || 'Item',
      quantity: item._sum.quantity || 0,
      revenue: item._sum.subtotal || 0
    }))

    // 5. Wastage and Spoilage Loss in period
    const wasteLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        action: 'inventory_waste',
        ...(startDate ? { timestamp: { gte: startDate } } : {})
      }
    })

    let wastageLoss = 0
    wasteLogs.forEach(w => {
      if (w.afterValue) {
        try {
          const parsed = JSON.parse(w.afterValue)
          if (parsed.financialLoss) wastageLoss += parsed.financialLoss
        } catch {}
      }
    })

    // 6. Staff / Cashier Performance
    const staffOrders = await prisma.order.groupBy({
      by: ['staffId'],
      where: nonCancelledWhere,
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    })

    const staffIds = staffOrders.map(s => s.staffId)
    const staffMembers = await prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, name: true, role: true }
    })
    const staffMap = new Map(staffMembers.map(s => [s.id, s]))

    const staffPerformance = staffOrders.map(s => {
      const member = staffMap.get(s.staffId)
      const count = s._count.id || 0
      const volume = s._sum.totalAmount || 0
      return {
        staffId: s.staffId,
        name: member?.name || 'Staff Member',
        role: member?.role || 'cashier',
        ordersCount: count,
        totalSales: Math.round(volume * 100) / 100,
        averageTicket: count > 0 ? Math.round((volume / count) * 100) / 100 : 0
      }
    }).sort((a, b) => b.totalSales - a.totalSales)

    const totalRevenue = revenueAgg._sum.totalAmount || 0
    const netProfit = Math.max(0, Math.round((totalRevenue - wastageLoss) * 100) / 100)

    return NextResponse.json({
      timeRange,
      totalRevenue,
      subtotal: revenueAgg._sum.subtotal || 0,
      tax: revenueAgg._sum.tax || 0,
      discount: revenueAgg._sum.discount || 0,
      wastageLoss: Math.round(wastageLoss * 100) / 100,
      netProfit,
      totalOrders,
      completedOrders,
      cancelledOrders,
      paymentMethods,
      popularItems,
      staffPerformance
    })
  } catch (error) {
    console.error('Failed to compute analytics:', error)
    return NextResponse.json({ error: 'Failed to compute analytics' }, { status: 500 })
  }
}
