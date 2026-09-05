import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const devices = await prisma.device.findMany({
      where: { tenantId },
      orderBy: { lastSyncedAt: 'desc' }
    })
    return NextResponse.json(devices)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch devices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { name, role, pairingCode, appVersion } = body

    // Check device limit according to license/plan
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: { licenses: { orderBy: { expiresAt: 'desc' }, take: 1 } }
    })

    const activeLicense = tenant?.licenses[0]
    const maxDevices = activeLicense?.maxDevices || (tenant?.plan === 'pro' ? 999 : tenant?.plan === 'growth' ? 5 : 1)

    const currentDeviceCount = await prisma.device.count({ where: { tenantId } })
    if (currentDeviceCount >= maxDevices) {
      return NextResponse.json({
        error: `Device limit reached (${currentDeviceCount}/${maxDevices}). Please upgrade your plan to connect more devices.`
      }, { status: 403 })
    }

    const device = await prisma.device.create({
      data: {
        tenantId,
        name: name || `Device ${currentDeviceCount + 1}`,
        role: role || 'terminal',
        pairingCode: pairingCode || Math.floor(100000 + Math.random() * 900000).toString(),
        pairedAt: new Date(),
        lastSyncedAt: new Date(),
        appVersion: appVersion || '1.0.0'
      }
    })

    return NextResponse.json(device)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to pair device' }, { status: 500 })
  }
}
