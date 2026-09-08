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
        joinCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
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
    const { name, email, password, role, joinCode } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password || 'password123', 10)
    const generatedJoinCode = joinCode || Math.floor(100000 + Math.random() * 900000).toString()

    const staff = await prisma.staff.create({
      data: {
        tenantId,
        name,
        email,
        password: hashedPassword,
        role: role || 'cashier',
        joinCode: generatedJoinCode
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        joinCode: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(staff)
  } catch (error: any) {
    console.error('Failed to create staff member:', error)
    if (error?.code === 'P2002') {
      return NextResponse.json({ error: 'A staff member with this email already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
  }
}

