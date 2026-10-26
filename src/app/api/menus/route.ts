import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)

    // Check if tenant has any menus; if none, initialize default 3 menus
    let menus = await prisma.menu.findMany({
      where: { tenantId },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    if (menus.length === 0) {
      // Auto-create default 3 menus for cafe
      const existingItems = await prisma.menuItem.findMany({
        where: { tenantId }
      })

      const defaultMenusData = [
        {
          name: 'In-House Dine-In Menu',
          slug: 'in-house',
          description: 'Specialty coffee brews, artisan pastries, and kitchen dishes served right to your table.',
          type: 'dine_in',
          isActive: true,
          badgeText: 'Table Contactless Ordering • Free WiFi',
          qrColor: '#0f172a',
          orderingEnabled: true
        },
        {
          name: 'Takeaway & Direct Delivery',
          slug: 'delivery',
          description: 'Packaged with thermal freshness. Order for counter pickup or fast direct delivery.',
          type: 'delivery',
          isActive: true,
          badgeText: 'Direct Order • Pickup or Doorstep Delivery',
          qrColor: '#059669',
          orderingEnabled: true
        },
        {
          name: 'Delivery Apps (Aggregators)',
          slug: 'apps',
          description: 'Optimized combos and express packaging for third-party courier delivery.',
          type: 'apps',
          isActive: true,
          badgeText: 'Find Us on UberEats, Deliveroo & Talabat',
          qrColor: '#ea580c',
          orderingEnabled: false
        }
      ]

      for (const mData of defaultMenusData) {
        const createdMenu = await prisma.menu.create({
          data: {
            tenantId,
            ...mData
          }
        })

        // Attach existing items to the menu
        if (existingItems.length > 0) {
          await prisma.menuOnItem.createMany({
            data: existingItems.map((item, idx) => ({
              menuId: createdMenu.id,
              menuItemId: item.id,
              customPrice: mData.type === 'apps' ? Math.round((item.price * 1.15) * 100) / 100 : null,
              sortOrder: idx,
              isAvailable: true
            }))
          })
        }
      }

      menus = await prisma.menu.findMany({
        where: { tenantId },
        include: {
          items: {
            include: {
              menuItem: {
                include: {
                  category: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      })
    }

    return NextResponse.json(menus)
  } catch (error: any) {
    console.error('Error fetching menus:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch menus' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const {
      name,
      slug,
      description,
      type = 'dine_in',
      isActive = true,
      badgeText,
      qrColor = '#09090b',
      orderingEnabled = true
    } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Menu name is required' }, { status: 400 })
    }

    // Generate or clean slug
    const cleanSlug = (slug || name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if slug is unique for this tenant
    const existing = await prisma.menu.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug: cleanSlug
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: 'A menu with this URL slug already exists' }, { status: 400 })
    }

    const newMenu = await prisma.menu.create({
      data: {
        tenantId,
        name: name.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        type,
        isActive: Boolean(isActive),
        badgeText: badgeText?.trim() || null,
        qrColor: qrColor || '#09090b',
        orderingEnabled: Boolean(orderingEnabled)
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(newMenu)
  } catch (error: any) {
    console.error('Error creating menu:', error)
    return NextResponse.json({ error: error.message || 'Failed to create menu' }, { status: 500 })
  }
}
