import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generatePkPass } from '@/lib/apple-wallet/pass-generator'
import { getTenantIdFromRequest, getTenantById } from '@/lib/tenant-context'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await params
    const tenantId = getTenantIdFromRequest(request)

    // 1. Fetch customer details
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // 2. Fetch tenant details
    const tenant = await getTenantById(tenantId || customer.tenantId)
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // 3. Generate .pkpass ZIP bundle
    const passBuffer = await generatePkPass({
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        loyaltyPoints: customer.loyaltyPoints,
        createdAt: customer.createdAt
      },
      tenant: {
        id: tenant.id,
        businessName: tenant.businessName,
        geofenceLat: tenant.geofenceLat,
        geofenceLng: tenant.geofenceLng,
        geofenceRadius: tenant.geofenceRadius,
        receiptHeader: tenant.receiptHeader,
        receiptFooter: tenant.receiptFooter
      }
    })

    const safeFilename = `${customer.name.replace(/[^a-zA-Z0-9]/g, '_')}_loyalty.pkpass`

    // 4. Return Apple Wallet pass with native MIME type
    // Convert Buffer to Uint8Array for Next.js Response body
    const uint8Array = new Uint8Array(passBuffer)

    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': passBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('Failed to generate Apple Wallet pass:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate Apple Wallet pass' },
      { status: 500 }
    )
  }
}
