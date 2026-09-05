import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { name, capacity, isActive } = body

    const updated = await prisma.restaurantTable.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(capacity !== undefined && { capacity: parseInt(capacity, 10) }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Failed to update table:', error)
    return NextResponse.json({ error: 'Failed to update table' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantId = getTenantIdFromRequest(request)

    const table = await prisma.restaurantTable.findUnique({
      where: { id }
    })

    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    // Check if table currently has an active dining order
    const activeOrder = await prisma.order.findFirst({
      where: {
        tenantId,
        tableNumber: table.number,
        orderStatus: { in: ['pending', 'preparing', 'ready'] }
      }
    })

    if (activeOrder) {
      return NextResponse.json(
        { error: `Cannot delete Table #${table.number} while order ${activeOrder.orderNumber} is active.` },
        { status: 400 }
      )
    }

    await prisma.restaurantTable.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete table:', error)
    return NextResponse.json({ error: 'Failed to delete table' }, { status: 500 })
  }
}
