import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { STARTER_TEMPLATES } from '@/lib/onboarding/starter-templates'
import { logAuditEvent } from '@/lib/audit'

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { templateId } = body

    const template = STARTER_TEMPLATES.find(t => t.id === templateId)
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    // Apply template categories and items inside a transaction
    await prisma.$transaction(async (tx) => {
      for (const cat of template.categories) {
        // Create category
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
        }
      }
    })

    await logAuditEvent({
      tenantId,
      action: 'staff_update',
      entityType: 'onboarding',
      notes: `Applied starter template: ${template.name}`
    })

    return NextResponse.json({ success: true, template: template.name })
  } catch (error: any) {
    console.error('Failed to apply starter template:', error)
    return NextResponse.json({ error: error.message || 'Failed to apply template' }, { status: 500 })
  }
}
