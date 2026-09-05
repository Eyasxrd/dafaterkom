import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { logAuditEvent } from '@/lib/audit'
import { generateLicenseToken, PlanTier } from '@/lib/licensing/license-verifier'

export async function GET(request: NextRequest) {
  try {
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            devices: true,
            orders: true,
            staff: true
          }
        },
        licenses: {
          orderBy: { expiresAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(tenants)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch tenants' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId, action, days, plan, status } = body

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 })
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    let updatedTenant = tenant

    if (action === 'extend_trial') {
      const daysToAdd = parseInt(days) || 14
      const currentExpiry = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) : new Date()
      const newExpiry = new Date(currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000)

      updatedTenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          trialEndsAt: newExpiry,
          status: 'trial'
        }
      })
    } else if (action === 'update_status') {
      updatedTenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: { status }
      })
    } else if (action === 'issue_license') {
      const targetPlan = (plan || tenant.plan) as PlanTier
      const token = generateLicenseToken(tenantId, targetPlan, 365)
      await prisma.license.create({
        data: {
          tenantId,
          plan: targetPlan,
          signedToken: token,
          maxDevices: targetPlan === 'pro' ? 999 : targetPlan === 'growth' ? 5 : 1,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      })
      updatedTenant = await prisma.tenant.update({
        where: { id: tenantId },
        data: { plan: targetPlan, status: 'active' }
      })
    }

    await logAuditEvent({
      tenantId,
      action: 'license_update',
      entityType: 'super_admin_action',
      entityId: tenantId,
      notes: `Super-admin performed ${action}`
    })

    return NextResponse.json({ success: true, tenant: updatedTenant })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update tenant' }, { status: 500 })
  }
}
