export type ItemType = 'drink' | 'food' | 'retail' | 'other'

export type DrinkSubtype =
  | 'coffee'
  | 'tea_matcha'
  | 'juice_smoothie'
  | 'mocktail'
  | 'soda'
  | 'shake_frappe'
  | 'water'
  | 'specialty'

export type FoodSubtype =
  | 'bakery'
  | 'breakfast'
  | 'sandwich_wrap'
  | 'main_course'
  | 'appetizer_side'
  | 'salad_bowl'
  | 'dessert'
  | 'pizza_pasta'
  | 'other_food'

export interface DrinkSizeOption {
  id: string
  name: string // e.g. "Small", "Medium", "Large", "Extra Large"
  volumeMl: number // e.g. 250, 350, 500, 700
  volumeOz?: number // e.g. 8, 12, 16, 24
  extraPrice: number // e.g. 0.00, 0.75, 1.50
  ingredientMultiplier: number // e.g. 1.0, 1.4, 1.8, 2.2
  isDefault?: boolean
  // Hot Packaging
  hotCupIngredientId?: string
  hotCupIngredientName?: string
  hotLidIngredientId?: string
  hotLidIngredientName?: string
  // Cold Packaging
  coldCupIngredientId?: string
  coldCupIngredientName?: string
  coldLidIngredientId?: string
  coldLidIngredientName?: string
  // General / Fallback Packaging
  cupIngredientId?: string
  cupIngredientName?: string
  lidIngredientId?: string
  lidIngredientName?: string
}

export interface FoodPortionOption {
  id: string
  name: string // e.g. "Regular", "Large", "Double", "Half", "Full"
  weightGrams?: number // e.g. 200, 350
  extraPrice: number // e.g. 0.00, 2.50
  ingredientMultiplier?: number
  isDefault?: boolean
  // Primary Container / Box Link
  packagingIngredientId?: string
  packagingIngredientName?: string
  // Secondary Wrap / Bag Link
  secondaryPackagingIngredientId?: string
  secondaryPackagingIngredientName?: string
}

export interface DrinkCoffeeOption {
  id?: string
  name: string
  ingredientId?: string
  ingredientName?: string
  doseGrams: number
  extraPrice?: number
  isDefault?: boolean
}

export interface DrinkMilkOption {
  id?: string
  name: string
  ingredientId?: string
  ingredientName?: string
  volumeMl: number
  extraPrice?: number
  isDefault?: boolean
}

export interface DrinkSweetenerOption {
  id: string
  name: string
  ingredientId?: string
  ingredientName?: string
  quantityPerServing: number
  unit: string
  extraPrice?: number
  isDefault?: boolean
}

export interface NutritionalFacts {
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  sugarG?: number
  sodiumMg?: number
}

export interface DrinkCustomizationConfig {
  subtype?: DrinkSubtype
  isCoffeeBased: boolean
  defaultCoffeeDoseGrams: number
  coffeeOptions: DrinkCoffeeOption[]
  isMilkBased: boolean
  defaultMilkVolumeMl: number
  milkOptions: DrinkMilkOption[]
  sweetenerOptions?: DrinkSweetenerOption[]
  sizeType?: 'standard' | 'volume_ml' | 'custom'
  sizes: DrinkSizeOption[]
  temperatureOptions: Array<'hot' | 'iced' | 'blended' | 'room_temp'>
  sweetnessLevels: string[]
  iceLevels: string[]
  caffeineType?: 'regular' | 'decaf' | 'half_caf' | 'caffeine_free'
  allowExtraShot?: boolean
  extraShotPrice?: number
}

export interface FoodBaseIngredient {
  ingredientId?: string
  ingredientName: string
  quantity: number
  unit: string
}

export interface FoodModifierOption {
  id: string
  name: string
  ingredientId?: string
  ingredientName?: string
  quantityDeducted?: number
  unit?: string
  extraPrice?: number
  isDefault?: boolean
}

export interface FoodModifierGroup {
  id: string
  name: string
  required: boolean
  minSelections?: number
  maxSelections?: number
  options: FoodModifierOption[]
}

export interface FoodCustomizationConfig {
  subtype?: FoodSubtype
  portions: FoodPortionOption[]
  spiceLevel?: 'none' | 'mild' | 'medium' | 'hot' | 'extra_spicy'
  servingTemp?: 'hot' | 'cold' | 'fresh' | 'baked' | 'grilled' | 'fried'
  baseIngredients?: FoodBaseIngredient[]
  modifierGroups?: FoodModifierGroup[]
}

export interface ItemCustomizationConfig {
  itemType: ItemType
  drinkConfig?: DrinkCustomizationConfig
  foodConfig?: FoodCustomizationConfig
  nutrition?: NutritionalFacts
  originNote?: string
  storageNote?: string
  tasteProfile?: string[]
  sku?: string
}

