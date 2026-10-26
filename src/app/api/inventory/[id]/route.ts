import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, description, quantity, unit, lowStockThreshold, costPerUnit } = body

    const existing = await prisma.ingredient.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Ingredient inventory record not found' }, { status: 404 })
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(quantity !== undefined && { quantity: Math.max(0, parseFloat(quantity)) }),
        ...(unit !== undefined && { unit: unit.trim() }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: Math.max(0, parseFloat(lowStockThreshold)) }),
        ...(costPerUnit !== undefined && { costPerUnit: Math.max(0, parseFloat(costPerUnit)) }),
        ...(quantity !== undefined && { lastRestocked: new Date() })
      },
      include: {
        recipes: {
          include: {
            menuItem: true
          }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Failed to update inventory ingredient:', error)
    return NextResponse.json({ error: error?.message || 'Failed to update inventory' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if ingredient is used in active recipes
    const recipesCount = await prisma.recipe.count({
      where: { ingredientId: id }
    })

    if (recipesCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete ingredient because it is formulated in ${recipesCount} recipe(s). Please remove it from recipes first.` },
        { status: 400 }
      )
    }

    await prisma.ingredient.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete inventory ingredient:', error)
    return NextResponse.json({ error: error?.message || 'Failed to delete inventory item' }, { status: 500 })
  }
}
