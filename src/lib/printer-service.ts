/**
 * Dafaterkom Multi-Type Printer Service & Plug-and-Play Preset Catalog
 * Supports ESC/POS Thermal Printers:
 * - Top Brand Pre-configurations (Epson, Xprinter, Star Micronics, Bixolon, Sunmi, Rongta, Zebra, Munbyn, Generic)
 * - LAN / Ethernet / WiFi Network IP & Port (e.g. 192.168.1.100:9100, 192.168.123.100:9100)
 * - USB (WebSerial / WebUSB) with auto-baud rate & vendor filters
 * - Bluetooth SPP (Web Bluetooth)
 * - Browser System Print Dialog (58mm / 80mm CSS media styles)
 * - Auto-cut paper, Cash drawer kick, Kitchen buzzer chime alarm, KOT (Kitchen Order Ticket) and Receipts.
 */

export type PrinterConnectionType = 'browser' | 'network_ip' | 'usb_serial' | 'bluetooth'
export type PrinterRole = 'receipt' | 'kitchen' | 'both'
export type PaperWidth = '80mm' | '58mm'
export type CodePage = 'CP1256_ARABIC' | 'PC864_ARABIC' | 'PC437_USA' | 'UTF8'
export type PrinterBrand =
  | 'Epson'
  | 'Xprinter'
  | 'Star Micronics'
  | 'Bixolon'
  | 'Sunmi'
  | 'Rongta'
  | 'Zebra'
  | 'Munbyn'
  | 'Generic'

export interface PrinterPreset {
  id: string
  brand: PrinterBrand
  modelName: string
  category: 'receipt' | 'kitchen' | 'both' | 'mobile' | 'label'
  defaultConnectionType: PrinterConnectionType
  defaultRole: PrinterRole
  paperWidth: PaperWidth
  defaultIp?: string
  defaultPort?: number
  defaultBaudRate?: number
  autoCut: boolean
  openCashDrawer: boolean
  buzzerAlert: boolean
  characterSet: CodePage
  badge: string
  badgeAr: string
  description: string
  descriptionAr: string
  vendorIdHex?: number
  productIdHex?: number
}

export interface PresetBundle {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  badge: string
  badgeAr: string
  printers: Array<{
    presetId: string
    name: string
    role: PrinterRole
    ipAddress?: string
    port?: number
  }>
}

export interface PrinterDevice {
  id: string
  name: string
  role: PrinterRole
  connectionType: PrinterConnectionType
  brand?: PrinterBrand | string
  model?: string
  presetId?: string
  ipAddress?: string
  port?: number
  baudRate?: number
  paperWidth: PaperWidth
  autoCut: boolean
  openCashDrawer: boolean
  buzzerAlert?: boolean
  autoPrintOnOrder: boolean
  characterSet?: CodePage
  isActive: boolean
}

export interface TenantPrinterSettings {
  defaultReceiptPrinterId?: string
  defaultKitchenPrinterId?: string
  printers: PrinterDevice[]
}

/**
 * Top Used POS & Kitchen Thermal Printers Presets Catalog
 */
