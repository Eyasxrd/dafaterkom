import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { logAuditEvent } from '@/lib/audit'
import { verifyTotpToken } from '@/lib/totp'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode')
    const staffId = searchParams.get('staffId')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    // 1. Roster Mode: Live Team Floor Board & Departed Shifts for Today
    if (mode === 'roster') {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)

      // Fetch all currently active shifts for the tenant
      const activeShifts = await prisma.shift.findMany({
        where: {
          tenantId,
          status: 'active'
        },
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              jobTitle: true,
              department: true,
              phone: true,
              standardDailyHours: true,
              hourlyRate: true,
              overtimeRate: true,
              salaryType: true,
              shiftSchedule: true,
              totpEnabled: true,
              requireTotpForShift: true
            }
          }
        },
        orderBy: { startTime: 'desc' }
      })

      // For each active shift, calculate live sales (if cash drawer) and overtime
      const activeStaffWithStats = await Promise.all(
        activeShifts.map(async (shift) => {
          const startTimeMs = new Date(shift.startTime).getTime()
          const durationSecs = Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000))
          const durationHours = Math.round((durationSecs / 3600) * 100) / 100
          const standardHours = shift.staff.standardDailyHours || 8.0
          const isOvertime = durationHours > standardHours
          const overtimeHours = isOvertime ? Math.round((durationHours - standardHours) * 100) / 100 : 0

          let cashSales = 0
          let cardSales = 0
          let cashInTotal = 0
          let cashOutTotal = 0
          let totalOrders = 0
          let expectedCash = shift.startCash

          if (shift.hasCashDrawer) {
            const orders = await prisma.order.findMany({
              where: {
                tenantId,
                staffId: shift.staffId,
                createdAt: { gte: shift.startTime },
                orderStatus: { not: 'cancelled' }
              }
            })

            totalOrders = orders.length
            cashSales = orders
              .filter(o => o.paymentMethod === 'cash')
              .reduce((sum, o) => sum + o.totalAmount, 0)
            cardSales = orders
              .filter(o => o.paymentMethod !== 'cash')
              .reduce((sum, o) => sum + o.totalAmount, 0)

            const cashLogs = await prisma.auditLog.findMany({
              where: {
                tenantId,
                entityType: 'shift',
                entityId: shift.id,
                action: { in: ['cash_in', 'cash_out'] }
              }
            })

            for (const log of cashLogs) {
              try {
                const parsed = log.afterValue ? JSON.parse(log.afterValue) : null
                if (parsed && typeof parsed.amount === 'number') {
                  if (log.action === 'cash_in') cashInTotal += parsed.amount
                  if (log.action === 'cash_out') cashOutTotal += parsed.amount
                }
              } catch {}
            }

            expectedCash = shift.startCash + cashSales + cashInTotal - cashOutTotal
          }

          return {
            ...shift,
            durationSecs,
            durationHours,
            standardHours,
            isOvertime,
            overtimeHours,
            financials: shift.hasCashDrawer ? {
              totalOrders,
              cashSales,
              cardSales,
              cashInTotal,
              cashOutTotal,
              expectedCash
            } : null
          }
        })
      )

      // Fetch completed shifts from today / past 24 hours
      const departedShifts = await prisma.shift.findMany({
        where: {
          tenantId,
          status: 'completed',
          endTime: { gte: todayStart }
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
              overtimeRate: true
            }
          }
        },
        orderBy: { endTime: 'desc' },
        take: 50
      })

      const departedStaffWithStats = departedShifts.map((shift) => {
        const startMs = new Date(shift.startTime).getTime()
        const endMs = shift.endTime ? new Date(shift.endTime).getTime() : Date.now()
        const durationHours = Math.round(((endMs - startMs) / (1000 * 3600)) * 100) / 100
        const standardHours = shift.staff.standardDailyHours || 8.0
        const isOvertime = shift.isOvertime || durationHours > standardHours
        const overtimeHours = shift.overtimeHours || (isOvertime ? Math.round((durationHours - standardHours) * 100) / 100 : 0)

        return {
          ...shift,
          durationHours,
          standardHours,
          isOvertime,
          overtimeHours
        }
      })

      const totalActive = activeStaffWithStats.length
      const activeCashiers = activeStaffWithStats.filter(s => s.hasCashDrawer).length
      const activeFloor = activeStaffWithStats.filter(s => !s.hasCashDrawer).length
      const overtimeCount = activeStaffWithStats.filter(s => s.isOvertime).length
      const departedCount = departedStaffWithStats.length

      return NextResponse.json({
        activeStaff: activeStaffWithStats,
        departedStaff: departedStaffWithStats,
        summary: {
          totalActive,
          activeCashiers,
          activeFloor,
          overtimeCount,
          departedCount
        }
      })
    }

    // 2. Active Shift for specific staff (Cashier POS single view)
    if (activeOnly && staffId) {
      const activeShift = await prisma.shift.findFirst({
        where: {
          tenantId,
          staffId,
          status: 'active'
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
              totpEnabled: true,
              requireTotpForShift: true
            }
          }
        },
        orderBy: { startTime: 'desc' }
      })

      if (activeShift) {
        let cashSales = 0
        let cardSales = 0
        let cashInTotal = 0
        let cashOutTotal = 0
        let totalOrders = 0
        let pettyCashItems: Array<{ id: string; type: string; amount: number; reason: string; timestamp: Date }> = []

        if (activeShift.hasCashDrawer) {
          const orders = await prisma.order.findMany({
            where: {
              tenantId,
              staffId,
              createdAt: { gte: activeShift.startTime },
              orderStatus: { not: 'cancelled' }
            }
          })

          totalOrders = orders.length
          cashSales = orders
            .filter(o => o.paymentMethod === 'cash')
            .reduce((sum, o) => sum + o.totalAmount, 0)

          cardSales = orders
            .filter(o => o.paymentMethod !== 'cash')
            .reduce((sum, o) => sum + o.totalAmount, 0)

          const cashLogs = await prisma.auditLog.findMany({
            where: {
              tenantId,
              entityType: 'shift',
              entityId: activeShift.id,
              action: { in: ['cash_in', 'cash_out'] }
            },
            orderBy: { timestamp: 'desc' }
          })

          for (const log of cashLogs) {
            try {
              const parsed = log.afterValue ? JSON.parse(log.afterValue) : null
              if (parsed && typeof parsed.amount === 'number') {
                if (log.action === 'cash_in') cashInTotal += parsed.amount
                if (log.action === 'cash_out') cashOutTotal += parsed.amount
                pettyCashItems.push({
                  id: log.id,
                  type: log.action,
                  amount: parsed.amount,
                  reason: parsed.reason || log.notes || '',
                  timestamp: log.timestamp
                })
              }
            } catch {}
          }
        }

        const expectedCash = activeShift.startCash + cashSales + cashInTotal - cashOutTotal

        return NextResponse.json({
          shift: activeShift,
          stats: {
            totalOrders,
            cashSales,
            cardSales,
            totalSales: cashSales + cardSales,
            cashInTotal,
            cashOutTotal,
            expectedCash,
            pettyCashItems
          }
        })
      }

      return NextResponse.json({ shift: null, stats: null })
    }

    // 3. Return recent shifts list
    const shifts = await prisma.shift.findMany({
      where: {
        tenantId,
        ...(staffId ? { staffId } : {})
      },
      include: {
        staff: {
          select: { 
            id: true, 
            name: true, 
            role: true,
            jobTitle: true,
            department: true,
            totpEnabled: true,
            requireTotpForShift: true
          }
        }
      },
      orderBy: { startTime: 'desc' },
      take: 50
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
    const { 
      staffId, 
      employeeCode, 
      totpCode, 
      startCash, 
      notes, 
      hasCashDrawer = true, 
      roleInShift 
    } = body

    let resolvedStaff: any = null

    // If employeeCode provided, look up and verify staff member
    if (employeeCode && String(employeeCode).trim()) {
      resolvedStaff = await prisma.staff.findFirst({
        where: {
          tenantId,
          joinCode: String(employeeCode).trim(),
          isActive: true
        }
      })

      if (!resolvedStaff) {
        return NextResponse.json({ error: 'Invalid employee code or account is inactive' }, { status: 401 })
      }

      if (staffId && staffId !== resolvedStaff.id) {
        return NextResponse.json({ error: 'Employee code does not match the selected user' }, { status: 403 })
      }
    } else if (staffId) {
      resolvedStaff = await prisma.staff.findFirst({
        where: { tenantId, id: staffId, isActive: true }
      })
      if (!resolvedStaff) {
        return NextResponse.json({ error: 'Staff member not found or inactive' }, { status: 404 })
      }
    } else {
      return NextResponse.json({ error: 'Employee code is required to clock in and start shift' }, { status: 400 })
    }

    // Check Google Authenticator TOTP if enabled for this employee
    if (resolvedStaff.totpEnabled && resolvedStaff.totpSecret) {
      if (!totpCode || String(totpCode).trim().length !== 6) {
        return NextResponse.json({
          error: 'Google Authenticator 6-digit code is required to start your shift.',
          requiresTotp: true,
          staffName: resolvedStaff.name
        }, { status: 401 })
      }

      const isValidTotp = verifyTotpToken({
        secret: resolvedStaff.totpSecret,
        token: String(totpCode).trim()
      })

      if (!isValidTotp) {
        return NextResponse.json({
          error: 'Invalid or expired Google Authenticator code. Check your phone app for the latest 6-digit code.',
          requiresTotp: true,
          staffName: resolvedStaff.name
        }, { status: 401 })
      }
    }

    // Check if staff already has an active shift
    const existingActive = await prisma.shift.findFirst({
      where: { tenantId, staffId: resolvedStaff.id, status: 'active' }
    })

    if (existingActive) {
      return NextResponse.json({
        error: `${resolvedStaff.name} already has an active shift. Please close it before opening a new one.`,
        shift: existingActive
      }, { status: 400 })
    }

    const drawerEnabled = Boolean(hasCashDrawer)
    const openingFloat = drawerEnabled ? (parseFloat(startCash) || 0) : 0
    const shiftRole = roleInShift || resolvedStaff.jobTitle || resolvedStaff.role || 'Staff'

    // Create Shift in database
    const shift = await prisma.shift.create({
      data: {
        tenantId,
        staffId: resolvedStaff.id,
        startCash: openingFloat,
        notes: notes?.trim() || null,
        hasCashDrawer: drawerEnabled,
        roleInShift: shiftRole,
        status: 'active'
      },
      include: {
        staff: {
          select: { id: true, name: true, role: true, jobTitle: true, department: true }
        }
      }
    })

    // Simultaneously create / link an AttendanceRecord so HR & Attendance stays in sync
    try {
      const attendance = await prisma.attendanceRecord.create({
        data: {
          tenantId,
          staffId: resolvedStaff.id,
          clockIn: shift.startTime,
          source: totpCode ? 'google_auth_totp' : drawerEnabled ? 'cashier_shift' : 'floor_shift',
          status: 'present',
          notes: notes?.trim() 
            ? `[Shift: ${shiftRole}] ${notes.trim()}` 
            : `Shift started (${drawerEnabled ? `Cash Drawer $${openingFloat}` : 'Floor Duty'})`
        }
      })

      await prisma.shift.update({
        where: { id: shift.id },
        data: { attendanceId: attendance.id }
      })
    } catch (attErr) {
      console.warn('Could not auto-create linked attendance record:', attErr)
    }

    // Audit log if cashier drawer opened
    if (drawerEnabled && openingFloat > 0) {
      await logAuditEvent({
        tenantId,
        staffId: resolvedStaff.id,
        action: 'drawer_open',
        entityType: 'shift',
        entityId: shift.id,
        afterValue: { startCash: shift.startCash },
        notes: `Shift opened with starting cash: $${shift.startCash}`
      })
    }

    return NextResponse.json(shift)
  } catch (error: any) {
    console.error('Failed to start shift:', error)
    return NextResponse.json({ error: error.message || 'Failed to start shift' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { shiftId, endCash, notes, overtimeReason } = body

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
    const startMs = new Date(currentShift.startTime).getTime()
    const endMs = endTime.getTime()
    const diffMs = Math.max(0, endMs - startMs)
    const totalHours = Math.round((diffMs / (1000 * 3600)) * 100) / 100
    const standardHours = currentShift.staff.standardDailyHours || 8.0
    const isOvertime = totalHours > standardHours
    const regularHours = Math.min(totalHours, standardHours)
    const overtimeHours = isOvertime ? Math.round((totalHours - standardHours) * 100) / 100 : 0

    let cashSales = 0
    let cardSales = 0
    let cashInTotal = 0
    let cashOutTotal = 0
    let countedEndCash = 0
    let expectedEndCash = 0
    let cashDiscrepancy = 0
    let totalOrders = 0

    if (currentShift.hasCashDrawer) {
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

      totalOrders = orders.length
      cashSales = orders
        .filter(o => o.paymentMethod === 'cash')
        .reduce((sum, o) => sum + o.totalAmount, 0)

      cardSales = orders
        .filter(o => o.paymentMethod !== 'cash')
        .reduce((sum, o) => sum + o.totalAmount, 0)

      const cashLogs = await prisma.auditLog.findMany({
        where: {
          tenantId,
          entityType: 'shift',
          entityId: shiftId,
          action: { in: ['cash_in', 'cash_out'] }
        }
      })

      for (const log of cashLogs) {
        try {
          const parsed = log.afterValue ? JSON.parse(log.afterValue) : null
          if (parsed && typeof parsed.amount === 'number') {
            if (log.action === 'cash_in') cashInTotal += parsed.amount
            if (log.action === 'cash_out') cashOutTotal += parsed.amount
          }
        } catch {}
      }

      countedEndCash = parseFloat(endCash) || 0
      expectedEndCash = currentShift.startCash + cashSales + cashInTotal - cashOutTotal
      cashDiscrepancy = countedEndCash - expectedEndCash
    }

    const combinedNotes = [
      currentShift.notes,
      notes?.trim(),
      overtimeReason ? `[OT: ${overtimeReason}]` : null
    ].filter(Boolean).join(' | ')

    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: {
        endTime,
        status: 'completed',
        endCash: currentShift.hasCashDrawer ? countedEndCash : 0,
        cashSales,
        cardSales,
        totalOrders,
        isOvertime,
        overtimeHours,
        notes: combinedNotes || null
      },
      include: {
        staff: {
          select: { id: true, name: true, role: true, jobTitle: true, department: true }
        }
      }
    })

    // Synchronize the linked AttendanceRecord in HR
    try {
      if (currentShift.attendanceId) {
        await prisma.attendanceRecord.update({
          where: { id: currentShift.attendanceId },
          data: {
            clockOut: endTime,
            totalHours,
            regularHours,
            overtimeHours,
            status: 'completed',
            notes: combinedNotes || undefined
          }
        })
      } else {
        // Fallback: find active attendance record for this staff and close it
        const activeAtt = await prisma.attendanceRecord.findFirst({
          where: { tenantId, staffId: currentShift.staffId, clockOut: null },
          orderBy: { clockIn: 'desc' }
        })
        if (activeAtt) {
          await prisma.attendanceRecord.update({
            where: { id: activeAtt.id },
            data: {
              clockOut: endTime,
              totalHours,
              regularHours,
              overtimeHours,
              status: 'completed'
            }
          })
        }
      }
    } catch (attErr) {
      console.warn('Could not sync attendance record on shift close:', attErr)
    }

    return NextResponse.json({
      shift: updatedShift,
      totalHours,
      regularHours,
      overtimeHours,
      isOvertime,
      zReport: currentShift.hasCashDrawer ? {
        shiftId: updatedShift.id,
        staffName: currentShift.staff.name,
        startTime: currentShift.startTime,
        endTime,
        startCash: currentShift.startCash,
        cashSales,
        cardSales,
        cashInTotal,
        cashOutTotal,
        totalSales: cashSales + cardSales,
        totalOrders,
        countedEndCash,
        expectedEndCash,
        cashDiscrepancy,
        totalHours,
        overtimeHours
      } : null
    })
  } catch (error: any) {
    console.error('Failed to close shift:', error)
    return NextResponse.json({ error: error.message || 'Failed to close shift' }, { status: 500 })
  }
}
