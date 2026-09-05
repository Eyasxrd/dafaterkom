import { NextRequest, NextResponse } from 'next/server'
import { getTenantIdFromRequest, getTenantById } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const tenant = await getTenantById(tenantId)

    const hasCertificates = Boolean(
      process.env.APPLE_PASS_CERT && process.env.APPLE_PASS_KEY
    )

    const config = {
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER || 'pass.com.dafaterkom.loyalty',
      teamIdentifier: process.env.APPLE_TEAM_IDENTIFIER || '9JA6Z4KBBY',
      organizationName: tenant?.businessName || 'Dafaterkom Café',
      backgroundColor: 'rgb(16, 185, 129)', // Emerald-500
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(209, 250, 229)',
      relevantText: `Welcome to ${tenant?.businessName || 'Dafaterkom Café'}! Scan your loyalty pass to earn points.`,
      hasCertificates,
      geofenceConfigured: Boolean(tenant?.geofenceLat && tenant?.geofenceLng),
      coordinates: {
        lat: tenant?.geofenceLat || null,
        lng: tenant?.geofenceLng || null,
        radius: tenant?.geofenceRadius || 200
      }
    }

    return NextResponse.json(config)
  } catch (error: any) {
    console.error('Failed to get Apple Wallet config:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch config' }, { status: 500 })
  }
}
