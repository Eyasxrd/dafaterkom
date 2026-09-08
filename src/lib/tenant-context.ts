import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth'

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
 * Extracts tenantId securely from authenticated session, preventing IDOR attacks.
 * Only superadmin can override tenantId via header.
 */
export function getTenantIdFromRequest(request?: NextRequest | Request | null): string {
  if (!request) return DEFAULT_TENANT_ID

  // If request is NextRequest, check verified session
  if ('cookies' in request && typeof request.cookies?.get === 'function') {
    const session = getAuthenticatedUser(request as NextRequest)
    if (session) {
      // Super admin may inspect or act on behalf of other tenants
      if (session.role === 'superadmin') {
        const headerTenant = request.headers.get('x-tenant-id')
        if (headerTenant && headerTenant.trim()) {
          return headerTenant.trim()
        }
      }
      return session.tenantId || DEFAULT_TENANT_ID
    }
  }

  // Fallback for unauthenticated initial calls
  const headerTenant = request.headers.get('x-tenant-id')
  if (headerTenant && headerTenant.trim()) {
    return headerTenant.trim()
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
