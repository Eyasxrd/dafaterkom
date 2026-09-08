import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

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
        role: true,
        isActive: true
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
