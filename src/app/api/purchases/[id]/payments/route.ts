import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { postSupplierPaymentJournal } from '@/lib/accounting'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { id: invoiceId } = await params
    const body = await request.json()
    const {
      amount,
      paymentMethod = 'cash',
      paymentDate,
      referenceNumber,
      notes
    } = body

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Valid payment amount is required' }, { status: 400 })
    }

    const invoice = await prisma.purchaseInvoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { supplier: true }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Purchase invoice not found' }, { status: 404 })
    }

    const currentRemaining = Math.max(0, invoice.totalAmount - invoice.paidAmount)
    if (currentRemaining <= 0) {
      return NextResponse.json({ error: 'This invoice is already fully paid' }, { status: 400 })
    }

    const actualPaymentAmount = Math.min(numAmount, currentRemaining)
    const newPaidAmount = Math.round((invoice.paidAmount + actualPaymentAmount) * 100) / 100
    const newPaymentStatus = newPaidAmount >= invoice.totalAmount ? 'paid' : 'partial'

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create payment record
      const payment = await tx.supplierPayment.create({
        data: {
          tenantId,
          supplierId: invoice.supplierId,
          purchaseInvoiceId: invoice.id,
          amount: actualPaymentAmount,
          paymentMethod,
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          referenceNumber: referenceNumber?.trim() || null,
          notes: notes?.trim() || `Installment payment for #${invoice.invoiceNumber}`
        }
      })

      // 2. Update invoice paid amount and payment status
      const updatedInvoice = await tx.purchaseInvoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          paymentStatus: newPaymentStatus
        },
        include: {
          supplier: true,
          payments: { orderBy: { paymentDate: 'desc' } }
        }
      })

      // 3. Decrement supplier balance
      await tx.supplier.update({
        where: { id: invoice.supplierId },
        data: {
          balance: { decrement: actualPaymentAmount }
        }
      })

      return { invoice: updatedInvoice, payment }
    })

    // Auto-post double-entry accounting journal
    try {
      await postSupplierPaymentJournal(result.payment.id, tenantId)
    } catch (journalErr) {
      console.error('Warning: Failed to auto-post journal for supplier payment:', journalErr)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Failed to record purchase invoice payment:', error)
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 })
  }
}
