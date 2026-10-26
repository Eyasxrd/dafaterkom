import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await params

    const supplier = await prisma.supplier.findFirst({
      where: { id, tenantId },
      include: {
        purchaseInvoices: {
          include: {
            items: true,
            payments: true
          },
          orderBy: { issueDate: 'desc' }
        },
        payments: {
          include: {
            purchaseInvoice: {
              select: { invoiceNumber: true }
            }
          },
          orderBy: { paymentDate: 'desc' }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Build chronological transaction ledger for Account Statement
    type LedgerTransaction = {
      id: string
      date: string
      type: 'invoice' | 'payment'
      reference: string
      description: string
      debit: number    // What we owe (+)
      credit: number   // What we paid (-)
      runningBalance: number
      paymentMethod?: string
      dueDate?: string | null
      paymentStatus?: string
    }

    const rawTransactions: Array<{
      id: string
      date: Date
      type: 'invoice' | 'payment'
      reference: string
      description: string
      debit: number
      credit: number
      paymentMethod?: string
      dueDate?: string | null
      paymentStatus?: string
    }> = []

    for (const inv of supplier.purchaseInvoices) {
      rawTransactions.push({
        id: inv.id,
        date: new Date(inv.issueDate),
        type: 'invoice',
        reference: inv.invoiceNumber,
        description: `Purchase Invoice (${inv.items.length} items)`,
        debit: inv.totalAmount,
        credit: 0,
        dueDate: inv.dueDate ? inv.dueDate.toISOString() : null,
        paymentStatus: inv.paymentStatus
      })
    }

    for (const pay of supplier.payments) {
      rawTransactions.push({
        id: pay.id,
        date: new Date(pay.paymentDate),
        type: 'payment',
        reference: pay.referenceNumber || (pay.purchaseInvoice ? `For #${pay.purchaseInvoice.invoiceNumber}` : 'Payment'),
        description: pay.notes || `Payment via ${pay.paymentMethod}`,
        debit: 0,
        credit: pay.amount,
        paymentMethod: pay.paymentMethod
      })
    }

    // Sort ascending by date to calculate accurate running balance
    rawTransactions.sort((a, b) => a.date.getTime() - b.date.getTime())

    let currentBalance = 0
    const ledger: LedgerTransaction[] = rawTransactions.map((tx) => {
      currentBalance += (tx.debit - tx.credit)
      return {
        id: tx.id,
        date: tx.date.toISOString(),
        type: tx.type,
        reference: tx.reference,
        description: tx.description,
        debit: tx.debit,
        credit: tx.credit,
        runningBalance: Math.round(currentBalance * 100) / 100,
        paymentMethod: tx.paymentMethod,
        dueDate: tx.dueDate,
        paymentStatus: tx.paymentStatus
      }
    })

    const totalInvoiced = supplier.purchaseInvoices.reduce((s, i) => s + i.totalAmount, 0)
    const totalPaid = supplier.payments.reduce((s, p) => s + p.amount, 0)
    const netBalance = Math.round((totalInvoiced - totalPaid) * 100) / 100

    return NextResponse.json({
      ...supplier,
      statement: {
        totalInvoiced,
        totalPaid,
        netBalance: netBalance > 0 ? netBalance : 0,
        ledger: ledger.reverse() // Return most recent first for display
      }
    })
  } catch (error: any) {
    console.error('Failed to get supplier:', error)
    return NextResponse.json({ error: 'Failed to retrieve supplier details' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await params
    const body = await request.json()
    const { name, contactPerson, phone, email, address, taxNumber, notes } = body

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: name?.trim(),
        contactPerson: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        taxNumber: taxNumber?.trim() || null,
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Failed to update supplier:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id } = await params

    const invoiceCount = await prisma.purchaseInvoice.count({
      where: { supplierId: id }
    })

    if (invoiceCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete supplier with existing purchase invoices. Delete or archive invoices first.'
      }, { status: 400 })
    }

    await prisma.supplier.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to delete supplier:', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
