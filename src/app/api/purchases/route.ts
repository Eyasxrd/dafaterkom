import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'
import { postPurchaseInvoiceJournal } from '@/lib/accounting'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const paymentStatus = searchParams.get('paymentStatus')
    const overdueOnly = searchParams.get('overdue') === 'true'

    const whereClause: any = { tenantId }
    if (supplierId) whereClause.supplierId = supplierId
    if (paymentStatus && paymentStatus !== 'all') {
      whereClause.paymentStatus = paymentStatus
    }

    const invoices = await prisma.purchaseInvoice.findMany({
      where: whereClause,
      include: {
        supplier: {
          select: { id: true, name: true, phone: true, email: true }
        },
        items: {
          include: {
            ingredient: {
              select: { id: true, name: true, unit: true, quantity: true }
            },
            menuItem: {
              select: { id: true, name: true, price: true, category: { select: { name: true } } }
            }
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        }
      },
      orderBy: { issueDate: 'desc' }
    })

    const now = new Date()
    const enriched = invoices.map((inv) => {
      const isDue = inv.dueDate ? new Date(inv.dueDate) < now : false
      const isOverdue = inv.paymentStatus !== 'paid' && isDue
      const remainingAmount = Math.max(0, inv.totalAmount - inv.paidAmount)

      let daysOverdue = 0
      if (isOverdue && inv.dueDate) {
        const diffMs = now.getTime() - new Date(inv.dueDate).getTime()
        daysOverdue = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      }

      return {
        ...inv,
        remainingAmount: Math.round(remainingAmount * 100) / 100,
        isOverdue,
        daysOverdue
      }
    })

    const filtered = overdueOnly ? enriched.filter(inv => inv.isOverdue) : enriched
    return NextResponse.json(filtered)
  } catch (error: any) {
    console.error('Failed to fetch purchase invoices:', error)
    return NextResponse.json({ error: 'Failed to fetch purchase invoices' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const {
      supplierId,
      invoiceNumber,
      issueDate,
      dueDate,
      destinationWarehouse = 'raw_materials',
      items,
      tax = 0,
      notes,
      paidAmount = 0,
      paymentMethod = 'cash',
      status = 'received'
    } = body

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier is required' }, { status: 400 })
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'At least one item is required' }, { status: 400 })
    }

    // Auto-generate invoice number if empty
    const finalInvoiceNumber = invoiceNumber?.trim() || `PUR-${Date.now().toString().slice(-6)}`

    // Calculate item costs
    let calculatedSubtotal = 0
    const processedItems = items.map((item: any) => {
      const qty = parseFloat(item.quantity) || 1
      const price = parseFloat(item.unitPrice) || 0
      const total = Math.round(qty * price * 100) / 100
      calculatedSubtotal += total
      return {
        ingredientId: item.ingredientId || null,
        menuItemId: item.menuItemId || null,
        itemName: item.itemName?.trim() || 'Item',
        quantity: qty,
        unit: item.unit || 'pieces',
        unitPrice: price,
        totalPrice: total
      }
    })

    const numTax = parseFloat(tax) || 0
    const totalAmount = Math.round((calculatedSubtotal + numTax) * 100) / 100
    const numPaid = Math.min(totalAmount, Math.max(0, parseFloat(paidAmount) || 0))

    let paymentStatus = 'unpaid'
    if (numPaid >= totalAmount) {
      paymentStatus = 'paid'
    } else if (numPaid > 0) {
      paymentStatus = 'partial'
    }

    // Execute in transaction: create invoice, create items, update inventory/ingredients, record payment, update supplier balance
    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.create({
        data: {
          tenantId,
          supplierId,
          invoiceNumber: finalInvoiceNumber,
          issueDate: issueDate ? new Date(issueDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          destinationWarehouse,
          status,
          paymentStatus,
          subtotal: calculatedSubtotal,
          tax: numTax,
          totalAmount,
          paidAmount: numPaid,
          notes: notes?.trim() || null,
          items: {
            create: processedItems
          }
        },
        include: {
          items: true,
          supplier: true
        }
      })

      // If marked received, auto replenish ingredients & inventory
      if (status === 'received') {
        for (const it of processedItems) {
          // 1. Raw materials / Ingredient update
          if (it.ingredientId) {
            await tx.ingredient.update({
              where: { id: it.ingredientId },
              data: {
                quantity: { increment: it.quantity },
                costPerUnit: it.unitPrice > 0 ? it.unitPrice : undefined,
                lastRestocked: new Date()
              }
            })
          }
          // 2. Retail finished goods / Inventory update
          if (it.menuItemId) {
            const existingInv = await tx.inventory.findUnique({
              where: { menuItemId: it.menuItemId }
            })
            if (existingInv) {
              await tx.inventory.update({
                where: { id: existingInv.id },
                data: {
                  quantity: { increment: Math.round(it.quantity) },
                  lastRestocked: new Date()
                }
              })
            } else {
              await tx.inventory.create({
                data: {
                  menuItemId: it.menuItemId,
                  quantity: Math.round(it.quantity),
                  unit: it.unit || 'pieces',
                  lowStockThreshold: 10,
                  lastRestocked: new Date()
                }
              })
            }
          }
        }
      }

      // If initial payment was provided, create SupplierPayment record
      if (numPaid > 0) {
        await tx.supplierPayment.create({
          data: {
            tenantId,
            supplierId,
            purchaseInvoiceId: invoice.id,
            amount: numPaid,
            paymentMethod,
            paymentDate: new Date(),
            notes: `Initial payment for #${invoice.invoiceNumber}`
          }
        })
      }

      // Update Supplier balance (net unpaid remainder added to balance)
      const remainingUnpaid = totalAmount - numPaid
      if (remainingUnpaid > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: {
            balance: { increment: remainingUnpaid }
          }
        })
      }

      return invoice
    })

    // Auto-post double-entry accounting journal
    try {
      await postPurchaseInvoiceJournal(result.id, tenantId)
    } catch (journalErr) {
      console.error('Warning: Failed to auto-post journal for purchase invoice:', journalErr)
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Failed to create purchase invoice:', error)
    return NextResponse.json({ error: error.message || 'Failed to create purchase invoice' }, { status: 500 })
  }
}
