'use client'

import React, { useState, useRef, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  RotateCcw,
  Sparkles,
  Layers,
  Search,
  Filter,
  Package,
  Info,
  X,
  Coffee,
  CheckCheck,
  Tag,
  ShieldAlert,
  Flame,
  Clock,
  Compass,
  Thermometer,
  Percent,
  Snowflake,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

export interface ColumnMapping {
  name: string
  price: string
  category: string
  description: string
  ingredients: string
  type: string
  subtype: string
  imageUrl: string
  sku: string
  isAvailable: string
  dietaryTags: string
  allergens: string
  calories: string
  proteinG: string
  carbsG: string
  fatG: string
  sugarG: string
  sodiumMg: string
  prepTime: string
  originNote: string
  storageNote: string
  tasteProfile: string
  caffeineType: string
  temperatureOptions: string
  sweetnessLevels: string
  iceLevels: string
  sizes: string
}

export interface ParsedMenuItemRow {
  index: number
  name: string
  price: number
  category: string
  description: string
  ingredients?: string
  type: 'drink' | 'food' | 'retail' | 'other'
  subtype?: string
  imageUrl: string
  sku: string
  isAvailable: boolean
  dietaryTags: string[]
  allergens: string[]
  calories?: number
  proteinG?: number
  carbsG?: number
  fatG?: number
  sugarG?: number
  sodiumMg?: number
  prepTime?: number
  originNote?: string
  storageNote?: string
  tasteProfile?: string[]
  caffeineType?: string
  temperatureOptions?: string[]
  sweetnessLevels?: string[]
  iceLevels?: string[]
  sizes?: string
  isValid: boolean
  errorReason?: string
  raw: any
}

interface MenuExcelImporterModalProps {
  isOpen: boolean
  onClose: () => void
  menus: Array<{ id: string; name: string; type: string }>
  categories: Array<{ id: string; name: string }>
  onImportComplete: () => void
}

export default function MenuExcelImporterModal({
  isOpen,
  onClose,
  menus,
  categories,
  onImportComplete
}: MenuExcelImporterModalProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // File state
  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<string>('')
  const [availableSheets, setAvailableSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([])
  const [rawSheetData, setRawSheetData] = useState<any[]>([])

  // Options & Mapping
  const [duplicateMode, setDuplicateMode] = useState<'overwrite' | 'skip'>('overwrite')
  const [targetMenuId, setTargetMenuId] = useState<string>('all')
  const [activeMappingSection, setActiveMappingSection] = useState<'all' | 'core' | 'nutrition' | 'customizations'>('all')

  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    price: '',
    category: '',
    description: '',
    ingredients: '',
    type: '',
    subtype: '',
    imageUrl: '',
    sku: '',
    isAvailable: '',
    dietaryTags: '',
    allergens: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
    sugarG: '',
    sodiumMg: '',
    prepTime: '',
    originNote: '',
    storageNote: '',
    tasteProfile: '',
    caffeineType: '',
    temperatureOptions: '',
    sweetnessLevels: '',
    iceLevels: '',
    sizes: ''
  })

  // Preview & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'invalid'>('all')

  // Import Execution state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    createdCount: number
    updatedCount: number
    skippedCount: number
    totalProcessed: number
    errors: string[]
  } | null>(null)

  // Reset state when closing or starting fresh
  const handleReset = () => {
    setCurrentStep(1)
    setFileName('')
    setFileSize('')
    setAvailableSheets([])
    setSelectedSheet('')
    setRawWorkbook(null)
    setSheetHeaders([])
    setRawSheetData([])
    setMapping({
      name: '',
      price: '',
      category: '',
      description: '',
      ingredients: '',
      type: '',
      subtype: '',
      imageUrl: '',
      sku: '',
      isAvailable: '',
      dietaryTags: '',
      allergens: '',
      calories: '',
      proteinG: '',
      carbsG: '',
      fatG: '',
      sugarG: '',
      sodiumMg: '',
      prepTime: '',
      originNote: '',
      storageNote: '',
      tasteProfile: '',
      caffeineType: '',
      temperatureOptions: '',
      sweetnessLevels: '',
      iceLevels: '',
      sizes: ''
    })
    setImportResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Auto-detect columns with fuzzy matching
  const autoDetectMapping = (headers: string[]): ColumnMapping => {
    const findHeader = (patterns: string[]) => {
      return headers.find((h) => {
        const clean = h.toLowerCase().replace(/[^a-z0-9]/g, '')
        return patterns.some((p) => clean.includes(p.toLowerCase()))
      }) || ''
    }

    return {
      name: findHeader(['itemname', 'productname', 'item', 'name', 'product', 'title']),
      price: findHeader(['sellingprice', 'retailprice', 'price', 'rate', 'amount', 'sar', 'usd']),
      category: findHeader(['category', 'cat', 'group', 'section', 'department', 'menusection']),
      description: findHeader(['description', 'desc', 'details', 'note', 'summary']),
      ingredients: findHeader(['ingredients', 'ingredient', 'contents', 'components', 'recipeingredients', 'displayingredients']),
      type: findHeader(['itemtype', 'type', 'kind', 'classification', 'drinkfood']),
      subtype: findHeader(['subtype', 'subclassification', 'beveragetype', 'foodtype', 'subcategory']),
      imageUrl: findHeader(['imageurl', 'image', 'photo', 'picture', 'pic']),
      sku: findHeader(['sku', 'barcode', 'code', 'itemcode', 'upc']),
      isAvailable: findHeader(['isavailable', 'available', 'instock', 'active', 'status', 'enabled']),
      dietaryTags: findHeader(['dietary', 'dietarytags', 'tags', 'diet', 'lifestyle', 'vegan']),
      allergens: findHeader(['allergens', 'allergen', 'allergy', 'allergies', 'warning', 'contains']),
      calories: findHeader(['calories', 'calorie', 'cal', 'kcal']),
      proteinG: findHeader(['protein', 'proteing', 'protein(g)']),
      carbsG: findHeader(['carbs', 'carbohydrates', 'carbsg', 'carbohydrate']),
      fatG: findHeader(['fat', 'totalfat', 'fatg', 'fats']),
      sugarG: findHeader(['sugar', 'sugarg', 'sugars']),
      sodiumMg: findHeader(['sodium', 'sodiummg', 'salt']),
      prepTime: findHeader(['preptime', 'prep', 'time', 'minutes', 'duration']),
      originNote: findHeader(['origin', 'originnote', 'beanorigin', 'source', 'country']),
      storageNote: findHeader(['storage', 'storagenote', 'shelflife', 'preservation', 'temperaturenote']),
      tasteProfile: findHeader(['taste', 'tasteprofile', 'flavor', 'sensory', 'notes']),
      caffeineType: findHeader(['caffeine', 'caffeinetype', 'caffeinated', 'decaf']),
      temperatureOptions: findHeader(['temperature', 'temp', 'styles', 'hotcold', 'servingtemp']),
      sweetnessLevels: findHeader(['sweetness', 'sweetnesslevels', 'sugarlevel']),
      iceLevels: findHeader(['ice', 'icelevels', 'icecustomization']),
      sizes: findHeader(['sizes', 'size', 'portions', 'sizing', 'variants'])
    }
  }

  // Parse workbook when a file is loaded
  const processWorkbook = (wb: XLSX.WorkBook, sheetName?: string) => {
    const targetSheet = sheetName || wb.SheetNames[0]
    const worksheet = wb.Sheets[targetSheet]
    if (!worksheet) return

    // Convert sheet to array of rows
    const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
    if (data.length < 1) return

    const rawHeaders: string[] = (data[0] || []).map((h) => String(h).trim()).filter(Boolean)
    const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' })

    setRawWorkbook(wb)
    setAvailableSheets(wb.SheetNames)
    setSelectedSheet(targetSheet)
    setSheetHeaders(rawHeaders)
    setRawSheetData(jsonRows)

    // Auto-detect mappings
    const detected = autoDetectMapping(rawHeaders)
    setMapping(detected)

    setCurrentStep(2)
  }

  // File drop / upload handler
  const handleFileUpload = (file: File) => {
    if (!file) return

    setFileName(file.name)
    setFileSize((file.size / 1024).toFixed(1) + ' KB')

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result
        const wb = XLSX.read(buffer, { type: 'binary' })
        processWorkbook(wb)
      } catch (err) {
        console.error('Failed to parse excel file:', err)
        alert('Could not read the spreadsheet. Please verify it is a valid .xlsx, .xls, or .csv file.')
      }
    }
    reader.readAsBinaryString(file)
  }

  // Download comprehensive sample template covering EVERY detail
  const handleDownloadSample = () => {
    const sampleItems = [
      {
        "Item Name": "Spanish Latte",
        "Price": 5.50,
        "Category": "Espresso Bar",
        "Description": "Espresso poured over velvety milk infused with sweetened condensed milk and cinnamon.",
        "Ingredients": "Espresso, Whole Milk, Condensed Milk, Cinnamon",
        "Type": "drink",
        "Subtype": "espresso",
        "Dietary Tags": "Vegetarian, Halal",
        "Allergens": "Dairy",
        "Calories": 240,
        "Protein (g)": 7,
        "Carbs (g)": 28,
        "Fat (g)": 8,
        "Sugar (g)": 24,
        "Sodium (mg)": 95,
        "Prep Time (mins)": 3,
        "SKU": "BEV-LAT-01",
        "In Stock": "Yes",
        "Origin Note": "Blend of Brazil Santos & Ethiopian Yirgacheffe",
        "Storage Note": "Best served fresh between 60°C - 65°C",
        "Taste Profile": "Sweet, Creamy, Rich",
        "Caffeine": "regular",
        "Temperature Styles": "hot, iced",
        "Sweetness Options": "0%, 25%, 50%, 75%, 100%, 120%",
        "Ice Options": "No Ice, Light Ice, Regular Ice, Extra Ice",
        "Sizes & Surcharges": "Small:0, Medium:0.75, Large:1.50"
      },
      {
        "Item Name": "Iced V60 Filter Coffee",
        "Price": 6.00,
        "Category": "Specialty Brews",
        "Description": "Single origin pour-over slow-brewed over ice for crisp clarity and fruity acidity.",
        "Ingredients": "Ethiopian Specialty Coffee Beans, Filtered Alkaline Water",
        "Type": "drink",
        "Subtype": "brewed_coffee",
        "Dietary Tags": "Vegan, Gluten-Free, Organic, Keto, Sugar-Free",
        "Allergens": "",
        "Calories": 5,
        "Protein (g)": 0,
        "Carbs (g)": 0.5,
        "Fat (g)": 0,
        "Sugar (g)": 0,
        "Sodium (mg)": 2,
        "Prep Time (mins)": 4,
        "SKU": "BEV-V60-02",
        "In Stock": "Yes",
        "Origin Note": "Ethiopia Guji Highlands, Grade 1 Natural Process",
        "Storage Note": "Brewed to order, consume chilled",
        "Taste Profile": "Floral, Citrusy, Fruity, Crisp",
        "Caffeine": "regular",
        "Temperature Styles": "iced",
        "Sweetness Options": "0%, 50%",
        "Ice Options": "Light Ice, Regular Ice",
        "Sizes & Surcharges": "Standard:0"
      },
      {
        "Item Name": "Artisan Almond Croissant",
        "Price": 4.50,
        "Category": "Bakery & Pastry",
        "Description": "Twice-baked flaky croissant filled with rich almond frangipane and topped with toasted almonds.",
        "Ingredients": "French Butter, Flour, Almond Cream, Sliced Almonds, Powdered Sugar",
        "Type": "food",
        "Subtype": "bakery_pastry",
        "Dietary Tags": "Vegetarian",
        "Allergens": "Dairy, Gluten, Nuts, Eggs",
        "Calories": 390,
        "Protein (g)": 8,
        "Carbs (g)": 42,
        "Fat (g)": 21,
        "Sugar (g)": 18,
        "Sodium (mg)": 210,
        "Prep Time (mins)": 2,
        "SKU": "BAK-ALM-01",
        "In Stock": "Yes",
        "Origin Note": "Normandy Butter and California Marcona Almonds",
        "Storage Note": "Store in ambient display, best warmed 15 seconds",
        "Taste Profile": "Sweet, Nutty, Buttery",
        "Caffeine": "",
        "Temperature Styles": "warm, room_temp",
        "Sweetness Options": "",
        "Ice Options": "",
        "Sizes & Surcharges": "Regular:0"
      },
      {
        "Item Name": "Smoked Turkey & Sourdough Panini",
        "Price": 8.50,
        "Category": "Breakfast & Brunch",
        "Description": "House-smoked turkey breast, melted Swiss gruyère, arugula, and whole grain honey mustard on crusty sourdough.",
        "Ingredients": "Artisan Sourdough, Smoked Turkey Breast, Gruyère Cheese, Baby Arugula, Dijon Mustard",
        "Type": "food",
        "Subtype": "sandwich_wrap",
        "Dietary Tags": "Halal",
        "Allergens": "Dairy, Gluten",
        "Calories": 480,
        "Protein (g)": 32,
        "Carbs (g)": 46,
        "Fat (g)": 18,
        "Sugar (g)": 4,
        "Sodium (mg)": 680,
        "Prep Time (mins)": 6,
        "SKU": "FD-SND-04",
        "In Stock": "Yes",
        "Origin Note": "Local slow-fermented sourdough",
        "Storage Note": "Grilled to order, serve hot",
        "Taste Profile": "Savory, Smoky, Rich",
        "Caffeine": "",
        "Temperature Styles": "hot",
        "Sweetness Options": "",
        "Ice Options": "",
        "Sizes & Surcharges": "Single:0, Platter (+Fries):2.50"
      },
      {
        "Item Name": "Colombia Huila Whole Bean (250g)",
        "Price": 16.00,
        "Category": "Retail Coffee Beans",
        "Description": "Freshly roasted whole bean coffee with notes of caramel, dark cherry, and milk chocolate.",
        "Ingredients": "100% Arabica Specialty Coffee Beans",
        "Type": "retail",
        "Subtype": "",
        "Dietary Tags": "Vegan, Organic, Keto, Halal",
        "Allergens": "",
        "Calories": 0,
        "Protein (g)": 0,
        "Carbs (g)": 0,
        "Fat (g)": 0,
        "Sugar (g)": 0,
        "Sodium (mg)": 0,
        "Prep Time (mins)": 1,
        "SKU": "RET-COL-250",
        "In Stock": "Yes",
        "Origin Note": "Huila, Colombia (Elevation: 1,750m)",
        "Storage Note": "Store in a cool dry place away from direct sunlight",
        "Taste Profile": "Caramel, Cherry, Chocolate",
        "Caffeine": "regular",
        "Temperature Styles": "",
        "Sweetness Options": "",
        "Ice Options": "",
        "Sizes & Surcharges": "250g Pack:0"
      }
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(sampleItems)
    XLSX.utils.book_append_sheet(wb, ws, "Menu Comprehensive Template")
    XLSX.writeFile(wb, "dafaterkom_menu_master_template.xlsx")
  }

  // Parse helper for lists
  const splitStringList = (val: any): string[] => {
    if (!val) return []
    if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean)
    return String(val)
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  // Parse rows according to current mapping
  const parsedRows: ParsedMenuItemRow[] = useMemo(() => {
    if (!rawSheetData.length || !mapping.name) return []

    return rawSheetData.map((row, idx) => {
      const rawName = mapping.name ? String(row[mapping.name] || '').trim() : ''
      const rawPrice = mapping.price ? parseFloat(String(row[mapping.price]).replace(/[^0-9.-]+/g, '')) : NaN
      const rawCategory = mapping.category ? String(row[mapping.category] || '').trim() : 'General'
      const rawDesc = mapping.description ? String(row[mapping.description] || '').trim() : ''
      const rawIngredients = mapping.ingredients ? String(row[mapping.ingredients] || '').trim() : undefined
      const rawType = mapping.type ? String(row[mapping.type] || '').toLowerCase().trim() : ''
      const rawSubtype = mapping.subtype ? String(row[mapping.subtype] || '').toLowerCase().trim() : undefined
      const rawImage = mapping.imageUrl ? String(row[mapping.imageUrl] || '').trim() : ''
      const rawSku = mapping.sku ? String(row[mapping.sku] || '').trim() : ''

      // Availability boolean
      let isAvailable = true
      if (mapping.isAvailable && row[mapping.isAvailable] !== undefined) {
        const str = String(row[mapping.isAvailable]).toLowerCase().trim()
        if (['false', '0', 'no', 'out of stock', 'unavailable', 'inactive'].includes(str)) isAvailable = false
      }

      // Dietary & Allergens
      const dietaryTags = mapping.dietaryTags ? splitStringList(row[mapping.dietaryTags]) : []
      const allergens = mapping.allergens ? splitStringList(row[mapping.allergens]) : []

      // Nutrition numbers
      const rawCal = mapping.calories ? parseInt(String(row[mapping.calories]).replace(/[^0-9]/g, '')) : undefined
      const rawProt = mapping.proteinG ? parseFloat(String(row[mapping.proteinG]).replace(/[^0-9.]/g, '')) : undefined
      const rawCarbs = mapping.carbsG ? parseFloat(String(row[mapping.carbsG]).replace(/[^0-9.]/g, '')) : undefined
      const rawFat = mapping.fatG ? parseFloat(String(row[mapping.fatG]).replace(/[^0-9.]/g, '')) : undefined
      const rawSugar = mapping.sugarG ? parseFloat(String(row[mapping.sugarG]).replace(/[^0-9.]/g, '')) : undefined
      const rawSodium = mapping.sodiumMg ? parseFloat(String(row[mapping.sodiumMg]).replace(/[^0-9.]/g, '')) : undefined
      const rawPrep = mapping.prepTime ? parseInt(String(row[mapping.prepTime]).replace(/[^0-9]/g, '')) : undefined

      // Notes & Customizations
      const rawOrigin = mapping.originNote ? String(row[mapping.originNote] || '').trim() : undefined
      const rawStorage = mapping.storageNote ? String(row[mapping.storageNote] || '').trim() : undefined
      const tasteProfile = mapping.tasteProfile ? splitStringList(row[mapping.tasteProfile]) : []
      const caffeineType = mapping.caffeineType ? String(row[mapping.caffeineType] || '').toLowerCase().trim() : undefined
      const temperatureOptions = mapping.temperatureOptions ? splitStringList(row[mapping.temperatureOptions]) : []
      const sweetnessLevels = mapping.sweetnessLevels ? splitStringList(row[mapping.sweetnessLevels]) : []
      const iceLevels = mapping.iceLevels ? splitStringList(row[mapping.iceLevels]) : []
      const sizes = mapping.sizes ? String(row[mapping.sizes] || '').trim() : undefined

      const cleanType: 'drink' | 'food' | 'retail' | 'other' = 
        rawType.includes('food') || rawType.includes('bakery') || rawType.includes('sandwich') ? 'food' :
        rawType.includes('retail') || rawType.includes('bag') ? 'retail' :
        rawType.includes('other') ? 'other' : 'drink'

      let isValid = true
      let errorReason: string | undefined

      if (!rawName) {
        isValid = false
        errorReason = 'Missing item name'
      } else if (isNaN(rawPrice) || rawPrice < 0) {
        isValid = false
        errorReason = 'Invalid selling price'
      }

      return {
        index: idx + 1,
        name: rawName,
        price: isNaN(rawPrice) ? 0 : rawPrice,
        category: rawCategory || 'General',
        description: rawDesc,
        ingredients: rawIngredients,
        type: cleanType,
        subtype: rawSubtype,
        imageUrl: rawImage,
        sku: rawSku,
        isAvailable,
        dietaryTags,
        allergens,
        calories: !isNaN(rawCal as any) ? rawCal : undefined,
        proteinG: !isNaN(rawProt as any) ? rawProt : undefined,
        carbsG: !isNaN(rawCarbs as any) ? rawCarbs : undefined,
        fatG: !isNaN(rawFat as any) ? rawFat : undefined,
        sugarG: !isNaN(rawSugar as any) ? rawSugar : undefined,
        sodiumMg: !isNaN(rawSodium as any) ? rawSodium : undefined,
        prepTime: !isNaN(rawPrep as any) ? rawPrep : undefined,
        originNote: rawOrigin,
        storageNote: rawStorage,
        tasteProfile: tasteProfile.length > 0 ? tasteProfile : undefined,
        caffeineType,
        temperatureOptions: temperatureOptions.length > 0 ? temperatureOptions : undefined,
        sweetnessLevels: sweetnessLevels.length > 0 ? sweetnessLevels : undefined,
        iceLevels: iceLevels.length > 0 ? iceLevels : undefined,
        sizes,
        isValid,
        errorReason,
        raw: row
      }
    })
  }, [rawSheetData, mapping])

  // Filter preview items
  const filteredPreviewRows = useMemo(() => {
    return parsedRows.filter((row) => {
      if (previewFilter === 'valid' && !row.isValid) return false
      if (previewFilter === 'invalid' && row.isValid) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          row.name.toLowerCase().includes(q) ||
          row.category.toLowerCase().includes(q) ||
          row.description.toLowerCase().includes(q) ||
          (row.ingredients && row.ingredients.toLowerCase().includes(q))
        )
      }
      return true
    })
  }, [parsedRows, previewFilter, searchQuery])

  const validCount = parsedRows.filter((r) => r.isValid).length
  const invalidCount = parsedRows.filter((r) => !r.isValid).length

  // Execute bulk import
  const handleExecuteImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid)
    if (validRows.length === 0) {
      alert('No valid items to import.')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        duplicateMode,
        targetMenuId: targetMenuId !== 'all' ? targetMenuId : null,
        items: validRows.map((r) => ({
          name: r.name,
          price: r.price,
          category: r.category,
          description: r.description || undefined,
          ingredients: r.ingredients || undefined,
          type: r.type,
          subtype: r.subtype || undefined,
          imageUrl: r.imageUrl || undefined,
          sku: r.sku || undefined,
          isAvailable: r.isAvailable,
          dietaryTags: r.dietaryTags.length > 0 ? r.dietaryTags : undefined,
          allergens: r.allergens.length > 0 ? r.allergens : undefined,
          calories: r.calories,
          proteinG: r.proteinG,
          carbsG: r.carbsG,
          fatG: r.fatG,
          sugarG: r.sugarG,
          sodiumMg: r.sodiumMg,
          prepTime: r.prepTime,
          originNote: r.originNote,
          storageNote: r.storageNote,
          tasteProfile: r.tasteProfile,
          caffeineType: r.caffeineType,
          temperatureOptions: r.temperatureOptions,
          sweetnessLevels: r.sweetnessLevels,
          iceLevels: r.iceLevels,
          sizes: r.sizes
        }))
      }

      const res = await fetch('/api/menu-items/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (res.ok) {
        setImportResult(data)
        setCurrentStep(4)
      } else {
        alert(data.error || 'Failed to complete import')
      }
    } catch (err: any) {
      console.error('Import failed:', err)
      alert(err.message || 'An unexpected error occurred during import')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { handleReset(); onClose() } }}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto p-6 sm:p-7">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Comprehensive Menu Importer (Excel & CSV)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Step {currentStep} of 4
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Covers every detail: Nutrition, Allergens, Dietary Tags, Subtypes, Sizing, and Notes. Optional fields remain empty for future edits.
              </DialogDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => { handleReset(); onClose() }}
            className="h-8 w-8 p-0 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 my-4">
          {[
            { step: 1, label: '1. Upload File' },
            { step: 2, label: '2. Map All Fields' },
            { step: 3, label: '3. Preview & Validate' },
            { step: 4, label: '4. Complete' }
          ].map((s) => (
            <div
              key={s.step}
              className={`p-2 rounded-xl text-center text-xs font-bold transition-all border ${
                currentStep === s.step
                  ? 'bg-blue-500/15 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs'
                  : currentStep > s.step
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-white/[0.02] border-transparent text-slate-400'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* STEP 1: UPLOAD FILE */}
        {currentStep === 1 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-200">
            {/* Friendly guidance note */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/30 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">Full Menu Detail Coverage:</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Only <strong>Item Name</strong> and <strong>Selling Price</strong> are mandatory. Everything else (Ingredients, Calories, Nutrition, Dietary Tags, Allergens, Sizing, Flavors, Origin) is completely optional. Any column you leave empty will remain blank so you can edit and formulate it later!
                </p>
              </div>
            </div>

            {/* Drag & drop upload box */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0])
                }
              }}
              className={`p-8 sm:p-10 rounded-3xl border-2 border-dashed text-center transition-all cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                  : 'border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/50 bg-slate-50/50 dark:bg-slate-900/40'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0])
                  }
                }}
              />

              <div className="w-14 h-14 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <UploadCloud className="w-7 h-7" />
              </div>

              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                Click to browse or drag & drop spreadsheet
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv).
              </p>
            </div>

            {/* Template download card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Download Full Template (.xlsx)
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    Includes all 24 fields with sample drinks, specialty brews, pastries, paninis, and retail beans.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadSample}
                className="gap-1.5 text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer h-8 rounded-xl shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get Sample File</span>
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: MAP COLUMNS */}
        {currentStep === 2 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-200">
            {/* Sheet info & switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2 text-xs">
                <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-slate-700 dark:text-slate-200">{fileName}</span>
                <span className="text-[10px] text-slate-400">({rawSheetData.length} rows loaded)</span>
              </div>

              {availableSheets.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Sheet:</span>
                  <select
                    value={selectedSheet}
                    onChange={(e) => {
                      if (rawWorkbook) processWorkbook(rawWorkbook, e.target.value)
                    }}
                    className="h-7 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                  >
                    {availableSheets.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Section tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-white/10 pb-2 overflow-x-auto">
              {[
                { id: 'all', label: 'All Fields (24)' },
                { id: 'core', label: 'Core & Classification' },
                { id: 'nutrition', label: 'Dietary & Nutrition' },
                { id: 'customizations', label: 'Customizations & Sensory' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMappingSection(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeMappingSection === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mapping container */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {/* SECTION A: CORE ESSENTIALS */}
              {(activeMappingSection === 'all' || activeMappingSection === 'core') && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span>Core Details & Classification</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Item Name */}
                    <div className="p-2.5 rounded-xl border border-blue-500/40 bg-blue-500/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-blue-700 dark:text-blue-300">Item Title *</label>
                        <span className="text-[9px] font-bold text-rose-500 uppercase">Required</span>
                      </div>
                      <select
                        value={mapping.name}
                        onChange={(e) => setMapping((prev) => ({ ...prev, name: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-blue-500/40"
                      >
                        <option value="">-- Select Column --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Selling Price */}
                    <div className="p-2.5 rounded-xl border border-blue-500/40 bg-blue-500/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black text-blue-700 dark:text-blue-300">Selling Price ($) *</label>
                        <span className="text-[9px] font-bold text-rose-500 uppercase">Required</span>
                      </div>
                      <select
                        value={mapping.price}
                        onChange={(e) => setMapping((prev) => ({ ...prev, price: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-blue-500/40"
                      >
                        <option value="">-- Select Column --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Category */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Category</label>
                      <select
                        value={mapping.category}
                        onChange={(e) => setMapping((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Auto 'General' --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Description */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Description / Note</label>
                      <select
                        value={mapping.description}
                        onChange={(e) => setMapping((prev) => ({ ...prev, description: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Display Ingredients */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Display Ingredients</label>
                      <select
                        value={mapping.ingredients}
                        onChange={(e) => setMapping((prev) => ({ ...prev, ingredients: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Item Type */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Classification (Drink/Food/Retail)</label>
                      <select
                        value={mapping.type}
                        onChange={(e) => setMapping((prev) => ({ ...prev, type: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Auto-detect --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Subtype */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Subtype (e.g. Espresso, Bakery)</label>
                      <select
                        value={mapping.subtype}
                        onChange={(e) => setMapping((prev) => ({ ...prev, subtype: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Image URL */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Photo / Image URL</label>
                      <select
                        value={mapping.imageUrl}
                        onChange={(e) => setMapping((prev) => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* SKU / Barcode */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">SKU / Barcode</label>
                      <select
                        value={mapping.sku}
                        onChange={(e) => setMapping((prev) => ({ ...prev, sku: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Availability */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Availability / In Stock</label>
                      <select
                        value={mapping.isAvailable}
                        onChange={(e) => setMapping((prev) => ({ ...prev, isAvailable: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Default (Available) --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION B: DIETARY & NUTRITIONAL FACTS */}
              {(activeMappingSection === 'all' || activeMappingSection === 'nutrition') && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>Dietary, Allergens & Nutritional Breakdown</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Dietary Tags */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Dietary Tags (Vegan, etc.)</label>
                      <select
                        value={mapping.dietaryTags}
                        onChange={(e) => setMapping((prev) => ({ ...prev, dietaryTags: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Allergens */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Allergens (Dairy, Nuts)</label>
                      <select
                        value={mapping.allergens}
                        onChange={(e) => setMapping((prev) => ({ ...prev, allergens: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Calories */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Calories (kcal)</label>
                      <select
                        value={mapping.calories}
                        onChange={(e) => setMapping((prev) => ({ ...prev, calories: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Prep Time */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Prep Time (mins)</label>
                      <select
                        value={mapping.prepTime}
                        onChange={(e) => setMapping((prev) => ({ ...prev, prepTime: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Protein */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Protein (g)</label>
                      <select
                        value={mapping.proteinG}
                        onChange={(e) => setMapping((prev) => ({ ...prev, proteinG: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Carbs */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Carbs (g)</label>
                      <select
                        value={mapping.carbsG}
                        onChange={(e) => setMapping((prev) => ({ ...prev, carbsG: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Fat */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Total Fat (g)</label>
                      <select
                        value={mapping.fatG}
                        onChange={(e) => setMapping((prev) => ({ ...prev, fatG: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Sugar & Sodium */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Sugar (g) / Sodium (mg)</label>
                      <select
                        value={mapping.sugarG || mapping.sodiumMg}
                        onChange={(e) => setMapping((prev) => ({ ...prev, sugarG: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION C: CUSTOMIZATIONS, SENSORY & SIZES */}
              {(activeMappingSection === 'all' || activeMappingSection === 'customizations') && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-200">
                    <Compass className="w-4 h-4 text-purple-500" />
                    <span>Customization Matrix, Sizing & Sensory Notes</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {/* Sizes / Portions */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Sizes / Portions (e.g. S:0, M:1)</label>
                      <select
                        value={mapping.sizes}
                        onChange={(e) => setMapping((prev) => ({ ...prev, sizes: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Standard Size --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Temperature Styles */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Temperature Styles (hot, iced)</label>
                      <select
                        value={mapping.temperatureOptions}
                        onChange={(e) => setMapping((prev) => ({ ...prev, temperatureOptions: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Default (Hot & Iced) --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Sweetness Levels */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Sweetness Levels (0%, 50%, 100%)</label>
                      <select
                        value={mapping.sweetnessLevels}
                        onChange={(e) => setMapping((prev) => ({ ...prev, sweetnessLevels: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Standard Sweetness --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Ice Levels */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Ice Levels (No Ice, Regular)</label>
                      <select
                        value={mapping.iceLevels}
                        onChange={(e) => setMapping((prev) => ({ ...prev, iceLevels: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Standard Ice Levels --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Caffeine */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Caffeine (regular/decaf)</label>
                      <select
                        value={mapping.caffeineType}
                        onChange={(e) => setMapping((prev) => ({ ...prev, caffeineType: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Regular --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Taste Profile */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Taste Profile (Sweet, Fruity)</label>
                      <select
                        value={mapping.tasteProfile}
                        onChange={(e) => setMapping((prev) => ({ ...prev, tasteProfile: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Origin Note */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Origin Note</label>
                      <select
                        value={mapping.originNote}
                        onChange={(e) => setMapping((prev) => ({ ...prev, originNote: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>

                    {/* Storage Note */}
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Storage Note</label>
                      <select
                        value={mapping.storageNote}
                        onChange={(e) => setMapping((prev) => ({ ...prev, storageNote: e.target.value }))}
                        className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                      >
                        <option value="">-- Leave Empty --</option>
                        {sheetHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Extra Import Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Assign to Digital Menu Channel:
                </label>
                <select
                  value={targetMenuId}
                  onChange={(e) => setTargetMenuId(e.target.value)}
                  className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200"
                >
                  <option value="all">All / In-House Master Menu</option>
                  {menus.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  If Item Already Exists:
                </label>
                <select
                  value={duplicateMode}
                  onChange={(e: any) => setDuplicateMode(e.target.value)}
                  className="w-full h-8 px-2 text-xs font-medium rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200"
                >
                  <option value="overwrite">Update price & info (Overwrite)</option>
                  <option value="skip">Skip duplicates (Keep current item)</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep(1)}
                className="gap-1.5 text-xs font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </Button>
              <Button
                type="button"
                disabled={!mapping.name || !mapping.price}
                onClick={() => setCurrentStep(3)}
                className="gap-1.5 text-xs font-bold liquid-btn-primary"
              >
                <span>Continue to Preview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: PREVIEW & VALIDATE */}
        {currentStep === 3 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-200">
            {/* Status overview cards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Items</span>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">{parsedRows.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Ready / Valid</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">{validCount}</p>
              </div>
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Invalid Rows</span>
                <p className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">{invalidCount}</p>
              </div>
            </div>

            {/* Search and filter toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter preview items..."
                  className="h-8 pl-8 text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-1.5 self-end">
                {(['all', 'valid', 'invalid'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPreviewFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      previewFilter === f
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'valid' ? 'Valid' : 'Errors'}
                  </button>
                ))}
              </div>
            </div>

            {/* Comprehensive Preview table */}
            <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden max-h-[340px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-white/10 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Item Details</th>
                    <th className="py-2.5 px-3">Category & Subtype</th>
                    <th className="py-2.5 px-3">Price & Sizing</th>
                    <th className="py-2.5 px-3">Dietary & Nutrition</th>
                    <th className="py-2.5 px-3">Customizations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredPreviewRows.slice(0, 100).map((r) => (
                    <tr key={r.index} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      {/* Status */}
                      <td className="py-2.5 px-3 align-top">
                        {r.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                            <Check className="w-3 h-3" /> Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md" title={r.errorReason}>
                            <AlertCircle className="w-3 h-3" /> {r.errorReason}
                          </span>
                        )}
                      </td>

                      {/* Item Details */}
                      <td className="py-2.5 px-3 align-top max-w-[200px]">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">{r.name || '—'}</span>
                        {r.description && <p className="text-[11px] text-slate-400 truncate mt-0.5">{r.description}</p>}
                        {r.ingredients && (
                          <p className="text-[10px] text-slate-500 italic truncate mt-0.5">
                            Ingredients: {r.ingredients}
                          </p>
                        )}
                        {r.sku && <span className="text-[9px] font-mono text-slate-400">SKU: {r.sku}</span>}
                      </td>

                      {/* Category & Subtype */}
                      <td className="py-2.5 px-3 align-top">
                        <span className="text-slate-700 dark:text-slate-300 font-semibold block">{r.category}</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="uppercase text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            {r.type}
                          </span>
                          {r.subtype && (
                            <span className="text-[9px] font-medium text-blue-600 dark:text-blue-400">
                              • {r.subtype}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Price & Sizing */}
                      <td className="py-2.5 px-3 align-top">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm block">
                          ${r.price.toFixed(2)}
                        </span>
                        {r.sizes ? (
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono truncate block max-w-[120px]" title={r.sizes}>
                            {r.sizes}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Standard</span>
                        )}
                      </td>

                      {/* Dietary & Nutrition */}
                      <td className="py-2.5 px-3 align-top max-w-[180px]">
                        {r.calories !== undefined && (
                          <span className="inline-block text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded mr-1">
                            {r.calories} kcal
                          </span>
                        )}
                        {r.dietaryTags.length > 0 && (
                          <span className="inline-block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded mr-1">
                            {r.dietaryTags.join(', ')}
                          </span>
                        )}
                        {r.allergens.length > 0 && (
                          <span className="inline-block text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded mr-1">
                            Allergens: {r.allergens.join(', ')}
                          </span>
                        )}
                        {r.proteinG !== undefined && (
                          <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                            P: {r.proteinG}g • C: {r.carbsG || 0}g • F: {r.fatG || 0}g
                          </span>
                        )}
                      </td>

                      {/* Customizations */}
                      <td className="py-2.5 px-3 align-top text-[11px] text-slate-500 max-w-[160px]">
                        {r.originNote && <span className="block truncate text-[10px] text-slate-400" title={r.originNote}>📍 {r.originNote}</span>}
                        {r.temperatureOptions && r.temperatureOptions.length > 0 && (
                          <span className="text-[10px] text-blue-500 block truncate">🌡️ {r.temperatureOptions.join(', ')}</span>
                        )}
                        {r.tasteProfile && r.tasteProfile.length > 0 && (
                          <span className="text-[10px] text-purple-500 block truncate">✨ {r.tasteProfile.join(', ')}</span>
                        )}
                        {!r.originNote && !r.temperatureOptions && !r.tasteProfile && (
                          <span className="text-slate-400 text-[10px] italic">Standard</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCurrentStep(2)}
                className="gap-1.5 text-xs font-bold"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Mapping</span>
              </Button>
              <Button
                type="button"
                disabled={validCount === 0 || isSubmitting}
                onClick={handleExecuteImport}
                className="gap-1.5 text-xs font-bold liquid-btn-primary"
              >
                {isSubmitting ? (
                  <span>Importing {validCount} items...</span>
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4" />
                    <span>Import {validCount} Items to Menu</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: COMPLETE */}
        {currentStep === 4 && importResult && (
          <div className="space-y-5 py-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Menu Imported Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                All item details (nutrition facts, allergens, dietary lifestyle tags, sizing variants, and descriptions) have been registered in your digital catalog, POS register, and QR menus!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Created</span>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {importResult.createdCount}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Updated</span>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
                  {importResult.updatedCount}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Skipped</span>
                <p className="text-lg font-black text-slate-600 dark:text-slate-300 font-mono">
                  {importResult.skippedCount}
                </p>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="max-w-lg mx-auto p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left text-xs space-y-1 text-amber-700 dark:text-amber-300">
                <span className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Notes / Warnings ({importResult.errors.length}):
                </span>
                <div className="max-h-24 overflow-y-auto space-y-0.5 text-[11px]">
                  {importResult.errors.map((e, idx) => <p key={idx}>{e}</p>)}
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="gap-1.5 text-xs font-bold h-9 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Import Another File</span>
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onImportComplete()
                  handleReset()
                  onClose()
                }}
                className="gap-1.5 text-xs font-bold liquid-btn-primary h-9 rounded-xl px-5"
              >
                <span>Done & View Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
