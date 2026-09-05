import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest, getTenantById } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const tenant = await getTenantById(tenantId)

    const [menuCount, staffCount, orderCount, activeStaffWithCode] = await Promise.all([
      prisma.menuItem.count({ where: { tenantId } }),
      prisma.staff.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId, paymentStatus: 'completed' } }),
      prisma.staff.findFirst({
        where: { tenantId, joinCode: { not: null }, isActive: true },
        select: { id: true, name: true, role: true, joinCode: true }
      })
    ])

    const profileDone = Boolean(tenant && tenant.businessName && tenant.currency)
    const menuDone = menuCount > 0
    const taxDone = Boolean(tenant && (tenant.taxNumber || (tenant.taxRate !== undefined && tenant.taxRate > 0)))
    const staffDone = staffCount > 0
    const firstSaleDone = orderCount > 0

    const items = [
      { key: 'profile', label: 'Shop Profile & Currency', done: profileDone },
      { key: 'menu', label: 'Menu Items & Catalog', done: menuDone },
      { key: 'tax', label: 'Tax Rate & Receipt Preview', done: taxDone },
      { key: 'staff', label: 'Staff Account & Join Code', done: staffDone },
      { key: 'firstSale', label: 'First Practice Sale', done: firstSaleDone }
    ]

    const doneCount = items.filter(i => i.done).length
    const progressPercent = Math.round((doneCount / items.length) * 100)

    return NextResponse.json({
      tenant,
      progressPercent,
      completedSteps: {
        profile: profileDone,
        menu: menuDone,
        tax: taxDone,
        staff: staffDone,
        firstSale: firstSaleDone
      },
      counts: {
        menuItems: menuCount,
        staff: staffCount,
        orders: orderCount
      },
      staffJoinCode: activeStaffWithCode?.joinCode || null
    })
  } catch (error: any) {
    console.error('Failed to get onboarding status:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch status' }, { status: 500 })
  }
}
