import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { verifyTotpToken } from '@/lib/totp'

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { staffId, pin, token } = body

    if (!token || String(token).trim().length !== 6) {
      return NextResponse.json({ error: 'A 6-digit Google Authenticator code is required' }, { status: 400 })
    }

    let staff: any = null

    if (staffId) {
      staff = await prisma.staff.findFirst({
        where: { id: staffId, tenantId, isActive: true }
      })
    } else if (pin) {
      staff = await prisma.staff.findFirst({
        where: { joinCode: String(pin).trim(), tenantId, isActive: true }
      })
    }

    if (!staff) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (!staff.totpEnabled || !staff.totpSecret) {
      return NextResponse.json({
        valid: false,
        error: `${staff.name} does not have Google Authenticator linked yet.`
      }, { status: 400 })
    }

    const isValid = verifyTotpToken({
      secret: staff.totpSecret,
      token: String(token).trim()
    })

    if (!isValid) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid or expired code. Enter the latest 6-digit code from Google Authenticator.'
      }, { status: 400 })
    }

    return NextResponse.json({
      valid: true,
      staff: {
        id: staff.id,
        name: staff.name,
        role: staff.role,
        department: staff.department
      }
    })
  } catch (error: any) {
    console.error('Failed to verify TOTP:', error)
    return NextResponse.json({ error: error.message || 'Failed to verify TOTP' }, { status: 500 })
  }
}