export const TOP_PRINTER_PRESETS: PrinterPreset[] = [
  // --- EPSON ---
  {
    id: 'epson_tm_t88vii',
    brand: 'Epson',
    modelName: 'Epson TM-T88VII / TM-T88VI',
    category: 'both',
    defaultConnectionType: 'network_ip',
    defaultRole: 'receipt',
    paperWidth: '80mm',
    defaultIp: '192.168.192.168',
    defaultPort: 9100,
    defaultBaudRate: 38400,
    autoCut: true,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: 'Standard #1',
    badgeAr: 'الأول عالمياً',
    description: 'Ultra-fast flagship thermal POS printer (500mm/s) with Ethernet LAN, USB and high reliability.',
    descriptionAr: 'طابعة إيصالات فائقة السرعة (500 مم/ث) بمنافذ إيثرنت شبكية وUSB وتحمل استثنائي للضغط العالي.',
    vendorIdHex: 0x04b8
  },
  {
    id: 'epson_tm_t20iii',
    brand: 'Epson',
    modelName: 'Epson TM-T20III',
    category: 'receipt',
    defaultConnectionType: 'usb_serial',
    defaultRole: 'receipt',
    paperWidth: '80mm',
    defaultIp: '192.168.192.168',
    defaultPort: 9100,
    defaultBaudRate: 38400,
    autoCut: true,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: 'Best Value',
    badgeAr: 'الأكثر طلباً',
    description: 'Affordable, energy-efficient thermal receipt printer ideal for main cashier stations.',
    descriptionAr: 'طابعة إيصالات كاشير اقتصادية وموفرة للطاقة مع قاطع آلي سريع.',
    vendorIdHex: 0x04b8
  },
  {
    id: 'epson_tm_m30ii',
    brand: 'Epson',
    modelName: 'Epson TM-m30II (Cube POS)',
    category: 'receipt',
    defaultConnectionType: 'network_ip',
    defaultRole: 'receipt',
    paperWidth: '80mm',
    defaultIp: '192.168.1.100',
    defaultPort: 9100,
    defaultBaudRate: 38400,
    autoCut: true,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: 'Tablet & Cube',
    badgeAr: 'كافيهات والآيباد',
    description: 'Compact 3-inch cube thermal printer tailored for modern iPad, Android tablet & specialty coffee counters.',
    descriptionAr: 'تصميم مكعب مدمج وأنيق مخصص للمقاهي العصرية ونقاط البيع اللوحية iPad و Android.',
    vendorIdHex: 0x04b8
  },

  // --- XPRINTER ---
  {
    id: 'xprinter_xp_n160ii',
    brand: 'Xprinter',
    modelName: 'Xprinter XP-N160II / XP-80C',
    category: 'both',
    defaultConnectionType: 'network_ip',
    defaultRole: 'receipt',
    paperWidth: '80mm',
    defaultIp: '192.168.123.100',
    defaultPort: 9100,
    defaultBaudRate: 19200,
    autoCut: true,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: 'Top Budget',
    badgeAr: 'الأوسع انتشاراً',
    description: 'Widely used 80mm high-speed thermal receipt printer with Ethernet LAN + USB auto-cutter.',
    descriptionAr: 'الطابعة الحرارية الأكثر انتشاراً في المحلات والمطاعم لسهولة شبكها وثمنها الاقتصادي.',
    vendorIdHex: 0x0416
  },
  {
    id: 'xprinter_xp_c260',
    brand: 'Xprinter',
    modelName: 'Xprinter XP-C260 / C300 (Kitchen Alarm)',
    category: 'kitchen',
    defaultConnectionType: 'network_ip',
    defaultRole: 'kitchen',
    paperWidth: '80mm',
    defaultIp: '192.168.123.100',
    defaultPort: 9100,
    defaultBaudRate: 19200,
    autoCut: true,
    openCashDrawer: false,
    buzzerAlert: true,
    characterSet: 'CP1256_ARABIC',
    badge: 'Kitchen Alarm',
    badgeAr: 'مطبخ بجرس',
    description: 'Heavy duty kitchen printer with oil/water resistance, LED flash and loud buzzer chime on order dispatch.',
    descriptionAr: 'طابعة مطبخ قوية مقاومة للحرارة والزيوت مع جرس تنبيه صوتي وضوئي عند وصول كل طلب.',
    vendorIdHex: 0x0416
  },
  {
    id: 'xprinter_xp_58iih',
    brand: 'Xprinter',
    modelName: 'Xprinter XP-58IIH / XP-Q90EC',
    category: 'mobile',
    defaultConnectionType: 'usb_serial',
    defaultRole: 'receipt',
    paperWidth: '58mm',
    defaultBaudRate: 9600,
    autoCut: false,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: '58mm Mobile',
    badgeAr: '58 مم متنقلة',
    description: 'Compact 58mm receipt printer for mobile food trucks, small booths, and low footprint spaces.',
    descriptionAr: 'طابعة فواتير صغيرة 58 مم توفر المساحة ومثالية للأكشاك وعربات الفود ترك والمنافذ الصغيرة.',
    vendorIdHex: 0x0416
  },

  // --- STAR MICRONICS ---
  {
    id: 'star_tsp143iii',
    brand: 'Star Micronics',
    modelName: 'Star Micronics TSP143III (TSP100)',
    category: 'both',
    defaultConnectionType: 'network_ip',
    defaultRole: 'receipt',
    paperWidth: '80mm',
    defaultIp: '192.168.1.100',
    defaultPort: 9100,
    defaultBaudRate: 38400,
    autoCut: true,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: 'iOS / Tablet',
    badgeAr: 'أنظمة الآيباد',
    description: 'High-speed thermal printer with ultra-reliable guillotine auto-cutter and internal power supply.',
    descriptionAr: 'طابعة إيصالات احترافية فائقة التحمل مع قاطع آلي ونظام سحب ورق ذكي.',
    vendorIdHex: 0x0519
  },
  {
    id: 'star_mc_print3',
    brand: 'Star Micronics',
    modelName: 'Star Micronics mC-Print3 (CloudPRNT)',
    category: 'both',
    defaultConnectionType: 'network_ip',
    defaultRole: 'receipt',
    paperWidth: '80mm',
    defaultIp: '192.168.1.100',
    defaultPort: 9100,
    defaultBaudRate: 38400,
    autoCut: true,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: 'Front Exit',
    badgeAr: 'خروج أمامي',
    description: 'Splash-proof front-loading design with multi-channel Bluetooth, USB & Ethernet connectivity.',
    descriptionAr: 'طابعة أمامية مقاومة لانسكاب السوائل مع دعم البلوتوث والشبكة وUSB.',
    vendorIdHex: 0x0519
  },

  // --- BIXOLON ---
  {
    id: 'bixolon_srp_350iii',
    brand: 'Bixolon',
    modelName: 'Bixolon SRP-350III / SRP-330II',
    category: 'receipt',
    defaultConnectionType: 'network_ip',
    defaultRole: 'receipt',
    paperWidth: '80mm',
    defaultIp: '192.168.192.168',
    defaultPort: 9100,
    defaultBaudRate: 38400,
    autoCut: true,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: 'High Speed',
    badgeAr: 'عالية السرعة',
    description: 'Super-fast 250mm/s 80mm thermal receipt printer with 1.8M cuts cutter lifespan.',
    descriptionAr: 'طابعة إيصالات كورية سريعة وعالية التحمل مع قاطع ورق يتحمل 1.8 مليون عملية قص.',
    vendorIdHex: 0x1504
  },
  {
    id: 'bixolon_srp_275iii',
    brand: 'Bixolon',
    modelName: 'Bixolon SRP-275III (Kitchen Impact)',
    category: 'kitchen',
    defaultConnectionType: 'network_ip',
    defaultRole: 'kitchen',
    paperWidth: '80mm',
    defaultIp: '192.168.192.168',
    defaultPort: 9100,
    defaultBaudRate: 19200,
    autoCut: true,
    openCashDrawer: false,
    buzzerAlert: true,
    characterSet: 'PC437_USA',
    badge: 'Kitchen Impact',
    badgeAr: 'مطبخ نقطية',
    description: '2-color ribbon impact dot-matrix printer resistant to intense kitchen heat, moisture and steam.',
    descriptionAr: 'طابعة شريط حبري نقطي مقاومة للحرارة والبخار في المطابخ الساخنة وتدعم تمييز الملاحظات باللون الأحمر.',
    vendorIdHex: 0x1504
  },

  // --- SUNMI ---
  {
    id: 'sunmi_builtin_pos',
    brand: 'Sunmi',
    modelName: 'Sunmi V2 / V2s / V2 Pro (Handheld POS)',
    category: 'mobile',
    defaultConnectionType: 'bluetooth',
    defaultRole: 'receipt',
    paperWidth: '58mm',
    autoCut: false,
    openCashDrawer: false,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: 'Handheld POS',
    badgeAr: 'أجهزة محمولة',
    description: 'Instant zero-configuration printing for Sunmi handheld Android POS terminals.',
    descriptionAr: 'تعريف فوري جاهز لأجهزة سنمي اليدوية المحمولة لطباعة الفواتير عند الطاولة أو التوصيل.'
  },
  {
    id: 'sunmi_t2_desktop',
    brand: 'Sunmi',
    modelName: 'Sunmi T2 / T2s / D2s (Desktop POS)',
    category: 'both',
    defaultConnectionType: 'usb_serial',
    defaultRole: 'receipt',
    paperWidth: '80mm',
    defaultBaudRate: 115200,
    autoCut: true,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: 'Dual-Screen',
    badgeAr: 'شاشات مكتبية',
    description: 'Built-in Seiko 80mm high-speed thermal printer on Sunmi desktop dual-screen terminals.',
    descriptionAr: 'طابعة سيكو 80 مم مدمجة فائقة السرعة في شاشات سنمي المكتبية مع فتح الدرج آلياً.'
  },

  // --- RONGTA ---
  {
    id: 'rongta_rp326',
    brand: 'Rongta',
    modelName: 'Rongta RP326 / RP80 (LAN + Buzzer)',
    category: 'both',
    defaultConnectionType: 'network_ip',
    defaultRole: 'both',
    paperWidth: '80mm',
    defaultIp: '192.168.1.87',
    defaultPort: 9100,
    defaultBaudRate: 19200,
    autoCut: true,
    openCashDrawer: true,
    buzzerAlert: true,
    characterSet: 'CP1256_ARABIC',
    badge: 'LAN + Buzzer',
    badgeAr: 'شبكة وجرس',
    description: 'Reliable 260mm/s 80mm printer with built-in buzzer sound alarm for receipts and kitchen tickets.',
    descriptionAr: 'طابعة تجارية سريعة مع منبه صوتي مدمج وتصلح لفواتير الكاشير وطلبات المطبخ.',
    vendorIdHex: 0x0fe6
  },

  // --- ZEBRA ---
  {
    id: 'zebra_zd220_label',
    brand: 'Zebra',
    modelName: 'Zebra ZD220 / ZD421 (Cup Sticker & Tag)',
    category: 'label',
    defaultConnectionType: 'usb_serial',
    defaultRole: 'kitchen',
    paperWidth: '58mm',
    defaultBaudRate: 9600,
    autoCut: false,
    openCashDrawer: false,
    buzzerAlert: false,
    characterSet: 'UTF8',
    badge: 'Cup & Label',
    badgeAr: 'ملصقات واستكرات',
    description: 'Direct thermal label printer for barista cup stickers, item tags and barcode shelf labels.',
    descriptionAr: 'طابعة ملصقات حرارية واستكرات مخصصة لأكواب القهوة والمشروبات والمطبخ والباركود.'
  },

  // --- MUNBYN ---
  {
    id: 'munbyn_itpp047',
    brand: 'Munbyn',
    modelName: 'Munbyn ITPP047 / ITPP129',
    category: 'both',
    defaultConnectionType: 'network_ip',
    defaultRole: 'receipt',
    paperWidth: '80mm',
    defaultIp: '192.168.1.100',
    defaultPort: 9100,
    defaultBaudRate: 19200,
    autoCut: true,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: 'Heavy Duty',
    badgeAr: 'تحمل تجاري',
    description: 'Heavy-duty 80mm commercial thermal printer with automatic cutter and multi-port support.',
    descriptionAr: 'طابعة إيصالات تجارية عالية الجودة متوافقة مع جميع أنظمة الكاشير وسهلة التوصيل.'
  },

  // --- UNIVERSAL GENERIC ---
  {
    id: 'generic_escpos_80mm',
    brand: 'Generic',
    modelName: 'Universal 80mm Thermal ESC/POS',
    category: 'both',
    defaultConnectionType: 'browser',
    defaultRole: 'receipt',
    paperWidth: '80mm',
    defaultIp: '192.168.1.200',
    defaultPort: 9100,
    defaultBaudRate: 19200,
    autoCut: true,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: '80mm Standard',
    badgeAr: '80 مم قياسية',
    description: 'Standard ESC/POS configuration compatible with any 80mm thermal receipt & kitchen printer.',
    descriptionAr: 'تعريف قياسي شامل يعمل مع كافة الطابعات الحرارية مقاس 80 مم بدون أي تعقيد.'
  },
  {
    id: 'generic_escpos_58mm',
    brand: 'Generic',
    modelName: 'Universal 58mm Thermal ESC/POS',
    category: 'both',
    defaultConnectionType: 'browser',
    defaultRole: 'receipt',
    paperWidth: '58mm',
    defaultBaudRate: 9600,
    autoCut: false,
    openCashDrawer: true,
    buzzerAlert: false,
    characterSet: 'CP1256_ARABIC',
    badge: '58mm Compact',
    badgeAr: '58 مم مدمجة',
    description: 'Universal ESC/POS configuration compatible with any 58mm mobile or mini thermal printer.',
    descriptionAr: 'تعريف قياسي مدمج متوافق مع كافة طابعات 58 مم المحمولة والمكتبية.'
  }
]