export interface SelectedOption {
  groupId?: string
  groupName: string
  optionId?: string
  optionName: string
  ingredientId?: string
  ingredientName?: string
  quantityDeducted?: number
  unit?: string
  extraPrice?: number
}

export const DEFAULT_DRINK_SIZES: DrinkSizeOption[] = [
  { id: 'size_s', name: 'Small', volumeMl: 250, volumeOz: 8, extraPrice: 0.00, ingredientMultiplier: 1.0, isDefault: true },
  { id: 'size_m', name: 'Medium', volumeMl: 350, volumeOz: 12, extraPrice: 0.75, ingredientMultiplier: 1.4, isDefault: false },
  { id: 'size_l', name: 'Large', volumeMl: 500, volumeOz: 16, extraPrice: 1.50, ingredientMultiplier: 1.8, isDefault: false },
  { id: 'size_xl', name: 'Extra Large (XL)', volumeMl: 700, volumeOz: 24, extraPrice: 2.25, ingredientMultiplier: 2.2, isDefault: false }
]

export const DEFAULT_FOOD_PORTIONS: FoodPortionOption[] = [
  { id: 'portion_regular', name: 'Regular Portion', weightGrams: 250, extraPrice: 0.00, ingredientMultiplier: 1.0, isDefault: true },
  { id: 'portion_large', name: 'Large / Double', weightGrams: 400, extraPrice: 2.50, ingredientMultiplier: 1.6, isDefault: false }
]

export const DEFAULT_COFFEE_OPTIONS: DrinkCoffeeOption[] = [
  { id: 'c_house', name: 'House Espresso Blend', doseGrams: 18, isDefault: true },
  { id: 'c_single', name: 'Single Origin Ethiopian', doseGrams: 18, extraPrice: 0.50 },
  { id: 'c_decaf', name: 'Swiss Water Decaf', doseGrams: 18, extraPrice: 0.00 }
]

export const DEFAULT_MILK_OPTIONS: DrinkMilkOption[] = [
  { id: 'm_whole', name: 'Whole Milk', volumeMl: 220, isDefault: true },
  { id: 'm_oat', name: 'Oat Milk', volumeMl: 220, extraPrice: 0.75 },
  { id: 'm_almond', name: 'Almond Milk', volumeMl: 220, extraPrice: 0.75 },
  { id: 'm_skim', name: 'Skim Milk', volumeMl: 220, extraPrice: 0.00 },
  { id: 'm_coconut', name: 'Coconut Milk', volumeMl: 220, extraPrice: 0.75 }
]

export const DEFAULT_SWEETENER_OPTIONS: DrinkSweetenerOption[] = [
  { id: 'sw_white', name: 'White Sugar', quantityPerServing: 10, unit: 'g', extraPrice: 0.00, isDefault: true },
  { id: 'sw_brown', name: 'Brown Sugar', quantityPerServing: 10, unit: 'g', extraPrice: 0.00 },
  { id: 'sw_stevia', name: 'Stevia (Sugar-Free)', quantityPerServing: 1, unit: 'packets', extraPrice: 0.00 }
]

export const DEFAULT_TEMPERATURE_OPTIONS: Array<'hot' | 'iced' | 'blended' | 'room_temp'> = [
  'hot',
  'iced'
]

export const DEFAULT_SWEETNESS_LEVELS = [
  '0% No Sugar',
  '25% Low Sweet',
  '50% Half Sweet',
  '75% Less Sweet',
  '100% Normal',
  '120% Extra Sweet'
]

export const DEFAULT_ICE_LEVELS = [
  'No Ice',
  'Light Ice',
  'Regular Ice',
  'Extra Ice'
]

export const COMMON_TASTE_PROFILES = [
  'Sweet',
  'Savory',
  'Bitter',
  'Creamy',
  'Fruity',
  'Crisp',
  'Smoky',
  'Chocolaty',
  'Citrusy',
  'Floral',
  'Nutty',
  'Tangy',
  'Spicy',
  'Rich'
]

export function getDefaultDrinkConfig(isCoffee = true, isMilk = true): DrinkCustomizationConfig {
  return {
    subtype: isCoffee ? 'coffee' : 'specialty',
    isCoffeeBased: isCoffee,
    defaultCoffeeDoseGrams: 18,
    coffeeOptions: DEFAULT_COFFEE_OPTIONS,
    isMilkBased: isMilk,
    defaultMilkVolumeMl: 220,
    milkOptions: DEFAULT_MILK_OPTIONS,
    sweetenerOptions: DEFAULT_SWEETENER_OPTIONS,
    sizeType: 'standard',
    sizes: DEFAULT_DRINK_SIZES,
    temperatureOptions: DEFAULT_TEMPERATURE_OPTIONS,
    sweetnessLevels: DEFAULT_SWEETNESS_LEVELS,
    iceLevels: DEFAULT_ICE_LEVELS,
    caffeineType: isCoffee ? 'regular' : 'caffeine_free',
    allowExtraShot: isCoffee,
    extraShotPrice: 1.00
  }
}

