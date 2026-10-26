import { prisma } from '@/lib/db'

export interface DefaultAccountDef {
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  category: string
  description?: string
}

export const DEFAULT_ACCOUNTS: DefaultAccountDef[] = [
  // 1. Assets (1000 - 1999)
  { code: '1010', name: 'Cash on Hand (Till & Registers)', type: 'asset', category: 'current_asset', description: 'Cash in POS cash drawers and main safe' },
  { code: '1020', name: 'Bank Operating Account', type: 'asset', category: 'current_asset', description: 'Primary commercial bank account for card settlements and transfers' },
  { code: '1030', name: 'Accounts Receivable (Customers)', type: 'asset', category: 'current_asset', description: 'Amounts owed by corporate customers, catering clients, and delivery platforms' },
  { code: '1040', name: 'Raw Materials & Ingredients Inventory', type: 'asset', category: 'current_asset', description: 'Food ingredients, coffee beans, syrups, dairy and packaging stock' },
  { code: '1050', name: 'Finished Goods & Retail Inventory', type: 'asset', category: 'current_asset', description: 'Prepared pastries, packaged merchandise, and ready-to-sell goods' },
  { code: '1060', name: 'Input VAT Paid (Tax Asset)', type: 'asset', category: 'current_asset', description: 'VAT paid on purchase invoices and operating expenses reclaimable from tax authorities' },
  { code: '1510', name: 'Kitchen & Restaurant Equipment', type: 'asset', category: 'non_current_asset', description: 'Espresso machines, ovens, refrigeration units, and furniture' },

  // 2. Liabilities (2000 - 2999)
  { code: '2010', name: 'Accounts Payable (Suppliers)', type: 'liability', category: 'current_liability', description: 'Outstanding unpaid bills owed to food and beverage suppliers' },
  { code: '2020', name: 'Output VAT Collected (Tax Payable)', type: 'liability', category: 'current_liability', description: 'VAT collected on POS customer sales payable to the tax authority' },
  { code: '2030', name: 'Accrued Salaries & Wages Payable', type: 'liability', category: 'current_liability', description: 'Staff earned salaries and overtime awaiting bank disbursement' },
  { code: '2040', name: 'Short-term Operating Liabilities', type: 'liability', category: 'current_liability', description: 'Short-term credit lines, advances, and payable deposits' },

  // 3. Equity (3000 - 3999)
  { code: '3010', name: "Owner's Capital", type: 'equity', category: 'equity', description: 'Initial invested capital by the business owner or partners' },
  { code: '3020', name: 'Retained Earnings', type: 'equity', category: 'equity', description: 'Accumulated net profits retained in the business across fiscal years' },
  { code: '3030', name: "Owner's Drawings & Distributions", type: 'equity', category: 'equity', description: 'Withdrawals and dividend payouts taken by the owner' },

  // 4. Revenue (4000 - 4999)
  { code: '4010', name: 'Food & Beverage Sales Revenue', type: 'revenue', category: 'operating_revenue', description: 'Main revenue from dine-in, takeaway, and drive-thru food and drinks' },
  { code: '4020', name: 'Delivery & Online Platform Revenue', type: 'revenue', category: 'operating_revenue', description: 'Sales processed via aggregators, online menu, and delivery apps' },
  { code: '4030', name: 'Catering & Event Services Revenue', type: 'revenue', category: 'operating_revenue', description: 'Income from private events, office catering, and special orders' },
  { code: '4090', name: 'Discounts & Promotional Allowances', type: 'revenue', category: 'operating_revenue', description: 'Contra-revenue account for promo codes, loyalty discounts, and staff meals' },

  // 5. Cost of Goods Sold (5000 - 5019)
  { code: '5010', name: 'Cost of Food & Ingredients (COGS)', type: 'expense', category: 'cost_of_sales', description: 'Direct food and beverage cost consumed during order preparation' },
  { code: '5015', name: 'Packaging & Disposable Supplies', type: 'expense', category: 'cost_of_sales', description: 'Cups, lids, bags, napkins, and takeaway food containers' },

  // 6. Operating Expenses (5020 - 5999)
  { code: '5020', name: 'Staff Base Salaries Expense', type: 'expense', category: 'operating_expense', description: 'Regular hourly and monthly wages for baristas, chefs, and service staff' },
  { code: '5025', name: 'Staff Overtime & Bonus Expense', type: 'expense', category: 'operating_expense', description: 'Overtime hours, holiday pay, and employee performance bonuses' },
  { code: '5030', name: 'Rent & Facility Lease Expense', type: 'expense', category: 'operating_expense', description: 'Monthly store lease, seating area rent, and commercial charges' },
  { code: '5040', name: 'Utilities (Electricity, Water & Gas)', type: 'expense', category: 'operating_expense', description: 'Power for espresso machines, refrigeration, water filtration, and gas' },
  { code: '5050', name: 'Inventory Spoilage, Wastage & Loss', type: 'expense', category: 'operating_expense', description: 'Expired dairy, spoiled produce, dropped items, and preparation waste' },
  { code: '5060', name: 'Maintenance & Equipment Repairs', type: 'expense', category: 'operating_expense', description: 'Service calls, coffee machine descaling, grinder burrs, and plumbing' },
  { code: '5070', name: 'Marketing, Advertising & Loyalty', type: 'expense', category: 'operating_expense', description: 'Social media ads, printed flyers, loyalty rewards, and customer campaigns' },
  { code: '5080', name: 'Cleaning & Sanitation Supplies', type: 'expense', category: 'operating_expense', description: 'Detergents, sanitizer, espresso cleaning powder, and mop refills' },
  { code: '5090', name: 'General & Administrative Expenses', type: 'expense', category: 'operating_expense', description: 'Accounting software, point of sale subscriptions, licenses, and office supplies' },
  { code: '5095', name: 'Bank & POS Card Processing Fees', type: 'expense', category: 'operating_expense', description: 'Merchant credit card terminal transaction fees and banking commissions' }
]

