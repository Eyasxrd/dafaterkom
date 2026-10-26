import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { createJournalEntry, ensureDefaultAccounts } from '@/lib/accounting'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    await ensureDefaultAccounts(tenantId)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const referenceType = searchParams.get('referenceType') || ''
    const status = searchParams.get('status') || ''
    const accountId = searchParams.get('accountId') || ''
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const where: any = { tenantId }

    if (referenceType && referenceType !== 'all') {
      where.referenceType = referenceType
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }

    if (search) {
      where.OR = [
        { entryNumber: { contains: search } },
        { narration: { contains: search } }
      ]
    }

    if (accountId) {
      where.lines = {
        some: {
          accountId
        }
      }
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    })

    const totalCount = await prisma.journalEntry.count({ where })

    return NextResponse.json({
      entries,
      totalCount
    })
  } catch (error: any) {
    console.error('Failed to fetch journal entries:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch journal entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { date, narration, lines, createdBy, referenceType, referenceId } = body

    if (!narration || !lines || lines.length < 2) {
      return NextResponse.json({ error: 'Narration and at least two journal entry lines are required' }, { status: 400 })
    }

    const entry = await createJournalEntry({
      tenantId,
      date: date ? new Date(date) : new Date(),
      referenceType: referenceType || 'manual',
      referenceId,
      narration,
      createdBy: createdBy || 'Accountant',
      lines
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create journal entry:', error)
    return NextResponse.json({ error: error.message || 'Failed to create journal entry' }, { status: 400 })
  }
}
