import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { STARTER_TEMPLATES } from '@/lib/onboarding/starter-templates'
import { logAuditEvent } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { templateId, tableCount, tableCapacity = 4 } = body

    const template = STARTER_TEMPLATES.find(t => t.id === templateId)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Apply template categories, items, ingredients, recipes, and optional tables inside a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Process Categories and Items
      for (const cat of template.categories) {
        const createdCat = await tx.category.create({
          data: {
            tenantId,
            name: cat.name,
            description: cat.description
          }
        })

        for (const item of cat.items) {
          const createdItem = await tx.menuItem.create({
            data: {
              tenantId,
              name: item.name,
              description: item.description,
              price: item.price,
              categoryId: createdCat.id,
              prepTime: item.prepTime || null,
              calories: item.calories || null,
              dietaryTags: item.dietaryTags || null,
              allergens: item.allergens || null,
              isAvailable: true
            }
          })

          // Create starter inventory
          await tx.inventory.create({
            data: {
              menuItemId: createdItem.id,
              quantity: 50,
              unit: 'pieces',
              lowStockThreshold: 10,
              lastRestocked: new Date()
            }
          })

          // Process ingredients & recipes if defined in template
          if (item.ingredients && item.ingredients.length > 0) {
            for (const ing of item.ingredients) {
              // Upsert ingredient
              const ingredient = await tx.ingredient.upsert({
                where: {
                  tenantId_name: {
                    tenantId,
                    name: ing.name
                  }
                },
                update: {
                  unit: ing.unit,
                  costPerUnit: ing.costPerUnit || 0,
                  lowStockThreshold: ing.lowStockThreshold || 10
                },
                create: {
                  tenantId,
                  name: ing.name,
                  unit: ing.unit,
                  quantity: 10000, // Seed initial raw stock
                  costPerUnit: ing.costPerUnit || 0,
                  lowStockThreshold: ing.lowStockThreshold || 10,
                  lastRestocked: new Date()
                }
              })

              // Create Recipe link
              await tx.recipe.upsert({
                where: {
                  menuItemId_ingredientId: {
                    menuItemId: createdItem.id,
                    ingredientId: ingredient.id
                  }
                },
                update: {
                  quantity: ing.quantity
                },
                create: {
                  menuItemId: createdItem.id,
                  ingredientId: ingredient.id,
                  quantity: ing.quantity
                }
              })
            }
          }
        }
      }

      // 2. Generate Tables if requested
      const count = parseInt(String(tableCount), 10)
      if (!isNaN(count) && count > 0) {
        const capacity = parseInt(String(tableCapacity), 10) || 4
        for (let i = 1; i <= count; i++) {
          const existingTable = await tx.restaurantTable.findUnique({
            where: {
              tenantId_number: {
                tenantId,
                number: i
              }
            }
          })

          if (!existingTable) {
            await tx.restaurantTable.create({
              data: {
                tenantId,
                number: i,
                name: `Table ${i}`,
                capacity,
                isActive: true
              }
            })
          }
        }
      }
    })

    await logAuditEvent({
      tenantId,
      action: 'staff_update',
      entityType: 'onboarding',
      notes: `Applied starter template: ${template.name} with ${tableCount || 0} tables`
    })

    return NextResponse.json({ success: true, template: template.name })
  } catch (error: any) {
    console.error('Failed to apply starter template:', error)
    return NextResponse.json({ error: error.message || 'Failed to apply template' }, { status: 500 })
  }
}
