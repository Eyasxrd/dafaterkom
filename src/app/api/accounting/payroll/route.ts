import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { postPayrollDisbursement } from '@/lib/accounting'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10)

    // 1. Fetch past disbursements
    const disbursements = await prisma.payrollDisbursement.findMany({
      where: { tenantId },
      orderBy: { disbursedAt: 'desc' }
    })

    // 2. Compute live attendance & timesheet totals for requested month/year
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999)

    const staffMembers = await prisma.staff.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jobTitle: true,
        hourlyRate: true,
        overtimeRate: true,
        standardDailyHours: true
      }
    })

    const attendances = await prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        clockIn: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    })

    // Group hours by staff
    const staffPayrollDraft = staffMembers.map(staff => {
      const records = attendances.filter(a => a.staffId === staff.id)
      let regularHours = 0
      let overtimeHours = 0
      let totalHours = 0

      for (const rec of records) {
        if (rec.regularHours !== null && rec.regularHours !== undefined) {
          regularHours += rec.regularHours
        } else if (rec.totalHours) {
          regularHours += Math.min(staff.standardDailyHours || 8, rec.totalHours)
        }

        if (rec.overtimeHours !== null && rec.overtimeHours !== undefined) {
          overtimeHours += rec.overtimeHours
        } else if (rec.totalHours && rec.totalHours > (staff.standardDailyHours || 8)) {
          overtimeHours += (rec.totalHours - (staff.standardDailyHours || 8))
        }

        if (rec.totalHours) {
          totalHours += rec.totalHours
        }
      }

      // If no hourly rate configured, use a sensible default of $12/hr base, $18/hr overtime
      const effectiveRate = staff.hourlyRate > 0 ? staff.hourlyRate : 12.50
      const effectiveOtRate = staff.overtimeRate > 0 ? staff.overtimeRate : (effectiveRate * 1.5)

      const regularPay = Math.round(regularHours * effectiveRate * 100) / 100
      const overtimePay = Math.round(overtimeHours * effectiveOtRate * 100) / 100
      const totalPay = Math.round((regularPay + overtimePay) * 100) / 100

      return {
        staffId: staff.id,
        name: staff.name,
        role: staff.role,
        jobTitle: staff.jobTitle || staff.role,
        hourlyRate: effectiveRate,
        overtimeRate: effectiveOtRate,
        daysWorked: records.length,
        totalHours: Math.round(totalHours * 10) / 10,
        regularHours: Math.round(regularHours * 10) / 10,
        overtimeHours: Math.round(overtimeHours * 10) / 10,
        regularPay,
        overtimePay,
        totalPay
      }
    })

    const draftSummary = {
      month,
      year,
      staffCount: staffMembers.length,
      activeWorkersCount: staffPayrollDraft.filter(s => s.daysWorked > 0).length,
      totalRegularHours: staffPayrollDraft.reduce((s, r) => s + r.regularHours, 0),
      totalOvertimeHours: staffPayrollDraft.reduce((s, r) => s + r.overtimeHours, 0),
      totalBasePay: Math.round(staffPayrollDraft.reduce((s, r) => s + r.regularPay, 0) * 100) / 100,
      totalOvertimePay: Math.round(staffPayrollDraft.reduce((s, r) => s + r.overtimePay, 0) * 100) / 100,
      grandTotalPayroll: Math.round(staffPayrollDraft.reduce((s, r) => s + r.totalPay, 0) * 100) / 100
    }

    return NextResponse.json({
      disbursements,
      draftSummary,
      staffPayrollDraft
    })
  } catch (error: any) {
    console.error('Failed to fetch payroll data:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch payroll data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const {
      periodMonth,
      periodYear,
      staffCount,
      basePay,
      overtimePay,
      deductions = 0,
      bonuses = 0,
      paymentMethod = 'bank_transfer',
      notes
    } = body

    if (!periodMonth || !periodYear || basePay === undefined) {
      return NextResponse.json({ error: 'periodMonth, periodYear, and basePay are required' }, { status: 400 })
    }

    const result = await postPayrollDisbursement(tenantId, {
      periodMonth: Number(periodMonth),
      periodYear: Number(periodYear),
      staffCount: Number(staffCount || 1),
      basePay: Number(basePay),
      overtimePay: Number(overtimePay || 0),
      deductions: Number(deductions || 0),
      bonuses: Number(bonuses || 0),
      paymentMethod,
      notes
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Failed to disburse payroll:', error)
    return NextResponse.json({ error: error.message || 'Failed to disburse payroll' }, { status: 500 })
  }
}
