import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { logAuditEvent } from '@/lib/audit'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await context.params
    const body = await request.json()

    const existing = await prisma.promoCode.findFirst({
      where: { id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
    }

    const {
      description,
      discountType,
      discountPercent,
      discountAmount,
      freeItemId,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      startDate,
      endDate,
      isActive
    } = body

    // Validation if type or values are updated
    const targetType = discountType || existing.discountType

    if (targetType === 'percentage' && discountPercent !== undefined) {
      const pct = parseFloat(discountPercent)
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        return NextResponse.json({ error: 'Discount percentage must be between 1 and 100' }, { status: 400 })
      }
    }

    if (targetType === 'free_item' && freeItemId !== undefined) {
      if (freeItemId) {
        const itemExists = await prisma.menuItem.findFirst({
          where: { id: freeItemId, tenantId }
        })
        if (!itemExists) {
          return NextResponse.json({ error: 'Selected free menu item not found' }, { status: 404 })
        }
      }
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data: {
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        discountType: targetType,
        discountPercent: targetType === 'percentage'
          ? (discountPercent !== undefined ? parseFloat(discountPercent) : existing.discountPercent)
          : null,
        discountAmount: targetType === 'fixed_amount'
          ? (discountAmount !== undefined ? parseFloat(discountAmount) : existing.discountAmount)
          : null,
        freeItemId: targetType === 'free_item'
          ? (freeItemId !== undefined ? freeItemId : existing.freeItemId)
          : null,
        minOrderAmount: minOrderAmount !== undefined ? (parseFloat(minOrderAmount) || 0) : existing.minOrderAmount,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? parseFloat(maxDiscount) : null) : existing.maxDiscount,
        usageLimit: usageLimit !== undefined ? (usageLimit ? parseInt(usageLimit) : null) : existing.usageLimit,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive
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
      entityId: updated.id,
      beforeValue: existing,
      afterValue: updated,
      notes: `Updated promo code: ${updated.code}`
    })

    return NextResponse.json(updated)
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to update promo code'
    console.error('Failed to update promo code:', error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await context.params

    const existing = await prisma.promoCode.findFirst({
      where: { id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Promo code not found' }, { status: 404 })
    }

    await prisma.promoCode.delete({
      where: { id }
    })

    await logAuditEvent({
      tenantId,
      action: 'staff_update',
      entityType: 'promo_code',
      entityId: id,
      beforeValue: existing,
      notes: `Deleted promo code: ${existing.code}`
    })

    return NextResponse.json({ success: true, message: `Promo code ${existing.code} deleted` })
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to delete promo code'
    console.error('Failed to delete promo code:', error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
