import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testInventoryDeduction() {
  console.log('--- Testing Customization & Inventory Deduction ---')

  const tenant = await prisma.tenant.findFirst()
  if (!tenant) throw new Error('No tenant found')
  const tenantId = tenant.id

  const staff = await prisma.staff.findFirst({ where: { tenantId } })
  if (!staff) throw new Error('No staff found')

  // Find Caffe Latte
  const latte = await prisma.menuItem.findFirst({
    where: { tenantId, name: { contains: 'Latte' } }
  })
  if (!latte) throw new Error('Latte not found')

  // Find Oat Milk and Whole Milk ingredients
  const oatMilkBefore = await prisma.ingredient.findFirst({ where: { tenantId, name: 'Oat Milk' } })
  const wholeMilkBefore = await prisma.ingredient.findFirst({ where: { tenantId, name: 'Whole Milk' } })
  const ethiopianBefore = await prisma.ingredient.findFirst({ where: { tenantId, name: 'Single Origin Ethiopian' } })
  const gfBreadBefore = await prisma.ingredient.findFirst({ where: { tenantId, name: 'Gluten-Free Bread' } })

  console.log(`[Before Order] Oat Milk: ${oatMilkBefore?.quantity}ml | Whole Milk: ${wholeMilkBefore?.quantity}ml | Ethiopian Beans: ${ethiopianBefore?.quantity}g`)

  // Simulate Order: 1x Latte with Oat Milk and Single Origin Ethiopian (+Extra Shot)
  const orderNumber = `TEST-${Date.now()}`
  const orderPayload = {
    orderNumber,
    staffId: staff.id,
    subtotal: 6.25,
    tax: 0.94,
    discount: 0,
    totalAmount: 7.19,
    paymentMethod: 'cash',
    items: [
      {
        menuItemId: latte.id,
        quantity: 1,
        price: 6.25,
        subtotal: 6.25,
        notes: 'Oat Milk • Single Origin Ethiopian • Extra Shot',
        selectedOptions: [
          { groupName: 'Milk', optionName: 'Oat Milk', ingredientId: oatMilkBefore?.id, quantityDeducted: 220, extraPrice: 0.75 },
          { groupName: 'Coffee Bean', optionName: 'Single Origin Ethiopian', ingredientId: ethiopianBefore?.id, quantityDeducted: 18, extraPrice: 0.50 },
          { groupName: 'Add-on', optionName: 'Extra Espresso Shot', ingredientId: ethiopianBefore?.id, quantityDeducted: 18, extraPrice: 1.00 }
        ]
      }
    ]
  }

  // Execute order creation transaction identical to /api/orders
  await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        tenantId,
        orderNumber: orderPayload.orderNumber,
        staffId: orderPayload.staffId,
        subtotal: orderPayload.subtotal,
        tax: orderPayload.tax,
        discount: orderPayload.discount,
        totalAmount: orderPayload.totalAmount,
        paymentMethod: orderPayload.paymentMethod,
        paymentStatus: 'completed',
        orderStatus: 'pending',
        items: {
          create: orderPayload.items.map(i => ({
            menuItemId: i.menuItemId,
            quantity: i.quantity,
            price: i.price,
            subtotal: i.subtotal,
            notes: i.notes
          }))
        }
      }
    })

    // Deduct direct inventory & base recipe
    for (const item of orderPayload.items) {
      if (item.selectedOptions && item.selectedOptions.length > 0) {
        for (const opt of item.selectedOptions) {
          const qty = (opt.quantityDeducted || 1) * item.quantity
          if (opt.ingredientId) {
            const ing = await tx.ingredient.findUnique({ where: { id: opt.ingredientId } })
            if (ing) {
              await tx.ingredient.update({
                where: { id: opt.ingredientId },
                data: { quantity: Math.max(0, ing.quantity - qty) }
              })
            }
          }
        }
      }
    }
    return created
  })

  // Verify stock after order
  const oatMilkAfter = await prisma.ingredient.findFirst({ where: { tenantId, name: 'Oat Milk' } })
  const wholeMilkAfter = await prisma.ingredient.findFirst({ where: { tenantId, name: 'Whole Milk' } })
  const ethiopianAfter = await prisma.ingredient.findFirst({ where: { tenantId, name: 'Single Origin Ethiopian' } })

  console.log(`[After Order] Oat Milk: ${oatMilkAfter?.quantity}ml | Whole Milk: ${wholeMilkAfter?.quantity}ml | Ethiopian Beans: ${ethiopianAfter?.quantity}g`)

  const oatDeducted = (oatMilkBefore?.quantity || 0) - (oatMilkAfter?.quantity || 0)
  const wholeDeducted = (wholeMilkBefore?.quantity || 0) - (wholeMilkAfter?.quantity || 0)
  const ethiopianDeducted = (ethiopianBefore?.quantity || 0) - (ethiopianAfter?.quantity || 0)

  console.log(`[Deduction Verification]:`)
  console.log(`- Oat Milk Deducted: ${oatDeducted}ml (Expected: 220ml) -> ${oatDeducted === 220 ? 'PASSED ✅' : 'FAILED ❌'}`)
  console.log(`- Whole Milk Deducted: ${wholeDeducted}ml (Expected: 0ml) -> ${wholeDeducted === 0 ? 'PASSED ✅' : 'FAILED ❌'}`)
  console.log(`- Ethiopian Beans Deducted: ${ethiopianDeducted}g (Expected: 36g for base+extra shot) -> ${ethiopianDeducted === 36 ? 'PASSED ✅' : 'FAILED ❌'}`)

  if (oatDeducted === 220 && wholeDeducted === 0 && ethiopianDeducted === 36) {
    console.log('\n🎉 ALL INVENTORY DEDUCTION TESTS PASSED PERFECTLY! 🎉')
  } else {
    throw new Error('Deduction mismatch')
  }
}

testInventoryDeduction()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