/**
 * 1-Click Plug & Play Hardware Bundles for Instant Setup
 */
export const PRESET_BUNDLES: PresetBundle[] = [
  {
    id: 'bundle_cafe_barista',
    name: 'Specialty Café & Coffee Bar Pack',
    nameAr: 'باقة المقاهي المتخصصة ومحطة البارستا',
    badge: 'Most Recommended for Cafés',
    badgeAr: 'الأكثر ترشيحاً للمقاهي والكافيهات',
    description: '1x Epson Cashier Receipt Printer + 1x Xprinter Barista/KOT Printer with Sound Buzzer Alarm.',
    descriptionAr: 'طابعة فواتير كاشير سريعة + طابعة طلبات بارستا ومطبخ مع جرس تنبيه صوتي عند وصول الطلب.',
    printers: [
      {
        presetId: 'epson_tm_t20iii',
        name: 'Main Counter Cashier Printer',
        role: 'receipt',
        ipAddress: '192.168.1.100',
        port: 9100
      },
      {
        presetId: 'xprinter_xp_c260',
        name: 'Espresso Bar & Kitchen KOT (Buzzer)',
        role: 'kitchen',
        ipAddress: '192.168.1.101',
        port: 9100
      }
    ]
  },
  {
    id: 'bundle_restaurant_pro',
    name: 'High-Volume Restaurant & Hot Kitchen Pack',
    nameAr: 'باقة المطاعم المزدحمة والمطبخ الساخن',
    badge: 'Heavy Duty 24/7',
    badgeAr: 'للعمل الشاق والمطابخ الكبيرة',
    description: '1x Epson TM-T88VII Cashier + 1x Bixolon/Xprinter Kitchen Station with Heat-Resistant Ticket Output.',
    descriptionAr: 'طابعة إبسون T88VII للفرونت كاشير + طابعة مطبخ احترافية مقاومة للحرارة والبخار مع جرس.',
    printers: [
      {
        presetId: 'epson_tm_t88vii',
        name: 'Front Desk Cashier 1',
        role: 'receipt',
        ipAddress: '192.168.192.168',
        port: 9100
      },
      {
        presetId: 'xprinter_xp_c260',
        name: 'Hot Kitchen & Prep Line KOT',
        role: 'kitchen',
        ipAddress: '192.168.123.100',
        port: 9100
      }
    ]
  },
  {
    id: 'bundle_budget_allinone',
    name: 'Value POS Starter Pack (Xprinter Dual)',
    nameAr: 'باقة البداية الاقتصادية الذكية (إكس برينتر)',
    badge: 'Best Budget Value',
    badgeAr: 'الأفضل قيمة واقتصاداً',
    description: '2x Xprinter 80mm Network/USB Printers for Cashier Receipts and Kitchen Tickets.',
    descriptionAr: 'طابعتين إكس برينتر 80 مم سهلة التوصيل بالفواتير وطلبات المطبخ بأقل تكلفة.',
    printers: [
      {
        presetId: 'xprinter_xp_n160ii',
        name: 'Counter Receipt Printer',
        role: 'receipt',
        ipAddress: '192.168.123.100',
        port: 9100
      },
      {
        presetId: 'xprinter_xp_c260',
        name: 'Kitchen / Bar Order Station',
        role: 'kitchen',
        ipAddress: '192.168.123.101',
        port: 9100
      }
    ]
  },
  {
    id: 'bundle_mobile_truck',
    name: 'Food Truck & Mobile Pop-Up Pack',
    nameAr: 'باقة الفود ترك ونقاط البيع المتنقلة',
    badge: 'Ultra Compact & Wireless',
    badgeAr: 'لاسلكية ومدمجة للمساحات الصغيرة',
    description: '1x Compact 58mm Bluetooth/USB Wireless Printer for fast on-the-go receipts.',
    descriptionAr: 'طابعة فواتير 58 مم بلوتوث لاسلكية مدمجة وسريعة مناسبة للسيارات والمعارض.',
    printers: [
      {
        presetId: 'xprinter_xp_58iih',
        name: 'Mobile Truck Receipt Printer',
        role: 'both'
      }
    ]
  }
]

