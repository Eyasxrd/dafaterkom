export interface StarterIngredient {
  name: string
  quantity: number
  unit: string
  costPerUnit?: number
  lowStockThreshold?: number
}

export interface StarterItem {
  name: string
  description: string
  price: number
  prepTime?: number
  calories?: number
  dietaryTags?: string
  allergens?: string
  ingredients?: StarterIngredient[]
}

export interface StarterCategory {
  name: string
  description: string
  items: StarterItem[]
}

export interface StarterTemplate {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  icon: string
  badge: string
  serviceType: 'counter' | 'table_service' | 'hybrid' | 'retail'
  suggestedTables?: number
  categories: StarterCategory[]
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'coffee-shop',
    name: 'Specialty Coffee Shop & Roastery',
    nameAr: 'مقهى مختص ومحمصة قهوة',
    description: 'Hot brews, artisanal espresso, cold coffees, matcha, plant-based milks, and fresh pastries.',
    descriptionAr: 'مشروبات ساخنة وباردة، إسبريسو مختص، حليب نباتي، ومخبوزات طازجة.',
    icon: '☕',
    badge: 'Popular',
    serviceType: 'counter',
    suggestedTables: 10,
    categories: [
      {
        name: 'Hot Espresso & Brews',
        description: 'Classic and specialty espresso beverages',
        items: [
          {
            name: 'Single Origin Espresso',
            description: 'Double shot rich Ethiopian single origin espresso',
            price: 3.50,
            prepTime: 2,
            calories: 5,
            ingredients: [
              { name: 'Specialty Espresso Beans', quantity: 18, unit: 'grams', costPerUnit: 0.04, lowStockThreshold: 1000 }
            ]
          },
          {
            name: 'Cortado',
            description: 'Equal parts espresso and silky textured whole milk',
            price: 4.25,
            prepTime: 3,
            calories: 75,
            allergens: 'Dairy',
            ingredients: [
              { name: 'Specialty Espresso Beans', quantity: 18, unit: 'grams', costPerUnit: 0.04, lowStockThreshold: 1000 },
              { name: 'Fresh Whole Milk', quantity: 60, unit: 'ml', costPerUnit: 0.002, lowStockThreshold: 5000 }
            ]
          },
          {
            name: 'Spanish Latte',
            description: 'Signature espresso layered with sweetened condensed milk and steamed milk',
            price: 5.50,
            prepTime: 3,
            calories: 220,
            allergens: 'Dairy',
            ingredients: [
              { name: 'Specialty Espresso Beans', quantity: 18, unit: 'grams', costPerUnit: 0.04 },
              { name: 'Sweetened Condensed Milk', quantity: 30, unit: 'ml', costPerUnit: 0.008 },
              { name: 'Fresh Whole Milk', quantity: 150, unit: 'ml', costPerUnit: 0.002 }
            ]
          },
          {
            name: 'Flat White',
            description: 'Velvety micro-foamed milk poured over a double ristretto',
            price: 4.75,
            prepTime: 3,
            calories: 110,
            allergens: 'Dairy',
            ingredients: [
              { name: 'Specialty Espresso Beans', quantity: 18, unit: 'grams', costPerUnit: 0.04 },
              { name: 'Fresh Whole Milk', quantity: 140, unit: 'ml', costPerUnit: 0.002 }
            ]
          },
          {
            name: 'V60 Pour-Over Filter',
            description: 'Hand-poured floral light roast filter coffee',
            price: 5.75,
            prepTime: 5,
            calories: 4,
            ingredients: [
              { name: 'Geisha / Filter Coffee Beans', quantity: 20, unit: 'grams', costPerUnit: 0.06 }
            ]
          }
        ]
      },
      {
        name: 'Iced & Cold Drinks',
        description: 'Chilled coffees, nitro brews, and iced refreshers',
        items: [
          {
            name: 'Iced Salted Caramel Latte',
            description: 'Chilled espresso with artisanal sea salt caramel syrup and creamy milk',
            price: 5.75,
            prepTime: 3,
            calories: 240,
            allergens: 'Dairy',
            ingredients: [
              { name: 'Specialty Espresso Beans', quantity: 18, unit: 'grams', costPerUnit: 0.04 },
              { name: 'Fresh Whole Milk', quantity: 180, unit: 'ml', costPerUnit: 0.002 },
              { name: 'Caramel Syrup', quantity: 25, unit: 'ml', costPerUnit: 0.01 }
            ]
          },
          {
            name: 'Nitro Cold Brew',
            description: '24-hour slow steeped cold brew infused with micro nitrogen bubbles',
            price: 5.25,
            prepTime: 1,
            calories: 5,
            ingredients: [
              { name: 'Cold Brew Concentrate', quantity: 250, unit: 'ml', costPerUnit: 0.005 }
            ]
          },
          {
            name: 'Iced Ceremonial Matcha Latte',
            description: 'Uji Japanese matcha whisked with organic oat milk and raw agave',
            price: 6.25,
            prepTime: 4,
            calories: 140,
            dietaryTags: 'Vegan',
            ingredients: [
              { name: 'Ceremonial Matcha Powder', quantity: 4, unit: 'grams', costPerUnit: 0.20 },
              { name: 'Organic Oat Milk', quantity: 200, unit: 'ml', costPerUnit: 0.004 }
            ]
          },
          {
            name: 'Passionfruit Hibiscus Iced Tea',
            description: 'Cold-steeped ruby hibiscus tea with passionfruit puree and mint',
            price: 4.50,
            prepTime: 2,
            calories: 90,
            dietaryTags: 'Vegan'
          }
        ]
      },
      {
        name: 'Bakery & Light Bites',
        description: 'Fresh morning bakes and warm pastries',
        items: [
          {
            name: 'French Butter Croissant',
            description: 'Golden flaky French pastry with 100% Normandy butter',
            price: 3.50,
            prepTime: 2,
            calories: 280,
            allergens: 'Dairy, Gluten'
          },
          {
            name: 'Belgian Chocolate Pain au Chocolat',
            description: 'Flaky pastry filled with two batons of Belgian dark chocolate',
            price: 4.00,
            prepTime: 2,
            calories: 320,
            allergens: 'Dairy, Gluten'
          },
          {
            name: 'Pistachio Cruffin',
            description: 'Croissant-muffin hybrid filled with rich Sicilian pistachio cream',
            price: 4.75,
            prepTime: 2,
            calories: 380,
            allergens: 'Dairy, Gluten, Tree Nuts'
          }
        ]
      }
    ]
  },
  {
    id: 'bakery',
    name: 'Artisan Bakery & Patisserie',
    nameAr: 'مخبز وحلويات فرنسية راقية',
    description: 'Sourdough loaves, delicate tarts, cookies, cheesecakes, and morning patisserie.',
    descriptionAr: 'خبز الساوردو الطبيعي، كيكات وتارت فاخرة، ومعجنات الصباح.',
    icon: '🥐',
    badge: 'Artisanal',
    serviceType: 'counter',
    suggestedTables: 8,
    categories: [
      {
        name: 'Sourdough & Rustic Breads',
        description: 'Slow-fermented artisan sourdough breads',
        items: [
          {
            name: 'Country Sourdough Loaf (800g)',
            description: '48-hour naturally fermented rustic wheat sourdough with crunchy blistered crust',
            price: 7.50,
            calories: 1900,
            dietaryTags: 'Vegan',
            allergens: 'Gluten',
            ingredients: [
              { name: 'Organic Bread Flour', quantity: 500, unit: 'grams', costPerUnit: 0.002 },
              { name: 'Sourdough Starter Culture', quantity: 100, unit: 'grams', costPerUnit: 0.001 },
              { name: 'Sea Salt', quantity: 10, unit: 'grams', costPerUnit: 0.0005 }
            ]
          },
          {
            name: 'Traditional French Baguette',
            description: 'Crisp exterior with an open, honeycombed crumb and toasted wheat aroma',
            price: 3.50,
            calories: 620,
            dietaryTags: 'Vegan',
            allergens: 'Gluten'
          },
          {
            name: 'Kalamata Olive & Rosemary Ciabatta',
            description: 'Hydrated Italian ciabatta packed with Greek olives and fresh fragrant rosemary',
            price: 5.75,
            calories: 850,
            dietaryTags: 'Vegan',
            allergens: 'Gluten'
          }
        ]
      },
      {
        name: 'Patisserie & Specialty Tarts',
        description: 'Handcrafted French desserts and cakes',
        items: [
          {
            name: 'San Sebastián Burnt Cheesecake',
            description: 'Crustless caramelized Spanish cheesecake with an ultra-creamy melting center',
            price: 6.50,
            prepTime: 2,
            calories: 420,
            allergens: 'Dairy, Eggs'
          },
          {
            name: 'Lemon Meringue Tartlet',
            description: 'Crisp sable shell, zesty Sicilian lemon curd, and torch-toasted Swiss meringue',
            price: 5.75,
            prepTime: 2,
            calories: 340,
            allergens: 'Dairy, Eggs, Gluten'
          },
          {
            name: 'Valrhona Triple Chocolate Fudge Brownie',
            description: 'Dense fudgy brownie crafted with 70% dark Valrhona cocoa and walnut crumble',
            price: 4.25,
            prepTime: 2,
            calories: 390,
            allergens: 'Dairy, Eggs, Gluten, Tree Nuts'
          }
        ]
      }
    ]
  },
  {
    id: 'qsr',
    name: 'Fast Casual Burgers & Fried Chicken (QSR)',
    nameAr: 'مطعم وجبات سريعة وبرجر',
    description: 'Smash burgers, crispy chicken tenders, loaded fries, combo meals, and thick milkshakes.',
    descriptionAr: 'سماش برجر، دجاج مقرمش، بطاطس لودد، وجبات كومبو، وميلك شيك.',
    icon: '🍔',
    badge: 'High Volume',
    serviceType: 'counter',
    suggestedTables: 16,
    categories: [
      {
        name: 'Signature Burgers',
        description: 'Fresh smashed Angus beef patties on buttered brioche',
        items: [
          {
            name: 'Double Classic Smash Burger',
            description: 'Two smashed Black Angus beef patties, double American cheddar, secret sauce, pickles',
            price: 9.75,
            prepTime: 6,
            calories: 680,
            allergens: 'Dairy, Gluten',
            ingredients: [
              { name: 'Fresh Angus Ground Beef (Patties)', quantity: 200, unit: 'grams', costPerUnit: 0.015, lowStockThreshold: 5000 },
              { name: 'Toasted Brioche Buns', quantity: 1, unit: 'pieces', costPerUnit: 0.40, lowStockThreshold: 50 },
              { name: 'American Cheddar Slices', quantity: 2, unit: 'pieces', costPerUnit: 0.15, lowStockThreshold: 100 },
              { name: 'House Burger Sauce', quantity: 30, unit: 'grams', costPerUnit: 0.005, lowStockThreshold: 1000 }
            ]
          },
          {
            name: 'Truffle Swiss Mushroom Burger',
            description: 'Black Angus beef, melted Swiss cheese, sautéed garlic portobello mushrooms, black truffle aioli',
            price: 11.50,
            prepTime: 7,
            calories: 740,
            allergens: 'Dairy, Gluten',
            ingredients: [
              { name: 'Fresh Angus Ground Beef (Patties)', quantity: 150, unit: 'grams', costPerUnit: 0.015 },
              { name: 'Toasted Brioche Buns', quantity: 1, unit: 'pieces', costPerUnit: 0.40 },
              { name: 'Truffle Garlic Aioli', quantity: 25, unit: 'grams', costPerUnit: 0.012 }
            ]
          },
          {
            name: 'Crispy Nashville Hot Chicken Burger',
            description: 'Buttermilk-brined fried chicken breast dipped in Nashville chili oil, slaw, pickles',
            price: 9.25,
            prepTime: 8,
            calories: 710,
            allergens: 'Dairy, Gluten, Eggs',
            ingredients: [
              { name: 'Fresh Chicken Breast', quantity: 180, unit: 'grams', costPerUnit: 0.008 },
              { name: 'Toasted Brioche Buns', quantity: 1, unit: 'pieces', costPerUnit: 0.40 }
            ]
          }
        ]
      },
      {
        name: 'Sides & Loaded Fries',
        description: 'Golden fries, rings, and cheesy appetizers',
        items: [
          {
            name: 'Crispy Sea Salt Fries',
            description: 'Skin-on premium potato fries tossed in fine sea salt',
            price: 3.75,
            prepTime: 4,
            calories: 340,
            dietaryTags: 'Vegan'
          },
          {
            name: 'Loaded Cheddar Bacon Fries',
            description: 'Fries smothered in warm aged cheddar sauce, smoky bacon bits, and jalapeño slices',
            price: 6.25,
            prepTime: 5,
            calories: 580,
            allergens: 'Dairy'
          },
          {
            name: 'Beer-Battered Onion Rings',
            description: 'Thick-cut sweet onion rings coated in crispy golden batter with smoky BBQ dip',
            price: 4.50,
            prepTime: 4,
            calories: 390,
            allergens: 'Gluten'
          }
        ]
      },
      {
        name: 'Thick Milkshakes & Sodas',
        description: 'Real ice cream milkshakes and fountain drinks',
        items: [
          {
            name: 'Salted Caramel Pretzel Shake',
            description: 'Vanilla bean custard shake with caramel swirl and crushed pretzel crunch',
            price: 5.50,
            prepTime: 3,
            calories: 520,
            allergens: 'Dairy, Gluten'
          },
          {
            name: 'Oreo Cookies & Cream Shake',
            description: 'Creamy milkshake blended with whole Oreo cookies and whipped cream',
            price: 5.50,
            prepTime: 3,
            calories: 540,
            allergens: 'Dairy, Gluten'
          }
        ]
      }
    ]
  },
  {
    id: 'pizzeria',
    name: 'Pizzeria & Italian Bistro',
    nameAr: 'مطعم بيتزا وباستا إيطالية',
    description: 'Neapolitan wood-fired pizzas, handmade pastas, antipasti, fresh salads, and tiramisu.',
    descriptionAr: 'بيتزا نابولية على الحطب، باستا إيطالية طازجة، سلطات وتيراميسو.',
    icon: '🍕',
    badge: 'Dine-In & Delivery',
    serviceType: 'table_service',
    suggestedTables: 14,
    categories: [
      {
        name: 'Wood-Fired Neapolitan Pizzas',
        description: 'Hand-stretched sourdough pizzas baked at 450°C',
        items: [
          {
            name: 'Pizza Margherita D.O.P.',
            description: 'San Marzano tomato sauce, fresh Fior di Latte mozzarella, fresh basil, extra virgin olive oil',
            price: 11.50,
            prepTime: 9,
            calories: 780,
            allergens: 'Dairy, Gluten',
            ingredients: [
              { name: 'Neapolitan Sourdough Dough Ball', quantity: 250, unit: 'grams', costPerUnit: 0.003 },
              { name: 'San Marzano Tomato Sauce', quantity: 90, unit: 'grams', costPerUnit: 0.004 },
              { name: 'Fresh Mozzarella Fior di Latte', quantity: 120, unit: 'grams', costPerUnit: 0.012 },
              { name: 'Extra Virgin Olive Oil', quantity: 15, unit: 'ml', costPerUnit: 0.01 }
            ]
          },
          {
            name: 'Spicy Diavola & Pepperoni',
            description: 'San Marzano sauce, mozzarella, spicy Italian pepperoni, chili flakes, and hot honey drizzle',
            price: 13.75,
            prepTime: 10,
            calories: 890,
            allergens: 'Dairy, Gluten',
            ingredients: [
              { name: 'Neapolitan Sourdough Dough Ball', quantity: 250, unit: 'grams', costPerUnit: 0.003 },
              { name: 'Fresh Mozzarella Fior di Latte', quantity: 120, unit: 'grams', costPerUnit: 0.012 },
              { name: 'Spicy Beef Pepperoni Slices', quantity: 60, unit: 'grams', costPerUnit: 0.018 }
            ]
          },
          {
            name: 'Tartufo Funghi & Provolone',
            description: 'White base with black truffle cream, wild forest mushrooms, smoked provolone, thyme',
            price: 15.00,
            prepTime: 10,
            calories: 820,
            allergens: 'Dairy, Gluten'
          }
        ]
      },
      {
        name: 'Fresh Pastas & Starters',
        description: 'Handcrafted pasta and Italian appetizers',
        items: [
          {
            name: 'Truffle Tagliatelle Alfredo',
            description: 'Fresh egg pasta tossed with Parmigiano-Reggiano, butter, and shaved black truffle',
            price: 14.50,
            prepTime: 12,
            calories: 720,
            allergens: 'Dairy, Gluten, Eggs'
          },
          {
            name: 'Classic Caesar Salad',
            description: 'Crisp romaine lettuce, sourdough croutons, shaved parmesan, house anchovy dressing',
            price: 8.50,
            prepTime: 5,
            calories: 310,
            allergens: 'Dairy, Gluten, Fish'
          },
          {
            name: 'Traditional Venetian Tiramisu',
            description: 'Espresso-soaked Savoiardi ladyfingers layered with rich mascarpone zabaglione',
            price: 6.75,
            prepTime: 2,
            calories: 410,
            allergens: 'Dairy, Gluten, Eggs'
          }
        ]
      }
    ]
  },
  {
    id: 'juice-bar',
    name: 'Juice, Smoothie & Superfood Bar',
    nameAr: 'بار العصائر الطبيعية والسموذي',
    description: 'Cold-pressed 100% natural juices, organic açaí bowls, protein shakes, and wellness tonics.',
    descriptionAr: 'عصائر باردة طازجة، أساي بولز عضوية، سموذي بروتين، وشوتس مناعة.',
    icon: '🥤',
    badge: 'Healthy & Fresh',
    serviceType: 'counter',
    suggestedTables: 6,
    categories: [
      {
        name: 'Cold-Pressed Raw Juices',
        description: 'Raw, unpasteurized natural juices extracted with cold-press technology',
        items: [
          {
            name: 'Green Immunity Detox',
            description: 'Kale, English cucumber, green Granny Smith apple, celery, ginger root, lemon',
            price: 6.50,
            prepTime: 2,
            calories: 120,
            dietaryTags: 'Vegan'
          },
          {
            name: 'Citrus Glow & Turmeric',
            description: 'Fresh Valencia orange, sweet carrot, turmeric root, ruby red grapefruit, black pepper',
            price: 6.00,
            prepTime: 2,
            calories: 140,
            dietaryTags: 'Vegan'
          },
          {
            name: 'Ruby Beet Vitality',
            description: 'Organic beetroot, red apple, pomegranate juice, fresh mint, lime',
            price: 6.25,
            prepTime: 2,
            calories: 135,
            dietaryTags: 'Vegan'
          }
        ]
      },
      {
        name: 'Organic Açaí Bowls & Protein',
        description: 'Amazonian açaí puree topped with superfoods',
        items: [
          {
            name: 'Signature Amazon Açaí Bowl',
            description: 'Thick organic açaí blend topped with house granola, fresh banana, strawberries, peanut butter drizzle',
            price: 9.75,
            prepTime: 5,
            calories: 410,
            dietaryTags: 'Vegetarian',
            allergens: 'Peanuts, Tree Nuts'
          },
          {
            name: 'Peanut Butter Whey Power Smoothie',
            description: 'Almond milk, banana, 25g vanilla whey isolate protein, all-natural peanut butter, raw oats',
            price: 7.50,
            prepTime: 4,
            calories: 460,
            allergens: 'Dairy, Peanuts, Tree Nuts'
          }
        ]
      }
    ]
  },
  {
    id: 'retail',
    name: 'Boutique Retail & Gourmet Market',
    nameAr: 'متجر بيع تجزئة وسوبرماركت صغير',
    description: 'Packaged coffee beans, artisanal sauces, merchandise, snacks, beverages, and retail items.',
    descriptionAr: 'بن معبأ، صلصات ومنتجات فاخرة، هدايا ومستلزمات منزلية.',
    icon: '🏪',
    badge: 'Retail & Barcode',
    serviceType: 'retail',
    suggestedTables: 0,
    categories: [
      {
        name: 'Packaged Specialty Beans (250g)',
        description: 'Freshly roasted whole bean coffee bags',
        items: [
          {
            name: 'Ethiopia Yirgacheffe Washed 250g',
            description: 'Notes of jasmine, bergamot, and peach tea. Whole bean bag with one-way valve',
            price: 16.50,
            calories: 0
          },
          {
            name: 'Colombia Huila Pink Bourbon 250g',
            description: 'Notes of pink guava, brown sugar, and dark chocolate. Filter roast',
            price: 18.00,
            calories: 0
          },
          {
            name: 'Signature House Espresso Blend 1kg',
            description: 'Brazil and Guatemala blend with caramel, roasted hazelnut, and milk chocolate notes',
            price: 34.00,
            calories: 0
          }
        ]
      },
      {
        name: 'Brewing Gear & Merch',
        description: 'Barista accessories and branded merchandise',
        items: [
          {
            name: 'Glass V60 Dripper (Size 02)',
            description: 'Heat-resistant borosilicate glass pour-over cone with olive wood base',
            price: 26.00
          },
          {
            name: 'Insulated Ceramic Travel Tumbler (12oz)',
            description: 'Double-wall vacuum insulated stainless steel cup with ceramic internal coating',
            price: 24.50
          }
        ]
      }
    ]
  }
]
