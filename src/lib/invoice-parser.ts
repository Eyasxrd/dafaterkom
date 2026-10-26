/**
 * Invoice Parser & Smart Extractor
 * Supports Arabic & English invoices, receipts, and bills
 */

export interface ParsedInvoiceItem {
  id: string
  rawName: string
  itemName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  matchedIngredientId?: string | null
  matchedMenuItemId?: string | null
  matchType?: 'ingredient' | 'menu_item' | 'new'
  matchConfidence?: number
}

export interface ParsedInvoiceResult {
  supplierName?: string
  taxNumber?: string
  invoiceNumber?: string
  issueDate?: string
  dueDate?: string
  subtotal: number
  tax: number
  totalAmount: number
  currency: string
  items: ParsedInvoiceItem[]
  rawText: string
  confidence: number
}

/**
 * Normalizes Arabic-Indic digits (٠-٩) and Persian digits to standard ASCII digits (0-9)
 * and normalizes Arabic comma/decimal separators
 */
export function normalizeArabicNumbers(text: string): string {
  if (!text) return ''
  // Strip invisible LTR, RTL, and zero-width markers
  const clean = text.replace(/[\u200B-\u200D\uFEFF\u200E\u200F\u202A-\u202E]/g, '')
  
  const arabicIndicDigits: Record<string, string> = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
    '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
    '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
    '٫': '.', '،': ','
  }

  return clean.replace(/[٠-٩۰-۹٫،]/g, (char) => arabicIndicDigits[char] || char)
}

/**
 * Unit mapping dictionary (Arabic & English to standard system units)
 */
const UNIT_MAPPINGS: Record<string, string> = {
  // Kilogram
  'kg': 'kg',
  'kgs': 'kg',
  'kilo': 'kg',
  'kilos': 'kg',
  'كيلو': 'kg',
  'كجم': 'kg',
  'كغ': 'kg',
  'كيلوجرام': 'kg',

  // Gram
  'g': 'grams',
  'gm': 'grams',
  'gram': 'grams',
  'grams': 'grams',
  'جرام': 'grams',
  'غ': 'grams',
  'غم': 'grams',

  // Liter
  'l': 'liters',
  'liter': 'liters',
  'liters': 'liters',
  'ltr': 'liters',
  'لتر': 'liters',
  'ليتر': 'liters',

  // Milliliter
  'ml': 'ml',
  'مل': 'ml',
  'ملل': 'ml',

  // Pieces / Units
  'pcs': 'pieces',
  'piece': 'pieces',
  'pieces': 'pieces',
  'unit': 'pieces',
  'units': 'pieces',
  'item': 'pieces',
  'items': 'pieces',
  'حبة': 'pieces',
  'حبات': 'pieces',
  'قطعة': 'pieces',
  'قطع': 'pieces',
  'عدد': 'pieces',

  // Box / Carton / Pack
  'box': 'box',
  'boxes': 'box',
  'carton': 'box',
  'ctn': 'box',
  'كرتون': 'box',
  'صندوق': 'box',
  'pack': 'pack',
  'packet': 'pack',
  'pkg': 'pack',
  'باكيت': 'pack',
  'علبة': 'pack',
  'علب': 'pack',
  'ربطة': 'pack'
}

/**
 * Normalizes extracted unit string into known unit enum
 */
export function normalizeUnit(rawUnit?: string): string {
  if (!rawUnit) return 'pieces'
  const cleaned = rawUnit.trim().toLowerCase()
  return UNIT_MAPPINGS[cleaned] || 'pieces'
}

/**
 * Extract Date from text
 */
function extractDate(text: string): string | undefined {
  const norm = normalizeArabicNumbers(text)

  // Patterns: YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY
  const datePatterns = [
    /\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/, // YYYY-MM-DD
    /\b(0?[1-9]|[12]\d|3[01])[-/.](0?[1-9]|1[0-2])[-/.](20\d{2})\b/  // DD-MM-YYYY
  ]

  for (const pattern of datePatterns) {
    const match = norm.match(pattern)
    if (match) {
      if (match[1].length === 4) {
        // YYYY-MM-DD
        const y = match[1]
        const m = match[2].padStart(2, '0')
        const d = match[3].padStart(2, '0')
        return `${y}-${m}-${d}`
      } else {
        // DD-MM-YYYY
        const d = match[1].padStart(2, '0')
        const m = match[2].padStart(2, '0')
        const y = match[3]
        return `${y}-${m}-${d}`
      }
    }
  }

  return undefined
}

/**
 * Extract Invoice Number from text
 */