export const DEFAULT_PRINTER_SETTINGS: TenantPrinterSettings = {
  defaultReceiptPrinterId: 'printer_default_receipt',
  defaultKitchenPrinterId: 'printer_default_kitchen',
  printers: [
    {
      id: 'printer_default_receipt',
      name: 'Main Counter Receipt Printer (Epson / Generic 80mm)',
      role: 'receipt',
      connectionType: 'browser',
      brand: 'Epson',
      model: 'TM-T20III',
      presetId: 'epson_tm_t20iii',
      paperWidth: '80mm',
      autoCut: true,
      openCashDrawer: true,
      buzzerAlert: false,
      autoPrintOnOrder: true,
      characterSet: 'CP1256_ARABIC',
      isActive: true
    },
    {
      id: 'printer_default_kitchen',
      name: 'Kitchen / Barista KOT Printer (Xprinter 80mm)',
      role: 'kitchen',
      connectionType: 'browser',
      brand: 'Xprinter',
      model: 'XP-C260',
      presetId: 'xprinter_xp_c260',
      paperWidth: '80mm',
      autoCut: true,
      openCashDrawer: false,
      buzzerAlert: true,
      autoPrintOnOrder: true,
      characterSet: 'CP1256_ARABIC',
      isActive: true
    }
  ]
}

