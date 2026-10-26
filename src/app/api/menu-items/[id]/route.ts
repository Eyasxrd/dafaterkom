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

    const item = await prisma.menuItem.findFirst({
      where: { id, tenantId },
      include: {
        category: true,
        inventory: true,
        recipes: {
          include: {
            ingredient: true
          }
        },
        menus: {
          include: {
            menu: true
          }
        }
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch item' }, { status: 500 })
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
      price,
      categoryId,
      imageUrl,
      isAvailable,
      ingredients,
      dietaryTags,
      allergens,
      calories,
      prepTime,
      variants,
      options,
      recipes, // Array of { ingredientId: string, quantity: number }
      menuAssignments // Array of { menuId, customPrice }
    } = body

    const existing = await prisma.menuItem.findFirst({
      where: { id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const formattedDietaryTags = dietaryTags !== undefined
      ? (Array.isArray(dietaryTags) ? JSON.stringify(dietaryTags) : dietaryTags)
      : undefined

    const formattedAllergens = allergens !== undefined
      ? (Array.isArray(allergens) ? JSON.stringify(allergens) : allergens)
      : undefined

    const formattedVariants = variants !== undefined
      ? (Array.isArray(variants) ? JSON.stringify(variants) : variants)
      : undefined

    const formattedOptions = options !== undefined
      ? (typeof options === 'object' && options !== null ? JSON.stringify(options) : options)
      : undefined

    await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(ingredients !== undefined && { ingredients: ingredients?.trim() || null }),
        ...(formattedDietaryTags !== undefined && { dietaryTags: formattedDietaryTags }),
        ...(formattedAllergens !== undefined && { allergens: formattedAllergens }),
        ...(calories !== undefined && { calories: calories ? parseInt(calories) : null }),
        ...(prepTime !== undefined && { prepTime: prepTime ? parseInt(prepTime) : null }),
        ...(formattedVariants !== undefined && { variants: formattedVariants }),
        ...(formattedOptions !== undefined && { options: formattedOptions })
      }
    })

    // If recipes array provided, replace existing recipes
    if (Array.isArray(recipes)) {
      await prisma.recipe.deleteMany({
        where: { menuItemId: id }
      })

      const validRecipes = recipes
        .filter((r: any) => r && r.ingredientId && parseFloat(r.quantity) > 0)
        .map((r: any) => ({
          menuItemId: id,
          ingredientId: r.ingredientId,
          quantity: parseFloat(r.quantity)
        }))

      if (validRecipes.length > 0) {
        await prisma.recipe.createMany({
          data: validRecipes
        })
      }
    }

    // If menu assignments provided, update them
    if (Array.isArray(menuAssignments)) {
      await prisma.menuOnItem.deleteMany({
        where: { menuItemId: id }
      })

      if (menuAssignments.length > 0) {
        await prisma.menuOnItem.createMany({
          data: menuAssignments.map((assignment: any, idx: number) => ({
            menuId: typeof assignment === 'string' ? assignment : assignment.menuId,
            menuItemId: id,
            customPrice: typeof assignment === 'object' && assignment.customPrice !== undefined ? assignment.customPrice : null,
            sortOrder: idx,
            isAvailable: true
          }))
        })
      }
    }

    const updatedItem = await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
        recipes: {
          include: {
            ingredient: true
          }
        },
        menus: {
          include: {
            menu: true
          }
        }
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error: any) {
    console.error('Failed to update menu item:', error)
    return NextResponse.json({ error: error.message || 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tenantId = getTenantIdFromRequest(request)

    const existing = await prisma.menuItem.findFirst({
      where: { id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    await prisma.menuItem.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Item deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete item' }, { status: 500 })
  }
}
