import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, quantity, unit, lowStockThreshold } = body

    const ingredient = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(quantity !== undefined && { quantity: parseFloat(quantity) }),
        ...(unit && { unit }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: parseFloat(lowStockThreshold) }),
        ...(quantity !== undefined && { lastRestocked: new Date() })
      }
    })

    return NextResponse.json(ingredient)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update ingredient' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check if ingredient is used in any recipes
    const recipesCount = await prisma.recipe.count({
      where: { ingredientId: id }
    })

    if (recipesCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete ingredient that is used in recipes' },
        { status: 400 }
      )
    }

    await prisma.ingredient.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete ingredient' }, { status: 500 })
  }
}