function extractInvoiceNumber(text: string): string | undefined {
  const norm = normalizeArabicNumbers(text)
  const lines = norm.split('\n')

  const invKeywords = [
    /(?:invoice\s*(?:no|number|#|id)?|inv\s*(?:no|#)?|bill\s*(?:no|#)?|فاتورة\s*رقم|رقم\s*الفاتورة|سند\s*رقم|رقم\s*السند)\s*[:#\-]?\s*([a-zA-Z0-9\-_/]+)/i,
    /#\s*([0-9]{3,})/
  ]

  for (const line of lines) {
    for (const kw of invKeywords) {
      const match = line.match(kw)
      if (match && match[1] && match[1].length >= 2 && !/^(date|total|tax|vat|تاريخ|مجموع)$/i.test(match[1])) {
        return match[1].trim()
      }
    }
  }

  return undefined
}

/**
 * Extract Tax ID / VAT Number
 */
function extractTaxNumber(text: string): string | undefined {
  const norm = normalizeArabicNumbers(text)
  const vatMatch = norm.match(/(?:vat\s*(?:no|id|#)?|tax\s*id|الرقم\s*الضريبي|رقم\s*التسجيل\s*الضريبي)\s*[:#\-]?\s*([0-9]{9,15})/i)
  if (vatMatch && vatMatch[1]) {
    return vatMatch[1].trim()
  }

  // Look for 15-digit numbers (common in GCC / ZATCA VAT)
  const fifteenDigits = norm.match(/\b(3\d{14})\b/)
  if (fifteenDigits) {
    return fifteenDigits[1]
  }

  return undefined
}

/**
 * Extract Financial Totals (Subtotal, Tax, Total)
 */
function extractTotals(text: string): { subtotal?: number; tax?: number; total?: number } {
  const norm = normalizeArabicNumbers(text)
  const lines = norm.split('\n')

  let subtotal: number | undefined
  let tax: number | undefined
  let total: number | undefined

  for (const line of lines) {
    const l = line.toLowerCase()
    
    // Find all positive numbers in this line
    const nums: number[] = []
    const m = line.match(/\d+(?:\.\d{1,2})?/g)
    if (m) {
      m.forEach(n => {
        const val = parseFloat(n)
        if (!isNaN(val)) nums.push(val)
      })
    }
    const lastNum = nums.length > 0 ? nums[nums.length - 1] : undefined

    // 1. Total (Grand total / net total / المبلغ الاجمالي / الاجمالي)
    if (total === undefined && lastNum !== undefined) {
      if (
        (l.includes('grand total') || l.includes('total amount') || l.includes('net total') || l.includes('الإجمالي') || l.includes('الاجمالي') || l.includes('المبلغ الإجمالي') || l.includes('المجموع الكلي')) ||
        (l.includes('total') && !l.includes('subtotal') && !l.includes('sub-total'))
      ) {
        total = lastNum
      }
    }

    // 2. Subtotal
    if (subtotal === undefined && lastNum !== undefined) {
      if (l.includes('subtotal') || l.includes('sub total') || l.includes('sub-total') || l.includes('المجموع الفرعي') || l.includes('قبل الضريبة')) {
        subtotal = lastNum
      }
    }

    // 3. Tax / VAT
    if (tax === undefined && lastNum !== undefined) {
      if (
        (l.includes('vat') || l.includes('tax') || l.includes('ضريبة') || l.includes('الضريبة') || l.includes('القيمة المضافة')) &&
        !l.includes('tax id') && !l.includes('tax number') && !l.includes('الرقم الضريبي') && !l.includes('tax invoice') && !l.includes('فاتورة ضريبية')
      ) {
        // If the line says VAT (15%), make sure we take the amount ($43.50), not the rate 15
        if (nums.length > 1) {
          tax = nums[nums.length - 1]
        } else {
          tax = lastNum
        }
      }
    }
  }

  return { subtotal, tax, total }
}

/**
 * Parse line items from OCR text using multi-column and line patterns
 */
function extractLineItems(text: string): ParsedInvoiceItem[] {
  const norm = normalizeArabicNumbers(text)
  const lines = norm.split('\n').map(l => l.trim()).filter(Boolean)
  const items: ParsedInvoiceItem[] = []

  // Skip lines that are metadata, headers, footers, or totals
  const skipKeywords = [
    /invoice\s*(?:no|#|number)/i,
    /inv[-_\s:]/i,
    /bill\s*(?:no|#)/i,
    /tax\s*id/i,
    /vat\s*(?:id|no|#)/i,
    /الرقم\s*الضريبي/i,
    /due\s*date/i,
    /issue\s*date/i,
    /date\s*[:/]/i,
    /التاريخ/i,
    /الاستحقاق/i,
    /phone|tel|mobile|هاتف|جوال/i,
    /subtotal|sub\s*total|المجموع\s*الفرعي|قبل\s*الضريبة/i,
    /grand\s*total|total\s*amount|المبلغ\s*الإجمالي|المجموع\s*الكلي/i,
    /vat\s*\(\d+%\)/i,
    /terms|payment\s*due|thank\s*you|نرجو\s*السداد|شروط/i,
    /#\s*item|description|qty|unit\s*price|الصنف|الوصف|الكمية|الوحدة|السعر|الإجمالي\s*\//i
  ]

  const unitRegex = /\b(kg|kgs|kilo|kilos|كيلو|كجم|كغ|g|gm|gram|grams|جرام|غم|l|liter|liters|لتر|ليتر|ml|مل|pcs|piece|pieces|حبة|قطعة|قطع|box|boxes|can|cans|علبة|علب|كرتون|pack|باكيت)\b/i

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]

    if (skipKeywords.some(kw => kw.test(rawLine))) {
      continue
    }

    // Strip leading row counter (e.g. "1 ", "1. ", "02 - ")
    let line = rawLine.replace(/^\s*\d{1,3}[\s.\-_)]+/, '').trim()
    if (!line || line.length < 3) continue

    // Extract all numbers and floats
    const numbersWithPos: { val: number; text: string; index: number; endIndex: number }[] = []
    const numRegex = /\b\d+(?:\.\d+)?\b/g
    let match: RegExpExecArray | null

    while ((match = numRegex.exec(line)) !== null) {
      numbersWithPos.push({
        val: parseFloat(match[0]),
        text: match[0],
        index: match.index,
        endIndex: match.index + match[0].length
      })
    }

    // We need at least 2 numeric tokens for quantity & price
    if (numbersWithPos.length >= 2) {
      let qty = 1
      let unitPrice = 0
      let totalPrice = 0
      let numStartIndex = line.length

      if (numbersWithPos.length >= 3) {
        // Last 3 numbers: Qty, UnitPrice, TotalPrice
        const n1 = numbersWithPos[numbersWithPos.length - 3]
        const n2 = numbersWithPos[numbersWithPos.length - 2]
        const n3 = numbersWithPos[numbersWithPos.length - 1]

        qty = n1.val
        unitPrice = n2.val
        totalPrice = n3.val
        numStartIndex = n1.index
      } else if (numbersWithPos.length === 2) {
        const n1 = numbersWithPos[0]
        const n2 = numbersWithPos[1]
        qty = n1.val
        unitPrice = n2.val
        totalPrice = Math.round(qty * unitPrice * 100) / 100
        numStartIndex = n1.index
      }

      let itemNamePart = line.substring(0, numStartIndex).trim()

      // Detect unit if embedded in item or between numbers
      let unit = 'pieces'
      const unitMatch = line.match(unitRegex)
      if (unitMatch) {
        unit = normalizeUnit(unitMatch[1])
        // Clean unit from itemNamePart if it was at the end
        itemNamePart = itemNamePart.replace(new RegExp(`\\s*${unitMatch[0]}\\s*$`, 'i'), '').trim()
      }

      // Strip trailing punctuation or slashes from name
      itemNamePart = itemNamePart.replace(/[\s\-_/:]+$/, '').trim()

      if (itemNamePart.length >= 2 && qty > 0 && (unitPrice > 0 || totalPrice > 0)) {
        if (unitPrice === 0 && qty > 0 && totalPrice > 0) {
          unitPrice = Math.round((totalPrice / qty) * 100) / 100
        }
        if (totalPrice === 0 && qty > 0 && unitPrice > 0) {
          totalPrice = Math.round(qty * unitPrice * 100) / 100
        }

        // Sanity check: unit price shouldn't be crazy (e.g. date year 2025 as price) unless totalPrice matches
        if (unitPrice > 0 && totalPrice > 0) {
          items.push({
            id: `item_${Date.now()}_${items.length}`,
            rawName: itemNamePart,
            itemName: itemNamePart,
            quantity: qty,
            unit,
            unitPrice,
            totalPrice,
            matchType: 'new'
          })
        }
      }
    }
  }

  return items
}

/**
 * Calculates string similarity score between 0 and 1
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0
  const s1 = str1.trim().toLowerCase()
  const s2 = str2.trim().toLowerCase()

  if (s1 === s2) return 1
  if (s1.includes(s2) || s2.includes(s1)) return 0.85

  // Token overlap similarity (Jaccard)
  const tokens1 = new Set(s1.split(/[\s,.\-_/]+/).filter(t => t.length > 1))
  const tokens2 = new Set(s2.split(/[\s,.\-_/]+/).filter(t => t.length > 1))

  if (tokens1.size === 0 || tokens2.size === 0) return 0

  let intersection = 0
  for (const t of tokens1) {
    if (tokens2.has(t)) intersection++
  }

  const union = new Set([...tokens1, ...tokens2]).size
  return union > 0 ? intersection / union : 0
}

/**
 * Match extracted items against existing tenant ingredients & menu items
 */
export function matchItemsWithInventory(
  items: ParsedInvoiceItem[],
  ingredients: Array<{ id: string; name: string; unit: string; costPerUnit?: number }>,
  menuItems: Array<{ id: string; name: string; price: number; inventory?: { unit: string } | null }>
): ParsedInvoiceItem[] {
  return items.map((item) => {
    let bestMatchId: string | null = null
    let bestMatchType: 'ingredient' | 'menu_item' | 'new' = 'new'
    let bestScore = 0
    let matchedUnit = item.unit
    let matchedPrice = item.unitPrice

    // 1. Check ingredients (Raw Materials)
    for (const ing of ingredients) {
      const score = calculateSimilarity(item.itemName, ing.name)
      if (score > bestScore && score >= 0.4) {
        bestScore = score
        bestMatchId = ing.id
        bestMatchType = 'ingredient'
        matchedUnit = ing.unit || item.unit
        if (ing.costPerUnit && ing.costPerUnit > 0 && item.unitPrice === 0) {
          matchedPrice = ing.costPerUnit
        }
      }
    }

    // 2. Check menu items (Finished goods)
    for (const m of menuItems) {
      const score = calculateSimilarity(item.itemName, m.name)
      if (score > bestScore && score >= 0.4) {
        bestScore = score
        bestMatchId = m.id
        bestMatchType = 'menu_item'
        if (m.inventory?.unit) matchedUnit = m.inventory.unit
      }
    }

    return {
      ...item,
      unit: matchedUnit,
      unitPrice: matchedPrice > 0 ? matchedPrice : item.unitPrice,
      totalPrice: item.quantity * (matchedPrice > 0 ? matchedPrice : item.unitPrice),
      matchedIngredientId: bestMatchType === 'ingredient' ? bestMatchId : null,
      matchedMenuItemId: bestMatchType === 'menu_item' ? bestMatchId : null,
      matchType: bestMatchType,
      matchConfidence: Math.round(bestScore * 100)
    }
  })
}

/**
 * Main parser entry point from raw OCR text
 */
export function parseInvoiceFromOCRText(
  rawText: string,
  existingSuppliers: Array<{ id: string; name: string; phone?: string | null }> = []
): ParsedInvoiceResult {
  const normText = normalizeArabicNumbers(rawText)

  // 1. Header Information
  const invoiceNumber = extractInvoiceNumber(normText) || `PUR-${Date.now().toString().slice(-6)}`
  const issueDate = extractDate(normText) || new Date().toISOString().split('T')[0]
  const taxNumber = extractTaxNumber(normText)

  // 2. Financial totals
  const totals = extractTotals(normText)

  // 3. Line Items
  const items = extractLineItems(normText)

  // If items have totals but invoice total is missing, calculate
  let calculatedSubtotal = items.reduce((sum, it) => sum + it.totalPrice, 0)
  const finalSubtotal = totals.subtotal ?? (calculatedSubtotal > 0 ? calculatedSubtotal : (totals.total ?? 0))
  const finalTax = totals.tax ?? 0
  const finalTotal = totals.total ?? (finalSubtotal + finalTax)

  // 4. Match Supplier name
  let detectedSupplierName: string | undefined
  const lines = normText.split('\n').map(l => l.trim()).filter(Boolean)

  for (const supplier of existingSuppliers) {
    if (lines.some(l => calculateSimilarity(l, supplier.name) >= 0.6)) {
      detectedSupplierName = supplier.name
      break
    }
  }

  // If no existing supplier matched, take the first non-generic top line as supplier candidate
  if (!detectedSupplierName && lines.length > 0) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      let candidate = lines[i].replace(/^[\d\s.\-_#:]+/, '').trim()
      // Strip trailing "TAX INVOICE", "فاتورة ضريبية", etc.
      candidate = candidate.replace(/\s*(?:tax\s*invoice|فاتورة\s*ضريبية|فاتورة|invoice|bill)[\s/]*.*$/i, '').trim()
      if (
        candidate.length > 2 &&
        !/^(invoice|bill|tax|vat|فاتورة|سند|ضريبة|تاريخ|date|cash|receipt)/i.test(candidate) &&
        !/\d{4}/.test(candidate)
      ) {
        detectedSupplierName = candidate
        break
      }
    }
  }

  return {
    supplierName: detectedSupplierName,
    taxNumber,
    invoiceNumber,
    issueDate,
    subtotal: Math.round(finalSubtotal * 100) / 100,
    tax: Math.round(finalTax * 100) / 100,
    totalAmount: Math.round(finalTotal * 100) / 100,
    currency: 'USD',
    items,
    rawText,
    confidence: items.length > 0 ? 85 : 50
  }
}
