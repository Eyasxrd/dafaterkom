export interface CurrencyDefinition {
  code: string
  symbolEn: string
  symbolAr: string
  nameEn: string
  nameAr: string
  flag: string
  decimals: number
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyDefinition> = {
  EGP: {
    code: 'EGP',
    symbolEn: 'EGP ',
    symbolAr: 'ج.م ',
    nameEn: 'Egyptian Pound',
    nameAr: 'جنيه مصري',
    flag: '🇪🇬',
    decimals: 2
  },
  SAR: {
    code: 'SAR',
    symbolEn: 'SAR ',
    symbolAr: 'ر.س ',
    nameEn: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
    flag: '🇸🇦',
    decimals: 2
  },
  AED: {
    code: 'AED',
    symbolEn: 'AED ',
    symbolAr: 'د.إ ',
    nameEn: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
    flag: '🇦🇪',
    decimals: 2
  },
  USD: {
    code: 'USD',
    symbolEn: '$',
    symbolAr: '$',
    nameEn: 'US Dollar',
    nameAr: 'دولار أمريكي',
    flag: '🇺🇸',
    decimals: 2
  },
  EUR: {
    code: 'EUR',
    symbolEn: '€',
    symbolAr: '€',
    nameEn: 'Euro',
    nameAr: 'يورو',
    flag: '🇪🇺',
    decimals: 2
  },
  GBP: {
    code: 'GBP',
    symbolEn: '£',
    symbolAr: '£',
    nameEn: 'British Pound',
    nameAr: 'جنيه إسترليني',
    flag: '🇬🇧',
    decimals: 2
  },
  KWD: {
    code: 'KWD',
    symbolEn: 'KWD ',
    symbolAr: 'د.ك ',
    nameEn: 'Kuwaiti Dinar',
    nameAr: 'دينار كويتي',
    flag: '🇰🇼',
    decimals: 3
  },
  QAR: {
    code: 'QAR',
    symbolEn: 'QAR ',
    symbolAr: 'ر.ق ',
    nameEn: 'Qatari Riyal',
    nameAr: 'ريال قطري',
    flag: '🇶🇦',
    decimals: 2
  },
  BHD: {
    code: 'BHD',
    symbolEn: 'BHD ',
    symbolAr: 'د.ب ',
    nameEn: 'Bahraini Dinar',
    nameAr: 'دينار بحريني',
    flag: '🇧🇭',
    decimals: 3
  },
  OMR: {
    code: 'OMR',
    symbolEn: 'OMR ',
    symbolAr: 'ر.ع ',
    nameEn: 'Omani Rial',
    nameAr: 'ريال عماني',
    flag: '🇴🇲',
    decimals: 3
  },
  JOD: {
    code: 'JOD',
    symbolEn: 'JOD ',
    symbolAr: 'د.أ ',
    nameEn: 'Jordanian Dinar',
    nameAr: 'دينار أردني',
    flag: '🇯🇴',
    decimals: 3
  }
}

export const CURRENCY_LIST: CurrencyDefinition[] = Object.values(SUPPORTED_CURRENCIES)

export function getCurrencySymbol(code?: string | null, isAr = false): string {
  if (!code) return isAr ? 'ج.م ' : 'EGP '
  const upper = code.trim().toUpperCase()
  const def = SUPPORTED_CURRENCIES[upper]
  if (def) {
    return isAr ? def.symbolAr : def.symbolEn
  }
  return `${upper} `
}

export function formatCurrency(amount: number | string | undefined | null, code?: string | null, isAr = false): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0)) || 0
  const sym = getCurrencySymbol(code, isAr)
  const upper = (code || '').trim().toUpperCase()
  const decimals = SUPPORTED_CURRENCIES[upper]?.decimals ?? 2
  const formattedNum = num.toFixed(decimals)

  if (sym === '$' || sym === '€' || sym === '£') {
    return `${sym}${formattedNum}`
  }
  return `${sym}${formattedNum}`
}

export function getCurrencyLabel(code: string, isAr = false): string {
  const upper = (code || '').trim().toUpperCase()
  const def = SUPPORTED_CURRENCIES[upper]
  if (!def) return upper
  if (isAr) {
    return `${def.flag} ${def.code} - ${def.nameAr} (${def.symbolAr.trim()})`
  }
  return `${def.flag} ${def.code} - ${def.nameEn} (${def.symbolEn.trim()})`
}
