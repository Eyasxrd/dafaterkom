import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { generateVoucherNumber, postExpenseVoucherJournal } from '@/lib/accounting'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = { tenantId }

    if (category && category !== 'all') {
      where.category = category
    }

    if (status && status !== 'all') {
      where.status = status
    }

    if (startDate || endDate) {
      where.paymentDate = {}
      if (startDate) where.paymentDate.gte = new Date(startDate)
      if (endDate) where.paymentDate.lte = new Date(endDate)
    }

    const expenses = await prisma.expenseVoucher.findMany({
      where,
      orderBy: { paymentDate: 'desc' },
      include: {
        account: true,
        paidFromAccount: true
      }
    })

    const summaryAgg = await prisma.expenseVoucher.aggregate({
      where: {
        ...where,
        status: { not: 'cancelled' }
      },
      _sum: {
        amount: true,
        taxAmount: true,
        totalAmount: true
      },
      _count: {
        id: true
      }
    })

    return NextResponse.json({
      expenses,
      summary: {
        totalAmount: summaryAgg._sum.totalAmount || 0,
        subtotal: summaryAgg._sum.amount || 0,
        taxAmount: summaryAgg._sum.taxAmount || 0,
        count: summaryAgg._count.id
      }
    })
  } catch (error: any) {
    console.error('Failed to fetch expenses:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const {
      title,
      category,
      amount,
      taxAmount = 0,
      paymentMethod = 'cash',
      paymentDate,
      accountId,
      paidFromAccountId,
      payee,
      referenceNumber,
      receiptUrl,
      notes
    } = body

    if (!title || !category || amount === undefined || amount <= 0) {
      return NextResponse.json({ error: 'Title, category, and valid positive amount are required' }, { status: 400 })
    }

    const totalAmount = Number(amount) + Number(taxAmount || 0)
    const voucherNumber = await generateVoucherNumber(tenantId)

    const voucher = await prisma.expenseVoucher.create({
      data: {
        tenantId,
        voucherNumber,
        title,
        category,
        amount: Number(amount),
        taxAmount: Number(taxAmount || 0),
        totalAmount,
        paymentMethod,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        accountId: accountId || null,
        paidFromAccountId: paidFromAccountId || null,
        payee: payee || null,
        referenceNumber: referenceNumber || null,
        receiptUrl: receiptUrl || null,
        notes: notes || null,
        status: 'paid'
      }
    })

    // Auto-post double-entry journal for this expense voucher
    try {
      await postExpenseVoucherJournal(voucher.id, tenantId)
    } catch (journalErr) {
      console.error('Warning: Failed to auto-post journal for expense voucher:', journalErr)
    }

    return NextResponse.json(voucher, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create expense voucher:', error)
    return NextResponse.json({ error: error.message || 'Failed to create expense voucher' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Voucher ID is required' }, { status: 400 })
    }

    // Cancel voucher and void journal entry
    const voucher = await prisma.expenseVoucher.update({
      where: { id },
      data: { status: 'cancelled' }
    })

    await prisma.journalEntry.updateMany({
      where: {
        tenantId,
        referenceType: 'expense_voucher',
        referenceId: id
      },
      data: { status: 'void' }
    })

    return NextResponse.json({ success: true, voucher })
  } catch (error: any) {
    console.error('Failed to cancel expense voucher:', error)
    return NextResponse.json({ error: error.message || 'Failed to cancel expense voucher' }, { status: 500 })
  }
}
