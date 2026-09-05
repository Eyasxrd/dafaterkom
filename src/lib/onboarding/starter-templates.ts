export interface StarterTemplate {
  id: string
  name: string
  description: string
  icon: string
  categories: {
    name: string
    description: string
    items: {
      name: string
      description: string
      price: number
      ingredients?: { name: string; quantity: number; unit: string }[]
    }[]
  }[]
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'coffee-shop',
    name: 'Specialty Coffee Shop',
    description: 'Hot brews, cold coffees, artisanal espresso, tea, and quick breakfast snacks.',
    icon: '☕',
    categories: [
      {
        name: 'Hot Coffees',
        description: 'Classic and specialty espresso beverages',
        items: [
          { name: 'Espresso', description: 'Double shot rich espresso', price: 3.50 },
          { name: 'Cortado', description: 'Equal parts espresso and steamed milk', price: 4.00 },
          { name: 'Cappuccino', description: 'Velvety espresso with dense foam', price: 4.50 },
          { name: 'Spanish Latte', description: 'Espresso with sweetened condensed milk', price: 5.25 },
          { name: 'Americano', description: 'Espresso topped with hot water', price: 3.75 }
        ]
      },
      {
        name: 'Cold Brews & Iced',
        description: 'Chilled coffees and refreshers',
        items: [
          { name: 'Iced Latte', description: 'Espresso poured over chilled milk and ice', price: 4.75 },
          { name: 'Nitro Cold Brew', description: 'Slow steeped coffee infused with nitrogen', price: 5.50 },
          { name: 'Iced Matcha Latte', description: 'Ceremonial grade matcha with oat milk', price: 5.75 }
        ]
      },
      {
        name: 'Pastries',
        description: 'Fresh daily bakes',
        items: [
          { name: 'Butter Croissant', description: 'Flaky golden French pastry', price: 3.25 },
          { name: 'Pain au Chocolat', description: 'Belgian dark chocolate croissant', price: 3.75 },
          { name: 'Almond Biscotti', description: 'Twice-baked almond cookie', price: 2.50 }
        ]
      }
    ]
  },
  {
    id: 'bakery',
    name: 'Artisan Bakery & Patisserie',
    description: 'Sourdough breads, delicate tarts, cookies, and sweet cakes.',
    icon: '🥐',
    categories: [
      {
        name: 'Breads & Loaves',
        description: 'Naturally leavened sourdoughs and baguettes',
        items: [
          { name: 'Country Sourdough Loaf', description: '48-hour fermented rustic loaf', price: 7.50 },
          { name: 'French Baguette', description: 'Crisp crust and airy crumb', price: 3.50 },
          { name: 'Olive Ciabatta', description: 'Kalamata olive Italian loaf', price: 6.00 }
        ]
      },
      {
        name: 'Cakes & Tarts',
        description: 'Handcrafted desserts',
        items: [
          { name: 'Lemon Meringue Tart', description: 'Tangy curd with toasted meringue', price: 6.50 },
          { name: 'Basque Burnt Cheesecake', description: 'Caramelized rich cheesecake slice', price: 7.00 },
          { name: 'Chocolate Fudge Brownie', description: 'Decadent dark chocolate brownie', price: 4.50 }
        ]
      }
    ]
  },
  {
    id: 'qsr',
    name: 'Quick-Service Restaurant (QSR)',
    description: 'Burgers, chicken sandwiches, crispy fries, combo meals, and shakes.',
    icon: '🍔',
    categories: [
      {
        name: 'Burgers & Sandwiches',
        description: 'Smash burgers and chicken sandwiches',
        items: [
          { name: 'Classic Smash Burger', description: 'Double beef patty, cheese, special sauce', price: 9.50 },
          { name: 'Crispy Chicken Burger', description: 'Fried chicken breast, pickles, garlic mayo', price: 8.75 },
          { name: 'Truffle Mushroom Burger', description: 'Swiss cheese, sautéed mushrooms, truffle aioli', price: 11.00 }
        ]
      },
      {
        name: 'Sides & Fries',
        description: 'Hot crispy sides',
        items: [
          { name: 'Golden Fries', description: 'Sea salt seasoned French fries', price: 3.50 },
          { name: 'Loaded Cheese Fries', description: 'Cheddar sauce, bacon bits, jalapeños', price: 5.50 },
          { name: 'Onion Rings', description: 'Beer-battered crispy onion rings', price: 4.25 }
        ]
      }
    ]
  },
  {
    id: 'juice-bar',
    name: 'Juice & Smoothie Bar',
    description: 'Cold-pressed raw juices, superfood smoothie bowls, and wellness shots.',
    icon: '🥤',
    categories: [
      {
        name: 'Cold-Pressed Juices',
        description: 'Raw, unpasteurized natural juices',
        items: [
          { name: 'Green Detox', description: 'Kale, cucumber, green apple, ginger, lemon', price: 6.75 },
          { name: 'Citrus Glow', description: 'Orange, carrot, turmeric, grapefruit', price: 6.25 },
          { name: 'Beet Boost', description: 'Beetroot, red apple, pomegranate, mint', price: 6.50 }
        ]
      },
      {
        name: 'Açaí Bowls',
        description: 'Organic açaí purée with crunchy toppings',
        items: [
          { name: 'Signature Açaí Bowl', description: 'Granola, banana, strawberries, peanut butter', price: 9.50 },
          { name: 'Tropical Dragon Bowl', description: 'Pitaya bowl, chia seeds, kiwi, coconut flakes', price: 10.00 }
        ]
      }
    ]
  }
]
