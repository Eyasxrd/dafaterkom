import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)

    // Default to current month if no dates provided
    const now = new Date()
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

    const startDate = searchParams.get('startDate') || defaultStart
    const endDate = searchParams.get('endDate') || defaultEnd

    // Get all staff
    const staffMembers = await prisma.staff.findMany({
      where: { tenantId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        jobTitle: true,
        hireDate: true,
        salaryType: true,
        monthlySalary: true,
        standardDailyHours: true,
        hourlyRate: true,
        overtimeRate: true,
        shiftSchedule: true,
        bankName: true,
        bankAccount: true,
        nationalId: true,
        totpEnabled: true
      },
      orderBy: { name: 'asc' }
    })

    // Get all attendance logs within range
    const attendanceLogs = await prisma.attendanceRecord.findMany({
      where: {
        tenantId,
        clockIn: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        },
        clockOut: { not: null }
      }
    })

    // Compute timesheet per staff
    let grandTotalHours = 0
    let grandRegularHours = 0
    let grandOvertimeHours = 0
    let grandBasePay = 0
    let grandOvertimePay = 0
    let grandTotalPayroll = 0

    const timesheet = staffMembers.map((staff) => {
      const logs = attendanceLogs.filter(log => log.staffId === staff.id)

      let totalHours = 0
      let regularHours = 0
      let overtimeHours = 0

      for (const log of logs) {
        const hrs = log.totalHours || 0
        const reg = log.regularHours ?? Math.min(hrs, staff.standardDailyHours || 8)
        const ot = log.overtimeHours ?? Math.max(0, hrs - (staff.standardDailyHours || 8))

        totalHours += hrs
        regularHours += reg
        overtimeHours += ot
      }

      totalHours = Math.round(totalHours * 100) / 100
      regularHours = Math.round(regularHours * 100) / 100
      overtimeHours = Math.round(overtimeHours * 100) / 100

      const isMonthly = staff.salaryType === 'monthly'
      const baseHourlyRate = staff.hourlyRate || (isMonthly && staff.monthlySalary ? (staff.monthlySalary / (30 * (staff.standardDailyHours || 8))) : 0)
      const otRate = staff.overtimeRate && staff.overtimeRate > 0 ? staff.overtimeRate : (baseHourlyRate * 1.5)

      let regularPay = 0
      let overtimePay = Math.round(overtimeHours * otRate * 100) / 100

      if (isMonthly) {
        // Base monthly salary (if staff worked or is salaried full-time)
        regularPay = staff.monthlySalary || 0
      } else {
        // Hourly pay based on logged regular hours
        regularPay = Math.round(regularHours * (staff.hourlyRate || 0) * 100) / 100
      }

      const totalPay = Math.round((regularPay + overtimePay) * 100) / 100

      grandTotalHours += totalHours
      grandRegularHours += regularHours
      grandOvertimeHours += overtimeHours
      grandBasePay += regularPay
      grandOvertimePay += overtimePay
      grandTotalPayroll += totalPay

      return {
        staffId: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        department: staff.department || 'General Operations',
        jobTitle: staff.jobTitle || staff.role,
        hireDate: staff.hireDate,
        salaryType: staff.salaryType || 'hourly',
        monthlySalary: staff.monthlySalary || 0,
        standardDailyHours: staff.standardDailyHours || 8,
        hourlyRate: staff.hourlyRate || 0,
        effectiveHourlyRate: Math.round(baseHourlyRate * 100) / 100,
        overtimeRate: Math.round(otRate * 100) / 100,
        shiftSchedule: staff.shiftSchedule || '09:00 - 17:00',
        bankName: staff.bankName,
        bankAccount: staff.bankAccount,
        nationalId: staff.nationalId,
        totpEnabled: staff.totpEnabled,
        daysWorked: logs.length,
        totalHours,
        regularHours,
        overtimeHours,
        regularPay,
        overtimePay,
        totalPay
      }
    })

    return NextResponse.json({
      period: {
        startDate,
        endDate
      },
      summary: {
        totalStaff: staffMembers.length,
        grandTotalHours: Math.round(grandTotalHours * 100) / 100,
        grandRegularHours: Math.round(grandRegularHours * 100) / 100,
        grandOvertimeHours: Math.round(grandOvertimeHours * 100) / 100,
        grandBasePay: Math.round(grandBasePay * 100) / 100,
        grandOvertimePay: Math.round(grandOvertimePay * 100) / 100,
        grandTotalPayroll: Math.round(grandTotalPayroll * 100) / 100
      },
      timesheet
    })
  } catch (error: any) {
    console.error('Failed to generate payroll timesheet:', error)
    return NextResponse.json({ error: 'Failed to generate payroll timesheet' }, { status: 500 })
  }
}
