import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function runTest() {
  console.log('🧪 === STARTING TEST: INGREDIENT RECIPE FORMULATION & ORDER DEDUCTION ===')

  // 1. Ensure a tenant and staff exist
  let tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        id: 'default-shop',
        businessName: 'Dafaterkom Test Cafe',
        slug: 'test-cafe',
        taxRate: 15.0
      }
    })
  }

  let staff = await prisma.staff.findFirst({ where: { tenantId: tenant.id } })
  if (!staff) {
    staff = await prisma.staff.create({
      data: {
        tenantId: tenant.id,
        name: 'Test Cashier',
        email: 'cashier-test@dafaterkom.com',
        password: 'hash',
        role: 'cashier'
      }
    })
  }

  let category = await prisma.category.findFirst({ where: { tenantId: tenant.id } })
  if (!category) {
    category = await prisma.category.create({
      data: {
        tenantId: tenant.id,
        name: 'Beverages'
      }
    })
  }

  // 2. Create a test raw ingredient
  const testIngredientName = `Test Roast Beans ${Date.now()}`
  const initialStock = 1000
  const ingredient = await prisma.ingredient.create({
    data: {
      tenantId: tenant.id,
      name: testIngredientName,
      quantity: initialStock,
      unit: 'grams',
      lowStockThreshold: 100,
      costPerUnit: 0.025
    }
  })
  console.log(`✅ Step 1: Created test raw ingredient "${ingredient.name}" with initial stock: ${ingredient.quantity} ${ingredient.unit}`)

  // 3. Create a test menu item with a recipe
  const portionPerServing = 18 // 18 grams per serving
  const menuItem = await prisma.menuItem.create({
    data: {
      tenantId: tenant.id,
      name: `Specialty Espresso ${Date.now()}`,
      price: 4.50,
      categoryId: category.id,
      recipes: {
        create: [
          {
            ingredientId: ingredient.id,
            quantity: portionPerServing
          }
        ]
      }
    },
    include: {
      recipes: {
        include: {
          ingredient: true
        }
      }
    }
  })
  console.log(`✅ Step 2: Created menu item "${menuItem.name}" with recipe: ${portionPerServing}g of "${ingredient.name}"`)
  console.log(`   Recipes attached: ${menuItem.recipes.length}`)

  if (menuItem.recipes.length !== 1 || menuItem.recipes[0].ingredientId !== ingredient.id) {
    throw new Error('❌ Recipe was not attached properly to menu item!')
  }

  // 4. Simulate POS order of 3 servings
  const orderQuantity = 3
  const expectedDeduction = portionPerServing * orderQuantity // 18 * 3 = 54g
  const expectedRemainingStock = initialStock - expectedDeduction // 1000 - 54 = 946g

  const orderNumber = `TEST-ORD-${Date.now()}`
  const subtotal = menuItem.price * orderQuantity
  const tax = subtotal * 0.15
  const total = subtotal + tax

  console.log(`🛒 Step 3: Placing order #${orderNumber} for ${orderQuantity}x "${menuItem.name}" (Total deduction expected: ${expectedDeduction}g)...`)

  const order = await prisma.$transaction(async (tx) => {
    // Create order
    const createdOrder = await tx.order.create({
      data: {
        tenantId: tenant.id,
        orderNumber,
        staffId: staff.id,
        subtotal,
        tax,
        discount: 0,
        totalAmount: total,
        paymentMethod: 'cash',
        paymentStatus: 'completed',
        orderStatus: 'pending',
        items: {
          create: [
            {
              menuItemId: menuItem.id,
              quantity: orderQuantity,
              price: menuItem.price,
              subtotal
            }
          ]
        }
      }
    })

    // Deduct base raw recipes
    const recipes = await tx.recipe.findMany({
      where: { menuItemId: menuItem.id },
      include: { ingredient: true }
    })

    for (const recipe of recipes) {
      const totalIngredientQuantity = recipe.quantity * orderQuantity
      const remainingQty = Math.max(0, Math.round((recipe.ingredient.quantity - totalIngredientQuantity) * 1000) / 1000)
      await tx.ingredient.update({
        where: { id: recipe.ingredientId },
        data: {
          quantity: remainingQty
        }
      })
    }

    return createdOrder
  })

  // 5. Verify the updated ingredient stock
  const updatedIngredient = await prisma.ingredient.findUnique({
    where: { id: ingredient.id }
  })

  console.log(`📊 Step 4: Verification - Ingredient stock in database is now: ${updatedIngredient?.quantity} ${updatedIngredient?.unit}`)
  console.log(`   Expected stock: ${expectedRemainingStock} ${ingredient.unit}`)

  if (updatedIngredient?.quantity !== expectedRemainingStock) {
    throw new Error(`❌ Stock mismatch! Expected ${expectedRemainingStock}, got ${updatedIngredient?.quantity}`)
  }
  console.log('✅ Stock deduction verified successfully!')

  // 6. Test cancellation / restoration
  console.log('🔄 Step 5: Testing order void / cancellation restoration...')
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { orderStatus: 'cancelled' }
    })

    const recipes = await tx.recipe.findMany({
      where: { menuItemId: menuItem.id }
    })
    for (const recipe of recipes) {
      await tx.ingredient.update({
        where: { id: recipe.ingredientId },
        data: {
          quantity: { increment: recipe.quantity * orderQuantity }
        }
      })
    }
  })

  const restoredIngredient = await prisma.ingredient.findUnique({
    where: { id: ingredient.id }
  })
  console.log(`📊 Restored ingredient stock: ${restoredIngredient?.quantity} ${restoredIngredient?.unit}`)
  if (restoredIngredient?.quantity !== initialStock) {
    throw new Error(`❌ Restoration failed! Expected ${initialStock}, got ${restoredIngredient?.quantity}`)
  }
  console.log('✅ Inventory stock restored successfully on cancellation!')

  // Clean up test records
  await prisma.recipe.deleteMany({ where: { menuItemId: menuItem.id } })
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } })
  await prisma.order.delete({ where: { id: order.id } })
  await prisma.menuItem.delete({ where: { id: menuItem.id } })
  await prisma.ingredient.delete({ where: { id: ingredient.id } })
  console.log('🧹 Cleaned up all test artifacts.')

  console.log('🎉 === ALL INGREDIENT RECIPE & INVENTORY DEDUCTION TESTS PASSED! ===\n')
}

runTest()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