/**
 * Ensures standard chart of accounts exists for a given tenant.
 */
export async function ensureDefaultAccounts(tenantId: string) {
  const existingCount = await prisma.account.count({ where: { tenantId } })
  if (existingCount === 0) {
    for (const acc of DEFAULT_ACCOUNTS) {
      await prisma.account.create({
        data: {
          tenantId,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          category: acc.category,
          description: acc.description,
          isSystem: true,
          isActive: true
        }
      })
    }
  }
}

/**
 * Generates sequential Journal Entry number (e.g. JE-2026-0001).
 */
export async function generateEntryNumber(tenantId: string, prefix = 'JE'): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.journalEntry.count({ where: { tenantId } })
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`
}

/**
 * Generates sequential Expense Voucher number (e.g. EXP-2026-0001).
 */
export async function generateVoucherNumber(tenantId: string, prefix = 'EXP'): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.expenseVoucher.count({ where: { tenantId } })
  return `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`
}

export interface JournalLineInput {
  accountId: string
  debit: number
  credit: number
  description?: string
}

export interface CreateJournalEntryInput {
  tenantId: string
  date?: Date
  referenceType?: string
  referenceId?: string
  narration: string
  status?: 'posted' | 'draft' | 'void'
  createdBy?: string
  lines: JournalLineInput[]
}

/**
 * Creates and posts a balanced Double-Entry Journal Entry.
 */
export async function createJournalEntry(input: CreateJournalEntryInput) {
  await ensureDefaultAccounts(input.tenantId)

  const totalDebit = input.lines.reduce((sum, l) => sum + (l.debit || 0), 0)
  const totalCredit = input.lines.reduce((sum, l) => sum + (l.credit || 0), 0)

  // Floating point rounding tolerance check
  const difference = Math.abs(totalDebit - totalCredit)
  if (difference > 0.05) {
    throw new Error(`Double-entry out of balance! Total Debits ($${totalDebit.toFixed(2)}) must equal Total Credits ($${totalCredit.toFixed(2)}). Diff: $${difference.toFixed(2)}`)
  }

  const entryNumber = await generateEntryNumber(input.tenantId)

  const result = await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.create({
      data: {
        tenantId: input.tenantId,
        entryNumber,
        date: input.date || new Date(),
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        narration: input.narration,
        status: input.status || 'posted',
        totalDebit: Math.round(totalDebit * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
        createdBy: input.createdBy,
        lines: {
          create: input.lines.map(l => ({
            accountId: l.accountId,
            debit: Math.round(l.debit * 100) / 100,
            credit: Math.round(l.credit * 100) / 100,
            description: l.description
          }))
        }
      },
      include: {
        lines: {
          include: {
            account: true
          }
        }
      }
    })

    // Update account balances if posted
    if (entry.status === 'posted') {
      for (const line of input.lines) {
        const account = await tx.account.findUnique({ where: { id: line.accountId } })
        if (account) {
          // Normal balances:
          // Assets & Expenses: Balance increases with Debit, decreases with Credit
          // Liabilities, Equity, Revenue: Balance increases with Credit, decreases with Debit
          let balanceChange = 0
          if (account.type === 'asset' || account.type === 'expense') {
            balanceChange = (line.debit || 0) - (line.credit || 0)
          } else {
            balanceChange = (line.credit || 0) - (line.debit || 0)
          }

          await tx.account.update({
            where: { id: account.id },
            data: {
              balance: {
                increment: Math.round(balanceChange * 100) / 100
              }
            }
          })
        }
      }
    }

    return entry
  })

  return result
}

/**
 * Look up Account ID by code for a given tenant.
 */
export async function getAccountByCode(tenantId: string, code: string) {
  await ensureDefaultAccounts(tenantId)
  let acc = await prisma.account.findUnique({
    where: {
      tenantId_code: {
        tenantId,
        code
      }
    }
  })
  if (!acc) {
    const defaultDef = DEFAULT_ACCOUNTS.find(d => d.code === code)
    if (defaultDef) {
      acc = await prisma.account.create({
        data: {
          tenantId,
          code: defaultDef.code,
          name: defaultDef.name,
          type: defaultDef.type,
          category: defaultDef.category,
          description: defaultDef.description,
          isSystem: true
        }
      })
    }
  }
  return acc
}

/**
 * Posts Journal Entry for a POS Order (Revenue, VAT, Cash/Card Settlement, and Estimated COGS).
 */
export async function postPOSOrderJournal(orderId: string, tenantId: string) {
  // Check if already posted
  const existing = await prisma.journalEntry.findFirst({
    where: {
      tenantId,
      referenceType: 'pos_sale',
      referenceId: orderId
    }
  })
  if (existing) return existing

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          menuItem: {
            include: {
              recipes: {
                include: {
                  ingredient: true
                }
              }
            }
          }
        }
      }
    }
  })

  if (!order || order.orderStatus === 'cancelled') return null

  // Resolve accounts
  const cashAccount = await getAccountByCode(tenantId, '1010') // Cash
  const bankAccount = await getAccountByCode(tenantId, '1020') // Card/Bank
  const salesAccount = await getAccountByCode(tenantId, '4010') // Sales Revenue
  const vatAccount = await getAccountByCode(tenantId, '2020') // Output VAT
  const discountAccount = await getAccountByCode(tenantId, '4090') // Discounts
  const cogsAccount = await getAccountByCode(tenantId, '5010') // COGS
  const inventoryAccount = await getAccountByCode(tenantId, '1040') // Inventory

  if (!cashAccount || !bankAccount || !salesAccount || !vatAccount || !discountAccount || !cogsAccount || !inventoryAccount) {
    throw new Error('Could not find standard chart of accounts')
  }

  const paymentAccount = order.paymentMethod === 'card' ? bankAccount : cashAccount
  const totalReceived = order.totalAmount
  const subtotal = order.subtotal
  const tax = order.tax
  const discount = order.discount

  const lines: JournalLineInput[] = []

  // 1. Debit Payment received (Cash or Card)
  lines.push({
    accountId: paymentAccount.id,
    debit: totalReceived,
    credit: 0,
    description: `POS Order #${order.orderNumber} receipt via ${order.paymentMethod}`
  })

  // 2. If discount given, Debit Discount account
  if (discount > 0) {
    lines.push({
      accountId: discountAccount.id,
      debit: discount,
      credit: 0,
      description: `Discount on POS Order #${order.orderNumber}`
    })
  }

  // 3. Credit Sales Revenue (Gross subtotal before discount)
  const grossSales = subtotal + discount
  lines.push({
    accountId: salesAccount.id,
    debit: 0,
    credit: grossSales,
    description: `Gross sales revenue for Order #${order.orderNumber}`
  })

  // 4. Credit VAT collected
  if (tax > 0) {
    lines.push({
      accountId: vatAccount.id,
      debit: 0,
      credit: tax,
      description: `Output VAT collected on Order #${order.orderNumber}`
    })
  }

  // Calculate ingredient recipe cost (COGS)
  let totalOrderCogs = 0
  for (const item of order.items) {
    if (item.menuItem?.recipes && item.menuItem.recipes.length > 0) {
      for (const recipe of item.menuItem.recipes) {
        const costPerUnit = recipe.ingredient?.costPerUnit || 0
        const itemIngredientCost = (recipe.quantity || 0) * costPerUnit * item.quantity
        totalOrderCogs += itemIngredientCost
      }
    }
  }

  // 5. If recipes exist and have cost, post COGS debit and Inventory credit
  if (totalOrderCogs > 0) {
    lines.push({
      accountId: cogsAccount.id,
      debit: Math.round(totalOrderCogs * 100) / 100,
      credit: 0,
      description: `COGS: Recipe food ingredients for Order #${order.orderNumber}`
    })
    lines.push({
      accountId: inventoryAccount.id,
      debit: 0,
      credit: Math.round(totalOrderCogs * 100) / 100,
      description: `Inventory reduction for Order #${order.orderNumber}`
    })
  }

  return await createJournalEntry({
    tenantId,
    date: order.createdAt,
    referenceType: 'pos_sale',
    referenceId: order.id,
    narration: `POS Order #${order.orderNumber} - ${order.customerName || 'Walk-in Customer'} (${order.paymentMethod})`,
    createdBy: order.staffId,
    lines
  })
}

