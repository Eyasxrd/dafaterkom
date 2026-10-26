import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Seeding Raw Ingredients & Item Customization Configs ---')

  const tenant = await prisma.tenant.findFirst()
  if (!tenant) {
    console.error('No tenant found.')
    return
  }
  const tenantId = tenant.id

  // 1. Ensure raw ingredients exist
  const ingredientsToSeed = [
    { name: 'Whole Milk', unit: 'ml', quantity: 25000, lowStockThreshold: 3000, costPerUnit: 0.0025 },
    { name: 'Oat Milk', unit: 'ml', quantity: 18000, lowStockThreshold: 2000, costPerUnit: 0.0045 },
    { name: 'Almond Milk', unit: 'ml', quantity: 15000, lowStockThreshold: 2000, costPerUnit: 0.0045 },
    { name: 'Skim Milk', unit: 'ml', quantity: 12000, lowStockThreshold: 2000, costPerUnit: 0.0025 },
    { name: 'Coconut Milk', unit: 'ml', quantity: 10000, lowStockThreshold: 1500, costPerUnit: 0.005 },
    { name: 'House Espresso Blend', unit: 'grams', quantity: 12000, lowStockThreshold: 1500, costPerUnit: 0.028 },
    { name: 'Single Origin Ethiopian', unit: 'grams', quantity: 8000, lowStockThreshold: 1000, costPerUnit: 0.038 },
    { name: 'Swiss Water Decaf', unit: 'grams', quantity: 6000, lowStockThreshold: 800, costPerUnit: 0.032 },
    { name: 'Artisan Sourdough', unit: 'slices', quantity: 250, lowStockThreshold: 30, costPerUnit: 0.40 },
    { name: 'Toasted Brioche', unit: 'bun', quantity: 180, lowStockThreshold: 25, costPerUnit: 0.50 },
    { name: 'Gluten-Free Bread', unit: 'slices', quantity: 120, lowStockThreshold: 20, costPerUnit: 0.65 }
  ]

  const ingredientMap = new Map<string, string>()

  for (const ing of ingredientsToSeed) {
    const existing = await prisma.ingredient.findFirst({
      where: { tenantId, name: ing.name }
    })
    if (existing) {
      ingredientMap.set(ing.name, existing.id)
    } else {
      const created = await prisma.ingredient.create({
        data: {
          tenantId,
          name: ing.name,
          unit: ing.unit,
          quantity: ing.quantity,
          lowStockThreshold: ing.lowStockThreshold,
          costPerUnit: ing.costPerUnit,
          lastRestocked: new Date()
        }
      })
      ingredientMap.set(ing.name, created.id)
      console.log(`Created raw ingredient: ${ing.name}`)
    }
  }

  // 2. Update existing menu items with rich customization configurations
  const menuItems = await prisma.menuItem.findMany({ where: { tenantId } })

  for (const item of menuItems) {
    const nameLower = item.name.toLowerCase()

    if (nameLower.includes('latte') || nameLower.includes('cappuccino') || nameLower.includes('flat white') || nameLower.includes('macchiato') || nameLower.includes('mocha')) {
      // Milk-based & Coffee-based drink
      const drinkConfig = {
        itemType: 'drink',
        drinkConfig: {
          isCoffeeBased: true,
          defaultCoffeeDoseGrams: 18,
          coffeeOptions: [
            { name: 'House Espresso Blend', ingredientId: ingredientMap.get('House Espresso Blend'), doseGrams: 18, isDefault: true },
            { name: 'Single Origin Ethiopian', ingredientId: ingredientMap.get('Single Origin Ethiopian'), doseGrams: 18, extraPrice: 0.50 },
            { name: 'Swiss Water Decaf', ingredientId: ingredientMap.get('Swiss Water Decaf'), doseGrams: 18, extraPrice: 0.00 }
          ],
          isMilkBased: true,
          defaultMilkVolumeMl: 220,
          milkOptions: [
            { name: 'Whole Milk', ingredientId: ingredientMap.get('Whole Milk'), volumeMl: 220, isDefault: true },
            { name: 'Oat Milk', ingredientId: ingredientMap.get('Oat Milk'), volumeMl: 220, extraPrice: 0.75 },
            { name: 'Almond Milk', ingredientId: ingredientMap.get('Almond Milk'), volumeMl: 220, extraPrice: 0.75 },
            { name: 'Skim Milk', ingredientId: ingredientMap.get('Skim Milk'), volumeMl: 220, extraPrice: 0.00 }
          ],
          sweetnessLevels: ['Normal (100%)', 'Half (50%)', 'Less (25%)', 'No Sugar (0%)', 'Extra Sweet (150%)'],
          allowExtraShot: true,
          extraShotPrice: 1.00
        }
      }
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { options: JSON.stringify(drinkConfig) }
      })
      console.log(`Configured Milk+Coffee drink: ${item.name}`)
    } else if (nameLower.includes('espresso') || nameLower.includes('americano') || nameLower.includes('drip') || nameLower.includes('cold brew')) {
      // Coffee-based but NOT milk-based drink
      const drinkConfig = {
        itemType: 'drink',
        drinkConfig: {
          isCoffeeBased: true,
          defaultCoffeeDoseGrams: 18,
          coffeeOptions: [
            { name: 'House Espresso Blend', ingredientId: ingredientMap.get('House Espresso Blend'), doseGrams: 18, isDefault: true },
            { name: 'Single Origin Ethiopian', ingredientId: ingredientMap.get('Single Origin Ethiopian'), doseGrams: 18, extraPrice: 0.50 },
            { name: 'Swiss Water Decaf', ingredientId: ingredientMap.get('Swiss Water Decaf'), doseGrams: 18, extraPrice: 0.00 }
          ],
          isMilkBased: false,
          defaultMilkVolumeMl: 0,
          milkOptions: [],
          sweetnessLevels: ['Normal (100%)', 'Half (50%)', 'Less (25%)', 'No Sugar (0%)'],
          allowExtraShot: true,
          extraShotPrice: 1.00
        }
      }
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { options: JSON.stringify(drinkConfig) }
      })
      console.log(`Configured Coffee-only drink: ${item.name}`)
    } else if (nameLower.includes('sandwich') || nameLower.includes('toast') || nameLower.includes('burger') || nameLower.includes('croissant') || nameLower.includes('salad') || nameLower.includes('food')) {
      // Food item with modifier groups
      const foodConfig = {
        itemType: 'food',
        foodConfig: {
          modifierGroups: [
            {
              id: 'bread_type',
              name: 'Bread / Crust Option',
              required: true,
              minSelections: 1,
              maxSelections: 1,
              options: [
                { id: 'b_sourdough', name: 'Artisan Sourdough', ingredientId: ingredientMap.get('Artisan Sourdough'), quantityDeducted: 2, unit: 'slices', isDefault: true },
                { id: 'b_brioche', name: 'Toasted Brioche', ingredientId: ingredientMap.get('Toasted Brioche'), quantityDeducted: 1, unit: 'bun', extraPrice: 0.50 },
                { id: 'b_gf', name: 'Gluten-Free Bread', ingredientId: ingredientMap.get('Gluten-Free Bread'), quantityDeducted: 2, unit: 'slices', extraPrice: 1.00 }
              ]
            }
          ]
        }
      }
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { options: JSON.stringify(foodConfig) }
      })
      console.log(`Configured Food modifiers: ${item.name}`)
    }
  }

  console.log('--- Customization seeding complete! ---')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
