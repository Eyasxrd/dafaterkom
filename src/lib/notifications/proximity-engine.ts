import { prisma } from '@/lib/db'

export interface GeofenceCheckParams {
  tenantId: string
  customerId: string
  latitude: number
  longitude: number
}

export interface ProximityNotificationResult {
  triggered: boolean
  reason?: string
  campaign?: any
  message?: string
}

/**
 * Calculates haversine distance between two coordinates in meters
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Evaluates proximity rules and delivers personalized notification if eligible
 */
export async function evaluateProximityTrigger(
  params: GeofenceCheckParams
): Promise<ProximityNotificationResult> {
  const { tenantId, customerId, latitude, longitude } = params

  // 1. Fetch tenant and its geofence config
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId }
  })

  if (!tenant || tenant.geofenceLat == null || tenant.geofenceLng == null) {
    return { triggered: false, reason: 'Tenant geofence is not configured' }
  }

  // 2. Check distance to cafe
  const distance = calculateDistanceMeters(
    latitude,
    longitude,
    tenant.geofenceLat,
    tenant.geofenceLng
  )

  const radius = tenant.geofenceRadius || 250
  if (distance > radius) {
    return {
      triggered: false,
      reason: `Customer is outside geofence (${Math.round(distance)}m > ${radius}m)`
    }
  }

  // 3. Fetch customer details
  const customer = await prisma.customer.findUnique({
    where: { id: customerId }
  })

  if (!customer) {
    return { triggered: false, reason: 'Customer not found' }
  }

  // 4. Fetch active proximity campaign
  const campaign = await prisma.loyaltyCampaign.findFirst({
    where: {
      tenantId,
      triggerType: 'proximity',
      isActive: true
    },
    orderBy: { createdAt: 'desc' }
  })

  if (!campaign) {
    return { triggered: false, reason: 'No active proximity campaign found' }
  }

  // 5. Cooldown check: Has this customer received a notification within campaign cooldown?
  const cooldownPeriodMs = (campaign.cooldownHours || 12) * 60 * 60 * 1000
  const recentNotif = await prisma.notificationLog.findFirst({
    where: {
      customerId,
      campaignId: campaign.id,
      sentAt: { gte: new Date(Date.now() - cooldownPeriodMs) }
    }
  })

  if (recentNotif) {
    return {
      triggered: false,
      reason: `Notification in cooldown period (${campaign.cooldownHours}h)`
    }
  }

  // 6. Check quiet hours
  const currentHour = new Date().getHours()
  if (currentHour >= 21 || currentHour < 8) {
    return { triggered: false, reason: 'Quiet hours active (9 PM - 8 AM)' }
  }

  // 7. Compose personalized push notification message
  const personalizedMessage = `Hey ${customer.name}! ☕ You're near ${tenant.businessName}. You have ${customer.loyaltyPoints} points! Come in for ${campaign.rewardDescription}`

  // 8. Log notification
  await prisma.notificationLog.create({
    data: {
      campaignId: campaign.id,
      customerId,
      channel: 'push',
      message: personalizedMessage,
      sentAt: new Date()
    }
  })

  return {
    triggered: true,
    campaign,
    message: personalizedMessage
  }
}
