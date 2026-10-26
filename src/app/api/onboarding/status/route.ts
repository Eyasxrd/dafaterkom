import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest, getTenantById } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const tenant = await getTenantById(tenantId)

    const [
      menuCount,
      categoryCount,
      ingredientCount,
      tableCount,
      staffCount,
      orderCount,
      deviceCount,
      activeStaffWithCode
    ] = await Promise.all([
      prisma.menuItem.count({ where: { tenantId } }),
      prisma.category.count({ where: { tenantId } }),
      prisma.ingredient.count({ where: { tenantId } }),
      prisma.restaurantTable.count({ where: { tenantId, isActive: true } }),
      prisma.staff.count({ where: { tenantId } }),
      prisma.order.count({ where: { tenantId, paymentStatus: 'completed' } }),
      prisma.device.count({ where: { tenantId } }),
      prisma.staff.findFirst({
        where: { tenantId, joinCode: { not: null }, isActive: true },
        select: { id: true, name: true, role: true, joinCode: true }
      })
    ])

    const profileDone = Boolean(tenant && tenant.businessName && tenant.currency)
    const menuDone = menuCount > 0
    const taxDone = Boolean(tenant && (tenant.taxNumber || (tenant.taxRate !== undefined && tenant.taxRate > 0)))
    const diningDone = tableCount > 0
    const staffDone = staffCount > 0
    const stationDone = deviceCount > 0
    const firstSaleDone = orderCount > 0

    const items = [
      { key: 'profile', label: 'Shop Profile & Currency', done: profileDone },
      { key: 'operations', label: 'Operations & Dining Tables', done: diningDone },
      { key: 'menu', label: 'Menu Catalog & Recipes', done: menuDone },
      { key: 'tax', label: 'Fiscal & Tax Accounting', done: taxDone },
      { key: 'hardware', label: 'Receipts & Station Hardware', done: stationDone },
      { key: 'staff', label: 'Staff Join Code & Security', done: staffDone },
      { key: 'firstSale', label: 'First Live Sale', done: firstSaleDone }
    ]

    const doneCount = items.filter(i => i.done).length
    const progressPercent = Math.round((doneCount / items.length) * 100)

    return NextResponse.json({
      tenant,
      progressPercent,
      completedSteps: {
        profile: profileDone,
        operations: diningDone,
        menu: menuDone,
        tax: taxDone,
        hardware: stationDone,
        staff: staffDone,
        firstSale: firstSaleDone
      },
      counts: {
        menuItems: menuCount,
        categories: categoryCount,
        ingredients: ingredientCount,
        tables: tableCount,
        staff: staffCount,
        devices: deviceCount,
        orders: orderCount
      },
      staffJoinCode: activeStaffWithCode?.joinCode || null
    })
  } catch (error: any) {
    console.error('Failed to get onboarding status:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch status' }, { status: 500 })
  }
}
