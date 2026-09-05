import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { quantity, unit, lowStockThreshold } = body

    const inventory = await prisma.inventory.update({
      where: { id },
      data: {
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(unit !== undefined && { unit }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold) }),
        ...(quantity !== undefined && { lastRestocked: new Date() })
      },
      include: {
        menuItem: true
      }
    })

    return NextResponse.json(inventory)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.inventory.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete inventory' }, { status: 500 })
  }
}