/**
 * Posts Journal Entry for a Supplier Purchase Invoice (Debit Inventory & Input VAT, Credit Accounts Payable).
 */
export async function postPurchaseInvoiceJournal(invoiceId: string, tenantId: string) {
  const existing = await prisma.journalEntry.findFirst({
    where: {
      tenantId,
      referenceType: 'purchase_invoice',
      referenceId: invoiceId
    }
  })
  if (existing) return existing

  const invoice = await prisma.purchaseInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      supplier: true,
      items: true
    }
  })

  if (!invoice || invoice.status === 'cancelled') return null

  const inventoryAccount = await getAccountByCode(tenantId, '1040') // Raw Materials Inventory
  const vatInputAccount = await getAccountByCode(tenantId, '1060') // Input VAT Paid
  const apAccount = await getAccountByCode(tenantId, '2010') // Accounts Payable

  if (!inventoryAccount || !vatInputAccount || !apAccount) {
    throw new Error('Standard accounts missing for purchase posting')
  }

  const lines: JournalLineInput[] = []

  // Debit Inventory Asset
  lines.push({
    accountId: inventoryAccount.id,
    debit: invoice.subtotal,
    credit: 0,
    description: `Purchase of inventory items - Inv #${invoice.invoiceNumber}`
  })

  // Debit Input VAT
  if (invoice.tax > 0) {
    lines.push({
      accountId: vatInputAccount.id,
      debit: invoice.tax,
      credit: 0,
      description: `Input VAT paid on Inv #${invoice.invoiceNumber}`
    })
  }

  // Credit Accounts Payable
  lines.push({
    accountId: apAccount.id,
    debit: 0,
    credit: invoice.totalAmount,
    description: `Payable to supplier ${invoice.supplier.name} - Inv #${invoice.invoiceNumber}`
  })

  return await createJournalEntry({
    tenantId,
    date: invoice.issueDate,
    referenceType: 'purchase_invoice',
    referenceId: invoice.id,
    narration: `Supplier Purchase Invoice #${invoice.invoiceNumber} from ${invoice.supplier.name}`,
    lines
  })
}

/**
 * Posts Journal Entry for a Supplier Payment (Debit Accounts Payable, Credit Cash or Bank).
 */
export async function postSupplierPaymentJournal(paymentId: string, tenantId: string) {
  const existing = await prisma.journalEntry.findFirst({
    where: {
      tenantId,
      referenceType: 'supplier_payment',
      referenceId: paymentId
    }
  })
  if (existing) return existing

  const payment = await prisma.supplierPayment.findUnique({
    where: { id: paymentId },
    include: {
      supplier: true,
      purchaseInvoice: true
    }
  })

  if (!payment) return null

  const apAccount = await getAccountByCode(tenantId, '2010')
  const cashAccount = await getAccountByCode(tenantId, '1010')
  const bankAccount = await getAccountByCode(tenantId, '1020')

  if (!apAccount || !cashAccount || !bankAccount) return null

  const paymentAccount = (payment.paymentMethod === 'bank_transfer' || payment.paymentMethod === 'check') ? bankAccount : cashAccount

  const lines: JournalLineInput[] = [
    {
      accountId: apAccount.id,
      debit: payment.amount,
      credit: 0,
      description: `Payment reduction of balance for supplier ${payment.supplier.name}`
    },
    {
      accountId: paymentAccount.id,
      debit: 0,
      credit: payment.amount,
      description: `Disbursement from ${paymentAccount.name} via ${payment.paymentMethod}`
    }
  ]

  return await createJournalEntry({
    tenantId,
    date: payment.paymentDate,
    referenceType: 'supplier_payment',
    referenceId: payment.id,
    narration: `Supplier Payment to ${payment.supplier.name} (${payment.paymentMethod}) ${payment.referenceNumber ? `Ref: ${payment.referenceNumber}` : ''}`,
    lines
  })
}

