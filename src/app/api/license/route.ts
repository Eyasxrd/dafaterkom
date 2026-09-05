import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { generateLicenseToken, verifyLicenseOffline, PlanTier } from '@/lib/licensing/license-verifier'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const license = await prisma.license.findFirst({
      where: { tenantId },
      orderBy: { expiresAt: 'desc' }
    })

    const deviceCount = await prisma.device.count({ where: { tenantId } })

    return NextResponse.json({
      license,
      deviceCount,
      verification: license ? verifyLicenseOffline(license.signedToken) : null
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch license' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { plan = 'growth', daysValid = 365 } = body

    const signedToken = generateLicenseToken(tenantId, plan as PlanTier, daysValid)

    const license = await prisma.license.create({
      data: {
        tenantId,
        plan,
        signedToken,
        maxDevices: plan === 'pro' ? 999 : plan === 'growth' ? 5 : 1,
        expiresAt: new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000)
      }
    })

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { plan, status: 'active' }
    })

    await logAuditEvent({
      tenantId,
      action: 'license_update',
      entityType: 'license',
      entityId: license.id,
      notes: `License generated for plan ${plan}`
    })

    return NextResponse.json({ success: true, license })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to issue license' }, { status: 500 })
  }
}
