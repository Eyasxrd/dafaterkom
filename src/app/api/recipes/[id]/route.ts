import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { quantity, sizeMultipliers, isOptional } = body

    const dataToUpdate: any = {}
    if (quantity !== undefined) {
      dataToUpdate.quantity = parseFloat(quantity)
    }
    if (sizeMultipliers !== undefined) {
      dataToUpdate.sizeMultipliers = typeof sizeMultipliers === 'object' && sizeMultipliers !== null
        ? JSON.stringify(sizeMultipliers)
        : typeof sizeMultipliers === 'string'
        ? sizeMultipliers
        : null
    }
    if (isOptional !== undefined) {
      dataToUpdate.isOptional = Boolean(isOptional)
    }

    const recipe = await prisma.recipe.update({
      where: { id },
      data: dataToUpdate,
      include: {
        ingredient: true,
        menuItem: true
      }
    })

    return NextResponse.json(recipe)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.recipe.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete recipe' }, { status: 500 })
  }
}