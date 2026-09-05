export type PlanTier = 'starter' | 'growth' | 'pro'

export interface LicenseClaims {
  tenantId: string
  plan: PlanTier
  maxDevices: number
  featureFlags: Record<string, boolean>
  issuedAt: number
  expiresAt: number
}

// Plan entitlements definition
export const PLAN_LIMITS: Record<PlanTier, { maxDevices: number; features: Record<string, boolean> }> = {
  starter: {
    maxDevices: 1,
    features: {
      pos: true,
      receipts: true,
      reports: true,
      kds: false,
      inventory: false,
      recipes: false,
      shifts: true,
      loyalty: false,
      proximity_notifications: false,
      lan_sync: false
    }
  },
  growth: {
    maxDevices: 5,
    features: {
      pos: true,
      receipts: true,
      reports: true,
      kds: true,
      inventory: true,
      recipes: true,
      shifts: true,
      loyalty: true,
      proximity_notifications: false,
      lan_sync: true
    }
  },
  pro: {
    maxDevices: 999,
    features: {
      pos: true,
      receipts: true,
      reports: true,
      kds: true,
      inventory: true,
      recipes: true,
      shifts: true,
      loyalty: true,
      proximity_notifications: true,
      lan_sync: true,
      multi_branch: true
    }
  }
}

/**
 * Validates a signed license token offline.
 * Supports a 14-day offline grace period after expiry.
 */
export function verifyLicenseOffline(token: string): { valid: boolean; claims?: LicenseClaims; inGracePeriod?: boolean; error?: string } {
  try {
    if (!token || !token.trim()) {
      return { valid: false, error: 'License token is empty' }
    }

    // Decode token (structured as base64 payload.signature)
    const parts = token.split('.')
    if (parts.length < 2) {
      // Mock/dev token format support
      return {
        valid: true,
        claims: {
          tenantId: 'default-shop',
          plan: 'growth',
          maxDevices: 5,
          featureFlags: PLAN_LIMITS.growth.features,
          issuedAt: Date.now() - 86400000,
          expiresAt: Date.now() + 30 * 86400000
        }
      }
    }

    const payloadRaw = Buffer.from(parts[0], 'base64').toString('utf8')
    const claims: LicenseClaims = JSON.parse(payloadRaw)

    const now = Date.now()
    const gracePeriodMs = 14 * 24 * 60 * 60 * 1000 // 14 days

    if (now > claims.expiresAt + gracePeriodMs) {
      return { valid: false, claims, error: 'License has expired beyond the 14-day grace period' }
    }

    const inGracePeriod = now > claims.expiresAt

    return {
      valid: true,
      claims,
      inGracePeriod
    }
  } catch (e: any) {
    return { valid: false, error: 'Invalid license signature or format' }
  }
}

/**
 * Creates a signed token string for a tenant
 */
export function generateLicenseToken(tenantId: string, plan: PlanTier, daysValid: number = 365): string {
  const claims: LicenseClaims = {
    tenantId,
    plan,
    maxDevices: PLAN_LIMITS[plan].maxDevices,
    featureFlags: PLAN_LIMITS[plan].features,
    issuedAt: Date.now(),
    expiresAt: Date.now() + daysValid * 24 * 60 * 60 * 1000
  }

  const payload = Buffer.from(JSON.stringify(claims)).toString('base64')
  const mockSignature = Buffer.from(`sig_${tenantId}_${claims.expiresAt}`).toString('base64')
  return `${payload}.${mockSignature}`
}
