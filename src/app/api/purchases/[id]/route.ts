import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await params

    const invoice = await prisma.purchaseInvoice.findFirst({
      where: { id, tenantId },
      include: {
        supplier: true,
        items: {
          include: {
            ingredient: true,
            menuItem: true
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Purchase invoice not found' }, { status: 404 })
    }

    return NextResponse.json(invoice)
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch purchase invoice' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await params
    const body = await request.json()
    const { status, notes, dueDate } = body

    const existing = await prisma.purchaseInvoice.findFirst({
      where: { id, tenantId },
      include: { items: true }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const wasReceived = existing.status === 'received'
    const willBeReceived = status === 'received'

    const updated = await prisma.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.update({
        where: { id },
        data: {
          ...(status && { status }),
          ...(notes !== undefined && { notes: notes?.trim() || null }),
          ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null })
        },
        include: {
          supplier: true,
          items: true
        }
      })

      // If transitioning to received, auto replenish stock
      if (!wasReceived && willBeReceived) {
        for (const it of existing.items) {
          if (it.ingredientId) {
            await tx.ingredient.update({
              where: { id: it.ingredientId },
              data: {
                quantity: { increment: it.quantity },
                costPerUnit: it.unitPrice > 0 ? it.unitPrice : undefined,
                lastRestocked: new Date()
              }
            })
          }
          if (it.menuItemId) {
            const existingInv = await tx.inventory.findUnique({
              where: { menuItemId: it.menuItemId }
            })
            if (existingInv) {
              await tx.inventory.update({
                where: { id: existingInv.id },
                data: {
                  quantity: { increment: Math.round(it.quantity) },
                  lastRestocked: new Date()
                }
              })
            } else {
              await tx.inventory.create({
                data: {
                  menuItemId: it.menuItemId,
                  quantity: Math.round(it.quantity),
                  unit: it.unit || 'pieces',
                  lowStockThreshold: 10,
                  lastRestocked: new Date()
                }
              })
            }
          }
        }
      }

      return invoice
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Failed to update purchase invoice:', error)
    return NextResponse.json({ error: error.message || 'Failed to update invoice' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await params

    await prisma.purchaseInvoice.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete purchase invoice' }, { status: 500 })
  }
}
