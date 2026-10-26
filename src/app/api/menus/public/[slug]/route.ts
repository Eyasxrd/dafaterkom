import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    // Find the menu by slug
    const menu = await prisma.menu.findFirst({
      where: {
        slug: slug.toLowerCase().trim()
      },
      include: {
        tenant: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            currency: true,
            taxRate: true,
            receiptHeader: true,
            receiptFooter: true
          }
        },
        items: {
          where: { isAvailable: true },
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
      return NextResponse.json({ error: 'Menu not found or inactive' }, { status: 404 })
    }

    // Structure items grouped by category
    const categoriesMap = new Map<string, { id: string; name: string; description: string | null; items: any[] }>()

    for (const link of menu.items) {
      const item = link.menuItem
      if (!item || !item.isAvailable) continue

      const catId = item.categoryId || 'uncategorized'
      const catName = item.category?.name || 'General'
      const catDesc = item.category?.description || null

      if (!categoriesMap.has(catId)) {
        categoriesMap.set(catId, {
          id: catId,
          name: catName,
          description: catDesc,
          items: []
        })
      }

      // Parse JSON strings safely
      let parsedDietaryTags: string[] = []
      let parsedAllergens: string[] = []
      let parsedVariants: any[] = []
      let parsedOptions: any = null

      try {
        if (item.dietaryTags) parsedDietaryTags = JSON.parse(item.dietaryTags)
      } catch {
        parsedDietaryTags = item.dietaryTags ? item.dietaryTags.split(',').map((s) => s.trim()) : []
      }

      try {
        if (item.allergens) parsedAllergens = JSON.parse(item.allergens)
      } catch {
        parsedAllergens = item.allergens ? item.allergens.split(',').map((s) => s.trim()) : []
      }

      try {
        if (item.variants) parsedVariants = JSON.parse(item.variants)
      } catch {}

      try {
        if (item.options) parsedOptions = JSON.parse(item.options)
      } catch {}

      // Effective price (customPrice from menu if specified, otherwise base price)
      const effectivePrice = link.customPrice !== null && link.customPrice !== undefined ? link.customPrice : item.price

      categoriesMap.get(catId)!.items.push({
        id: item.id,
        name: item.name,
        description: item.description,
        ingredients: item.ingredients,
        price: effectivePrice,
        basePrice: item.price,
        hasPriceOverride: link.customPrice !== null && link.customPrice !== undefined,
        imageUrl: item.imageUrl,
        dietaryTags: parsedDietaryTags,
        allergens: parsedAllergens,
        calories: item.calories,
        prepTime: item.prepTime,
        variants: parsedVariants,
        options: parsedOptions,
        categoryId: catId,
        categoryName: catName
      })
    }

    const result = {
      menu: {
        id: menu.id,
        name: menu.name,
        slug: menu.slug,
        description: menu.description,
        type: menu.type,
        badgeText: menu.badgeText,
        currency: menu.currency || menu.tenant.currency || 'USD',
        qrColor: menu.qrColor,
        orderingEnabled: menu.orderingEnabled,
        isActive: menu.isActive
      },
      tenant: menu.tenant,
      categories: Array.from(categoriesMap.values())
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching public menu:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch public menu' }, { status: 500 })
  }
}
