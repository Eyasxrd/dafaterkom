import { NextRequest, NextResponse } from 'next/server'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { syncAllHistoricalTransactions } from '@/lib/accounting'

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const result = await syncAllHistoricalTransactions(tenantId)
    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${result.totalSynced} historical operations into Double-Entry Journal Entries.`,
      ...result
    })
  } catch (error: any) {
    console.error('Failed to sync transactions:', error)
    return NextResponse.json({ error: error.message || 'Failed to sync transactions' }, { status: 500 })
  }
}
