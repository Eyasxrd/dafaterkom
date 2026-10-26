import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request)
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    const staff = await prisma.staff.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        jobTitle: true,
        totpEnabled: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!staff || !staff.isActive) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: staff
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = getAuthenticatedUser(request)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, phone, jobTitle, department, currentPassword, newPassword } = body

    const existingStaff = await prisma.staff.findUnique({
      where: { id: session.userId }
    })

    if (!existingStaff) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (name && name.trim()) updateData.name = name.trim()
    if (email && email.trim()) {
      // Check if email taken by another user
      const duplicateEmail = await prisma.staff.findFirst({
        where: { email: email.trim(), id: { not: session.userId } }
      })
      if (duplicateEmail) {
        return NextResponse.json({ error: 'Email is already in use by another staff member' }, { status: 400 })
      }
      updateData.email = email.trim()
    }
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle ? jobTitle.trim() : null
    if (department !== undefined) updateData.department = department ? department.trim() : null

    // If changing password
    if (newPassword && newPassword.trim()) {
      if (newPassword.trim().length < 4) {
        return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
      }

      // If user had an existing password, verify current password
      if (existingStaff.password) {
        if (!currentPassword) {
          return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 })
        }
        const isMatch = await bcrypt.compare(currentPassword, existingStaff.password)
        if (!isMatch) {
          return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
        }
      }

      updateData.password = await bcrypt.hash(newPassword.trim(), 10)
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: session.userId },
      data: updateData,
      select: {
        id: true,
        tenantId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        department: true,
        jobTitle: true,
        totpEnabled: true,
        isActive: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      user: updatedStaff,
      message: 'Profile updated successfully'
    })
  } catch (error: any) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: error.message || 'Failed to update profile' }, { status: 500 })
  }
}

