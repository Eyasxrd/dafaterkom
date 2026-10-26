import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTenantIdFromRequest } from '@/lib/tenant-context'

export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const now = new Date()

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      include: {
        orders: {
          select: { id: true, createdAt: true, totalAmount: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { name: 'asc' }
    })

    const birthdaySegment: any[] = []
    const twoWeeksSegment: any[] = []
    const oneMonthSegment: any[] = []

    const currentMonth = now.getMonth() + 1
    const currentDay = now.getDate()

    for (const cust of customers) {
      const lastOrder = cust.orders[0]
      const referenceDate = lastOrder ? new Date(lastOrder.createdAt) : new Date(cust.createdAt)
      const diffMs = now.getTime() - referenceDate.getTime()
      const daysSinceVisit = Math.floor(diffMs / (1000 * 60 * 60 * 24))

      // Check Inactivity Segments
      if (daysSinceVisit >= 14 && daysSinceVisit < 30) {
        twoWeeksSegment.push({
          id: cust.id,
          name: cust.name,
          phone: cust.phone,
          email: cust.email,
          loyaltyPoints: cust.loyaltyPoints,
          daysSinceVisit,
          lastOrderDate: referenceDate.toISOString(),
          lastOrderAmount: lastOrder?.totalAmount || 0
        })
      } else if (daysSinceVisit >= 30) {
        oneMonthSegment.push({
          id: cust.id,
          name: cust.name,
          phone: cust.phone,
          email: cust.email,
          loyaltyPoints: cust.loyaltyPoints,
          daysSinceVisit,
          lastOrderDate: referenceDate.toISOString(),
          lastOrderAmount: lastOrder?.totalAmount || 0
        })
      }

      // Check Birthday Segment
      if (cust.dateOfBirth) {
        try {
          // dateOfBirth format can be YYYY-MM-DD
          const parts = cust.dateOfBirth.split('-')
          if (parts.length >= 2) {
            const birthMonth = parseInt(parts[parts.length - 2], 10)
            const birthDay = parseInt(parts[parts.length - 1], 10)

            const isToday = birthMonth === currentMonth && birthDay === currentDay

            // Check if within next 7 days
            let isUpcoming = false
            for (let d = 1; d <= 7; d++) {
              const testDate = new Date(now)
              testDate.setDate(now.getDate() + d)
              if (testDate.getMonth() + 1 === birthMonth && testDate.getDate() === birthDay) {
                isUpcoming = true
                break
              }
            }

            if (isToday || isUpcoming) {
              birthdaySegment.push({
                id: cust.id,
                name: cust.name,
                phone: cust.phone,
                email: cust.email,
                loyaltyPoints: cust.loyaltyPoints,
                dateOfBirth: cust.dateOfBirth,
                isBirthdayToday: isToday,
                isUpcoming
              })
            }
          }
        } catch (e) {
          // Skip invalid date format
        }
      }
    }

    // Get recent notification logs for retention offers
    const recentLogs = await prisma.notificationLog.findMany({
      where: {
        customer: { tenantId }
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        campaign: { select: { id: true, name: true, triggerType: true } }
      },
      orderBy: { sentAt: 'desc' },
      take: 20
    })

    return NextResponse.json({
      counts: {
        birthday: birthdaySegment.length,
        twoWeeks: twoWeeksSegment.length,
        oneMonth: oneMonthSegment.length,
        totalCustomers: customers.length
      },
      segments: {
        birthday: birthdaySegment,
        twoWeeks: twoWeeksSegment,
        oneMonth: oneMonthSegment
      },
      recentLogs
    })
  } catch (error: any) {
    console.error('Failed to fetch CRM retention audience:', error)
    return NextResponse.json({ error: 'Failed to fetch retention audience' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantIdFromRequest(request)
    const body = await request.json()
    const {
      segment, // 'birthday' | 'two_weeks' | 'one_month'
      discountPercent = 20,
      customMessage,
      targetCustomerIds,
      validDays = 7
    } = body

    if (!segment) {
      return NextResponse.json({ error: 'Target segment is required' }, { status: 400 })
    }

    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    let promoPrefix = 'OFFER'
    let campaignName = 'Customer Retention Offer'

    if (segment === 'birthday') {
      promoPrefix = 'BDAY'
      campaignName = 'Birthday Celebration Offer'
    } else if (segment === 'two_weeks') {
      promoPrefix = 'MISSU'
      campaignName = '2-Week Inactivity Winback'
    } else if (segment === 'one_month') {
      promoPrefix = 'COMEBACK'
      campaignName = '1-Month+ Long Absent Winback'
    }

    const promoCodeString = `${promoPrefix}-${discountPercent}-${randomSuffix}`

    // 1. Create the PromoCode so it can actually be redeemed at checkout in POS
    const now = new Date()
    const endDate = new Date(now)
    endDate.setDate(now.getDate() + (parseInt(validDays) || 7))

    const promoCode = await prisma.promoCode.create({
      data: {
        tenantId,
        code: promoCodeString,
        description: `${campaignName} - ${discountPercent}% OFF`,
        discountType: 'percentage',
        discountPercent: parseFloat(discountPercent) || 20,
        startDate: now,
        endDate,
        isActive: true,
        usageLimit: 100
      }
    })

    // 2. Create or find LoyaltyCampaign record
    const campaign = await prisma.loyaltyCampaign.create({
      data: {
        tenantId,
        name: campaignName,
        triggerType: 'inactivity',
        rewardDescription: `${discountPercent}% discount with code ${promoCodeString}`,
        discountPercent: parseFloat(discountPercent) || 20,
        isActive: true
      }
    })

    // 3. Find recipient customers
    let recipients: any[] = []
    if (targetCustomerIds && Array.isArray(targetCustomerIds) && targetCustomerIds.length > 0) {
      recipients = await prisma.customer.findMany({
        where: { id: { in: targetCustomerIds }, tenantId }
      })
    } else {
      // Lookup all customers in tenant
      recipients = await prisma.customer.findMany({
        where: { tenantId }
      })
    }

    // 4. Create NotificationLog entries for targeted customers
    const logEntries = recipients.map((cust) => {
      let message = customMessage || ''
      if (!message) {
        if (segment === 'birthday') {
          message = `🎂 Happy Birthday ${cust.name}! Celebrate with ${discountPercent}% OFF your order today! Use Promo Code: ${promoCodeString}`
        } else if (segment === 'two_weeks') {
          message = `👋 We miss you, ${cust.name}! Enjoy ${discountPercent}% OFF your next visit this week with code: ${promoCodeString}`
        } else {
          message = `🎉 Welcome back ${cust.name}! It's been over a month—take ${discountPercent}% OFF your order with code: ${promoCodeString}`
        }
      } else {
        message = message
          .replace('{name}', cust.name)
          .replace('{code}', promoCodeString)
          .replace('{discount}', `${discountPercent}%`)
      }

      return {
        campaignId: campaign.id,
        customerId: cust.id,
        channel: cust.phone ? 'sms' : 'push',
        message,
        sentAt: new Date()
      }
    })

    if (logEntries.length > 0) {
      await prisma.notificationLog.createMany({
        data: logEntries
      })
    }

    return NextResponse.json({
      success: true,
      segment,
      promoCode: promoCodeString,
      discountPercent,
      dispatchedCount: logEntries.length,
      validUntil: endDate.toISOString()
    })
  } catch (error: any) {
    console.error('Failed to dispatch retention offer:', error)
    return NextResponse.json({ error: error.message || 'Failed to dispatch retention offer' }, { status: 500 })
  }
}
