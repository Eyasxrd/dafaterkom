import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { getAuthenticatedUser } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const staff = await prisma.staff.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canLogin: true,
        joinCode: true,
        jobTitle: true,
        phone: true,
        department: true,
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
        emergencyContact: true,
        totpEnabled: true,
        totpVerifiedAt: true,
        requireTotpForShift: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(staff)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const session = getAuthenticatedUser(request)

    // Check if tenant has existing staff
    const existingStaffCount = await prisma.staff.count({ where: { tenantId } })

    if (existingStaffCount > 0) {
      if (!session || (session.role !== 'admin' && session.role !== 'manager' && session.role !== 'superadmin')) {
        return NextResponse.json({ error: 'Unauthorized: Admin or Manager privileges required' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { 
      name, 
      email, 
      password, 
      role, 
      joinCode,
      jobTitle,
      phone,
      department,
      hireDate,
      salaryType,
      monthlySalary,
      standardDailyHours,
      hourlyRate,
      overtimeRate,
      shiftSchedule,
      bankName,
      bankAccount,
      nationalId,
      emergencyContact,
      requireTotpForShift,
      canLogin
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Employee name is required' }, { status: 400 })
    }

    const trimmedEmail = email && typeof email === 'string' && email.trim().length > 0 ? email.trim().toLowerCase() : null
    const generatedJoinCode = joinCode && String(joinCode).trim().length > 0 
      ? String(joinCode).trim() 
      : Math.floor(100000 + Math.random() * 900000).toString()

    const isLoginUser = canLogin !== undefined ? Boolean(canLogin) : true

    // Check for duplicate email if email provided
    if (trimmedEmail) {
      const existingEmail = await prisma.staff.findFirst({
        where: { email: trimmedEmail }
      })
      if (existingEmail) {
        return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 400 })
      }
    }

    // Check for duplicate joinCode in tenant
    const existingCode = await prisma.staff.findFirst({
      where: { tenantId, joinCode: generatedJoinCode }
    })
    if (existingCode) {
      return NextResponse.json({ error: 'This employee code / PIN is already assigned to another staff member' }, { status: 400 })
    }

    let hashedPassword: string | null = null
    if (password && typeof password === 'string' && password.trim().length > 0) {
      hashedPassword = await bcrypt.hash(password.trim(), 10)
    } else if (isLoginUser) {
      hashedPassword = await bcrypt.hash('password123', 10)
    }

    const staff = await prisma.staff.create({
      data: {
        tenantId,
        name: name.trim(),
        email: trimmedEmail,
        password: hashedPassword,
        role: role || 'cashier',
        canLogin: isLoginUser,
        joinCode: generatedJoinCode,
        jobTitle: jobTitle?.trim() || null,
        phone: phone?.trim() || null,
        department: department?.trim() || null,
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        salaryType: salaryType || 'hourly',
        monthlySalary: parseFloat(monthlySalary) || 0,
        standardDailyHours: parseFloat(standardDailyHours) || 8,
        hourlyRate: parseFloat(hourlyRate) || 0,
        overtimeRate: parseFloat(overtimeRate) || 0,
        shiftSchedule: shiftSchedule?.trim() || '09:00 - 17:00',
        bankName: bankName?.trim() || null,
        bankAccount: bankAccount?.trim() || null,
        nationalId: nationalId?.trim() || null,
        emergencyContact: emergencyContact?.trim() || null,
        requireTotpForShift: Boolean(requireTotpForShift)
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        canLogin: true,
        joinCode: true,
        jobTitle: true,
        phone: true,
        department: true,
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
        emergencyContact: true,
        totpEnabled: true,
        requireTotpForShift: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(staff)
  } catch (error: any) {
    console.error('Failed to create staff member:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A staff member with this email or identifier already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: error?.message || 'Failed to create staff member' }, { status: 500 })
  }
}

