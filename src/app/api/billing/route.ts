import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const records = await prisma.billingRecord.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    })
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })
    return NextResponse.json({ tenant, records })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch billing records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { newPlan } = body

    const validPlans = ['starter', 'growth', 'pro']
    if (!validPlans.includes(newPlan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const priceMap: Record<string, number> = { starter: 29, growth: 79, pro: 199 }
    const amount = priceMap[newPlan] || 79

    // Update tenant plan
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { plan: newPlan, status: 'active' }
    })

    // Create billing invoice record
    const invoice = await prisma.billingRecord.create({
      data: {
        tenantId,
        amount,
        currency: 'USD',
        status: 'paid',
        periodStart: new Date(),
        periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        paymentProvider: 'Stripe Gateway'
      }
    })

    await logAuditEvent({
      tenantId,
      action: 'plan_change',
      entityType: 'tenant',
      entityId: tenantId,
      afterValue: { plan: newPlan, invoiceId: invoice.id },
      notes: `Plan upgraded to ${newPlan}`
    })

    return NextResponse.json({ success: true, tenant: updatedTenant, invoice })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update subscription' }, { status: 500 })
  }
}
