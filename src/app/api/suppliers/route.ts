import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const now = new Date()

    const suppliers = await prisma.supplier.findMany({
      where: { tenantId },
      include: {
        purchaseInvoices: {
          select: {
            id: true,
            totalAmount: true,
            paidAmount: true,
            paymentStatus: true,
            dueDate: true,
            status: true
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    const enriched = suppliers.map((supplier) => {
      const invoices = supplier.purchaseInvoices
      const totalPurchases = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
      const totalPaid = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0)
      const directPayments = supplier.payments
        .filter(p => !supplier.purchaseInvoices.some(inv => inv.id === p.id))
        .reduce((sum, p) => sum + p.amount, 0)

      const overdueCount = invoices.filter(
        inv => inv.paymentStatus !== 'paid' && inv.dueDate && new Date(inv.dueDate) < now
      ).length

      const unpaidCount = invoices.filter(inv => inv.paymentStatus !== 'paid').length

      // Balance = Total Invoiced - Total Paid - Direct Payments
      // If balance field is maintained on supplier, we can also use Math.max(0, totalPurchases - totalPaid)
      const calculatedBalance = Math.max(0, totalPurchases - totalPaid)

      return {
        id: supplier.id,
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        taxNumber: supplier.taxNumber,
        balance: calculatedBalance > 0 ? calculatedBalance : supplier.balance,
        notes: supplier.notes,
        createdAt: supplier.createdAt,
        totalPurchases,
        totalPaid,
        invoicesCount: invoices.length,
        unpaidInvoicesCount: unpaidCount,
        overdueInvoicesCount: overdueCount
      }
    })

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error('Failed to fetch suppliers:', error)
    return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const { name, contactPerson, phone, email, address, taxNumber, openingBalance, notes } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })
    }

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name: name.trim(),
        contactPerson: contactPerson?.trim() || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        taxNumber: taxNumber?.trim() || null,
        balance: parseFloat(openingBalance) || 0,
        notes: notes?.trim() || null
      }
    })

    return NextResponse.json(supplier)
  } catch (error: any) {
    console.error('Failed to create supplier:', error)
    return NextResponse.json({ error: error.message || 'Failed to create supplier' }, { status: 500 })
  }
}
