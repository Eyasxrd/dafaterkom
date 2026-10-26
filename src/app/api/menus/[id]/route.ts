import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantId = getTenantIdFromRequest(request)

    const menu = await prisma.menu.findFirst({
      where: { id, tenantId },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    return NextResponse.json(menu)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch menu' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const {
      name,
      description,
      type,
      isActive,
      badgeText,
      qrColor,
      orderingEnabled,
      itemIds // optional array of item ids or [{ menuItemId, customPrice, isAvailable }]
    } = body

    const existing = await prisma.menu.findFirst({
      where: { id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    const updated = await prisma.menu.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(type !== undefined && { type }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(badgeText !== undefined && { badgeText: badgeText?.trim() || null }),
        ...(qrColor !== undefined && { qrColor }),
        ...(orderingEnabled !== undefined && { orderingEnabled: Boolean(orderingEnabled) })
      }
    })

    // If item associations are updated
    if (Array.isArray(itemIds)) {
      // Clear existing associations
      await prisma.menuOnItem.deleteMany({
        where: { menuId: id }
      })

      // Add new associations
      if (itemIds.length > 0) {
        await prisma.menuOnItem.createMany({
          data: itemIds.map((item: any, idx: number) => {
            const menuItemId = typeof item === 'string' ? item : item.menuItemId
            const customPrice = typeof item === 'object' && item.customPrice !== undefined ? item.customPrice : null
            const isAvailable = typeof item === 'object' && item.isAvailable !== undefined ? item.isAvailable : true
            return {
              menuId: id,
              menuItemId,
              customPrice,
              sortOrder: idx,
              isAvailable
            }
          })
        })
      }
    }

    const fullMenu = await prisma.menu.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    return NextResponse.json(fullMenu)
  } catch (error: any) {
    console.error('Error updating menu:', error)
    return NextResponse.json({ error: error.message || 'Failed to update menu' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantId = getTenantIdFromRequest(request)

    const existing = await prisma.menu.findFirst({
      where: { id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
    }

    await prisma.menu.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Menu deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete menu' }, { status: 500 })
  }
}
