import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { ensureDefaultAccounts } from '@/lib/accounting'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    await ensureDefaultAccounts(tenantId)

    const accounts = await prisma.account.findMany({
      where: { tenantId },
      orderBy: { code: 'asc' },
      include: {
        children: true,
        parent: true
      }
    })

    return NextResponse.json(accounts)
  } catch (error: any) {
    console.error('Failed to fetch accounts:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    await ensureDefaultAccounts(tenantId)

    const body = await request.json()
    const { code, name, type, category, description, parentId } = body

    if (!code || !name || !type || !category) {
      return NextResponse.json({ error: 'Code, Name, Type, and Category are required' }, { status: 400 })
    }

    // Check code uniqueness within tenant
    const existing = await prisma.account.findUnique({
      where: {
        tenantId_code: {
          tenantId,
          code
        }
      }
    })

    if (existing) {
      return NextResponse.json({ error: `Account with code ${code} already exists` }, { status: 400 })
    }

    const account = await prisma.account.create({
      data: {
        tenantId,
        code,
        name,
        type,
        category,
        description,
        parentId: parentId || null,
        isSystem: false,
        isActive: true
      }
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create account:', error)
    return NextResponse.json({ error: error.message || 'Failed to create account' }, { status: 500 })
  }
}
