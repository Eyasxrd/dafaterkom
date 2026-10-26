import { NextRequest, NextResponse } from 'next/server'
import { getTenantIdFromRequest, getTenantById } from '@/lib/tenant-context'
import { getAccountStatement } from '@/lib/accounting'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'all'
    const customStartParam = searchParams.get('startDate')
    const customEndParam = searchParams.get('endDate')
    const search = searchParams.get('search') || undefined
    const referenceType = searchParams.get('referenceType') || undefined
    const sortOrderParam = searchParams.get('sortOrder')
    const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc'

    const customStart = customStartParam ? new Date(customStartParam) : undefined
    const customEnd = customEndParam ? new Date(customEndParam) : undefined

    const tenantInfo = await getTenantById(tenantId)
    const statement = await getAccountStatement(tenantId, id, {
      timeRange,
      startDate: customStart,
      endDate: customEnd,
      search,
      referenceType,
      sortOrder
    })

    return NextResponse.json({
      tenant: {
        businessName: tenantInfo.businessName,
        currency: tenantInfo.currency || 'USD',
        taxNumber: tenantInfo.taxNumber || '',
        taxRate: tenantInfo.taxRate || 15.0
      },
      ...statement
    })
  } catch (error: any) {
    console.error('Failed to generate account statement:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate account statement' }, { status: 500 })
  }
}