/**
 * Posts Journal Entry for Inventory Spoilage / Wastage.
 */
export async function postWastageJournal(tenantId: string, financialLoss: number, notes?: string, logId?: string) {
  if (financialLoss <= 0) return null

  const wastageAccount = await getAccountByCode(tenantId, '5050') // Wastage Expense
  const inventoryAccount = await getAccountByCode(tenantId, '1040') // Raw Materials Inventory

  if (!wastageAccount || !inventoryAccount) return null

  const lines: JournalLineInput[] = [
    {
      accountId: wastageAccount.id,
      debit: financialLoss,
      credit: 0,
      description: notes || 'Inventory Spoilage & Shrinkage Loss'
    },
    {
      accountId: inventoryAccount.id,
      debit: 0,
      credit: financialLoss,
      description: 'Stock reduction from wastage/spoilage'
    }
  ]

  return await createJournalEntry({
    tenantId,
    referenceType: 'inventory_waste',
    referenceId: logId,
    narration: `Inventory Wastage & Spoilage Write-off: $${financialLoss.toFixed(2)} - ${notes || 'Kitchen Loss'}`,
    lines
  })
}

/**
 * Posts Journal Entry for Operating Expense Voucher (Rent, Utilities, Maintenance, etc.).
 */
export async function postExpenseVoucherJournal(voucherId: string, tenantId: string) {
  const existing = await prisma.journalEntry.findFirst({
    where: {
      tenantId,
      referenceType: 'expense_voucher',
      referenceId: voucherId
    }
  })
  if (existing) return existing

  const voucher = await prisma.expenseVoucher.findUnique({
    where: { id: voucherId }
  })

  if (!voucher || voucher.status === 'cancelled') return null

  // Map category to default accounts
  let expenseAccountCode = '5090' // Default General Admin
  switch (voucher.category) {
    case 'rent': expenseAccountCode = '5030'; break
    case 'utilities': expenseAccountCode = '5040'; break
    case 'maintenance': expenseAccountCode = '5060'; break
    case 'marketing': expenseAccountCode = '5070'; break
    case 'supplies': expenseAccountCode = '5080'; break
    case 'petty_cash': expenseAccountCode = '5090'; break
    default: expenseAccountCode = '5090'; break
  }

  const expenseAccount = voucher.accountId ? await prisma.account.findUnique({ where: { id: voucher.accountId } }) : await getAccountByCode(tenantId, expenseAccountCode)
  const cashAccount = await getAccountByCode(tenantId, '1010')
  const bankAccount = await getAccountByCode(tenantId, '1020')
  const vatInputAccount = await getAccountByCode(tenantId, '1060')

  const paidFromAccount = voucher.paidFromAccountId ? await prisma.account.findUnique({ where: { id: voucher.paidFromAccountId } }) : (voucher.paymentMethod === 'bank_transfer' ? bankAccount : cashAccount)

  if (!expenseAccount || !paidFromAccount) return null

  const lines: JournalLineInput[] = []

  // Debit Expense Account
  lines.push({
    accountId: expenseAccount.id,
    debit: voucher.amount,
    credit: 0,
    description: voucher.title
  })

  // Debit Input VAT if applicable
  if (voucher.taxAmount > 0 && vatInputAccount) {
    lines.push({
      accountId: vatInputAccount.id,
      debit: voucher.taxAmount,
      credit: 0,
      description: `VAT paid on expense ${voucher.voucherNumber}`
    })
  }

  // Credit Payment Source (Cash / Bank)
  lines.push({
    accountId: paidFromAccount.id,
    debit: 0,
    credit: voucher.totalAmount,
    description: `Paid via ${voucher.paymentMethod} to ${voucher.payee || 'Vendor'}`
  })

  return await createJournalEntry({
    tenantId,
    date: voucher.paymentDate,
    referenceType: 'expense_voucher',
    referenceId: voucher.id,
    narration: `Expense Voucher #${voucher.voucherNumber}: ${voucher.title} (${voucher.category}) - ${voucher.payee || ''}`,
    lines
  })
}

/**
 * Posts Journal Entry for Payroll & Staff Salaries Disbursal.
 */
