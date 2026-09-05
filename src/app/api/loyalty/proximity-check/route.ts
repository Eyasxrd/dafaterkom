import { NextRequest, NextResponse } from 'next/server'
import { evaluateProximityTrigger } from '@/lib/notifications/proximity-engine'
import { DEFAULT_TENANT_ID } from '@/lib/tenant-context'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId = DEFAULT_TENANT_ID, customerId, latitude, longitude } = body

    if (!customerId || latitude == null || longitude == null) {
      return NextResponse.json({ error: 'Missing customerId or coordinates' }, { status: 400 })
    }

    const result = await evaluateProximityTrigger({
      tenantId,
      customerId,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Proximity evaluation error:', error)
    return NextResponse.json({ error: error.message || 'Evaluation failed' }, { status: 500 })
  }
}
