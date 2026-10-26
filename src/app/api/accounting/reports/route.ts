import { NextRequest, NextResponse } from 'next/server'
import { getTenantIdFromRequest, getTenantById } from '@/lib/tenant-context'
import { getFinancialStatements } from '@/lib/accounting'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'month'
    const customStartParam = searchParams.get('startDate')
    const customEndParam = searchParams.get('endDate')

    const customStart = customStartParam ? new Date(customStartParam) : undefined
    const customEnd = customEndParam ? new Date(customEndParam) : undefined

    const tenantInfo = await getTenantById(tenantId)
    const statements = await getFinancialStatements(tenantId, timeRange, customStart, customEnd)

    return NextResponse.json({
      tenant: {
        businessName: tenantInfo.businessName,
        currency: tenantInfo.currency || 'USD',
        taxNumber: tenantInfo.taxNumber || '',
        taxRate: tenantInfo.taxRate || 15.0
      },
      ...statements
    })
  } catch (error: any) {
    console.error('Failed to generate financial reports:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate financial reports' }, { status: 500 })
  }
}
