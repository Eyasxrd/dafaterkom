import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { code, subtotal = 0 } = body

    const normalizedCode = code ? String(code).trim().toUpperCase() : ''
    if (!normalizedCode) {
      return NextResponse.json({ valid: false, error: 'Promo code cannot be empty' }, { status: 400 })
    }

    const orderSubtotal = Math.max(0, parseFloat(subtotal) || 0)

    // Lookup promo code in database
    const promo = await prisma.promoCode.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code: normalizedCode
        }
      },
      include: {
        freeItem: {
          select: {
            id: true,
            name: true,
            price: true,
            imageUrl: true,
            isAvailable: true,
            category: { select: { id: true, name: true } }
          }
        }
      }
    })

    // If not found in DB, check legacy demo codes for backward compatibility
    if (!promo) {
      const legacyPromos: Record<string, { type: string; percent?: number; amount?: number; desc: string }> = {
        WELCOME10: { type: 'percentage', percent: 10, desc: '10% Welcome Discount' },
        SUMMER20: { type: 'percentage', percent: 20, desc: '20% Summer Discount' },
        VIP15: { type: 'percentage', percent: 15, desc: '15% VIP Discount' },
        HAPPYHOUR: { type: 'percentage', percent: 25, desc: '25% Happy Hour Discount' },
        COFFEE5: { type: 'fixed_amount', amount: 5.0, desc: '$5.00 Off' }
      }

      const legacy = legacyPromos[normalizedCode]
      if (legacy) {
        let discount = 0
        if (legacy.type === 'percentage' && legacy.percent) {
          discount = Math.round((orderSubtotal * (legacy.percent / 100)) * 100) / 100
        } else if (legacy.type === 'fixed_amount' && legacy.amount) {
          discount = Math.min(orderSubtotal, legacy.amount)
        }

        return NextResponse.json({
          valid: true,
          promo: {
            id: `legacy-${normalizedCode}`,
            code: normalizedCode,
            description: legacy.desc,
            discountType: legacy.type,
            discountPercent: legacy.percent || null,
            discountAmount: legacy.amount || null,
            freeItemId: null,
            freeItem: null,
            minOrderAmount: 0,
            maxDiscount: null
          },
          discount,
          freeItem: null
        })
      }

      return NextResponse.json({
        valid: false,
        error: `Promo code "${normalizedCode}" is not recognized`
      }, { status: 404 })
    }

    // Check active status
    if (!promo.isActive) {
      return NextResponse.json({
        valid: false,
        error: `Promo code "${normalizedCode}" is currently inactive`
      }, { status: 400 })
    }

    // Check date boundaries
    const now = new Date()
    if (promo.startDate && now < new Date(promo.startDate)) {
      return NextResponse.json({
        valid: false,
        error: `Promo code "${normalizedCode}" is not valid yet`
      }, { status: 400 })
    }

    if (promo.endDate && now > new Date(promo.endDate)) {
      return NextResponse.json({
        valid: false,
        error: `Promo code "${normalizedCode}" expired on ${new Date(promo.endDate).toLocaleDateString()}`
      }, { status: 400 })
    }

    // Check usage limit
    if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit) {
      return NextResponse.json({
        valid: false,
        error: `Promo code "${normalizedCode}" has reached its maximum usage limit`
      }, { status: 400 })
    }

    // Check minimum spend
    if (promo.minOrderAmount && orderSubtotal < promo.minOrderAmount) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount of $${promo.minOrderAmount.toFixed(2)} required to use "${normalizedCode}"`
      }, { status: 400 })
    }

    // Calculate discount value
    let discount = 0
    let freeItem = null

    if (promo.discountType === 'percentage' && promo.discountPercent) {
      discount = Math.round((orderSubtotal * (promo.discountPercent / 100)) * 100) / 100
      if (promo.maxDiscount && discount > promo.maxDiscount) {
        discount = promo.maxDiscount
      }
    } else if (promo.discountType === 'fixed_amount' && promo.discountAmount) {
      discount = Math.min(orderSubtotal, promo.discountAmount)
    } else if (promo.discountType === 'free_item') {
      freeItem = promo.freeItem
      discount = 0 // Item is added as free line item
    }

    return NextResponse.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        description: promo.description,
        discountType: promo.discountType,
        discountPercent: promo.discountPercent,
        discountAmount: promo.discountAmount,
        freeItemId: promo.freeItemId,
        freeItem: promo.freeItem,
        minOrderAmount: promo.minOrderAmount,
        maxDiscount: promo.maxDiscount
      },
      discount,
      freeItem
    })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to validate promo code'
    console.error('Promo validation error:', error)
    return NextResponse.json({ valid: false, error: errorMsg }, { status: 500 })
  }
}
