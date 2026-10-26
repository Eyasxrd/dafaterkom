import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await params
    const body = await request.json()
    const { clockOutTime, clockInTime, notes, status } = body

    const existing = await prisma.attendanceRecord.findFirst({
      where: { id, tenantId },
      include: { staff: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Attendance record not found' }, { status: 404 })
    }

    const clockIn = clockInTime ? new Date(clockInTime) : new Date(existing.clockIn)
    const clockOut = clockOutTime ? new Date(clockOutTime) : new Date()

    if (clockOut < clockIn) {
      return NextResponse.json({ error: 'Clock out time cannot be earlier than clock in time' }, { status: 400 })
    }

    // Calculate duration in hours
    const diffMs = clockOut.getTime() - clockIn.getTime()
    const totalHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100

    const standardHours = existing.staff.standardDailyHours || 8.0
    const regularHours = Math.min(totalHours, standardHours)
    const overtimeHours = Math.round(Math.max(0, totalHours - standardHours) * 100) / 100

    const updated = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        clockIn,
        clockOut,
        totalHours,
        regularHours,
        overtimeHours,
        status: status || 'completed',
        notes: notes !== undefined ? notes : existing.notes
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            jobTitle: true,
            standardDailyHours: true,
            hourlyRate: true,
            overtimeRate: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Failed to update attendance record:', error)
    return NextResponse.json({ error: error.message || 'Failed to update attendance' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await params

    await prisma.attendanceRecord.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete attendance record:', error)
    return NextResponse.json({ error: 'Failed to delete attendance record' }, { status: 500 })
  }
}
