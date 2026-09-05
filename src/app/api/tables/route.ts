import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    
    let tables = await prisma.restaurantTable.findMany({
      where: { tenantId, isActive: true },
      orderBy: { number: 'asc' }
    })

    // If tenant has no tables yet, seed default tables 1 to 12
    if (tables.length === 0) {
      const defaultTables = Array.from({ length: 12 }, (_, i) => ({
        tenantId,
        number: i + 1,
        name: `Table ${i + 1}`,
        capacity: 4,
        isActive: true
      }))

      await prisma.restaurantTable.createMany({
        data: defaultTables
      })

      tables = await prisma.restaurantTable.findMany({
        where: { tenantId, isActive: true },
        orderBy: { number: 'asc' }
      })
    }

    return NextResponse.json(tables)
  } catch (error) {
    console.error('Failed to fetch tables:', error)
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { number, name, capacity } = body

    const tableNum = parseInt(number, 10)
    if (isNaN(tableNum) || tableNum <= 0) {
      return NextResponse.json({ error: 'Valid table number is required' }, { status: 400 })
    }

    const existing = await prisma.restaurantTable.findUnique({
      where: {
        tenantId_number: {
          tenantId,
          number: tableNum
        }
      }
    })

    if (existing) {
      if (!existing.isActive) {
        // Reactivate if it was soft-deleted
        const reactivated = await prisma.restaurantTable.update({
          where: { id: existing.id },
          data: {
            isActive: true,
            name: name?.trim() || existing.name || `Table ${tableNum}`,
            capacity: capacity ? parseInt(capacity, 10) : existing.capacity
          }
        })
        return NextResponse.json(reactivated)
      }
      return NextResponse.json({ error: `Table #${tableNum} already exists` }, { status: 409 })
    }

    const table = await prisma.restaurantTable.create({
      data: {
        tenantId,
        number: tableNum,
        name: name?.trim() || `Table ${tableNum}`,
        capacity: capacity ? parseInt(capacity, 10) : 4,
        isActive: true
      }
    })

    return NextResponse.json(table, { status: 201 })
  } catch (error) {
    console.error('Failed to create table:', error)
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
}
