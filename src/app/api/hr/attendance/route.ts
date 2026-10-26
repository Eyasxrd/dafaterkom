import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { verifyTotpToken } from '@/lib/totp'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClause: any = { tenantId }

    if (staffId && staffId !== 'all') {
      whereClause.staffId = staffId
    }

    if (status === 'active') {
      whereClause.clockOut = null
    } else if (status === 'completed') {
      whereClause.clockOut = { not: null }
    }

    if (startDate || endDate) {
      whereClause.clockIn = {}
      if (startDate) {
        whereClause.clockIn.gte = new Date(startDate)
      }
      if (endDate) {
        // Set to end of day
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        whereClause.clockIn.lte = end
      }
    }

    const records = await prisma.attendanceRecord.findMany({
      where: whereClause,
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            jobTitle: true,
            department: true,
            standardDailyHours: true,
            hourlyRate: true,
            overtimeRate: true,
            salaryType: true,
            monthlySalary: true,
            totpEnabled: true
          }
        }
      },
      orderBy: { clockIn: 'desc' }
    })

    return NextResponse.json(records)
  } catch (error: any) {
    console.error('Failed to fetch attendance records:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { staffId, pin, totpCode, source = 'biometric', clockInTime, notes } = body

    let resolvedStaff: any = null

    // Look up staff by PIN or staffId
    if (pin) {
      resolvedStaff = await prisma.staff.findFirst({
        where: { tenantId, joinCode: String(pin).trim(), isActive: true }
      })
      if (!resolvedStaff) {
        return NextResponse.json({ error: 'Invalid PIN / Join Code' }, { status: 404 })
      }
    } else if (staffId) {
      resolvedStaff = await prisma.staff.findFirst({
        where: { tenantId, id: staffId, isActive: true }
      })
      if (!resolvedStaff) {
        return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: 'Staff ID or PIN is required' }, { status: 400 })
    }

    // If staff has TOTP enabled, verify the dynamic 6-digit code
    if (resolvedStaff.totpEnabled && resolvedStaff.totpSecret) {
      if (!totpCode || String(totpCode).trim().length !== 6) {
        return NextResponse.json({
          error: 'Google Authenticator 6-digit dynamic code is required for attendance clock-in.',
          requiresTotp: true,
          staffId: resolvedStaff.id,
          staffName: resolvedStaff.name
        }, { status: 401 })
      }

      const isValid = verifyTotpToken({
        secret: resolvedStaff.totpSecret,
        token: String(totpCode).trim()
      })

      if (!isValid) {
        return NextResponse.json({
          error: 'Invalid or expired Google Authenticator code. Check your smartphone app for the active code.',
          requiresTotp: true,
          staffId: resolvedStaff.id,
          staffName: resolvedStaff.name
        }, { status: 401 })
      }
    }

    // Check if employee already has an active clock-in without clock-out
    const activeAttendance = await prisma.attendanceRecord.findFirst({
      where: {
        tenantId,
        staffId: resolvedStaff.id,
        clockOut: null
      }
    })

    if (activeAttendance) {
      return NextResponse.json({
        error: `${resolvedStaff.name} is already clocked in since ${new Date(activeAttendance.clockIn).toLocaleTimeString()}`,
        activeAttendance
      }, { status: 409 })
    }

    const clockIn = clockInTime ? new Date(clockInTime) : new Date()

    const attendance = await prisma.attendanceRecord.create({
      data: {
        tenantId,
        staffId: resolvedStaff.id,
        clockIn,
        source: totpCode ? 'google_auth_totp' : source,
        status: 'present',
        notes: notes?.trim() || null
      },
      include: {
        staff: {
          select: {
            id: true,
            name: true,
            role: true,
            jobTitle: true,
            department: true,
            standardDailyHours: true,
            hourlyRate: true,
            overtimeRate: true,
            salaryType: true,
            monthlySalary: true,
            totpEnabled: true
          }
        }
      }
    })

    return NextResponse.json(attendance)
  } catch (error: any) {
    console.error('Failed to clock in:', error)
    return NextResponse.json({ error: error.message || 'Failed to clock in' }, { status: 500 })
  }
}
