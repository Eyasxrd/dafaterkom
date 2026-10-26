import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { logAuditEvent } from '@/lib/audit'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const whereClause: { tenantId: string; isActive?: boolean } = { tenantId }
    if (activeOnly) {
      whereClause.isActive = true
    }

    const promos = await prisma.promoCode.findMany({
      where: whereClause,
      include: {
        freeItem: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            category: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(promos)
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch promo codes'
    console.error('Failed to fetch promo codes:', error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const {
      code,
      description,
      discountType = 'percentage',
      discountPercent,
      discountAmount,
      freeItemId,
      minOrderAmount = 0,
      maxDiscount,
      usageLimit,
      startDate,
      endDate,
      isActive = true
    } = body

    const normalizedCode = code ? String(code).trim().toUpperCase() : ''
    if (!normalizedCode) {
      return NextResponse.json({ error: 'Promo code is required' }, { status: 400 })
    }

    // Check if promo code already exists for this tenant
    const existing = await prisma.promoCode.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: normalizedCode
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: `Promo code "${normalizedCode}" already exists` }, { status: 400 })
    }

    // Validate type-specific requirements
    if (discountType === 'percentage') {
      const pct = parseFloat(discountPercent)
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        return NextResponse.json({ error: 'Discount percentage must be between 1 and 100' }, { status: 400 })
      }
    } else if (discountType === 'free_item') {
      if (!freeItemId) {
        return NextResponse.json({ error: 'Please select a free menu item for this promo' }, { status: 400 })
      }
      const itemExists = await prisma.menuItem.findFirst({
        where: { id: freeItemId, tenantId }
      })
      if (!itemExists) {
        return NextResponse.json({ error: 'Selected free menu item not found' }, { status: 404 })
      }
    } else if (discountType === 'fixed_amount') {
      const amt = parseFloat(discountAmount)
      if (isNaN(amt) || amt <= 0) {
        return NextResponse.json({ error: 'Discount amount must be greater than 0' }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: 'Invalid discount type' }, { status: 400 })
    }

    const promo = await prisma.promoCode.create({
      data: {
        tenantId,
        code: normalizedCode,
        description: description?.trim() || null,
        discountType,
        discountPercent: discountType === 'percentage' ? parseFloat(discountPercent) : null,
        discountAmount: discountType === 'fixed_amount' ? parseFloat(discountAmount) : null,
        freeItemId: discountType === 'free_item' ? freeItemId : null,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: Boolean(isActive)
      },
      include: {
        freeItem: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            category: { select: { id: true, name: true } }
          }
        }
      }
    })

    await logAuditEvent({
      tenantId,
      action: 'staff_update',
      entityType: 'promo_code',
      entityId: promo.id,
      notes: `Created promo code: ${promo.code} (${promo.discountType})`
    })

    return NextResponse.json(promo, { status: 201 })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to create promo code'
    console.error('Failed to create promo code:', error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
