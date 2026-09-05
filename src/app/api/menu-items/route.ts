import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const menuItems = await prisma.menuItem.findMany({
      where: { tenantId },
      include: {
        category: true,
        inventory: true,
        recipes: {
          include: {
            ingredient: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    return NextResponse.json(menuItems)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { name, description, price, categoryId, imageUrl, isAvailable } = body

    const menuItem = await prisma.menuItem.create({
      data: {
        tenantId,
        name,
        description,
        price: parseFloat(price),
        categoryId,
        imageUrl,
        isAvailable: isAvailable !== undefined ? isAvailable : true
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(menuItem)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create menu item' }, { status: 500 })
  }
}
