import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    const targetDate = dateParam ? new Date(dateParam) : new Date()
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999)

    // 1. Fetch Tenant details for receipt header
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        businessName: true,
        taxNumber: true,
        taxRate: true,
        receiptHeader: true,
        receiptFooter: true
      }
    })

    // 2. Fetch Orders for the day
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        staff: {
          select: { id: true, name: true }
        }
      }
    })

    const completedOrders = orders.filter(o => o.orderStatus === 'completed')
    const refundedOrders = orders.filter(o => o.orderStatus === 'refunded')
    const cancelledOrders = orders.filter(o => o.orderStatus === 'cancelled')
    const activeOrders = orders.filter(o => o.orderStatus !== 'cancelled' && o.orderStatus !== 'refunded')

    // Revenue aggregations
    let grossSales = 0
    let totalDiscount = 0
    let totalTax = 0
    let netSales = 0

    let cashTotal = 0
    let cardTotal = 0
    let mobileTotal = 0
    let splitTotal = 0

    orders.forEach(o => {
      if (o.orderStatus !== 'cancelled') {
        grossSales += (o.subtotal || 0)
        totalDiscount += (o.discount || 0)
        totalTax += (o.tax || 0)
        netSales += o.totalAmount

        if (o.orderStatus !== 'refunded') {
          if (o.paymentMethod === 'cash') cashTotal += o.totalAmount
          else if (o.paymentMethod === 'card') cardTotal += o.totalAmount
          else if (o.paymentMethod === 'mobile') mobileTotal += o.totalAmount
          else splitTotal += o.totalAmount
        }
      }
    })

    // Total refunded amount
    const totalRefundedAmount = refundedOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    // 3. Spoilage / Food Wastage for the day
    const wasteLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        action: 'inventory_waste',
        timestamp: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    })

    let totalWastageLoss = 0
    wasteLogs.forEach(w => {
      if (w.afterValue) {
        try {
          const parsed = JSON.parse(w.afterValue)
          if (parsed.financialLoss) totalWastageLoss += parsed.financialLoss
        } catch {}
      }
    })

    // 4. Shifts and cash float for the day
    const shifts = await prisma.shift.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: {
        staff: {
          select: { name: true }
        }
      }
    })

    const openingFloat = shifts.reduce((sum, s) => sum + s.startCash, 0)
    const expectedDrawerCash = openingFloat + cashTotal - totalRefundedAmount

    const dateStr = targetDate.toISOString().slice(0, 10).replace(/-/g, '')
    const zReportNumber = `Z-${dateStr}-${orders.length.toString().padStart(3, '0')}`

    return NextResponse.json({
      zReportNumber,
      generatedAt: new Date().toISOString(),
      reportDate: targetDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      tenant: {
        businessName: tenant?.businessName || 'Dafaterkom Café',
        taxNumber: tenant?.taxNumber || '300123456700003',
        taxRate: tenant?.taxRate ?? 15
      },
      summary: {
        totalOrdersCount: orders.length,
        completedCount: completedOrders.length,
        refundedCount: refundedOrders.length,
        cancelledCount: cancelledOrders.length,
        grossSales: Math.round(grossSales * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        netSales: Math.round(netSales * 100) / 100,
        totalRefundedAmount: Math.round(totalRefundedAmount * 100) / 100,
        totalWastageLoss: Math.round(totalWastageLoss * 100) / 100,
        netOperatingRevenue: Math.round((netSales - totalRefundedAmount - totalWastageLoss) * 100) / 100
      },
      tenders: {
        cash: Math.round(cashTotal * 100) / 100,
        card: Math.round(cardTotal * 100) / 100,
        mobile: Math.round(mobileTotal * 100) / 100,
        split: Math.round(splitTotal * 100) / 100
      },
      drawerReconciliation: {
        openingFloat: Math.round(openingFloat * 100) / 100,
        cashSales: Math.round(cashTotal * 100) / 100,
        refundsPaid: Math.round(totalRefundedAmount * 100) / 100,
        expectedDrawerCash: Math.round(expectedDrawerCash * 100) / 100,
        shiftCount: shifts.length
      },
      shifts: shifts.map(s => ({
        id: s.id,
        staffName: s.staff.name,
        status: s.status,
        startCash: s.startCash,
        endCash: s.endCash,
        startTime: s.startTime,
        endTime: s.endTime
      }))
    })
  } catch (error) {
    console.error('Failed to generate Z-Report:', error)
    return NextResponse.json({ error: 'Failed to generate Z-Report' }, { status: 500 })
  }
}
