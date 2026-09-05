import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const campaigns = await prisma.loyaltyCampaign.findMany({
      where: { tenantId },
      include: {
        _count: {
          select: { notificationLogs: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const recentLogs = await prisma.notificationLog.findMany({
      where: { campaign: { tenantId } },
      include: { customer: true, campaign: true },
      orderBy: { sentAt: 'desc' },
      take: 20
    })

    return NextResponse.json({ campaigns, recentLogs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch campaigns' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { name, triggerType, rewardDescription, pointsCost, discountPercent, cooldownHours } = body

    const campaign = await prisma.loyaltyCampaign.create({
      data: {
        tenantId,
        name,
        triggerType: triggerType || 'proximity',
        rewardDescription,
        pointsCost: parseInt(pointsCost) || 0,
        discountPercent: parseFloat(discountPercent) || 15,
        cooldownHours: parseInt(cooldownHours) || 12,
        isActive: true
      }
    })

    await logAuditEvent({
      tenantId,
      action: 'staff_update',
      entityType: 'campaign',
      entityId: campaign.id,
      notes: `Created loyalty campaign: ${name}`
    })

    return NextResponse.json(campaign)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create campaign' }, { status: 500 })
  }
}
