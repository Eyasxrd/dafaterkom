import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedPromos() {
  const tenantId = 'default-shop'
  console.log('Seeding initial promo codes for tenant:', tenantId)

  // Find a coffee or pastry item for the free gift demo promo
  const espressoItem = await prisma.menuItem.findFirst({
    where: {
      tenantId,
      name: { contains: 'Espresso' }
    }
  }) || await prisma.menuItem.findFirst({
    where: { tenantId }
  })

  const samplePromos = [
    {
      code: 'WELCOME10',
      description: '10% welcome discount for new guests',
      discountType: 'percentage',
      discountPercent: 10.0,
      minOrderAmount: 0,
      isActive: true
    },
    {
      code: 'SUMMER20',
      description: '20% summer savings on orders over $15',
      discountType: 'percentage',
      discountPercent: 20.0,
      minOrderAmount: 15.0,
      maxDiscount: 25.0,
      isActive: true
    },
    {
      code: 'VIP15',
      description: 'Exclusive 15% discount for Dafaterkom VIPs',
      discountType: 'percentage',
      discountPercent: 15.0,
      minOrderAmount: 0,
      isActive: true
    },
    {
      code: 'HAPPYHOUR',
      description: '25% happy hour discount',
      discountType: 'percentage',
      discountPercent: 25.0,
      minOrderAmount: 10.0,
      isActive: true
    },
    {
      code: 'COFFEE5',
      description: '$5.00 flat discount off entire bill',
      discountType: 'fixed_amount',
      discountAmount: 5.0,
      minOrderAmount: 10.0,
      isActive: true
    },
    ...(espressoItem ? [{
      code: 'FREECOFFEE',
      description: `Complimentary ${espressoItem.name} gift with your meal`,
      discountType: 'free_item',
      freeItemId: espressoItem.id,
      minOrderAmount: 10.0,
      isActive: true
    }] : [])
  ]

  for (const promo of samplePromos) {
    await prisma.promoCode.upsert({
      where: {
        tenantId_code: {
          tenantId,
          code: promo.code
        }
      },
      update: promo,
      create: {
        ...promo,
        tenantId
      }
    })
    console.log(`✓ Promo code created/updated: ${promo.code} (${promo.discountType})`)
  }

  console.log('Successfully seeded promo codes!')
}

seedPromos()
  .catch(err => {
    console.error('Error seeding promos:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