export async function postPayrollDisbursement(tenantId: string, data: {
  periodMonth: number
  periodYear: number
  staffCount: number
  basePay: number
  overtimePay: number
  deductions?: number
  bonuses?: number
  paymentMethod: string
  notes?: string
}) {
  await ensureDefaultAccounts(tenantId)

  const salariesAccount = await getAccountByCode(tenantId, '5020') // Base Salaries Expense
  const overtimeAccount = await getAccountByCode(tenantId, '5025') // Overtime Expense
  const cashAccount = await getAccountByCode(tenantId, '1010')
  const bankAccount = await getAccountByCode(tenantId, '1020')

  if (!salariesAccount || !overtimeAccount || !cashAccount || !bankAccount) {
    throw new Error('Chart of accounts missing required payroll accounts')
  }

  const paymentAccount = data.paymentMethod === 'cash' ? cashAccount : bankAccount

  const totalGrossPay = data.basePay + data.overtimePay + (data.bonuses || 0)
  const totalNetPay = totalGrossPay - (data.deductions || 0)

  const lines: JournalLineInput[] = []

  // 1. Debit Base Salaries Expense
  if (data.basePay > 0) {
    lines.push({
      accountId: salariesAccount.id,
      debit: data.basePay + (data.bonuses || 0) - (data.deductions || 0),
      credit: 0,
      description: `Staff base salaries & compensation for ${data.periodMonth}/${data.periodYear} (${data.staffCount} staff)`
    })
  }

  // 2. Debit Overtime Expense
  if (data.overtimePay > 0) {
    lines.push({
      accountId: overtimeAccount.id,
      debit: data.overtimePay,
      credit: 0,
      description: `Staff overtime pay for ${data.periodMonth}/${data.periodYear}`
    })
  }

  // 3. Credit Payment Account (Bank / Cash)
  lines.push({
    accountId: paymentAccount.id,
    debit: 0,
    credit: totalNetPay,
    description: `Payroll disbursement via ${data.paymentMethod}`
  })

  // Create Disbursement Record
  const disbursement = await prisma.payrollDisbursement.create({
    data: {
      tenantId,
      periodMonth: data.periodMonth,
      periodYear: data.periodYear,
      staffCount: data.staffCount,
      totalAmount: Math.round(totalNetPay * 100) / 100,
      basePay: Math.round(data.basePay * 100) / 100,
      overtimePay: Math.round(data.overtimePay * 100) / 100,
      deductions: Math.round((data.deductions || 0) * 100) / 100,
      bonuses: Math.round((data.bonuses || 0) * 100) / 100,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
      status: 'completed'
    }
  })

  const je = await createJournalEntry({
    tenantId,
    referenceType: 'payroll_disbursement',
    referenceId: disbursement.id,
    narration: `Payroll Disbursal for ${data.periodMonth}/${data.periodYear} (${data.staffCount} Staff Members) - Total: $${totalNetPay.toFixed(2)}`,
    lines
  })

  await prisma.payrollDisbursement.update({
    where: { id: disbursement.id },
    data: { journalEntryId: je.id }
  })

  return { disbursement, journalEntry: je }
}

/**
 * Synchronizes and backfills all historical POS Orders, Purchases, Payments, and Wastage into Double-Entry Journal Entries.
 */
export async function syncAllHistoricalTransactions(tenantId: string) {
  await ensureDefaultAccounts(tenantId)

  let syncedOrders = 0
  let syncedPurchases = 0
  let syncedPayments = 0
  let syncedExpenses = 0

  // 1. Orders
  const orders = await prisma.order.findMany({
    where: {
      tenantId,
      orderStatus: { not: 'cancelled' }
    }
  })

  for (const order of orders) {
    const existing = await prisma.journalEntry.findFirst({
      where: {
        tenantId,
        referenceType: 'pos_sale',
        referenceId: order.id
      }
    })
    if (!existing) {
      try {
        await postPOSOrderJournal(order.id, tenantId)
        syncedOrders++
      } catch (err) {
        console.error(`Failed to sync order ${order.orderNumber}:`, err)
      }
    }
  }

  // 2. Purchase Invoices
  const invoices = await prisma.purchaseInvoice.findMany({
    where: {
      tenantId,
      status: { not: 'cancelled' }
    }
  })

  for (const inv of invoices) {
    const existing = await prisma.journalEntry.findFirst({
      where: {
        tenantId,
        referenceType: 'purchase_invoice',
        referenceId: inv.id
      }
    })
    if (!existing) {
      try {
        await postPurchaseInvoiceJournal(inv.id, tenantId)
        syncedPurchases++
      } catch (err) {
        console.error(`Failed to sync invoice ${inv.invoiceNumber}:`, err)
      }
    }
  }

  // 3. Supplier Payments
  const payments = await prisma.supplierPayment.findMany({
    where: { tenantId }
  })

  for (const p of payments) {
    const existing = await prisma.journalEntry.findFirst({
      where: {
        tenantId,
        referenceType: 'supplier_payment',
        referenceId: p.id
      }
    })
    if (!existing) {
      try {
        await postSupplierPaymentJournal(p.id, tenantId)
        syncedPayments++
      } catch (err) {
        console.error(`Failed to sync supplier payment:`, err)
      }
    }
  }

  // 4. Expense Vouchers
  const vouchers = await prisma.expenseVoucher.findMany({
    where: {
      tenantId,
      status: { not: 'cancelled' }
    }
  })

  for (const v of vouchers) {
    const existing = await prisma.journalEntry.findFirst({
      where: {
        tenantId,
        referenceType: 'expense_voucher',
        referenceId: v.id
      }
    })
    if (!existing) {
      try {
        await postExpenseVoucherJournal(v.id, tenantId)
        syncedExpenses++
      } catch (err) {
        console.error(`Failed to sync expense voucher:`, err)
      }
    }
  }

  return {
    syncedOrders,
    syncedPurchases,
    syncedPayments,
    syncedExpenses,
    totalSynced: syncedOrders + syncedPurchases + syncedPayments + syncedExpenses
  }
}

/**
 * Computes all Financial Statements (Profit & Loss, Balance Sheet, Trial Balance, Cash Flow, Tax Return, Owner Executive KPIs).
 */
