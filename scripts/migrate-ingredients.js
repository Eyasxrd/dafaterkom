const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Ingredients Separation Migration ---');

  // 1. Find the "General" category or any items with price 0 that are raw materials
  const generalCategory = await prisma.category.findFirst({
    where: { name: 'General' },
    include: {
      items: {
        include: {
          inventory: true,
          recipes: true,
          orderItems: true
        }
      }
    }
  });

  if (!generalCategory || generalCategory.items.length === 0) {
    console.log('No raw items found in General category.');
    return;
  }

  console.log(`Found ${generalCategory.items.length} items in "General" category to migrate to Ingredient table.`);

  let migratedCount = 0;
  let updatedCount = 0;

  for (const item of generalCategory.items) {
    const qty = item.inventory ? Number(item.inventory.quantity) : 0;
    const unit = item.inventory ? item.inventory.unit : 'pieces';
    const threshold = item.inventory ? Number(item.inventory.lowStockThreshold) : 10;
    const lastRestocked = item.inventory?.lastRestocked || new Date();

    // Check if ingredient already exists in Ingredient table
    const existingIng = await prisma.ingredient.findFirst({
      where: {
        tenantId: item.tenantId,
        name: item.name.trim()
      }
    });

    if (existingIng) {
      await prisma.ingredient.update({
        where: { id: existingIng.id },
        data: {
          quantity: existingIng.quantity + qty,
          unit: existingIng.unit || unit,
          lowStockThreshold: existingIng.lowStockThreshold || threshold,
          lastRestocked: lastRestocked
        }
      });
      updatedCount++;
    } else {
      await prisma.ingredient.create({
        data: {
          tenantId: item.tenantId,
          name: item.name.trim(),
          description: item.description,
          quantity: qty,
          unit: unit,
          lowStockThreshold: threshold,
          costPerUnit: 0,
          lastRestocked: lastRestocked
        }
      });
      migratedCount++;
    }

    // Now delete from MenuItem (Inventory will cascade delete)
    await prisma.menuItem.delete({
      where: { id: item.id }
    });
  }

  console.log(`Successfully migrated ${migratedCount} new ingredients and updated ${updatedCount} existing ingredients.`);

  // Delete the empty General category
  await prisma.category.delete({
    where: { id: generalCategory.id }
  });
  console.log('Cleaned up empty "General" category.');

  // Verify counts
  const remainingMenuItems = await prisma.menuItem.count();
  const totalIngredients = await prisma.ingredient.count();
  const remainingCategories = await prisma.category.count();

  console.log('--- Migration Summary ---');
  console.log(`Remaining Sellable Menu Items: ${remainingMenuItems}`);
  console.log(`Total Ingredients in Ingredient Table: ${totalIngredients}`);
  console.log(`Remaining Categories: ${remainingCategories}`);
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