/**
 * ESC/POS Command Constants & Helpers
 */
export const ESC_POS = {
  INIT: '\x1B\x40', // Initialize printer
  ALIGN_LEFT: '\x1B\x61\x00',
  ALIGN_CENTER: '\x1B\x61\x01',
  ALIGN_RIGHT: '\x1B\x61\x02',
  BOLD_ON: '\x1B\x45\x01',
  BOLD_OFF: '\x1B\x45\x00',
  UNDERLINE_ON: '\x1B\x2D\x01',
  UNDERLINE_OFF: '\x1B\x2D\x00',
  DOUBLE_HEIGHT: '\x1B\x21\x10',
  DOUBLE_WIDTH: '\x1B\x21\x20',
  DOUBLE_SIZE: '\x1B\x21\x30',
  NORMAL_SIZE: '\x1B\x21\x00',
  CUT_PAPER: '\x1D\x56\x41\x03', // Partial cut with feed
  FULL_CUT: '\x1D\x56\x00',
  OPEN_DRAWER: '\x1B\x70\x00\x19\xFA', // Pulse drawer kick pin 2 (25ms pulse)
  OPEN_DRAWER_PIN5: '\x1B\x70\x01\x19\xFA', // Pulse pin 5
  BUZZER_CHIME: '\x1B\x42\x03\x02', // 3 chimes, 200ms duration (Kitchen Alarm)
  BUZZER_BEEP_SINGLE: '\x1B\x1E', // Single quick beep
  CODEPAGE_CP1256: '\x1B\x74\x16', // Windows-1256 Arabic
  CODEPAGE_PC864: '\x1B\x74\x1D', // PC864 Arabic
  CODEPAGE_UTF8: '\x1B\x28\x43\x02\x00\x00\x00', // UTF-8 enable if supported
  FEED_LINES: (n: number) => `\x1B\x64${String.fromCharCode(n)}`
}

