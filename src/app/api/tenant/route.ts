import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest, getTenantById, DEFAULT_TENANT_ID } from '@/lib/tenant-context'
import { logAuditEvent } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const tenant = await getTenantById(tenantId)
    return NextResponse.json(tenant)
  } catch (error: any) {
    console.error('Error fetching tenant:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch tenant' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()

    const oldTenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

    const updated = await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {
        businessName: body.businessName !== undefined ? body.businessName : undefined,
        currency: body.currency !== undefined ? body.currency : undefined,
        taxRate: body.taxRate !== undefined ? parseFloat(body.taxRate) : undefined,
        taxNumber: body.taxNumber !== undefined ? body.taxNumber : undefined,
        receiptHeader: body.receiptHeader !== undefined ? body.receiptHeader : undefined,
        receiptFooter: body.receiptFooter !== undefined ? body.receiptFooter : undefined,
        geofenceLat: body.geofenceLat !== undefined ? parseFloat(body.geofenceLat) : undefined,
        geofenceLng: body.geofenceLng !== undefined ? parseFloat(body.geofenceLng) : undefined,
        geofenceRadius: body.geofenceRadius !== undefined ? parseFloat(body.geofenceRadius) : undefined,
        plan: body.plan !== undefined ? body.plan : undefined,
        status: body.status !== undefined ? body.status : undefined,
      },
      create: {
        id: tenantId,
        slug: tenantId === DEFAULT_TENANT_ID ? 'default-shop' : `shop-${tenantId.slice(0, 8)}`,
        businessName: body.businessName || 'Dafaterkom Café & Specialty Roasters',
        currency: body.currency || 'USD',
        taxRate: body.taxRate !== undefined ? parseFloat(body.taxRate) : 15.0,
        taxNumber: body.taxNumber || 'VAT-12345678',
        receiptHeader: body.receiptHeader || 'Welcome to Dafaterkom Café',
        receiptFooter: body.receiptFooter || 'Thank you for your visit!',
        geofenceLat: body.geofenceLat !== undefined ? parseFloat(body.geofenceLat) : 40.7128,
        geofenceLng: body.geofenceLng !== undefined ? parseFloat(body.geofenceLng) : -74.006,
        geofenceRadius: body.geofenceRadius !== undefined ? parseFloat(body.geofenceRadius) : 200,
        plan: body.plan || 'growth',
        status: body.status || 'active'
      }
    })

    // If a staff join code was provided during setup, associate it with an active staff member
    if (body.staffJoinCode && String(body.staffJoinCode).trim()) {
      const code = String(body.staffJoinCode).trim()
      const existingStaff = await prisma.staff.findFirst({
        where: { tenantId, role: { in: ['cashier', 'admin', 'manager'] } }
      })
      if (existingStaff) {
        await prisma.staff.update({
          where: { id: existingStaff.id },
          data: { joinCode: code }
        })
      } else {
        const hashedPassword = await bcrypt.hash('cashier123', 10)
        await prisma.staff.create({
          data: {
            tenantId,
            name: 'Counter Cashier',
            email: `cashier-${Date.now()}@dafaterkom.local`,
            password: hashedPassword,
            role: 'cashier',
            joinCode: code
          }
        })
      }
    }

    // If device role is configured, register or update device
    if (body.deviceRole) {
      const roleStr = String(body.deviceRole).toLowerCase()
      const existingDevice = await prisma.device.findFirst({
        where: { tenantId }
      })
      if (existingDevice) {
        await prisma.device.update({
          where: { id: existingDevice.id },
          data: { role: roleStr, lastSyncedAt: new Date() }
        })
      } else {
        await prisma.device.create({
          data: {
            tenantId,
            name: `${roleStr.toUpperCase()} Station 1`,
            role: roleStr,
            pairedAt: new Date(),
            lastSyncedAt: new Date()
          }
        })
      }
    }

    await logAuditEvent({
      tenantId,
      action: 'staff_update',
      entityType: 'tenant',
      entityId: tenantId,
      beforeValue: oldTenant,
      afterValue: updated,
      notes: 'Tenant profile, tax configuration, and station setup updated'
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Error updating tenant:', error)
    return NextResponse.json({ error: error.message || 'Failed to update tenant' }, { status: 500 })
  }
}
