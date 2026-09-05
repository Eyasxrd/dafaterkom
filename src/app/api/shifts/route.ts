import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    if (activeOnly && staffId) {
      const activeShift = await prisma.shift.findFirst({
        where: {
          tenantId,
          staffId,
          status: 'active'
        },
        include: {
          staff: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { startTime: 'desc' }
      })

      if (activeShift) {
        // Calculate real-time sales for this shift
        const orders = await prisma.order.findMany({
          where: {
            tenantId,
            staffId,
            createdAt: { gte: activeShift.startTime },
            orderStatus: { not: 'cancelled' }
          }
        })

        const cashSales = orders
          .filter(o => o.paymentMethod === 'cash')
          .reduce((sum, o) => sum + o.totalAmount, 0)

        const cardSales = orders
          .filter(o => o.paymentMethod !== 'cash')
          .reduce((sum, o) => sum + o.totalAmount, 0)

        const expectedCash = activeShift.startCash + cashSales

        return NextResponse.json({
          shift: activeShift,
          stats: {
            totalOrders: orders.length,
            cashSales,
            cardSales,
            totalSales: cashSales + cardSales,
            expectedCash
          }
        })
      }

      return NextResponse.json({ shift: null, stats: null })
    }

    // Return recent shifts list
    const shifts = await prisma.shift.findMany({
      where: {
        tenantId,
        ...(staffId ? { staffId } : {})
      },
      include: {
        staff: {
          select: { id: true, name: true, role: true }
        }
      },
      orderBy: { startTime: 'desc' },
      take: 30
    })

    return NextResponse.json(shifts)
  } catch (error) {
    console.error('Failed to fetch shifts:', error)
    return NextResponse.json({ error: 'Failed to fetch shifts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { staffId, employeeCode, startCash, notes } = body

    let resolvedStaffId = staffId

    // If employeeCode provided, look up and verify staff member
    if (employeeCode && String(employeeCode).trim()) {
      const codeStaff = await prisma.staff.findFirst({
        where: {
          tenantId,
          joinCode: String(employeeCode).trim(),
          isActive: true
        }
      })

      if (!codeStaff) {
        return NextResponse.json({ error: 'Invalid employee code or account is inactive' }, { status: 401 })
      }

      if (staffId && staffId !== codeStaff.id) {
        return NextResponse.json({ error: 'Employee code does not match the selected user' }, { status: 403 })
      }

      resolvedStaffId = codeStaff.id
    } else {
      return NextResponse.json({ error: 'Employee code is required to clock in and start shift' }, { status: 400 })
    }

    // Check if staff already has an active shift
    const existingActive = await prisma.shift.findFirst({
      where: { tenantId, staffId: resolvedStaffId, status: 'active' }
    })

    if (existingActive) {
      return NextResponse.json({
        error: 'Staff member already has an active shift. Please close it before opening a new one.',
        shift: existingActive
      }, { status: 400 })
    }

    const shift = await prisma.shift.create({
      data: {
        tenantId,
        staffId: resolvedStaffId,
        startCash: parseFloat(startCash) || 0,
        notes: notes?.trim() || null,
        status: 'active'
      },
      include: {
        staff: {
          select: { id: true, name: true, role: true }
        }
      }
    })

    await logAuditEvent({
      tenantId,
      staffId,
      action: 'drawer_open',
      entityType: 'shift',
      entityId: shift.id,
      afterValue: { startCash: shift.startCash },
      notes: `Shift opened with starting cash: $${shift.startCash}`
    })

    return NextResponse.json(shift)
  } catch (error) {
    console.error('Failed to start shift:', error)
    return NextResponse.json({ error: 'Failed to start shift' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { shiftId, endCash, notes } = body

    if (!shiftId) {
      return NextResponse.json({ error: 'Shift ID is required' }, { status: 400 })
    }

    const currentShift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: { staff: true }
    })

    if (!currentShift) {
      return NextResponse.json({ error: 'Shift not found' }, { status: 404 })
    }

    const endTime = new Date()

    // Aggregate sales during this shift period
    const orders = await prisma.order.findMany({
      where: {
        tenantId,
        staffId: currentShift.staffId,
        createdAt: {
          gte: currentShift.startTime,
          lte: endTime
        },
        orderStatus: { not: 'cancelled' }
      }
    })

    const cashSales = orders
      .filter(o => o.paymentMethod === 'cash')
      .reduce((sum, o) => sum + o.totalAmount, 0)

    const cardSales = orders
      .filter(o => o.paymentMethod !== 'cash')
      .reduce((sum, o) => sum + o.totalAmount, 0)

    const countedEndCash = parseFloat(endCash) || 0
    const expectedEndCash = currentShift.startCash + cashSales
    const cashDiscrepancy = countedEndCash - expectedEndCash

    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        endTime,
        status: 'completed',
        endCash: countedEndCash,
        cashSales,
        cardSales,
        totalOrders: orders.length,
        notes: notes
          ? `${currentShift.notes ? currentShift.notes + ' | ' : ''}${notes}`
          : currentShift.notes
      },
      include: {
        staff: {
          select: { id: true, name: true, role: true }
        }
      }
    })

    return NextResponse.json({
      shift: updatedShift,
      zReport: {
        shiftId: updatedShift.id,
        staffName: currentShift.staff.name,
        startTime: currentShift.startTime,
        endTime,
        startCash: currentShift.startCash,
        cashSales,
        cardSales,
        totalSales: cashSales + cardSales,
        totalOrders: orders.length,
        countedEndCash,
        expectedEndCash,
        cashDiscrepancy
      }
    })
  } catch (error) {
    console.error('Failed to close shift:', error)
    return NextResponse.json({ error: 'Failed to close shift' }, { status: 500 })
  }
}