export async function getFinancialStatements(tenantId: string, timeRange: string = 'month', customStart?: Date, customEnd?: Date) {
  await ensureDefaultAccounts(tenantId)

  const now = new Date()
  let startDate: Date | undefined = undefined
  let endDate: Date = customEnd || now

  if (customStart) {
    startDate = customStart
  } else if (timeRange === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  } else if (timeRange === 'week') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  } else if (timeRange === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  } else if (timeRange === 'quarter') {
    startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
  } else if (timeRange === 'year') {
    startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
  } else if (timeRange === 'all') {
    startDate = undefined
  }

  // Fetch all accounts
  const accounts = await prisma.account.findMany({
    where: { tenantId, isActive: true },
    orderBy: { code: 'asc' }
  })

  // Fetch all journal lines within period (and before period for opening balances)
  const periodWhere: any = {
    journalEntry: {
      tenantId,
      status: 'posted',
      date: {
        ...(startDate ? { gte: startDate } : {}),
        lte: endDate
      }
    }
  }

  const periodLines = await prisma.journalEntryLine.findMany({
    where: periodWhere,
    include: {
      account: true,
      journalEntry: true
    }
  })

  // All historical lines for Balance Sheet and Cumulative balances
  const allLines = await prisma.journalEntryLine.findMany({
    where: {
      journalEntry: {
        tenantId,
        status: 'posted',
        date: { lte: endDate }
      }
    },
    include: {
      account: true,
      journalEntry: true
    }
  })

  // Group debit and credit by account
  const periodDebits: Record<string, number> = {}
  const periodCredits: Record<string, number> = {}
  const cumulativeDebits: Record<string, number> = {}
  const cumulativeCredits: Record<string, number> = {}

  for (const line of periodLines) {
    periodDebits[line.accountId] = (periodDebits[line.accountId] || 0) + line.debit
    periodCredits[line.accountId] = (periodCredits[line.accountId] || 0) + line.credit
  }

  for (const line of allLines) {
    cumulativeDebits[line.accountId] = (cumulativeDebits[line.accountId] || 0) + line.debit
    cumulativeCredits[line.accountId] = (cumulativeCredits[line.accountId] || 0) + line.credit
  }

  // 1. TRIAL BALANCE
  const trialBalanceRows = accounts.map(acc => {
    const pDebit = periodDebits[acc.id] || 0
    const pCredit = periodCredits[acc.id] || 0
    const cDebit = cumulativeDebits[acc.id] || 0
    const cCredit = cumulativeCredits[acc.id] || 0

    let netBalance = 0
    if (acc.type === 'asset' || acc.type === 'expense') {
      netBalance = cDebit - cCredit
    } else {
      netBalance = cCredit - cDebit
    }

    return {
      accountId: acc.id,
      code: acc.code,
      name: acc.name,
      type: acc.type,
      category: acc.category,
      periodDebit: Math.round(pDebit * 100) / 100,
      periodCredit: Math.round(pCredit * 100) / 100,
      endingDebit: acc.type === 'asset' || acc.type === 'expense' ? Math.max(0, Math.round(netBalance * 100) / 100) : 0,
      endingCredit: acc.type === 'liability' || acc.type === 'equity' || acc.type === 'revenue' ? Math.max(0, Math.round(netBalance * 100) / 100) : 0,
      netBalance: Math.round(netBalance * 100) / 100
    }
  })

  const totalPeriodDebit = trialBalanceRows.reduce((sum, r) => sum + r.periodDebit, 0)
  const totalPeriodCredit = trialBalanceRows.reduce((sum, r) => sum + r.periodCredit, 0)
  const totalEndingDebit = trialBalanceRows.reduce((sum, r) => sum + r.endingDebit, 0)
  const totalEndingCredit = trialBalanceRows.reduce((sum, r) => sum + r.endingCredit, 0)
  const isTrialBalanced = Math.abs(totalEndingDebit - totalEndingCredit) < 0.1

  // 2. PROFIT & LOSS (INCOME STATEMENT)
  // Revenue Accounts (type === 'revenue')
  const revenueAccounts = trialBalanceRows.filter(r => r.type === 'revenue')
  const totalGrossRevenue = revenueAccounts
    .filter(r => r.code !== '4090')
    .reduce((sum, r) => sum + (periodCredits[r.accountId] || 0) - (periodDebits[r.accountId] || 0), 0)

  const discountAccount = trialBalanceRows.find(r => r.code === '4090')
  const totalDiscounts = discountAccount ? (periodDebits[discountAccount.accountId] || 0) - (periodCredits[discountAccount.accountId] || 0) : 0
  const netRevenue = Math.max(0, totalGrossRevenue - totalDiscounts)

  // COGS Accounts (category === 'cost_of_sales')
  const cogsAccounts = trialBalanceRows.filter(r => r.category === 'cost_of_sales')
  const totalCOGS = cogsAccounts.reduce((sum, r) => sum + (periodDebits[r.accountId] || 0) - (periodCredits[r.accountId] || 0), 0)

  const grossProfit = netRevenue - totalCOGS
  const grossProfitMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0

  // Operating Expenses (type === 'expense' && category !== 'cost_of_sales')
  const opExpenseAccounts = trialBalanceRows.filter(r => r.type === 'expense' && r.category !== 'cost_of_sales')
  const totalOperatingExpenses = opExpenseAccounts.reduce((sum, r) => sum + (periodDebits[r.accountId] || 0) - (periodCredits[r.accountId] || 0), 0)

  const netOperatingIncome = grossProfit - totalOperatingExpenses // EBITDA / Operating Profit
  const netProfit = netOperatingIncome
  const netProfitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0

  // Breakdown of major expenses
  const salariesExpense = (periodDebits[trialBalanceRows.find(r => r.code === '5020')?.accountId || ''] || 0) + (periodDebits[trialBalanceRows.find(r => r.code === '5025')?.accountId || ''] || 0)
  const rentExpense = periodDebits[trialBalanceRows.find(r => r.code === '5030')?.accountId || ''] || 0
  const utilitiesExpense = periodDebits[trialBalanceRows.find(r => r.code === '5040')?.accountId || ''] || 0
  const wastageExpense = periodDebits[trialBalanceRows.find(r => r.code === '5050')?.accountId || ''] || 0

  // 3. BALANCE SHEET
  const assetAccounts = trialBalanceRows.filter(r => r.type === 'asset')
  const currentAssets = assetAccounts.filter(r => r.category === 'current_asset')
  const nonCurrentAssets = assetAccounts.filter(r => r.category === 'non_current_asset')
  const totalAssets = assetAccounts.reduce((sum, r) => sum + r.netBalance, 0)

  const liabilityAccounts = trialBalanceRows.filter(r => r.type === 'liability')
  const totalLiabilities = liabilityAccounts.reduce((sum, r) => sum + r.netBalance, 0)

  const equityAccounts = trialBalanceRows.filter(r => r.type === 'equity')
  const baseEquity = equityAccounts.reduce((sum, r) => sum + r.netBalance, 0)

  // Cumulative Net Profit rolls into Equity
  const cumulativeRevenue = trialBalanceRows.filter(r => r.type === 'revenue').reduce((sum, r) => sum + (cumulativeCredits[r.accountId] || 0) - (cumulativeDebits[r.accountId] || 0), 0)
  const cumulativeExpenses = trialBalanceRows.filter(r => r.type === 'expense').reduce((sum, r) => sum + (cumulativeDebits[r.accountId] || 0) - (cumulativeCredits[r.accountId] || 0), 0)
  const cumulativeRetainedEarnings = cumulativeRevenue - cumulativeExpenses

  const totalEquity = baseEquity + cumulativeRetainedEarnings
  const isBalanceSheetBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.5

  // 4. CASH & LIQUIDITY (Cash on Hand + Bank)
  const cashAccount = trialBalanceRows.find(r => r.code === '1010')
  const bankAccount = trialBalanceRows.find(r => r.code === '1020')
  const totalCashAndBank = (cashAccount?.netBalance || 0) + (bankAccount?.netBalance || 0)

  // 5. VAT / TAX RETURN REPORT
  const vatOutputAccount = trialBalanceRows.find(r => r.code === '2020')
  const vatInputAccount = trialBalanceRows.find(r => r.code === '1060')
  const outputVATCollected = (periodCredits[vatOutputAccount?.accountId || ''] || 0) - (periodDebits[vatOutputAccount?.accountId || ''] || 0)
  const inputVATPaid = (periodDebits[vatInputAccount?.accountId || ''] || 0) - (periodCredits[vatInputAccount?.accountId || ''] || 0)
  const netVATPayable = outputVATCollected - inputVATPaid

  // 6. STATEMENT OF CASH FLOWS (Simplified direct method)
  const netCashFlowFromOperations = netRevenue - totalCOGS - totalOperatingExpenses

  return {
    timeRange,
    startDate: startDate?.toISOString(),
    endDate: endDate.toISOString(),

    // Executive KPIs for Owner
    kpis: {
      netRevenue: Math.round(netRevenue * 100) / 100,
      totalGrossRevenue: Math.round(totalGrossRevenue * 100) / 100,
      totalCOGS: Math.round(totalCOGS * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossProfitMargin: Math.round(grossProfitMargin * 10) / 10,
      totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      netProfitMargin: Math.round(netProfitMargin * 10) / 10,
      salariesExpense: Math.round(salariesExpense * 100) / 100,
      laborCostPercent: netRevenue > 0 ? Math.round((salariesExpense / netRevenue) * 1000) / 10 : 0,
      cogsPercent: netRevenue > 0 ? Math.round((totalCOGS / netRevenue) * 1000) / 10 : 0,
      wastageExpense: Math.round(wastageExpense * 100) / 100,
      totalCashAndBank: Math.round(totalCashAndBank * 100) / 100,
      workingCapital: Math.round((totalAssets - totalLiabilities) * 100) / 100
    },

    // Profit & Loss Statement
    incomeStatement: {
      revenue: {
        accounts: revenueAccounts.map(r => ({
          code: r.code,
          name: r.name,
          amount: Math.round(((periodCredits[r.accountId] || 0) - (periodDebits[r.accountId] || 0)) * 100) / 100
        })),
        grossRevenue: Math.round(totalGrossRevenue * 100) / 100,
        discounts: Math.round(totalDiscounts * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100
      },
      costOfGoodsSold: {
        accounts: cogsAccounts.map(r => ({
          code: r.code,
          name: r.name,
          amount: Math.round(((periodDebits[r.accountId] || 0) - (periodCredits[r.accountId] || 0)) * 100) / 100
        })),
        totalCOGS: Math.round(totalCOGS * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        grossProfitMargin: Math.round(grossProfitMargin * 10) / 10
      },
      operatingExpenses: {
        accounts: opExpenseAccounts.map(r => ({
          code: r.code,
          name: r.name,
          category: r.category,
          amount: Math.round(((periodDebits[r.accountId] || 0) - (periodCredits[r.accountId] || 0)) * 100) / 100
        })),
        totalExpenses: Math.round(totalOperatingExpenses * 100) / 100,
        salariesExpense: Math.round(salariesExpense * 100) / 100,
        rentExpense: Math.round(rentExpense * 100) / 100,
        utilitiesExpense: Math.round(utilitiesExpense * 100) / 100,
        wastageExpense: Math.round(wastageExpense * 100) / 100
      },
      summary: {
        operatingProfit: Math.round(netOperatingIncome * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        netProfitMargin: Math.round(netProfitMargin * 10) / 10
      }
    },

    // Balance Sheet
    balanceSheet: {
      assets: {
        current: currentAssets.map(r => ({ code: r.code, name: r.name, balance: r.netBalance })),
        nonCurrent: nonCurrentAssets.map(r => ({ code: r.code, name: r.name, balance: r.netBalance })),
        totalAssets: Math.round(totalAssets * 100) / 100
      },
      liabilities: {
        current: liabilityAccounts.map(r => ({ code: r.code, name: r.name, balance: r.netBalance })),
        totalLiabilities: Math.round(totalLiabilities * 100) / 100
      },
      equity: {
        accounts: equityAccounts.map(r => ({ code: r.code, name: r.name, balance: r.netBalance })),
        retainedEarnings: Math.round(cumulativeRetainedEarnings * 100) / 100,
        totalEquity: Math.round(totalEquity * 100) / 100
      },
      isBalanced: isBalanceSheetBalanced,
      totalLiabilitiesAndEquity: Math.round((totalLiabilities + totalEquity) * 100) / 100
    },

    // Trial Balance
    trialBalance: {
      rows: trialBalanceRows,
      totalPeriodDebit: Math.round(totalPeriodDebit * 100) / 100,
      totalPeriodCredit: Math.round(totalPeriodCredit * 100) / 100,
      totalEndingDebit: Math.round(totalEndingDebit * 100) / 100,
      totalEndingCredit: Math.round(totalEndingCredit * 100) / 100,
      isBalanced: isTrialBalanced
    },

    // Statement of Cash Flows
    cashFlow: {
      operatingCashFlow: Math.round(netCashFlowFromOperations * 100) / 100,
      cashReceivedFromSales: Math.round(netRevenue * 100) / 100,
      cashPaidForInventory: Math.round(totalCOGS * 100) / 100,
      cashPaidForSalaries: Math.round(salariesExpense * 100) / 100,
      cashPaidForOtherExpenses: Math.round((totalOperatingExpenses - salariesExpense) * 100) / 100,
      netCashChange: Math.round(netCashFlowFromOperations * 100) / 100,
      endingCashBalance: Math.round(totalCashAndBank * 100) / 100
    },

    // VAT Tax Return Report
    vatReport: {
      outputVATCollected: Math.round(outputVATCollected * 100) / 100,
      inputVATPaid: Math.round(inputVATPaid * 100) / 100,
      netVATPayable: Math.round(netVATPayable * 100) / 100,
      status: netVATPayable >= 0 ? 'payable' : 'refundable'
    }
  }
}

export interface AccountStatementOptions {
  timeRange?: string
  startDate?: Date
  endDate?: Date
  search?: string
  referenceType?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Generates an accurate, running-balance Account Statement / Ledger Report for an individual account.
 */
export async function getAccountStatement(tenantId: string, accountId: string, options: AccountStatementOptions = {}) {
  await ensureDefaultAccounts(tenantId)

  const account = await prisma.account.findFirst({
    where: { id: accountId, tenantId },
    include: { parent: true }
  })

  if (!account) {
    throw new Error('Account not found')
  }

  const isDebitNormal = account.type === 'asset' || account.type === 'expense'
  const now = new Date()
  let startDate: Date | undefined = options.startDate
  let endDate: Date = options.endDate || now

  if (!options.startDate && options.timeRange) {
    if (options.timeRange === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    } else if (options.timeRange === 'week' || options.timeRange === 'this_week') {
      const dayOfWeek = now.getDay()
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0)
    } else if (options.timeRange === 'month' || options.timeRange === 'this_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    } else if (options.timeRange === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    } else if (options.timeRange === 'quarter' || options.timeRange === 'this_quarter') {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3
      startDate = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0)
    } else if (options.timeRange === 'year' || options.timeRange === 'this_year') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
    } else if (options.timeRange === 'all') {
      startDate = undefined
    }
  }

  // Calculate opening balance prior to startDate
  let openingBalance = 0
  if (startDate) {
    const priorLines = await prisma.journalEntryLine.findMany({
      where: {
        accountId,
        journalEntry: {
          tenantId,
          status: 'posted',
          date: { lt: startDate }
        }
      },
      select: {
        debit: true,
        credit: true
      }
    })

    for (const pl of priorLines) {
      if (isDebitNormal) {
        openingBalance += (pl.debit - pl.credit)
      } else {
        openingBalance += (pl.credit - pl.debit)
      }
    }
    openingBalance = Math.round(openingBalance * 100) / 100
  }

  // Query lines within the specified date range
  const whereLines: any = {
    accountId,
    journalEntry: {
      tenantId,
      status: 'posted'
    }
  }

  if (startDate || endDate) {
    whereLines.journalEntry.date = {}
    if (startDate) whereLines.journalEntry.date.gte = startDate
    if (endDate) whereLines.journalEntry.date.lte = endDate
  }

  if (options.referenceType && options.referenceType !== 'all') {
    whereLines.journalEntry.referenceType = options.referenceType
  }

  if (options.search && options.search.trim()) {
    const q = options.search.trim()
    whereLines.OR = [
      { journalEntry: { entryNumber: { contains: q } } },
      { journalEntry: { narration: { contains: q } } },
      { description: { contains: q } }
    ]
  }

  const lines = await prisma.journalEntryLine.findMany({
    where: whereLines,
    include: {
      journalEntry: true
    },
    orderBy: {
      journalEntry: {
        date: 'asc'
      }
    }
  })

  let runningBalance = openingBalance
  let totalPeriodDebit = 0
  let totalPeriodCredit = 0

  const processedLines = lines.map(line => {
    const debit = line.debit || 0
    const credit = line.credit || 0
    totalPeriodDebit += debit
    totalPeriodCredit += credit

    if (isDebitNormal) {
      runningBalance += (debit - credit)
    } else {
      runningBalance += (credit - debit)
    }

    return {
      id: line.id,
      journalEntryId: line.journalEntryId,
      date: line.journalEntry.date.toISOString(),
      entryNumber: line.journalEntry.entryNumber,
      referenceType: line.journalEntry.referenceType,
      referenceId: line.journalEntry.referenceId,
      narration: line.description || line.journalEntry.narration,
      debit,
      credit,
      balance: Math.round(runningBalance * 100) / 100
    }
  })

  const netMovement = isDebitNormal ? (totalPeriodDebit - totalPeriodCredit) : (totalPeriodCredit - totalPeriodDebit)
  const closingBalance = Math.round(runningBalance * 100) / 100
  const resultLines = options.sortOrder === 'desc' ? [...processedLines].reverse() : processedLines

  return {
    account: {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      category: account.category,
      description: account.description,
      currentBalance: account.balance,
      isDebitNormal,
      parentName: account.parent?.name || null
    },
    summary: {
      openingBalance,
      totalDebit: Math.round(totalPeriodDebit * 100) / 100,
      totalCredit: Math.round(totalPeriodCredit * 100) / 100,
      netMovement: Math.round(netMovement * 100) / 100,
      closingBalance,
      transactionCount: processedLines.length,
      isDebitNormal
    },
    period: {
      timeRange: options.timeRange || 'all',
      startDate: startDate?.toISOString() || null,
      endDate: endDate.toISOString()
    },
    lines: resultLines
  }
}

