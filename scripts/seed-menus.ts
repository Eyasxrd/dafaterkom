import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedMenusAndEnrichItems() {
  const tenantId = 'default-shop'
  console.log('Ensuring default menus and rich foodie catalog for tenant:', tenantId)

  // 1. Create or ensure default menus
  const defaultMenus = [
    {
      name: 'Oldies Smokehouse & Artisan Kitchen',
      slug: 'in-house',
      description: 'Slow-smoked prime cuts, flame-grilled smash burgers, artisan coffee brews & handcrafted desserts.',
      type: 'dine_in',
      isActive: true,
      badgeText: 'Live Smoker Daily • Open till 1:00 AM • Free Ultra WiFi',
      qrColor: '#0f172a',
      orderingEnabled: true
    },
    {
      name: 'Express Takeaway & Direct Delivery',
      slug: 'delivery',
      description: 'Thermal-packed freshness. Order for express curbside pickup or fast direct delivery.',
      type: 'delivery',
      isActive: true,
      badgeText: 'Direct Kitchen Price • Express 25-Min Delivery',
      qrColor: '#059669',
      orderingEnabled: true
    },
    {
      name: 'Delivery Apps (Aggregators)',
      slug: 'apps',
      description: 'Optimized combos and express packaging for delivery partner couriers.',
      type: 'apps',
      isActive: true,
      badgeText: 'Available on UberEats, Deliveroo & Talabat',
      qrColor: '#ea580c',
      orderingEnabled: false
    }
  ]

  const savedMenus = []
  for (const mData of defaultMenus) {
    let menu = await prisma.menu.findUnique({
      where: {
        tenantId_slug: {
          tenantId,
          slug: mData.slug
        }
      }
    })

    if (!menu) {
      menu = await prisma.menu.create({
        data: {
          tenantId,
          ...mData
        }
      })
      console.log('Created menu:', menu.name)
    } else {
      menu = await prisma.menu.update({
        where: { id: menu.id },
        data: {
          name: mData.name,
          description: mData.description,
          badgeText: mData.badgeText,
          orderingEnabled: mData.orderingEnabled
        }
      })
      console.log('Updated menu:', menu.name)
    }
    savedMenus.push(menu)
  }

  // 2. Ensure categories exist
  const categoriesToEnsure = [
    { name: 'Smoked BBQ & Steaks', description: 'Oak-smoked 14 hours over Texas mesquite and cherry wood' },
    { name: 'Gourmet Burgers', description: 'Freshly ground Black Angus beef on toasted brioche' },
    { name: 'Sides & Appetizers', description: 'Crispy finger foods & loaded gourmet sharing plates' },
    { name: 'Specialty Coffee', description: 'Single-origin beans roasted to perfection' },
    { name: 'Signature Refreshers', description: 'Handcrafted iced teas, mojitos & cold presses' },
    { name: 'Artisan Desserts', description: 'House-made warm pastries, cheesecakes & gelato' }
  ]

  const categoryMap = new Map<string, string>()
  for (const cat of categoriesToEnsure) {
    let found = await prisma.category.findFirst({
      where: { name: cat.name }
    })
    if (!found) {
      found = await prisma.category.create({
        data: {
          name: cat.name,
          description: cat.description
        }
      })
      console.log('Created category:', cat.name)
    }
    categoryMap.set(cat.name, found.id)
  }

  // 3. Rich gourmet food items with high-resolution photography
  const foodieItems = [
    {
      name: '14-Hour Smoked Beef Brisket',
      categoryName: 'Smoked BBQ & Steaks',
      price: 24.50,
      description: 'Prime Black Angus brisket slow-smoked for 14 hours over oak wood with signature dry rub and house BBQ jus.',
      ingredients: 'Prime Black Angus beef, Texas pepper rub, oak wood smoke, homemade tangy molasses BBQ sauce, pickled jalapeños.',
      dietaryTags: ['halal', 'bestseller', 'chef_special'],
      allergens: [],
      calories: 780,
      prepTime: 12,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Smoked St. Louis Ribs Rack',
      categoryName: 'Smoked BBQ & Steaks',
      price: 28.00,
      description: 'Fall-off-the-bone tender ribs glazed with honey chipotle sauce, served with homemade slaw.',
      ingredients: 'Slow-smoked beef ribs, wildflower honey, chipotle glaze, apple cider spritz, crisp cabbage slaw.',
      dietaryTags: ['halal', 'bestseller'],
      allergens: [],
      calories: 920,
      prepTime: 15,
      imageUrl: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Double Truffle Smash Burger',
      categoryName: 'Gourmet Burgers',
      price: 16.50,
      description: 'Two smashed Black Angus patties, melted aged cheddar, caramelized shallots, black truffle aioli on brioche.',
      ingredients: 'Double Black Angus beef patties, double Wisconsin cheddar, butter-toasted brioche bun, black summer truffle aioli, balsamic caramelized shallots.',
      dietaryTags: ['halal', 'bestseller'],
      allergens: ['Gluten / Wheat', 'Dairy / Milk', 'Eggs'],
      calories: 840,
      prepTime: 10,
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Crispy Buttermilk Chicken Burger',
      categoryName: 'Gourmet Burgers',
      price: 14.50,
      description: '24-hour marinated chicken breast in spiced buttermilk, crispy golden crust, spicy slaw and ranch.',
      ingredients: 'Free-range chicken breast, buttermilk marinade, Nashville spice dust, sweet pickles, shredded purple slaw, garlic ranch.',
      dietaryTags: ['halal', 'new_item'],
      allergens: ['Gluten / Wheat', 'Dairy / Milk', 'Eggs'],
      calories: 720,
      prepTime: 10,
      imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Truffle Parmesan Hand-Cut Fries',
      categoryName: 'Sides & Appetizers',
      price: 7.50,
      description: 'Crispy skin-on Russet potatoes tossed with white truffle oil, grated 24-month Parmigiano-Reggiano and fresh rosemary.',
      ingredients: 'Russet potatoes, Italian white truffle oil, Parmigiano-Reggiano, chopped rosemary, sea salt crystals, garlic aioli.',
      dietaryTags: ['vegetarian', 'halal', 'bestseller'],
      allergens: ['Dairy / Milk'],
      calories: 420,
      prepTime: 6,
      imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Smoked Pulled Beef Loaded Nachos',
      categoryName: 'Sides & Appetizers',
      price: 12.00,
      description: 'Warm corn tortilla chips loaded with slow-cooked pulled beef, molten queso, guacamole, pico de gallo and sour cream.',
      ingredients: 'Crisp corn tortilla chips, smoked pulled beef, cheddar queso sauce, fresh guacamole, cilantro pico de gallo, pickled jalapeño rings.',
      dietaryTags: ['halal'],
      allergens: ['Dairy / Milk'],
      calories: 680,
      prepTime: 8,
      imageUrl: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Spanish Iced Latte',
      categoryName: 'Specialty Coffee',
      price: 5.50,
      description: 'Rich double shot of Ethiopian espresso layered over sweet condensed milk and cold whole milk with crystal ice.',
      ingredients: 'Single-origin Ethiopian espresso, artisan condensed milk, fresh whole milk, filtered ice.',
      dietaryTags: ['vegetarian', 'halal', 'bestseller'],
      allergens: ['Dairy / Milk'],
      calories: 210,
      prepTime: 3,
      imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Artisan Flat White',
      categoryName: 'Specialty Coffee',
      price: 4.50,
      description: 'Ristretto double shot blended with velvety microfoam milk for a silky, rich and intense coffee experience.',
      ingredients: 'Double ristretto Arabica espresso, velvety steamed whole milk.',
      dietaryTags: ['vegetarian', 'halal', 'organic'],
      allergens: ['Dairy / Milk'],
      calories: 130,
      prepTime: 3,
      imageUrl: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Passion Fruit Mint Mojito',
      categoryName: 'Signature Refreshers',
      price: 6.00,
      description: 'Refreshing tropical blend of wild passion fruit pulp, crushed fresh garden mint, lime juice and sparkling soda.',
      ingredients: 'Natural passion fruit puree, fresh mint sprigs, freshly squeezed Persian lime, cane syrup, sparkling mineral soda.',
      dietaryTags: ['vegan', 'halal', 'gluten_free', 'dairy_free', 'bestseller'],
      allergens: [],
      calories: 140,
      prepTime: 3,
      imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Blueberry Iced Hibiscus Tea',
      categoryName: 'Signature Refreshers',
      price: 5.00,
      description: 'Cold-steeped organic Egyptian hibiscus flowers infused with wild blueberry syrup and citrus slices.',
      ingredients: 'Organic hibiscus petals, wild blueberry extract, lemon slices, cold mountain spring water.',
      dietaryTags: ['vegan', 'halal', 'gluten_free', 'sugar_free', 'organic'],
      allergens: [],
      calories: 45,
      prepTime: 2,
      imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'San Sebastián Burnt Cheesecake',
      categoryName: 'Artisan Desserts',
      price: 8.50,
      description: 'Caramelized crust with a creamy, molten center served with warm Belgian dark chocolate sauce.',
      ingredients: 'Philadelphia cream cheese, fresh heavy cream, organic vanilla bean, melted Belgian 70% dark chocolate drizzle.',
      dietaryTags: ['vegetarian', 'halal', 'chef_special', 'bestseller'],
      allergens: ['Dairy / Milk', 'Eggs'],
      calories: 490,
      prepTime: 4,
      imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Warm Nutella Brioche French Toast',
      categoryName: 'Artisan Desserts',
      price: 9.50,
      description: 'Golden pan-seared brioche infused with cinnamon custard, filled with warm Nutella and topped with fresh berries.',
      ingredients: 'Thick artisan brioche loaf, Madagascar vanilla custard, Nutella hazelnut spread, fresh strawberries & blueberries, pure maple syrup.',
      dietaryTags: ['vegetarian', 'halal'],
      allergens: ['Gluten / Wheat', 'Dairy / Milk', 'Eggs', 'Tree Nuts / Hazelnuts'],
      calories: 610,
      prepTime: 8,
      imageUrl: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&auto=format&fit=crop&q=80'
    }
  ]

  for (const itemData of foodieItems) {
    const catId = categoryMap.get(itemData.categoryName)
    let item = await prisma.menuItem.findFirst({
      where: {
        tenantId,
        name: itemData.name
      }
    })

    if (!item) {
      item = await prisma.menuItem.create({
        data: {
          tenantId,
          name: itemData.name,
          description: itemData.description,
          ingredients: itemData.ingredients,
          price: itemData.price,
          categoryId: catId || '',
          isAvailable: true,
          imageUrl: itemData.imageUrl,
          dietaryTags: JSON.stringify(itemData.dietaryTags),
          allergens: JSON.stringify(itemData.allergens),
          calories: itemData.calories,
          prepTime: itemData.prepTime
        }
      })
      console.log('Created foodie item:', item.name)
    } else {
      item = await prisma.menuItem.update({
        where: { id: item.id },
        data: {
          description: itemData.description,
          ingredients: itemData.ingredients,
          price: itemData.price,
          categoryId: catId || item.categoryId,
          imageUrl: itemData.imageUrl,
          dietaryTags: JSON.stringify(itemData.dietaryTags),
          allergens: JSON.stringify(itemData.allergens),
          calories: itemData.calories,
          prepTime: itemData.prepTime,
          isAvailable: true
        }
      })
      console.log('Updated foodie item:', item.name)
    }

    // Link item to all menus
    for (const menu of savedMenus) {
      const existingLink = await prisma.menuOnItem.findUnique({
        where: {
          menuId_menuItemId: {
            menuId: menu.id,
            menuItemId: item.id
          }
        }
      })

      if (!existingLink) {
        await prisma.menuOnItem.create({
          data: {
            menuId: menu.id,
            menuItemId: item.id,
            customPrice: menu.type === 'apps' ? Math.round(item.price * 1.15 * 100) / 100 : null,
            sortOrder: 0,
            isAvailable: true
          }
        })
        console.log(`Linked ${item.name} -> ${menu.name}`)
      }
    }
  }

  console.log('Menu seeding and rich foodie catalog enrichment completed successfully!')
}

seedMenusAndEnrichItems()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

