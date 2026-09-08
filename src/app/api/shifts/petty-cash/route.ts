import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const shiftId = searchParams.get('shiftId')

    if (!shiftId) {
      return NextResponse.json({ error: 'shiftId parameter is required' }, { status: 400 })
    }

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityType: 'shift',
        entityId: shiftId,
        action: { in: ['cash_in', 'cash_out'] }
      },
      orderBy: { timestamp: 'desc' }
    })

    const items = logs.map((log) => {
      let details: any = {}
      try {
        details = log.afterValue ? JSON.parse(log.afterValue) : {}
      } catch {}

      return {
        id: log.id,
        shiftId: log.entityId,
        type: log.action as 'cash_in' | 'cash_out',
        amount: details.amount ?? 0,
        reason: details.reason || log.notes || '',
        timestamp: log.timestamp
      }
    })

    return NextResponse.json({ success: true, items })
  } catch (error) {
    console.error('Failed to fetch petty cash movements:', error)
    return NextResponse.json({ error: 'Failed to fetch petty cash movements' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { shiftId, staffId, type, amount, reason } = body

    if (!shiftId) {
      return NextResponse.json({ error: 'shiftId is required' }, { status: 400 })
    }

    if (type !== 'cash_in' && type !== 'cash_out') {
      return NextResponse.json({ error: 'type must be either "cash_in" or "cash_out"' }, { status: 400 })
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'A valid positive amount is required' }, { status: 400 })
    }

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'A reason or description is required for petty cash movements' }, { status: 400 })
    }

    const shift = await prisma.shift.findFirst({
      where: { id: shiftId, tenantId }
    })

    if (!shift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    if (shift.status !== 'active') {
      return NextResponse.json({ error: 'Cannot record cash in/out on an ended or inactive shift' }, { status: 400 })
    }

    const log = await prisma.auditLog.create({
      data: {
        tenantId,
        staffId: staffId || shift.staffId,
        action: type,
        entityType: 'shift',
        entityId: shift.id,
        afterValue: JSON.stringify({
          amount: parsedAmount,
          reason: reason.trim(),
          type,
          recordedAt: new Date().toISOString()
        }),
        notes: `[Petty Cash ${type === 'cash_in' ? 'IN (+)' : 'OUT (-)'}] $${parsedAmount.toFixed(2)} - ${reason.trim()}`
      }
    })

    return NextResponse.json({
      success: true,
      log: {
        id: log.id,
        shiftId: shift.id,
        type,
        amount: parsedAmount,
        reason: reason.trim(),
        timestamp: log.timestamp
      }
    })
  } catch (error) {
    console.error('Failed to log petty cash movement:', error)
    return NextResponse.json({ error: 'Failed to record petty cash movement' }, { status: 500 })
  }
}
