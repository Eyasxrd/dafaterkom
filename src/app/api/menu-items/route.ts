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
        },
        menus: {
          include: {
            menu: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    return NextResponse.json(menuItems)
  } catch (error) {
    console.error('Failed to fetch menu items:', error)
    return NextResponse.json({ error: 'Failed to fetch menu items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const {
      name,
      description,
      price,
      categoryId,
      imageUrl,
      isAvailable = true,
      ingredients,
      dietaryTags,
      allergens,
      calories,
      prepTime,
      variants,
      options,
      recipes, // Array of { ingredientId: string, quantity: number }
      menuAssignments // Array of { menuId: string, customPrice?: number | null }
    } = body

    if (!name || price === undefined || !categoryId) {
      return NextResponse.json({ error: 'Name, price, and category are required' }, { status: 400 })
    }

    const formattedDietaryTags = Array.isArray(dietaryTags) ? JSON.stringify(dietaryTags) : (dietaryTags || null)
    const formattedAllergens = Array.isArray(allergens) ? JSON.stringify(allergens) : (allergens || null)
    const formattedVariants = Array.isArray(variants) ? JSON.stringify(variants) : (variants || null)
    const formattedOptions = typeof options === 'object' && options !== null ? JSON.stringify(options) : (options || null)

    const menuItem = await prisma.menuItem.create({
      data: {
        tenantId,
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        categoryId,
        imageUrl: imageUrl?.trim() || null,
        isAvailable: Boolean(isAvailable),
        ingredients: ingredients?.trim() || null,
        dietaryTags: formattedDietaryTags,
        allergens: formattedAllergens,
        calories: calories ? parseInt(calories) : null,
        prepTime: prepTime ? parseInt(prepTime) : null,
        variants: formattedVariants,
        options: formattedOptions
      },
      include: {
        category: true
      }
    })

    // Create recipes / ingredient formulations if provided
    if (Array.isArray(recipes) && recipes.length > 0) {
      const validRecipes = recipes
        .filter((r: any) => r && r.ingredientId && parseFloat(r.quantity) > 0)
        .map((r: any) => ({
          menuItemId: menuItem.id,
          ingredientId: r.ingredientId,
          quantity: parseFloat(r.quantity)
        }))

      if (validRecipes.length > 0) {
        await prisma.recipe.createMany({
          data: validRecipes
        })
      }
    }

    // Attach to menus if specified
    if (Array.isArray(menuAssignments) && menuAssignments.length > 0) {
      await prisma.menuOnItem.createMany({
        data: menuAssignments.map((assignment: any, idx: number) => ({
          menuId: typeof assignment === 'string' ? assignment : assignment.menuId,
          menuItemId: menuItem.id,
          customPrice: typeof assignment === 'object' && assignment.customPrice ? parseFloat(assignment.customPrice) : null,
          sortOrder: idx,
          isAvailable: true
        }))
      })
    } else {
      // By default, link item to all existing menus of this tenant
      const existingMenus = await prisma.menu.findMany({
        where: { tenantId },
        select: { id: true, type: true }
      })
      if (existingMenus.length > 0) {
        await prisma.menuOnItem.createMany({
          data: existingMenus.map((m, idx) => ({
            menuId: m.id,
            menuItemId: menuItem.id,
            customPrice: m.type === 'apps' ? Math.round((parseFloat(price) * 1.15) * 100) / 100 : null,
            sortOrder: idx,
            isAvailable: true
          }))
        })
      }
    }

    const fullItem = await prisma.menuItem.findUnique({
      where: { id: menuItem.id },
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

    return NextResponse.json(fullItem)
  } catch (error: any) {
    console.error('Failed to create menu item:', error)
    return NextResponse.json({ error: error.message || 'Failed to create menu item' }, { status: 500 })
  }
}
