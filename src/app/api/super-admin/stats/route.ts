import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const totalTenants = await prisma.tenant.count()
    const activeTenants = await prisma.tenant.count({ where: { status: 'active' } })
    const trialTenants = await prisma.tenant.count({ where: { status: 'trial' } })
    const totalOrders = await prisma.order.count()
    const totalDevices = await prisma.device.count()
    const totalSyncEvents = await prisma.syncEvent.count()

    const tenants = await prisma.tenant.findMany({ select: { plan: true, status: true } })

    // Compute MRR estimate
    const planPrices: Record<string, number> = { starter: 29, growth: 79, pro: 199 }
    const mrr = tenants
      .filter(t => t.status === 'active')
      .reduce((sum, t) => sum + (planPrices[t.plan] || 0), 0)

    const arr = mrr * 12

    return NextResponse.json({
      totalTenants,
      activeTenants,
      trialTenants,
      totalOrders,
      totalDevices,
      totalSyncEvents,
      mrr,
      arr,
      planDistribution: {
        starter: tenants.filter(t => t.plan === 'starter').length,
        growth: tenants.filter(t => t.plan === 'growth').length,
        pro: tenants.filter(t => t.plan === 'pro').length
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch SaaS stats' }, { status: 500 })
  }
}
