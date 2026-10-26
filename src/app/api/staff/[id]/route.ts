import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      isActive, 
      role, 
      name, 
      email,
      joinCode, 
      password, 
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

    const updateData: any = {}
    if (isActive !== undefined) updateData.isActive = Boolean(isActive)
    if (canLogin !== undefined) updateData.canLogin = Boolean(canLogin)
    if (role !== undefined) updateData.role = role
    if (name !== undefined) updateData.name = name.trim()
    
    if (email !== undefined) {
      const trimmedEmail = email && typeof email === 'string' && email.trim().length > 0 ? email.trim().toLowerCase() : null
      if (trimmedEmail) {
        const existingEmail = await prisma.staff.findFirst({
          where: { email: trimmedEmail, id: { not: id } }
        })
        if (existingEmail) {
          return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 400 })
        }
      }
      updateData.email = trimmedEmail
    }

    if (joinCode !== undefined) {
      const trimmedCode = String(joinCode).trim()
      if (trimmedCode.length > 0) {
        // Find current staff to check tenant
        const currentStaff = await prisma.staff.findUnique({ where: { id } })
        if (currentStaff) {
          const duplicateCode = await prisma.staff.findFirst({
            where: { 
              tenantId: currentStaff.tenantId, 
              joinCode: trimmedCode, 
              id: { not: id } 
            }
          })
          if (duplicateCode) {
            return NextResponse.json({ error: 'This employee code / PIN is already assigned to another staff member' }, { status: 400 })
          }
        }
        updateData.joinCode = trimmedCode
      }
    }

    if (jobTitle !== undefined) updateData.jobTitle = jobTitle?.trim() || null
    if (phone !== undefined) updateData.phone = phone?.trim() || null
    if (department !== undefined) updateData.department = department?.trim() || null
    if (hireDate !== undefined) updateData.hireDate = hireDate ? new Date(hireDate) : null
    if (salaryType !== undefined) updateData.salaryType = salaryType
    if (monthlySalary !== undefined) updateData.monthlySalary = parseFloat(monthlySalary) || 0
    if (standardDailyHours !== undefined) updateData.standardDailyHours = parseFloat(standardDailyHours) || 8
    if (hourlyRate !== undefined) updateData.hourlyRate = parseFloat(hourlyRate) || 0
    if (overtimeRate !== undefined) updateData.overtimeRate = parseFloat(overtimeRate) || 0
    if (shiftSchedule !== undefined) updateData.shiftSchedule = shiftSchedule?.trim() || null
    if (bankName !== undefined) updateData.bankName = bankName?.trim() || null
    if (bankAccount !== undefined) updateData.bankAccount = bankAccount?.trim() || null
    if (nationalId !== undefined) updateData.nationalId = nationalId?.trim() || null
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact?.trim() || null
    if (requireTotpForShift !== undefined) updateData.requireTotpForShift = Boolean(requireTotpForShift)

    // Handle password update / reset by admin
    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (password.trim().length < 4) {
        return NextResponse.json({ error: 'Password must be at least 4 characters long' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(password.trim(), 10)
    }

    const staff = await prisma.staff.update({
      where: { id },
      data: updateData,
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
      }
    })

    return NextResponse.json(staff)
  } catch (error: any) {
    console.error('Failed to update staff:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A staff member with this email or code already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: error?.message || 'Failed to update staff' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.staff.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete staff:', error)
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 })
  }
}
