import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export const DEFAULT_TENANT_ID = 'default-shop'

export interface TenantInfo {
  id: string
  businessName: string
  slug: string
  plan: string
  status: string
  currency: string
  taxRate: number
  taxNumber?: string | null
  receiptHeader?: string | null
  receiptFooter?: string | null
  geofenceLat?: number | null
  geofenceLng?: number | null
  geofenceRadius: number
  trialEndsAt?: Date | null
}

/**
 * Extracts tenantId from request header, query, or defaults to DEFAULT_TENANT_ID.
 */
export function getTenantIdFromRequest(request?: NextRequest | Request | null): string {
  if (!request) return DEFAULT_TENANT_ID

  // 1. Check custom header x-tenant-id
  const headerTenant = request.headers.get('x-tenant-id')
  if (headerTenant && headerTenant.trim()) {
    return headerTenant.trim()
  }

  // 2. Check query parameter ?tenantId=
  if ('nextUrl' in request && request.nextUrl) {
    const queryTenant = request.nextUrl.searchParams.get('tenantId')
    if (queryTenant && queryTenant.trim()) {
      return queryTenant.trim()
    }
  } else if ('url' in request && typeof request.url === 'string') {
    try {
      const url = new URL(request.url)
      const queryTenant = url.searchParams.get('tenantId')
      if (queryTenant && queryTenant.trim()) {
        return queryTenant.trim()
      }
    } catch {
      // Ignore URL parse failure
    }
  }

  return DEFAULT_TENANT_ID
}

/**
 * Retrieves full tenant info by id, falling back to default-shop or creating it if missing.
 */
export async function getTenantById(tenantId: string = DEFAULT_TENANT_ID): Promise<TenantInfo> {
  let tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  })

  if (!tenant && tenantId === DEFAULT_TENANT_ID) {
    tenant = await prisma.tenant.create({
      data: {
        id: DEFAULT_TENANT_ID,
        businessName: 'Dafaterkom Café & Bakery',
        slug: 'dafaterkom-cafe',
        plan: 'growth',
        status: 'active',
        currency: 'USD',
        taxRate: 15.0,
        taxNumber: 'TAX-987654321',
        geofenceLat: 40.7128,
        geofenceLng: -74.0060,
        geofenceRadius: 250,
      }
    })
  }

  if (!tenant) {
    throw new Error(`Tenant with ID ${tenantId} not found`)
  }

  return tenant
}