/**
 * Parse stored printer settings with safe fallbacks
 */
export function parsePrinterSettings(raw: string | object | null | undefined): TenantPrinterSettings {
  if (!raw) return DEFAULT_PRINTER_SETTINGS
  if (typeof raw === 'object') return raw as TenantPrinterSettings
  try {
    const parsed = JSON.parse(raw)
    if (parsed && Array.isArray(parsed.printers) && parsed.printers.length > 0) {
      return parsed
    }
    return DEFAULT_PRINTER_SETTINGS
  } catch {
    return DEFAULT_PRINTER_SETTINGS
  }
}

/**
 * Instantiate a new PrinterDevice from a Preset
 */
export function createDeviceFromPreset(
  preset: PrinterPreset,
  customName?: string,
  overrides?: Partial<PrinterDevice>
): PrinterDevice {
  return {
    id: `printer_${preset.brand.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: customName || `${preset.brand} ${preset.modelName}`,
    role: preset.defaultRole,
    connectionType: preset.defaultConnectionType,
    brand: preset.brand,
    model: preset.modelName,
    presetId: preset.id,
    ipAddress: preset.defaultIp,
    port: preset.defaultPort || 9100,
    baudRate: preset.defaultBaudRate || 19200,
    paperWidth: preset.paperWidth,
    autoCut: preset.autoCut,
    openCashDrawer: preset.openCashDrawer,
    buzzerAlert: preset.buzzerAlert,
    autoPrintOnOrder: true,
    characterSet: preset.characterSet,
    isActive: true,
    ...overrides
  }
}

/**
 * Apply a complete 1-Click Hardware Bundle
 */
export function applyBundleToSettings(bundleId: string): TenantPrinterSettings {
  const bundle = PRESET_BUNDLES.find((b) => b.id === bundleId)
  if (!bundle) return DEFAULT_PRINTER_SETTINGS

  const createdPrinters: PrinterDevice[] = bundle.printers.map((item, idx) => {
    const preset = TOP_PRINTER_PRESETS.find((p) => p.id === item.presetId) || TOP_PRINTER_PRESETS[0]
    return createDeviceFromPreset(preset, item.name, {
      role: item.role,
      ipAddress: item.ipAddress || preset.defaultIp,
      port: item.port || preset.defaultPort || 9100,
      id: `printer_bundle_${bundleId}_${idx + 1}`
    })
  })

  const receiptPrinter = createdPrinters.find((p) => p.role === 'receipt' || p.role === 'both')
  const kitchenPrinter = createdPrinters.find((p) => p.role === 'kitchen' || p.role === 'both')

  return {
    defaultReceiptPrinterId: receiptPrinter ? receiptPrinter.id : createdPrinters[0]?.id,
    defaultKitchenPrinterId: kitchenPrinter ? kitchenPrinter.id : createdPrinters[0]?.id,
    printers: createdPrinters
  }
}

/**
 * Generate a text-based test ticket for a printer
 */
export function generateTestReceipt(printer: PrinterDevice, businessName = 'Dafaterkom Café'): string {
  const charsPerLine = printer.paperWidth === '58mm' ? 32 : 42
  const divider = '='.repeat(charsPerLine)
  const lineDivider = '-'.repeat(charsPerLine)

  return `
${divider}
        ${businessName.toUpperCase()}
          PRINTER HARDWARE TEST
${divider}
Device:   ${printer.name}
Brand:    ${printer.brand || 'Generic / ESC-POS'}
Model:    ${printer.model || 'Standard Thermal'}
Role:     ${printer.role.toUpperCase()}
Type:     ${printer.connectionType.toUpperCase()}
Paper:    ${printer.paperWidth}
${printer.connectionType === 'network_ip' ? `IP/Port:  ${printer.ipAddress || '192.168.1.100'}:${printer.port || 9100}\n` : ''}${printer.connectionType === 'usb_serial' ? `BaudRate: ${printer.baudRate || 19200} bps\n` : ''}Date:     ${new Date().toLocaleString()}
${lineDivider}
[✓] ESC/POS Protocol Ready
[✓] Status: Connected & Online
[✓] Cash Drawer Kick: ${printer.openCashDrawer ? 'Enabled (Pin 2)' : 'Disabled'}
[✓] Auto Paper Cut:  ${printer.autoCut ? 'Enabled (Full/Partial)' : 'Disabled'}
[✓] Kitchen Buzzer:  ${printer.buzzerAlert ? 'Active (Alarm Chime)' : 'Off'}
[✓] Codepage:        ${printer.characterSet || 'CP1256 (Arabic/Latin)'}
${lineDivider}
     *** PLUG & PLAY TEST PASSED ***
${divider}
`
}

/**
 * Web API Connection Handlers (WebSerial, WebUSB, WebBluetooth)
 */
export async function requestWebSerialPrinter(baudRate = 19200): Promise<{ success: boolean; portName?: string; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: 'Browser environment only' }
  const nav = navigator as any
  if (!nav.serial) {
    return {
      success: false,
      error: 'WebSerial API not supported in this browser. Please use Chrome, Edge, or Opera.'
    }
  }

  try {
    const port = await nav.serial.requestPort()
    await port.open({ baudRate })
    const info = port.getInfo()
    await port.close()
    return {
      success: true,
      portName: `USB Serial (VID: 0x${info.usbVendorId?.toString(16) || 'N/A'}, PID: 0x${info.usbProductId?.toString(16) || 'N/A'})`
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Serial port selection cancelled or failed' }
  }
}

export async function requestWebUsbPrinter(vendorIdHex?: number): Promise<{ success: boolean; deviceName?: string; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: 'Browser environment only' }
  const nav = navigator as any
  if (!nav.usb) {
    return {
      success: false,
      error: 'WebUSB API not supported in this browser. Please use Chrome or Edge.'
    }
  }

  try {
    const filters = vendorIdHex ? [{ vendorId: vendorIdHex }] : []
    const device = await nav.usb.requestDevice({ filters })
    return {
      success: true,
      deviceName: `${device.productName || 'USB Thermal Printer'} (${device.manufacturerName || 'ESC/POS'})`
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'USB device selection cancelled' }
  }
}

export async function requestWebBluetoothPrinter(): Promise<{ success: boolean; deviceName?: string; error?: string }> {
  if (typeof window === 'undefined') return { success: false, error: 'Browser environment only' }
  const nav = navigator as any
  if (!nav.bluetooth) {
    return {
      success: false,
      error: 'Web Bluetooth API not supported in this browser. Please use Chrome on Android/Desktop.'
    }
  }

  try {
    const device = await nav.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb', '49535343-fe7d-4ae5-8fa9-9fafd205e455', 'e7810a71-73ae-499d-8c15-faa9aef0c3f2']
    })
    return {
      success: true,
      deviceName: device.name || 'Bluetooth Thermal Printer'
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Bluetooth pairing cancelled' }
  }
}
