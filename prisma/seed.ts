import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Delete existing data in correct order (child tables first)
  await prisma.notificationLog.deleteMany()
  await prisma.loyaltyCampaign.deleteMany()
  await prisma.customerConsent.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.syncEvent.deleteMany()
  await prisma.license.deleteMany()
  await prisma.device.deleteMany()
  await prisma.billingRecord.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.recipe.deleteMany()
  await prisma.inventory.deleteMany()
  await prisma.menuItem.deleteMany()
  await prisma.category.deleteMany()
  await prisma.ingredient.deleteMany()
  await prisma.shift.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.tenant.deleteMany()
  
  console.log('Existing data cleared')

  // Create default tenant
  const defaultTenant = await prisma.tenant.create({
    data: {
      id: 'default-shop',
      businessName: 'Dafaterkom Café & Bakery',
      slug: 'dafaterkom-cafe',
      plan: 'growth',
      status: 'active',
      currency: 'USD',
      taxRate: 15.0,
      taxNumber: 'TAX-987654321',
      receiptHeader: 'Welcome to Dafaterkom Café & Bakery\n123 Gourmet Ave, Suite 100',
      receiptFooter: 'Thank you for your visit!\nFollow us on Instagram @dafaterkom.cafe',
      geofenceLat: 40.7128,
      geofenceLng: -74.0060,
      geofenceRadius: 250,
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  })
  console.log('Default tenant created:', defaultTenant.businessName)

  // Create starter license for default tenant
  await prisma.license.create({
    data: {
      tenantId: defaultTenant.id,
      signedToken: 'mock-signed-jwt-token-growth-plan-2026',
      plan: 'growth',
      maxDevices: 5,
      featureFlags: JSON.stringify({
        kds: true,
        inventory: true,
        recipes: true,
        shifts: true,
        loyalty: true,
        proximity_notifications: true,
        lan_sync: true
      }),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    }
  })

  // Create default device
  await prisma.device.create({
    data: {
      id: 'main-pos',
      tenantId: defaultTenant.id,
      name: 'Counter Register 1 (LAN Hub)',
      role: 'hub',
      pairingCode: '123456',
      pairedAt: new Date(),
      lastSyncedAt: new Date(),
      appVersion: '1.0.0'
    }
  })

  // Create default loyalty campaign
  await prisma.loyaltyCampaign.create({
    data: {
      tenantId: defaultTenant.id,
      name: 'Morning Espresso Delight',
      triggerType: 'proximity',
      rewardDescription: 'Free small espresso or 20% off any breakfast pastry!',
      pointsCost: 50,
      discountPercent: 20,
      cooldownHours: 8,
      isActive: true,
      rulesJson: JSON.stringify({
        minPoints: 20,
        quietHoursStart: 21,
        quietHoursEnd: 7
      })
    }
  })

  // Create default admin user
  const hashedAdminPassword = await bcrypt.hash('admin123', 10)
  const hashedCafePassword = await bcrypt.hash('password123', 10)
  
  const admin = await prisma.staff.create({
    data: {
      tenantId: defaultTenant.id,
      name: 'System Admin',
      email: 'admin@dafaterkom.com',
      password: hashedAdminPassword,
      role: 'admin',
      joinCode: '888999',
      isActive: true
    }
  })

  await prisma.staff.createMany({
    data: [
      {
        tenantId: defaultTenant.id,
        name: 'Admin User',
        email: 'admin@cafe.com',
        password: hashedCafePassword,
        role: 'admin',
        joinCode: '100001',
        isActive: true
      },
      {
        tenantId: defaultTenant.id,
        name: 'Sarah Manager',
        email: 'sarah@cafe.com',
        password: hashedCafePassword,
        role: 'manager',
        joinCode: '100002',
        isActive: true
      },
      {
        tenantId: defaultTenant.id,
        name: 'John Cashier',
        email: 'john@cafe.com',
        password: hashedCafePassword,
        role: 'cashier',
        joinCode: '100003',
        isActive: true
      },
      {
        tenantId: defaultTenant.id,
        name: 'Mike Kitchen',
        email: 'mike@cafe.com',
        password: hashedCafePassword,
        role: 'kitchen',
        joinCode: '100004',
        isActive: true
      }
    ]
  })

  console.log('Staff members created successfully')

  // Create categories
  const beveragesCategory = await prisma.category.create({
    data: {
      tenantId: defaultTenant.id,
      name: 'Beverages',
      description: 'Hot and cold drinks'
    }
  })

  const foodCategory = await prisma.category.create({
    data: {
      tenantId: defaultTenant.id,
      name: 'Food',
      description: 'Food items'
    }
  })

  // Create ingredients
  const cup = await prisma.ingredient.create({
    data: {
      name: 'Cup',
      description: 'Coffee cup',
      quantity: 1000,
      unit: 'pieces',
      lowStockThreshold: 50
    }
  })

  const sugar = await prisma.ingredient.create({
    data: {
      name: 'Sugar',
      description: 'White sugar',
      quantity: 5000,
      unit: 'grams',
      lowStockThreshold: 500
    }
  })

  const espressoBeans = await prisma.ingredient.create({
    data: {
      name: 'Espresso Beans',
      description: 'Coffee beans for espresso',
      quantity: 10000,
      unit: 'grams',
      lowStockThreshold: 1000
    }
  })

  const milk = await prisma.ingredient.create({
    data: {
      name: 'Milk',
      description: 'Fresh milk',
      quantity: 20000,
      unit: 'ml',
      lowStockThreshold: 2000
    }
  })

  const water = await prisma.ingredient.create({
    data: {
      name: 'Water',
      description: 'Filtered water',
      quantity: 50000,
      unit: 'ml',
      lowStockThreshold: 5000
    }
  })

  const bread = await prisma.ingredient.create({
    data: {
      name: 'Bread',
      description: 'Sandwich bread',
      quantity: 200,
      unit: 'pieces',
      lowStockThreshold: 20
    }
  })

  const cheese = await prisma.ingredient.create({
    data: {
      name: 'Cheese',
      description: 'Cheddar cheese',
      quantity: 5000,
      unit: 'grams',
      lowStockThreshold: 500
    }
  })

  const chicken = await prisma.ingredient.create({
    data: {
      name: 'Chicken',
      description: 'Grilled chicken',
      quantity: 3000,
      unit: 'grams',
      lowStockThreshold: 300
    }
  })

  const lettuce = await prisma.ingredient.create({
    data: {
      name: 'Lettuce',
      description: 'Fresh lettuce',
      quantity: 1000,
      unit: 'grams',
      lowStockThreshold: 100
    }
  })

  const tomato = await prisma.ingredient.create({
    data: {
      name: 'Tomato',
      description: 'Fresh tomato',
      quantity: 1000,
      unit: 'grams',
      lowStockThreshold: 100
    }
  })

  // Create menu items with recipes
  const espresso = await prisma.menuItem.create({
    data: {
      name: 'Espresso',
      description: 'Single shot espresso',
      price: 3.50,
      categoryId: beveragesCategory.id,
      isAvailable: true,
      recipes: {
        create: [
          {
            ingredientId: cup.id,
            quantity: 1
          },
          {
            ingredientId: sugar.id,
            quantity: 5
          },
          {
            ingredientId: espressoBeans.id,
            quantity: 17
          },
          {
            ingredientId: water.id,
            quantity: 30
          }
        ]
      }
    }
  })

  const cappuccino = await prisma.menuItem.create({
    data: {
      name: 'Cappuccino',
      description: 'Espresso with steamed milk and foam',
      price: 4.25,
      categoryId: beveragesCategory.id,
      isAvailable: true,
      recipes: {
        create: [
          {
            ingredientId: cup.id,
            quantity: 1
          },
          {
            ingredientId: sugar.id,
            quantity: 5
          },
          {
            ingredientId: espressoBeans.id,
            quantity: 17
          },
          {
            ingredientId: milk.id,
            quantity: 150
          },
          {
            ingredientId: water.id,
            quantity: 30
          }
        ]
      }
    }
  })

  const latte = await prisma.menuItem.create({
    data: {
      name: 'Caffe Latte',
      description: 'Espresso with steamed milk',
      price: 4.50,
      categoryId: beveragesCategory.id,
      isAvailable: true,
      recipes: {
        create: [
          {
            ingredientId: cup.id,
            quantity: 1
          },
          {
            ingredientId: sugar.id,
            quantity: 5
          },
          {
            ingredientId: espressoBeans.id,
            quantity: 17
          },
          {
            ingredientId: milk.id,
            quantity: 200
          },
          {
            ingredientId: water.id,
            quantity: 30
          }
        ]
      }
    }
  })

  const clubSandwich = await prisma.menuItem.create({
    data: {
      name: 'Club Sandwich',
      description: 'Chicken club sandwich with cheese and vegetables',
      price: 8.50,
      categoryId: foodCategory.id,
      isAvailable: true,
      recipes: {
        create: [
          {
            ingredientId: bread.id,
            quantity: 3
          },
          {
            ingredientId: chicken.id,
            quantity: 100
          },
          {
            ingredientId: cheese.id,
            quantity: 30
          },
          {
            ingredientId: lettuce.id,
            quantity: 20
          },
          {
            ingredientId: tomato.id,
            quantity: 30
          }
        ]
      }
    }
  })

  // Create initial inventory records for menu items
  await prisma.inventory.create({
    data: {
      menuItemId: espresso.id,
      quantity: 50,
      unit: 'pieces',
      lowStockThreshold: 15,
      lastRestocked: new Date()
    }
  })

  await prisma.inventory.create({
    data: {
      menuItemId: cappuccino.id,
      quantity: 40,
      unit: 'pieces',
      lowStockThreshold: 10,
      lastRestocked: new Date()
    }
  })

  await prisma.inventory.create({
    data: {
      menuItemId: latte.id,
      quantity: 45,
      unit: 'pieces',
      lowStockThreshold: 10,
      lastRestocked: new Date()
    }
  })

  await prisma.inventory.create({
    data: {
      menuItemId: clubSandwich.id,
      quantity: 25,
      unit: 'pieces',
      lowStockThreshold: 8,
      lastRestocked: new Date()
    }
  })

  console.log('Sample data and inventory created successfully')
  console.log('Menu items:', espresso.name, cappuccino.name, latte.name, clubSandwich.name)
  console.log('Ingredients:', cup.name, sugar.name, espressoBeans.name, milk.name, water.name)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })