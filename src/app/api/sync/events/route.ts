import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since')

    const events = await prisma.syncEvent.findMany({
      where: {
        tenantId,
        ...(since ? { appliedAt: { gt: new Date(since) } } : {})
      },
      orderBy: { appliedAt: 'asc' },
      take: 100
    })

    return NextResponse.json(events)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch sync events' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { deviceId, entityType, entityId, action, payload } = body

    const event = await prisma.syncEvent.create({
      data: {
        tenantId,
        deviceId: deviceId || 'unknown-device',
        entityType: entityType || 'generic',
        entityId: entityId || 'gen-' + Date.now(),
        action: action || 'update',
        payload: typeof payload === 'string' ? payload : JSON.stringify(payload || {})
      }
    })

    return NextResponse.json({ success: true, event })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record sync event' }, { status: 500 })
  }
}
