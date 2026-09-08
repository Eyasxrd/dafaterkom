import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000)

    const logs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        action: 'table_service_request',
        timestamp: { gte: fourHoursAgo }
      },
      orderBy: { timestamp: 'desc' }
    })

    const requests = logs
      .map(log => {
        try {
          const data = log.afterValue ? JSON.parse(log.afterValue) : {}
          return {
            id: log.id,
            tableNumber: parseInt(log.entityId || '0') || data.tableNumber,
            type: data.type || 'call_waiter', // 'call_waiter' | 'request_bill'
            status: log.notes === 'resolved' ? 'resolved' : 'pending',
            createdAt: log.timestamp.toISOString(),
            notes: data.notes || ''
          }
        } catch {
          return null
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null && r.status === 'pending')

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Failed to fetch table service requests:', error)
    return NextResponse.json({ error: 'Failed to fetch table service requests' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { tableNumber, type = 'call_waiter', notes = '' } = body

    if (!tableNumber) {
      return NextResponse.json({ error: 'Table number is required' }, { status: 400 })
    }

    const tableNum = parseInt(tableNumber)

    // Check if there is already an active pending request for this table and type in the last 2 minutes
    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000)
    const existing = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        action: 'table_service_request',
        entityId: String(tableNum),
        timestamp: { gte: twoMinsAgo },
        notes: { not: 'resolved' }
      }
    })

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Staff has already been notified and is on the way!',
        id: existing.id
      })
    }

    const record = await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'table_service_request',
        entityType: 'RestaurantTable',
        entityId: String(tableNum),
        notes: 'pending',
        afterValue: JSON.stringify({
          tableNumber: tableNum,
          type,
          notes,
          status: 'pending'
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: type === 'call_waiter' ? 'Staff notified to attend Table' : 'Bill request sent to counter',
      id: record.id
    })
  } catch (error) {
    console.error('Failed to submit service request:', error)
    return NextResponse.json({ error: 'Failed to submit service request' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { id, tableNumber } = body

    if (id) {
      await prisma.auditLog.update({
        where: { id },
        data: { notes: 'resolved' }
      })
    } else if (tableNumber) {
      await prisma.auditLog.updateMany({
        where: {
          tenantId,
          action: 'table_service_request',
          entityId: String(tableNumber),
          notes: 'pending'
        },
        data: { notes: 'resolved' }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to resolve service request:', error)
    return NextResponse.json({ error: 'Failed to resolve service request' }, { status: 500 })
  }
}
