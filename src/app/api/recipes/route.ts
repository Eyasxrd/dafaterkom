import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const menuItemId = searchParams.get('menuItemId')

    const recipes = await prisma.recipe.findMany({
      where: menuItemId ? { menuItemId } : undefined,
      include: {
        ingredient: true,
        menuItem: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })
    return NextResponse.json(recipes)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { menuItemId, ingredientId, quantity } = body

    if (!menuItemId || !ingredientId) {
      return NextResponse.json({ error: 'Menu item ID and ingredient ID are required' }, { status: 400 })
    }

    const qty = parseFloat(quantity)
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantity must be greater than 0' }, { status: 400 })
    }

    // Upsert so if ingredient is already on this recipe, we update its quantity
    const recipe = await prisma.recipe.upsert({
      where: {
        menuItemId_ingredientId: {
          menuItemId,
          ingredientId
        }
      },
      update: {
        quantity: qty
      },
      create: {
        menuItemId,
        ingredientId,
        quantity: qty
      },
      include: {
        ingredient: true,
        menuItem: true
      }
    })

    return NextResponse.json(recipe)
  } catch (error) {
    console.error('Failed to create/update recipe:', error)
    return NextResponse.json({ error: 'Failed to save recipe item' }, { status: 500 })
  }
}
