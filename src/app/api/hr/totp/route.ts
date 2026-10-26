import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { generateTotpSecret, generateOtpAuthUri, generateTotpQrCode, verifyTotpToken } from '@/lib/totp'

// GET: Generate new TOTP setup data (secret, URI, QR code)
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, tenantId }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Generate a fresh Base32 secret
    const secret = generateTotpSecret()
    const otpAuthUri = generateOtpAuthUri({
      secret,
      accountName: `${staff.name} (${staff.email})`,
      issuer: 'Dafaterkom Cloud POS'
    })

    const qrCodeDataUrl = await generateTotpQrCode(otpAuthUri)

    return NextResponse.json({
      staffId: staff.id,
      staffName: staff.name,
      email: staff.email,
      secret,
      otpAuthUri,
      qrCodeDataUrl,
      totpEnabled: staff.totpEnabled,
      totpVerifiedAt: staff.totpVerifiedAt
    })
  } catch (error: any) {
    console.error('Failed to generate TOTP setup:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate TOTP setup' }, { status: 500 })
  }
}

// POST: Verify code from Google Authenticator and enable 2FA
export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { staffId, secret, token, requireForShift = true } = body

    if (!staffId || !secret || !token) {
      return NextResponse.json({ error: 'Staff ID, secret and 6-digit verification token are required' }, { status: 400 })
    }

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, tenantId }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    // Verify token with +/- 1 time step window tolerance
    const isValid = verifyTotpToken({ secret, token })

    if (!isValid) {
      return NextResponse.json({
        error: 'Invalid 6-digit code. Please ensure your phone clock is synced and enter the latest code shown in Google Authenticator.'
      }, { status: 400 })
    }

    // Save secret and enable TOTP
    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        totpSecret: secret,
        totpEnabled: true,
        totpVerifiedAt: new Date(),
        requireTotpForShift: Boolean(requireForShift)
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        totpEnabled: true,
        totpVerifiedAt: true,
        requireTotpForShift: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Google Authenticator linked successfully for ${updatedStaff.name}!`,
      staff: updatedStaff
    })
  } catch (error: any) {
    console.error('Failed to enable TOTP:', error)
    return NextResponse.json({ error: error.message || 'Failed to enable Google Authenticator' }, { status: 500 })
  }
}

// DELETE: Reset / Unlink Google Authenticator
export async function DELETE(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: staffId, tenantId },
      data: {
        totpSecret: null,
        totpEnabled: false,
        totpVerifiedAt: null,
        requireTotpForShift: false
      },
      select: {
        id: true,
        name: true,
        email: true,
        totpEnabled: true
      }
    })

    return NextResponse.json({
      success: true,
      message: `Google Authenticator unlinked for ${updatedStaff.name}`,
      staff: updatedStaff
    })
  } catch (error: any) {
    console.error('Failed to unlink TOTP:', error)
    return NextResponse.json({ error: error.message || 'Failed to unlink Google Authenticator' }, { status: 500 })
  }
}
