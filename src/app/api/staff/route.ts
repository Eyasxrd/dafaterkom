import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
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
    const body = await request.json()
    const { name, email, password, role, joinCode } = body

    const hashedPassword = await bcrypt.hash(password || 'password123', 10)
    // Generate a random 6-digit join code if not provided
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 })
  }
}
