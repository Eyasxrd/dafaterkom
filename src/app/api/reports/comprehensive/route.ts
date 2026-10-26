import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest, getTenantById } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const tenantInfo = await getTenantById(tenantId)
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || 'today'
    const customStartParam = searchParams.get('startDate')
    const customEndParam = searchParams.get('endDate')

    const now = new Date()
    let startDate: Date | undefined = undefined
    let endDate: Date | undefined = undefined

    if (customStartParam) {
      startDate = new Date(customStartParam)
      if (customEndParam) {
        endDate = new Date(customEndParam)
        endDate.setHours(23, 59, 59, 999)
      }
    } else {
      if (timeRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
      } else if (timeRange === 'yesterday') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
      } else if (timeRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else if (timeRange === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      } else if (timeRange === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      } else if (timeRange === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0)
      } else if (timeRange === 'all') {
        startDate = undefined
        endDate = undefined
      }
    }

    const dateFilter: any = {}
    if (startDate) dateFilter.gte = startDate
    if (endDate) dateFilter.lte = endDate

    const orderWhere: any = { tenantId }
    if (startDate || endDate) {
      orderWhere.createdAt = dateFilter
    }

    const nonCancelledOrderWhere = {
      ...orderWhere,
      orderStatus: { not: 'cancelled' }
    }

    // Parallel data fetches for all report modules
    const [
      revenueAgg,
      totalOrdersCount,
      completedOrdersCount,
      cancelledOrdersCount,
      paymentMethodGroups,
      ordersList,
      popularItemsGroup,
      wasteLogs,
      staffMembers,
      staffOrderGroups,
      shifts,
      attendanceRecords,
      payrollDisbursements,
      expenseVouchers,
      purchaseInvoices,
      suppliers,
      ingredients,
      menuItems,
      customers,
      promoCodes
    ] = await Promise.all([
      // 1. Order Aggregations
      prisma.order.aggregate({
        where: nonCancelledOrderWhere,
        _sum: {
          totalAmount: true,
          subtotal: true,
          tax: true,
          discount: true
        }
      }),
      prisma.order.count({ where: orderWhere }),
      prisma.order.count({ where: { ...orderWhere, orderStatus: 'completed' } }),
      prisma.order.count({ where: { ...orderWhere, orderStatus: 'cancelled' } }),
      
      // Payment Methods
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: nonCancelledOrderWhere,
        _sum: { totalAmount: true },
        _count: { id: true }
      }),

      // Detailed Orders in period (up to 100 recent)
      prisma.order.findMany({
        where: orderWhere,
        include: {
          staff: { select: { id: true, name: true, role: true } },
          customer: { select: { id: true, name: true, phone: true } },
          items: {
            include: {
              menuItem: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),

      // Top Order Items
      prisma.orderItem.groupBy({
        by: ['menuItemId'],
        where: { order: nonCancelledOrderWhere },
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 15
      }),

      // Wastage Logs
      prisma.auditLog.findMany({
        where: {
          tenantId,
          action: 'inventory_waste',
          ...(startDate || endDate ? { timestamp: dateFilter } : {})
        },
        orderBy: { timestamp: 'desc' },
        take: 50
      }),

      // Staff (Safe query without non-existent fields)
      prisma.staff.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          role: true,
          jobTitle: true
        }
      }),

      // Staff Orders
      prisma.order.groupBy({
        by: ['staffId'],
        where: nonCancelledOrderWhere,
        _sum: { totalAmount: true, discount: true },
        _count: { id: true }
      }),

      // Shifts
      prisma.shift.findMany({
        where: {
          tenantId,
          ...(startDate || endDate ? { startTime: dateFilter } : {})
        },
        include: {
          staff: { select: { id: true, name: true } }
        },
        orderBy: { startTime: 'desc' },
        take: 50
      }),

      // Attendance
      prisma.attendanceRecord.findMany({
        where: {
          tenantId,
          ...(startDate || endDate ? { clockIn: dateFilter } : {})
        },
        include: {
          staff: { select: { id: true, name: true, role: true } }
        },
        orderBy: { clockIn: 'desc' }
      }),

      // Payroll Disbursements
      prisma.payrollDisbursement.findMany({
        where: {
          tenantId,
          ...(startDate || endDate ? { disbursedAt: dateFilter } : {})
        },
        orderBy: { disbursedAt: 'desc' }
      }),

      // Expense Vouchers
      prisma.expenseVoucher.findMany({
        where: {
          tenantId,
          ...(startDate || endDate ? { paymentDate: dateFilter } : {})
        },
        orderBy: { paymentDate: 'desc' }
      }),

      // Purchase Invoices
      prisma.purchaseInvoice.findMany({
        where: {
          tenantId,
          ...(startDate || endDate ? { issueDate: dateFilter } : {})
        },
        include: {
          supplier: { select: { id: true, name: true, phone: true } },
          items: true
        },
        orderBy: { issueDate: 'desc' }
      }),

      // Suppliers
      prisma.supplier.findMany({
        where: { tenantId },
        select: { id: true, name: true, contactPerson: true, phone: true, balance: true }
      }),

      // Ingredients (for stock valuation & low stock alerts)
      prisma.ingredient.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          quantity: true,
          unit: true,
          lowStockThreshold: true,
          costPerUnit: true,
          lastRestocked: true
        }
      }),

      // Menu Items & Inventory
      prisma.menuItem.findMany({
        where: { tenantId },
        include: {
          category: { select: { id: true, name: true } },
          inventory: true
        }
      }),

      // Customers
      prisma.customer.findMany({
        where: { tenantId },
        include: {
          orders: {
            where: { orderStatus: { not: 'cancelled' } },
            select: { totalAmount: true, createdAt: true }
          }
        },
        take: 100
      }),

      // Promo Codes
      prisma.promoCode.findMany({
        where: { tenantId }
      })
    ])

    // --- 1. OVERVIEW & ORDERS CALCULATIONS ---
    const grossSales = revenueAgg._sum.subtotal || 0
    const totalTax = revenueAgg._sum.tax || 0
    const totalDiscounts = revenueAgg._sum.discount || 0
    const netRevenue = revenueAgg._sum.totalAmount || 0

    // Hourly Breakdown (0 - 23)
    const hourlyMap = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      label: `${String(i).padStart(2, '0')}:00`,
      orders: 0,
      sales: 0
    }))

    // Channel Breakdown (Dine In vs Takeout / Delivery)
    let dineInOrders = 0
    let dineInSales = 0
    let deliveryOrders = 0
    let deliverySales = 0
    let takeawayOrders = 0
    let takeawaySales = 0

    ordersList.forEach(order => {
      if (order.orderStatus !== 'cancelled') {
        const orderHour = new Date(order.createdAt).getHours()
        hourlyMap[orderHour].orders += 1
        hourlyMap[orderHour].sales += order.totalAmount

        if (order.tableNumber) {
          dineInOrders += 1
          dineInSales += order.totalAmount
        } else if (order.notes && order.notes.toLowerCase().includes('delivery')) {
          deliveryOrders += 1
          deliverySales += order.totalAmount
        } else {
          takeawayOrders += 1
          takeawaySales += order.totalAmount
        }
      }
    })

    // Payment Methods
    const paymentMethods = paymentMethodGroups.map(p => ({
      method: p.paymentMethod,
      amount: Math.round((p._sum.totalAmount || 0) * 100) / 100,
      count: p._count.id,
      percentage: netRevenue > 0 ? Math.round(((p._sum.totalAmount || 0) / netRevenue) * 1000) / 10 : 0
    }))

    // Map popular items with MenuItem names & category
    const menuMap = new Map(menuItems.map(m => [m.id, m]))
    const popularItems = popularItemsGroup.map(item => {
      const menu = menuMap.get(item.menuItemId)
      return {
        id: item.menuItemId,
        name: menu?.name || 'Unknown Item',
        category: menu?.category?.name || 'General',
        quantity: item._sum.quantity || 0,
        revenue: Math.round((item._sum.subtotal || 0) * 100) / 100,
        price: menu?.price || 0
      }
    })

    // Category Sales breakdown
    const categorySalesMap = new Map<string, { name: string; quantity: number; revenue: number }>()
    popularItems.forEach(item => {
      const existing = categorySalesMap.get(item.category) || { name: item.category, quantity: 0, revenue: 0 }
      existing.quantity += item.quantity
      existing.revenue += item.revenue
      categorySalesMap.set(item.category, existing)
    })
    const categoryBreakdown = Array.from(categorySalesMap.values()).sort((a, b) => b.revenue - a.revenue)

    // --- 2. MONEY & FINANCIALS CALCULATIONS ---
    let wastageLoss = 0
    const parsedWastageLogs = wasteLogs.map(w => {
      let loss = 0
      let itemName = 'Unknown'
      let quantity = 0
      let reason = 'Wastage / Spoilage'
      if (w.afterValue) {
        try {
          const parsed = JSON.parse(w.afterValue)
          if (parsed.financialLoss) loss = Number(parsed.financialLoss)
          if (parsed.name) itemName = parsed.name
          if (parsed.quantity) quantity = Number(parsed.quantity)
          if (parsed.reason) reason = parsed.reason
        } catch {}
      }
      wastageLoss += loss
      return {
        id: w.id,
        timestamp: w.timestamp,
        itemName,
        quantity,
        lossAmount: Math.round(loss * 100) / 100,
        reason,
        staffId: w.staffId
      }
    })

    const expenseCategoryMap = new Map<string, { category: string; amount: number; tax: number; count: number }>()
    let totalOperatingExpenses = 0
    let totalExpenseTax = 0

    expenseVouchers.forEach(v => {
      if (v.status !== 'cancelled') {
        const cat = v.category || 'other'
        const existing = expenseCategoryMap.get(cat) || { category: cat, amount: 0, tax: 0, count: 0 }
        existing.amount += v.amount
        existing.tax += v.taxAmount
        existing.count += 1
        expenseCategoryMap.set(cat, existing)

        totalOperatingExpenses += v.amount
        totalExpenseTax += v.taxAmount
      }
    })

    let totalPurchases = 0
    let totalPurchasesPaid = 0
    purchaseInvoices.forEach(inv => {
      if (inv.status !== 'cancelled') {
        totalPurchases += inv.totalAmount
        totalPurchasesPaid += inv.paidAmount
      }
    })

    const estimatedCOGS = totalPurchases > 0 ? totalPurchases : Math.round(grossSales * 0.32 * 100) / 100
    const grossProfit = Math.round((grossSales - estimatedCOGS) * 100) / 100
    const totalAllExpenses = totalOperatingExpenses + wastageLoss
    const netProfit = Math.round((grossProfit - totalAllExpenses) * 100) / 100
    const netProfitMargin = grossSales > 0 ? Math.round((netProfit / grossSales) * 1000) / 10 : 0

    let totalShiftExpectedCash = 0
    let totalShiftActualCash = 0
    let totalShiftDiscrepancy = 0

    const shiftAudits = shifts.map(s => {
      const expected = (s.startCash || 0) + (s.cashSales || 0)
      const actual = s.endCash !== null ? s.endCash : expected
      const variance = s.endCash !== null ? Math.round((s.endCash - expected) * 100) / 100 : 0
      
      totalShiftExpectedCash += expected
      if (s.endCash !== null) {
        totalShiftActualCash += s.endCash
        totalShiftDiscrepancy += variance
      }

      return {
        id: s.id,
        staffName: s.staff?.name || 'Unknown Staff',
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        startCash: s.startCash,
        cashSales: s.cashSales,
        cardSales: s.cardSales,
        totalOrders: s.totalOrders,
        endCash: s.endCash,
        variance,
        notes: s.notes
      }
    })

    // --- 3. EMPLOYEES & HR CALCULATIONS ---
    const staffOrderMap = new Map(staffOrderGroups.map(s => [s.staffId, s]))

    const staffAttendanceMap = new Map<string, { totalHours: number; regularHours: number; overtimeHours: number; shiftCount: number }>()
    attendanceRecords.forEach(att => {
      const existing = staffAttendanceMap.get(att.staffId) || { totalHours: 0, regularHours: 0, overtimeHours: 0, shiftCount: 0 }
      existing.totalHours += att.totalHours || 0
      existing.regularHours += att.regularHours || 0
      existing.overtimeHours += att.overtimeHours || 0
      existing.shiftCount += 1
      staffAttendanceMap.set(att.staffId, existing)
    })

    const staffPerformance = staffMembers.map(member => {
      const orderStats = staffOrderMap.get(member.id)
      const attStats = staffAttendanceMap.get(member.id) || { totalHours: 0, regularHours: 0, overtimeHours: 0, shiftCount: 0 }
      const count = orderStats?._count?.id || 0
      const salesVolume = orderStats?._sum?.totalAmount || 0
      const discountsGiven = orderStats?._sum?.discount || 0
      const avgTicket = count > 0 ? Math.round((salesVolume / count) * 100) / 100 : 0
      const salesPerHour = attStats.totalHours > 0 ? Math.round((salesVolume / attStats.totalHours) * 100) / 100 : salesVolume

      return {
        staffId: member.id,
        name: member.name,
        role: member.role,
        department: (member as any).jobTitle || member.role || 'Staff',
        isActive: true,
        ordersCount: count,
        totalSales: Math.round(salesVolume * 100) / 100,
        discountsGiven: Math.round(discountsGiven * 100) / 100,
        averageTicket: avgTicket,
        hoursLogged: Math.round(attStats.totalHours * 10) / 10,
        regularHours: Math.round(attStats.regularHours * 10) / 10,
        overtimeHours: Math.round(attStats.overtimeHours * 10) / 10,
        shiftsWorked: attStats.shiftCount,
        salesPerHour
      }
    }).sort((a, b) => b.totalSales - a.totalSales)

    let totalPayrollDisbursed = 0
    let totalPayrollBase = 0
    let totalPayrollOvertime = 0
    let totalPayrollBonuses = 0
    let totalPayrollDeductions = 0

    payrollDisbursements.forEach(p => {
      totalPayrollDisbursed += p.totalAmount
      totalPayrollBase += p.basePay
      totalPayrollOvertime += p.overtimePay
      totalPayrollBonuses += p.bonuses
      totalPayrollDeductions += p.deductions
    })

    // --- 4. INVENTORY & SUPPLIER CALCULATIONS ---
    let totalIngredientValuation = 0
    const lowStockIngredients: any[] = []

    ingredients.forEach(ing => {
      const val = ing.quantity * ing.costPerUnit
      totalIngredientValuation += val
      if (ing.quantity <= ing.lowStockThreshold) {
        lowStockIngredients.push({
          id: ing.id,
          name: ing.name,
          type: 'ingredient',
          currentStock: ing.quantity,
          unit: ing.unit,
          threshold: ing.lowStockThreshold,
          costPerUnit: ing.costPerUnit,
          estimatedReorderCost: Math.max(0, ing.lowStockThreshold * 2 - ing.quantity) * ing.costPerUnit
        })
      }
    })

    let totalRetailValuation = 0
    const lowStockItems: any[] = []

    menuItems.forEach(item => {
      if (item.inventory) {
        const val = item.inventory.quantity * item.price
        totalRetailValuation += val
        if (item.inventory.quantity <= item.inventory.lowStockThreshold) {
          lowStockItems.push({
            id: item.id,
            name: item.name,
            type: 'menu_item',
            currentStock: item.inventory.quantity,
            unit: item.inventory.unit,
            threshold: item.inventory.lowStockThreshold,
            costPerUnit: item.price,
            estimatedReorderCost: Math.max(0, item.inventory.lowStockThreshold * 2 - item.inventory.quantity) * item.price
          })
        }
      }
    })

    const totalInventoryValuation = Math.round((totalIngredientValuation + totalRetailValuation) * 100) / 100

    let totalSupplierBalanceDebt = 0
    suppliers.forEach(s => {
      totalSupplierBalanceDebt += s.balance || 0
    })

    // --- 5. CUSTOMERS & LOYALTY CALCULATIONS ---
    let totalLoyaltyPointsBalance = 0
    const topCustomers = customers.map(c => {
      const customerOrders = c.orders || []
      const orderCount = customerOrders.length
      const totalSpend = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0)
      totalLoyaltyPointsBalance += c.loyaltyPoints || 0

      return {
        id: c.id,
        name: c.name,
        phone: c.phone || 'N/A',
        loyaltyPoints: c.loyaltyPoints || 0,
        ordersCount: orderCount,
        totalSpend: Math.round(totalSpend * 100) / 100,
        averageSpend: orderCount > 0 ? Math.round((totalSpend / orderCount) * 100) / 100 : 0,
        joinedAt: c.createdAt
      }
    }).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 25)

    return NextResponse.json({
      timeRange,
      currency: tenantInfo.currency || 'USD',
      businessName: tenantInfo.businessName,
      taxRate: tenantInfo.taxRate || 15.0,
      generatedAt: new Date().toISOString(),

      // 1. Executive Summary
      overview: {
        grossSales: Math.round(grossSales * 100) / 100,
        netRevenue: Math.round(netRevenue * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalDiscounts: Math.round(totalDiscounts * 100) / 100,
        estimatedCOGS,
        grossProfit,
        totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
        wastageLoss: Math.round(wastageLoss * 100) / 100,
        totalAllExpenses: Math.round(totalAllExpenses * 100) / 100,
        netProfit,
        netProfitMargin,
        totalOrders: totalOrdersCount,
        completedOrders: completedOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        averageOrderValue: totalOrdersCount > 0 ? Math.round((netRevenue / (completedOrdersCount || 1)) * 100) / 100 : 0,
        totalStaff: staffMembers.length,
        totalInventoryValuation,
        totalSupplierDebt: Math.round(totalSupplierBalanceDebt * 100) / 100
      },

      // 2. Orders & Sales
      ordersReport: {
        totalOrders: totalOrdersCount,
        completedOrders: completedOrdersCount,
        cancelledOrders: cancelledOrdersCount,
        fulfillmentChannels: [
          { channel: 'Dine-In', orders: dineInOrders, sales: Math.round(dineInSales * 100) / 100 },
          { channel: 'Takeaway / Counter', orders: takeawayOrders, sales: Math.round(takeawaySales * 100) / 100 },
          { channel: 'Delivery / Apps', orders: deliveryOrders, sales: Math.round(deliverySales * 100) / 100 }
        ],
        paymentMethods,
        hourlySales: hourlyMap,
        popularItems,
        categoryBreakdown,
        promoCodes: promoCodes.map(p => ({
          code: p.code,
          description: p.description,
          discountType: p.discountType,
          usedCount: p.usedCount,
          isActive: p.isActive
        })),
        recentOrders: ordersList.map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          createdAt: o.createdAt,
          staffName: o.staff?.name || 'Cashier',
          customerName: o.customerName || o.customer?.name || 'Walk-in Customer',
          subtotal: o.subtotal,
          tax: o.tax,
          discount: o.discount,
          totalAmount: o.totalAmount,
          paymentMethod: o.paymentMethod,
          paymentStatus: o.paymentStatus,
          orderStatus: o.orderStatus,
          tableNumber: o.tableNumber,
          itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0)
        }))
      },

      // 3. Money & Financials
      moneyReport: {
        incomeStatement: {
          grossRevenue: Math.round(grossSales * 100) / 100,
          discounts: Math.round(totalDiscounts * 100) / 100,
          netSales: Math.round(netRevenue * 100) / 100,
          costOfGoodsSold: estimatedCOGS,
          grossProfit: grossProfit,
          operatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
          wastageLoss: Math.round(wastageLoss * 100) / 100,
          netOperatingIncome: netProfit,
          profitMargin: netProfitMargin
        },
        expenseCategories: Array.from(expenseCategoryMap.values()).map(e => ({
          ...e,
          amount: Math.round(e.amount * 100) / 100,
          tax: Math.round(e.tax * 100) / 100,
          percentage: totalOperatingExpenses > 0 ? Math.round((e.amount / totalOperatingExpenses) * 1000) / 10 : 0
        })).sort((a, b) => b.amount - a.amount),
        expenseVouchers: expenseVouchers.map(v => ({
          id: v.id,
          voucherNumber: v.voucherNumber,
          title: v.title,
          category: v.category,
          amount: v.amount,
          taxAmount: v.taxAmount,
          totalAmount: v.totalAmount,
          paymentMethod: v.paymentMethod,
          paymentDate: v.paymentDate,
          payee: v.payee,
          status: v.status,
          notes: v.notes
        })),
        cashierShifts: {
          totalShifts: shifts.length,
          totalExpectedCash: Math.round(totalShiftExpectedCash * 100) / 100,
          totalActualCash: Math.round(totalShiftActualCash * 100) / 100,
          totalVariance: Math.round(totalShiftDiscrepancy * 100) / 100,
          shiftsList: shiftAudits
        },
        taxSummary: {
          outputTaxCollected: Math.round(totalTax * 100) / 100,
          inputTaxPaid: Math.round(totalExpenseTax * 100) / 100,
          netTaxPayable: Math.round(Math.max(0, totalTax - totalExpenseTax) * 100) / 100,
          applicableTaxRate: tenantInfo.taxRate || 15.0
        }
      },

      // 4. Employees & HR
      employeesReport: {
        totalStaffCount: staffMembers.length,
        activeStaffCount: staffMembers.length,
        staffPerformance,
        attendanceSummary: {
          totalAttendanceLogs: attendanceRecords.length,
          totalHoursLogged: Math.round(attendanceRecords.reduce((sum, a) => sum + (a.totalHours || 0), 0) * 10) / 10,
          totalOvertimeHours: Math.round(attendanceRecords.reduce((sum, a) => sum + (a.overtimeHours || 0), 0) * 10) / 10,
          recentLogs: attendanceRecords.slice(0, 30).map(a => ({
            id: a.id,
            staffName: a.staff?.name || 'Staff Member',
            role: a.staff?.role || 'staff',
            clockIn: a.clockIn,
            clockOut: a.clockOut,
            totalHours: a.totalHours,
            overtimeHours: a.overtimeHours,
            status: a.status
          }))
        },
        payrollSummary: {
          totalDisbursed: Math.round(totalPayrollDisbursed * 100) / 100,
          basePay: Math.round(totalPayrollBase * 100) / 100,
          overtimePay: Math.round(totalPayrollOvertime * 100) / 100,
          bonuses: Math.round(totalPayrollBonuses * 100) / 100,
          deductions: Math.round(totalPayrollDeductions * 100) / 100,
          disbursementsList: payrollDisbursements.map(p => ({
            id: p.id,
            period: `${p.periodMonth}/${p.periodYear}`,
            staffCount: p.staffCount,
            totalAmount: p.totalAmount,
            basePay: p.basePay,
            overtimePay: p.overtimePay,
            bonuses: p.bonuses,
            deductions: p.deductions,
            paymentMethod: p.paymentMethod,
            disbursedAt: p.disbursedAt,
            status: p.status
          }))
        }
      },

      // 5. Inventory, Wastage & Suppliers
      inventorySuppliersReport: {
        stockValuation: {
          totalValuation: totalInventoryValuation,
          ingredientValuation: Math.round(totalIngredientValuation * 100) / 100,
          retailValuation: Math.round(totalRetailValuation * 100) / 100,
          totalIngredientsTracked: ingredients.length,
          totalMenuItemsTracked: menuItems.length
        },
        criticalLowStock: [...lowStockIngredients, ...lowStockItems],
        wastageLogs: parsedWastageLogs,
        purchasingSummary: {
          totalInvoices: purchaseInvoices.length,
          totalPurchases: Math.round(totalPurchases * 100) / 100,
          totalPaid: Math.round(totalPurchasesPaid * 100) / 100,
          outstandingBalance: Math.round((totalPurchases - totalPurchasesPaid) * 100) / 100,
          recentInvoices: purchaseInvoices.slice(0, 30).map(i => ({
            id: i.id,
            invoiceNumber: i.invoiceNumber,
            supplierName: i.supplier?.name || 'Unknown Supplier',
            issueDate: i.issueDate,
            totalAmount: i.totalAmount,
            paidAmount: i.paidAmount,
            paymentStatus: i.paymentStatus,
            itemsCount: i.items.length
          }))
        },
        suppliersList: suppliers.map(s => ({
          id: s.id,
          name: s.name,
          contactPerson: s.contactPerson,
          phone: s.phone,
          balance: s.balance
        }))
      },

      // 6. Customers & Loyalty
      customersReport: {
        totalCustomers: customers.length,
        totalLoyaltyPointsBalance,
        topCustomers
      }
    })
  } catch (error: any) {
    console.error('Failed to generate comprehensive reports:', error)
    return NextResponse.json({ error: error.message || 'Failed to generate comprehensive reports' }, { status: 500 })
  }
}