export function getDefaultFoodConfig(): FoodCustomizationConfig {
  return {
    subtype: 'sandwich_wrap',
    portions: DEFAULT_FOOD_PORTIONS,
    spiceLevel: 'none',
    servingTemp: 'hot',
    baseIngredients: [],
    modifierGroups: [
      {
        id: 'bread_type',
        name: 'Bread / Crust Choice',
        required: false,
        minSelections: 0,
        maxSelections: 1,
        options: [
          { id: 'b_sourdough', name: 'Artisan Sourdough', quantityDeducted: 2, unit: 'slices', isDefault: true },
          { id: 'b_brioche', name: 'Toasted Brioche', quantityDeducted: 1, unit: 'bun', extraPrice: 0.50 },
          { id: 'b_gf', name: 'Gluten-Free Bread', quantityDeducted: 2, unit: 'slices', extraPrice: 1.00 }
        ]
      }
    ]
  }
}

export function parseItemCustomization(raw: string | object | null | undefined): ItemCustomizationConfig {
  if (!raw) {
    return { itemType: 'drink', drinkConfig: getDefaultDrinkConfig(true, true) }
  }

  let parsed: any = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { itemType: 'drink', drinkConfig: getDefaultDrinkConfig(true, true) }
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { itemType: 'drink', drinkConfig: getDefaultDrinkConfig(true, true) }
  }

  const itemType: ItemType = ['drink', 'food', 'retail', 'other'].includes(parsed.itemType)
    ? parsed.itemType
    : (parsed.isFood ? 'food' : 'drink')

  const rawDrinkConfig = parsed.drinkConfig
  let resolvedDrinkConfig: DrinkCustomizationConfig | undefined = undefined
  if (itemType === 'drink') {
    if (rawDrinkConfig) {
      resolvedDrinkConfig = {
        ...rawDrinkConfig,
        sizes: rawDrinkConfig.sizes && Array.isArray(rawDrinkConfig.sizes) && rawDrinkConfig.sizes.length > 0
          ? rawDrinkConfig.sizes
          : DEFAULT_DRINK_SIZES,
        temperatureOptions: rawDrinkConfig.temperatureOptions || DEFAULT_TEMPERATURE_OPTIONS,
        sweetnessLevels: rawDrinkConfig.sweetnessLevels || DEFAULT_SWEETNESS_LEVELS,
        iceLevels: rawDrinkConfig.iceLevels || DEFAULT_ICE_LEVELS,
        coffeeOptions: rawDrinkConfig.coffeeOptions || DEFAULT_COFFEE_OPTIONS,
        milkOptions: rawDrinkConfig.milkOptions || DEFAULT_MILK_OPTIONS,
        sweetenerOptions: rawDrinkConfig.sweetenerOptions || DEFAULT_SWEETENER_OPTIONS
      }
    } else {
      resolvedDrinkConfig = getDefaultDrinkConfig(parsed.isCoffeeBased ?? true, parsed.isMilkBased ?? true)
    }
  }

  const rawFoodConfig = parsed.foodConfig
  let resolvedFoodConfig: FoodCustomizationConfig | undefined = undefined
  if (itemType === 'food') {
    if (rawFoodConfig) {
      resolvedFoodConfig = {
        ...rawFoodConfig,
        portions: rawFoodConfig.portions && Array.isArray(rawFoodConfig.portions) && rawFoodConfig.portions.length > 0
          ? rawFoodConfig.portions
          : DEFAULT_FOOD_PORTIONS,
        modifierGroups: rawFoodConfig.modifierGroups || []
      }
    } else {
      resolvedFoodConfig = getDefaultFoodConfig()
    }
  }

  return {
    itemType,
    drinkConfig: resolvedDrinkConfig,
    foodConfig: resolvedFoodConfig,
    nutrition: parsed.nutrition,
    originNote: parsed.originNote,
    storageNote: parsed.storageNote,
    tasteProfile: Array.isArray(parsed.tasteProfile) ? parsed.tasteProfile : [],
    sku: parsed.sku
  }
}

export function formatModifiersSummary(selectedOptions: SelectedOption[]): string {
  if (!selectedOptions || selectedOptions.length === 0) return ''
  return selectedOptions
    .map((opt) => {
      const extra = opt.extraPrice && opt.extraPrice > 0 ? ` (+$${opt.extraPrice.toFixed(2)})` : ''
      return `${opt.groupName}: ${opt.optionName}${extra}`
    })
    .join(' • ')
}
