import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const ingredients = await prisma.ingredient.findMany({
      where: { tenantId },
      orderBy: {
        name: 'asc'
      }
    })
    return NextResponse.json(ingredients)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch ingredients' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { name, description, quantity, unit, lowStockThreshold } = body

    const ingredient = await prisma.ingredient.create({
      data: {
        tenantId,
        name,
        description,
        quantity: parseFloat(quantity) || 0,
        unit,
        lowStockThreshold: parseFloat(lowStockThreshold) || 10,
        lastRestocked: new Date()
      }
    })

    return NextResponse.json(ingredient)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ingredient' }, { status: 500 })
  }
}
