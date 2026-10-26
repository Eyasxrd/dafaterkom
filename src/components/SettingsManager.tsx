'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Printer,
  Store,
  Receipt,
  DollarSign,
  Palette,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wifi,
  Usb,
  Bluetooth,
  Monitor,
  Play,
  Settings2,
  Trash2,
  Plus,
  Volume2,
  Copy,
  Check,
  RefreshCw,
  Layers,
  FileText,
  CreditCard,
  QrCode,
  MapPin,
  Sliders,
  Sun,
  Moon,
  Coffee,
  PackageCheck,
  Cpu,
  Search,
  SlidersHorizontal,
  ChevronRight,
  User,
  Languages,
  KeyRound,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Building,
  Smartphone,
  CheckCheck
} from 'lucide-react'
import {
  PrinterDevice,
  TenantPrinterSettings,
  PrinterPreset,
  TOP_PRINTER_PRESETS,
  PRESET_BUNDLES,
  DEFAULT_PRINTER_SETTINGS,
  parsePrinterSettings,
  createDeviceFromPreset,
  applyBundleToSettings,
  generateTestReceipt,
  requestWebSerialPrinter,
  requestWebBluetoothPrinter,
  PrinterRole,
  PrinterConnectionType,
  PaperWidth,
  CodePage
} from '@/lib/printer-service'
import { useThemeStore, useAuthStore, useLanguageStore } from '@/lib/store'
import { PRESET_THEMES } from '@/lib/theme-engine'
import ThemeSelectorModal from '@/components/theme/ThemeSelectorModal'

interface SettingsManagerProps {
  onOpenWizard?: () => void
}

type SettingsTab =
  | 'user_profile'
  | 'language'
  | 'appearance'
  | 'printers'
  | 'store'
  | 'tax_currency'
  | 'receipts'
  | 'security'

export default function SettingsManager({ onOpenWizard }: SettingsManagerProps) {
  const currentLocale = useLocale() || 'en'
  const isAr = currentLocale === 'ar'
  const router = useRouter()
  const pathname = usePathname()

  const { isDarkMode, toggleDarkMode, activeThemeId, setActiveTheme, getAllThemes } = useThemeStore()
  const { user, updateUser } = useAuthStore()
  const { setLocale } = useLanguageStore()

  const [activeTab, setActiveTab] = useState<SettingsTab>('user_profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingUser, setIsSavingUser] = useState(false)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)

  // =========================================================================
  // User Profile State
  // =========================================================================
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profileEmail, setProfileEmail] = useState(user?.email || '')
  const [profilePhone, setProfilePhone] = useState(user?.phone || '')
  const [profileJobTitle, setProfileJobTitle] = useState(user?.jobTitle || '')
  const [profileDepartment, setProfileDepartment] = useState(user?.department || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // =========================================================================
  // Store & Tenant Profile Fields
  // =========================================================================
  const [businessName, setBusinessName] = useState('Dafaterkom Café')
  const [clientCode, setClientCode] = useState('CL-1001')
  const [taxNumber, setTaxNumber] = useState('300000000000003')
  const [currency, setCurrency] = useState('SAR')
  const [taxRate, setTaxRate] = useState(15.0)
  const [receiptHeader, setReceiptHeader] = useState('Specialty Coffee & Artisan Bakes\nWelcome to our Café')
  const [receiptFooter, setReceiptFooter] = useState('Thank you for visiting!\nWiFi: CafeGuest / Pass: coffee2026')
  const [wasteCostingMethod, setWasteCostingMethod] = useState<'fifo' | 'lifo' | 'wac'>('fifo')
  const [geofenceRadius, setGeofenceRadius] = useState(250)
  const [geofenceLat, setGeofenceLat] = useState(24.7136)
  const [geofenceLng, setGeofenceLng] = useState(46.6753)

  // =========================================================================
  // Printer Sub-state
  // =========================================================================
  const [printerSettings, setPrinterSettings] = useState<TenantPrinterSettings>(DEFAULT_PRINTER_SETTINGS)
  const [printerSubTab, setPrinterSubTab] = useState<'devices' | 'presets' | 'bundles'>('devices')
  const [editingPrinter, setEditingPrinter] = useState<PrinterDevice | null>(null)
  const [presetSearch, setPresetSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all')
  const [testOutput, setTestOutput] = useState<{ printerName: string; text: string } | null>(null)
  const [isConnectingHardware, setIsConnectingHardware] = useState(false)

  // =========================================================================
  // Appearance & Audio Settings
  // =========================================================================
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [posSoundEffects, setPosSoundEffects] = useState(true)
  const [autoOpenCashDrawerOnCash, setAutoOpenCashDrawerOnCash] = useState(true)
  const [requireManagerPinRefund, setRequireManagerPinRefund] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)

  // Fetch initial tenant settings & user info
  useEffect(() => {
    let isMounted = true
    async function fetchSettings() {
      try {
        setIsLoading(true)
        const [tenantRes, meRes] = await Promise.all([
          fetch('/api/tenant').catch(() => null),
          fetch('/api/auth/me').catch(() => null)
        ])

        if (tenantRes && tenantRes.ok && isMounted) {
          const data = await tenantRes.json()
          if (data) {
            if (data.businessName) setBusinessName(data.businessName)
            if (data.clientCode) setClientCode(data.clientCode)
            if (data.taxNumber) setTaxNumber(data.taxNumber)
            if (data.currency) setCurrency(data.currency)
            if (data.taxRate !== undefined) setTaxRate(data.taxRate)
            if (data.receiptHeader) setReceiptHeader(data.receiptHeader)
            if (data.receiptFooter) setReceiptFooter(data.receiptFooter)
            if (data.wasteCostingMethod) setWasteCostingMethod(data.wasteCostingMethod)
            if (data.geofenceRadius) setGeofenceRadius(data.geofenceRadius)
            if (data.geofenceLat) setGeofenceLat(data.geofenceLat)
            if (data.geofenceLng) setGeofenceLng(data.geofenceLng)
            if (data.printerConfig) {
              setPrinterSettings(parsePrinterSettings(data.printerConfig))
            }
          }
        }

        if (meRes && meRes.ok && isMounted) {
          const meData = await meRes.json()
          if (meData?.user) {
            setProfileName(meData.user.name || '')
            setProfileEmail(meData.user.email || '')
            setProfilePhone(meData.user.phone || '')
            setProfileJobTitle(meData.user.jobTitle || '')
            setProfileDepartment(meData.user.department || '')
            updateUser(meData.user)
          }
        }
      } catch (err: any) {
        console.error('Failed to load settings:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    fetchSettings()
    return () => {
      isMounted = false
    }
  }, [])

  // Filtered Presets
  const filteredPresets = useMemo(() => {
    return TOP_PRINTER_PRESETS.filter((preset) => {
      const matchBrand = selectedBrand === 'all' || preset.brand.toLowerCase() === selectedBrand.toLowerCase()
      const matchCategory =
        selectedRoleFilter === 'all' ||
        preset.category === selectedRoleFilter ||
        preset.defaultRole === selectedRoleFilter ||
        (selectedRoleFilter === 'receipt' && (preset.category === 'both' || preset.category === 'receipt')) ||
        (selectedRoleFilter === 'kitchen' && (preset.category === 'both' || preset.category === 'kitchen'))

      const q = presetSearch.toLowerCase().trim()
      const matchSearch =
        !q ||
        preset.modelName.toLowerCase().includes(q) ||
        preset.brand.toLowerCase().includes(q) ||
        preset.description.toLowerCase().includes(q) ||
        preset.badge.toLowerCase().includes(q)

      return matchBrand && matchCategory && matchSearch
    })
  }, [presetSearch, selectedBrand, selectedRoleFilter])

  // Save user profile
  const handleSaveUserProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingUser(true)
    setErrorNotice(null)
    setSuccessNotice(null)

    if (newPassword && newPassword !== confirmPassword) {
      setErrorNotice(isAr ? 'كلمتا المرور غير متطابقتين' : 'New passwords do not match')
      setIsSavingUser(false)
      return
    }

    try {
      const payload: any = {
        name: profileName,
        email: profileEmail,
        phone: profilePhone,
        jobTitle: profileJobTitle,
        department: profileDepartment
      }

      if (newPassword) {
        payload.currentPassword = currentPassword
        payload.newPassword = newPassword
      }

      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      if (data.user) {
        updateUser(data.user)
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')

      setSuccessNotice(
        isAr ? 'تم حفظ وتحديث بيانات حسابك بنجاح!' : 'User profile and credentials updated successfully!'
      )
      setTimeout(() => setSuccessNotice(null), 4000)
    } catch (err: any) {
      setErrorNotice(err.message || 'Error updating profile')
    } finally {
      setIsSavingUser(false)
    }
  }

  // Save store settings
  const handleSaveAllSettings = async () => {
    setIsSaving(true)
    setErrorNotice(null)
    setSuccessNotice(null)
    try {
      const payload = {
        businessName,
        clientCode,
        taxNumber,
        currency,
        taxRate,
        receiptHeader,
        receiptFooter,
        wasteCostingMethod,
        geofenceRadius,
        geofenceLat,
        geofenceLng,
        printerConfig: printerSettings
      }

      const res = await fetch('/api/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to save settings')
      }

      setSuccessNotice(
        isAr
          ? 'تم حفظ جميع التخصيصات وإعدادات النظام بنجاح!'
          : 'All system preferences and hardware settings saved successfully!'
      )
      setTimeout(() => setSuccessNotice(null), 5000)
    } catch (err: any) {
      setErrorNotice(err.message || 'Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

  // Language switcher helper
  const handleSwitchLanguage = (newLang: 'ar' | 'en') => {
    setLocale(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLang)
      // Redirect to locale path
      const segments = pathname.split('/')
      if (segments.length > 1 && (segments[1] === 'ar' || segments[1] === 'en')) {
        segments[1] = newLang
        router.push(segments.join('/'))
      } else {
        router.push(`/${newLang}`)
      }
    }
  }

  // Printer Management Helpers
  const handleApplyPresetToNewDevice = (preset: PrinterPreset) => {
    const newDevice = createDeviceFromPreset(preset)
    setPrinterSettings((prev) => {
      const updated = [...prev.printers, newDevice]
      return {
        ...prev,
        printers: updated,
        defaultReceiptPrinterId:
          newDevice.role === 'receipt' || newDevice.role === 'both'
            ? prev.defaultReceiptPrinterId || newDevice.id
            : prev.defaultReceiptPrinterId,
        defaultKitchenPrinterId:
          newDevice.role === 'kitchen' || newDevice.role === 'both'
            ? prev.defaultKitchenPrinterId || newDevice.id
            : prev.defaultKitchenPrinterId
      }
    })
    setSuccessNotice(
      isAr
        ? `تمت إضافة وتجهيز طابعة (${preset.brand} ${preset.modelName}) بنجاح!`
        : `Added pre-configured ${preset.brand} ${preset.modelName} to your hardware list!`
    )
    setPrinterSubTab('devices')
    setTimeout(() => setSuccessNotice(null), 4000)
  }

  const handleApplyBundle = (bundleId: string) => {
    const newSettings = applyBundleToSettings(bundleId)
    setPrinterSettings(newSettings)
    const bundle = PRESET_BUNDLES.find((b) => b.id === bundleId)
    setSuccessNotice(
      isAr
        ? `تم تطبيق "${bundle?.nameAr || bundle?.name}" وتثبيت الطابعات بنجاح!`
        : `Applied "${bundle?.name}" hardware package with instant plug-and-play profiles!`
    )
    setPrinterSubTab('devices')
    setTimeout(() => setSuccessNotice(null), 4000)
  }

  const handleOpenAddCustomPrinter = () => {
    const defaultGeneric = TOP_PRINTER_PRESETS.find((p) => p.id === 'generic_escpos_80mm') || TOP_PRINTER_PRESETS[0]
    const newDevice = createDeviceFromPreset(defaultGeneric, isAr ? 'طابعة حرارية جديدة' : 'New Thermal Printer')
    setEditingPrinter(newDevice)
  }

  const handleDeletePrinter = (id: string) => {
    setPrinterSettings((prev) => ({
      ...prev,
      printers: prev.printers.filter((p) => p.id !== id),
      defaultReceiptPrinterId: prev.defaultReceiptPrinterId === id ? undefined : prev.defaultReceiptPrinterId,
      defaultKitchenPrinterId: prev.defaultKitchenPrinterId === id ? undefined : prev.defaultKitchenPrinterId
    }))
  }

  const handleSavePrinterForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPrinter) return

    setPrinterSettings((prev) => {
      const exists = prev.printers.some((p) => p.id === editingPrinter.id)
      const updatedPrinters = exists
        ? prev.printers.map((p) => (p.id === editingPrinter.id ? editingPrinter : p))
        : [...prev.printers, editingPrinter]

      return {
        ...prev,
        printers: updatedPrinters,
        defaultReceiptPrinterId:
          editingPrinter.role === 'receipt' || editingPrinter.role === 'both'
            ? prev.defaultReceiptPrinterId || editingPrinter.id
            : prev.defaultReceiptPrinterId,
        defaultKitchenPrinterId:
          editingPrinter.role === 'kitchen' || editingPrinter.role === 'both'
            ? prev.defaultKitchenPrinterId || editingPrinter.id
            : prev.defaultKitchenPrinterId
      }
    })

    setEditingPrinter(null)
  }

  const handleTestPrint = (printer: PrinterDevice) => {
    const rawTicket = generateTestReceipt(printer, businessName)
    setTestOutput({ printerName: printer.name, text: rawTicket })

    if (printer.connectionType === 'browser') {
      window.print()
    } else {
      setSuccessNotice(
        isAr
          ? `تم إرسال أمر اختبار الطباعة إلى ${printer.name} (${printer.connectionType === 'network_ip' ? `${printer.ipAddress}:${printer.port}` : printer.connectionType})`
          : `Test print dispatched to ${printer.name} (${printer.connectionType === 'network_ip' ? `${printer.ipAddress}:${printer.port}` : printer.connectionType})`
      )
      setTimeout(() => setSuccessNotice(null), 4000)
    }
  }

  const handleWebSerialDirectConnect = async () => {
    setIsConnectingHardware(true)
    setErrorNotice(null)
    try {
      const res = await requestWebSerialPrinter(19200)
      if (res.success) {
        const detectedDevice: PrinterDevice = {
          id: `printer_usb_direct_${Date.now()}`,
          name: isAr ? 'طابعة USB مباشرة (WebSerial)' : 'Direct USB Thermal Printer',
          role: 'receipt',
          connectionType: 'usb_serial',
          brand: 'Generic',
          model: 'Direct USB ESC/POS',
          baudRate: 19200,
          paperWidth: '80mm',
          autoCut: true,
          openCashDrawer: true,
          autoPrintOnOrder: true,
          isActive: true
        }
        setPrinterSettings((prev) => ({
          ...prev,
          printers: [...prev.printers, detectedDevice],
          defaultReceiptPrinterId: prev.defaultReceiptPrinterId || detectedDevice.id
        }))
        setSuccessNotice(
          isAr
            ? `تم اكتشاف الطابعة عبر منفذ USB التسلسلي بنجاح!`
            : `USB Printer connected successfully via WebSerial!`
        )
      } else {
        setErrorNotice(res.error || 'Failed to detect serial printer')
      }
    } catch (e: any) {
      setErrorNotice(e.message)
    } finally {
      setIsConnectingHardware(false)
      setTimeout(() => setSuccessNotice(null), 5000)
    }
  }

  const handleWebBluetoothDirectConnect = async () => {
    setIsConnectingHardware(true)
    setErrorNotice(null)
    try {
      const res = await requestWebBluetoothPrinter()
      if (res.success) {
        const detectedDevice: PrinterDevice = {
          id: `printer_bt_${Date.now()}`,
          name: res.deviceName || (isAr ? 'طابعة بلوتوث لاسلكية' : 'Wireless Bluetooth Printer'),
          role: 'receipt',
          connectionType: 'bluetooth',
          brand: 'Generic',
          model: 'Bluetooth ESC/POS',
          paperWidth: '80mm',
          autoCut: false,
          openCashDrawer: false,
          autoPrintOnOrder: true,
          isActive: true
        }
        setPrinterSettings((prev) => ({
          ...prev,
          printers: [...prev.printers, detectedDevice]
        }))
        setSuccessNotice(
          isAr
            ? `تم اقتران طابعة البلوتوث (${res.deviceName}) بنجاح!`
            : `Bluetooth printer paired: ${res.deviceName}`
        )
      } else {
        setErrorNotice(res.error || 'Bluetooth pairing cancelled')
      }
    } catch (e: any) {
      setErrorNotice(e.message)
    } finally {
      setIsConnectingHardware(false)
      setTimeout(() => setSuccessNotice(null), 5000)
    }
  }

  const handleCopyClientCode = () => {
    navigator.clipboard.writeText(clientCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const navTabs: Array<{ id: SettingsTab; label: string; icon: any; badge?: string }> = [
    { id: 'user_profile', label: isAr ? 'الملف الشخصي والحساب' : 'User Account & Security', icon: User },
    { id: 'language', label: isAr ? 'اللغة والاتجاه (Language)' : 'Language & Regional', icon: Languages },
    { id: 'appearance', label: isAr ? 'المظهر والثيمات والأصوات' : 'Themes, Appearance & UX', icon: Palette },
    { id: 'printers', label: isAr ? 'الطابعات والعتاد (ESC/POS)' : 'Printers & Hardware', icon: Printer, badge: `${printerSettings.printers.length}` },
    { id: 'store', label: isAr ? 'بيانات المتجر والفرع' : 'Store & Branch Profile', icon: Store },
    { id: 'tax_currency', label: isAr ? 'الضريبة والعملة والتكاليف' : 'Tax, Currency & Costing', icon: DollarSign },
    { id: 'receipts', label: isAr ? 'تخصيص الفاتورة و ZATCA' : 'Receipt & E-Invoice', icon: Receipt },
    { id: 'security', label: isAr ? 'سياسات الكاشير والصندوق' : 'Security & Cash Policies', icon: Shield }
  ]

  const brands = [
    { label: isAr ? 'جميع الماركات' : 'All Brands', value: 'all' },
    { label: 'Epson (إبسون)', value: 'epson' },
    { label: 'Xprinter (إكس برينتر)', value: 'xprinter' },
    { label: 'Star Micronics', value: 'star micronics' },
    { label: 'Bixolon (بيكسلون)', value: 'bixolon' },
    { label: 'Sunmi (سنمي)', value: 'sunmi' },
    { label: 'Rongta (رونجتا)', value: 'rongta' },
    { label: 'Zebra (زيبرا)', value: 'zebra' },
    { label: 'Munbyn', value: 'munbyn' },
    { label: 'Generic ESC/POS', value: 'generic' }
  ]

  const roleCategories = [
    { label: isAr ? 'جميع الاستخدامات' : 'All Roles', value: 'all' },
    { label: isAr ? '🧾 فواتير كاشير (Receipt)' : '🧾 Receipt Cashier', value: 'receipt' },
    { label: isAr ? '🍳 طلبات مطبخ / بارستا (KOT)' : '🍳 Kitchen / KOT', value: 'kitchen' },
    { label: isAr ? '📱 أجهزة محمولة / فود ترك' : '📱 Mobile / Handheld', value: 'mobile' },
    { label: isAr ? '🏷️ ملصقات واستكرات أكواب' : '🏷️ Cup Stickers / Label', value: 'label' }
  ]

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl liquid-btn-primary flex items-center justify-center text-white animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {isAr ? 'جاري تحميل لوحة الإعدادات والتخصيص...' : 'Loading Settings & Customization Control Panel...'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header Banner */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {isAr ? 'مركز الإعدادات والتخصيص الشامل' : 'Settings & Customization Hub'}
              </h1>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase tracking-wider">
                Full Control
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isAr
                ? 'إدارة الحساب، تغيير اللغة، الوضع الليلي، ألوان الثيم، الطابعات، المتجر، والضرائب.'
                : 'Manage user credentials, language, themes, ESC/POS hardware, branch profile & tax rules.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          {onOpenWizard && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenWizard}
              className="rounded-xl text-xs font-bold gap-1.5 h-10 border-slate-200 dark:border-slate-800"
            >
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>{isAr ? 'معالج الإعداد' : 'Setup Wizard'}</span>
            </Button>
          )}

          <Button
            onClick={handleSaveAllSettings}
            disabled={isSaving}
            size="sm"
            className="rounded-xl text-xs font-bold gap-2 h-10 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md px-5"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{isAr ? 'حفظ إعدادات النظام' : 'Save System Settings'}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Global Alerts */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successNotice}</span>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl text-xs font-semibold flex items-center gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* Layout: Sidebar Tabs + Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Navigation Column */}
        <div className="lg:col-span-3 space-y-1.5">
          <div className="glass-panel p-2.5 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-1">
            {navTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl font-bold text-xs transition-all cursor-pointer text-left rtl:text-right ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Quick Support Callout */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50/40 dark:from-slate-800/40 dark:to-blue-950/20 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>{isAr ? 'تخصيص فوري' : 'Live Customization'}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'تطبق تغييراتك فورياً على نقطة البيع وشاشات المطبخ وطابعات الفواتير بدون الحاجة لإعادة تشغيل النظام.'
                : 'All modifications sync in real time to POS registers, Kitchen displays, and ZATCA invoices.'}
            </p>
          </div>
        </div>

        {/* Right Content Body Column */}
        <div className="lg:col-span-9">
          <div className="glass-panel p-5 sm:p-7 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-sm">
            {/* ========================================================================= */}
            {/* TAB 1: USER ACCOUNT & SECURITY PROFILE */}
            {/* ========================================================================= */}
            {activeTab === 'user_profile' && (
              <form onSubmit={handleSaveUserProfile} className="space-y-6">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span>{isAr ? 'بيانات المستخدم وحساب الدخول' : 'User Profile & Account Security'}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isAr
                        ? 'تحديث اسمك، بريدك الإلكتروني، رقم الهاتف، وتغيير كلمة مرور حسابك.'
                        : 'Update your display name, login email, phone number, and change password.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {user?.role || 'Staff'}
                    </span>
                  </div>
                </div>

                {/* Profile Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'الاسم الكامل' : 'Full Name'}
                    </Label>
                    <Input
                      required
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      placeholder="e.g. Eyas Al-Rashid"
                      className="rounded-2xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'البريد الإلكتروني للدخول' : 'Login Email'}
                    </Label>
                    <Input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      placeholder="e.g. operator@dafaterkom.com"
                      className="rounded-2xl font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'رقم الهاتف / الجوال' : 'Phone Number'}
                    </Label>
                    <Input
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+966 50 000 0000"
                      className="rounded-2xl font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'المسمى الوظيفي' : 'Job Title'}
                    </Label>
                    <Input
                      value={profileJobTitle}
                      onChange={(e) => setProfileJobTitle(e.target.value)}
                      placeholder="e.g. Store Manager / Senior Barista"
                      className="rounded-2xl"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'القسم / الإدارة' : 'Department'}
                    </Label>
                    <Select value={profileDepartment || 'Operations'} onValueChange={setProfileDepartment}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Management">{isAr ? 'الإدارة العامة (Management)' : 'Management'}</SelectItem>
                        <SelectItem value="Operations">{isAr ? 'العمليات والتشغيل (Operations)' : 'Operations'}</SelectItem>
                        <SelectItem value="Service">{isAr ? 'خدمة العملاء والكاشير (Service)' : 'Service & Cashier'}</SelectItem>
                        <SelectItem value="Kitchen">{isAr ? 'المطبخ والبارستا (Kitchen & Barista)' : 'Kitchen & Barista'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isAr ? 'تغيير كلمة المرور (Security Credentials)' : 'Change Account Password'}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">{isAr ? 'كلمة المرور الحالية' : 'Current Password'}</Label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</Label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-slate-500">{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-9 text-xs rounded-xl"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Profile */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={isSavingUser}
                    className="rounded-2xl text-xs font-bold gap-2 h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-md px-6"
                  >
                    {isSavingUser ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isAr ? 'جاري الحفظ...' : 'Updating Profile...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{isAr ? 'تحديث وحفظ بياناتي' : 'Update My Profile'}</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: LANGUAGE & REGIONAL LOCALIZATION */}
            {/* ========================================================================= */}
            {activeTab === 'language' && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-1">
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Languages className="w-5 h-5 text-blue-600" />
                    <span>{isAr ? 'اللغة، الاتجاه، والإعدادات الإقليمية' : 'Language & Regional Localization'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'التبديل بين اللغة العربية (RTL) والإنجليزية (LTR) مع توافق كامل للأرقام والعملات.'
                      : 'Switch active language between Arabic (RTL) and English (LTR) with instant formatting.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Arabic Card */}
                  <button
                    type="button"
                    onClick={() => handleSwitchLanguage('ar')}
                    className={`p-5 rounded-3xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                      currentLocale === 'ar'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-2xl">🇸🇦</span>
                      {currentLocale === 'ar' ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>النشطة حالياً</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">انقر للتفعيل</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-black">العربية (Arabic - RTL)</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        واجهة مستخدم عربية كاملة من اليمين إلى اليسار متوافقة مع الفاتورة الإلكترونية وهيئة الزكاة.
                      </p>
                    </div>
                  </button>

                  {/* English Card */}
                  <button
                    type="button"
                    onClick={() => handleSwitchLanguage('en')}
                    className={`p-5 rounded-3xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                      currentLocale === 'en'
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 shadow-md ring-2 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-2xl">🇺🇸</span>
                      {currentLocale === 'en' ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Currently Active</span>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Click to activate</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-black">English (US - LTR)</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Left-to-right English interface optimized for international staff and quick QSR registers.
                      </p>
                    </div>
                  </button>
                </div>

                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-emerald-500" />
                    <span>{isAr ? 'التزامن التلقائي للغة' : 'Automatic Session Language'}</span>
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {isAr
                      ? 'يتم حفظ تفضيل اللغة تلقائياً في المتصفح وجهاز الكاشير ليبقى ثابتاً في الجلسات القادمة.'
                      : 'Your language choice is automatically remembered in browser storage across all POS terminal sessions.'}
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: THEMES, APPEARANCE & POS UX */}
            {/* ========================================================================= */}
            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-1">
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-600" />
                    <span>{isAr ? 'المظهر والثيمات وتجربة الكاشير' : 'Theme, Appearance & POS Experience'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'الوضع الليلي والنهاري، تدرجات الألوان، والتأثيرات الصوتية أثناء البيع.'
                      : 'Toggle dark mode, color palettes, and POS cashier sound effects.'}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Dark Mode Switch */}
                  <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {isDarkMode ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                        <span>{isAr ? 'الوضع الليلي / الداكن' : 'Dark Mode Canvas'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {isAr ? 'تبديل واجهة النظام بالكامل بين الوضع الداكن والفاتح' : 'Switch entire interface to high-contrast Dark Mode'}
                      </p>
                    </div>
                    <Switch checked={isDarkMode} onCheckedChange={toggleDarkMode} />
                  </div>

                  {/* Preset Themes Selector Cards */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isAr ? 'أنماط وباليت الألوان المعتمدة' : 'Curated Theme Palettes'}
                      </Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsThemeModalOpen(true)}
                        className="text-xs h-8 rounded-xl font-bold gap-1 text-blue-600 dark:text-blue-400"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAr ? 'محرر الألوان المخصص' : 'Custom Theme Engine'}</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {getAllThemes().slice(0, 6).map((theme) => {
                        const isActive = activeThemeId === theme.id
                        return (
                          <button
                            key={theme.id}
                            type="button"
                            onClick={() => setActiveTheme(theme.id)}
                            className={`p-3 rounded-2xl border text-left rtl:text-right transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                              isActive
                                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-sm ring-2 ring-blue-500/20'
                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                {isAr ? theme.nameAr || theme.name : theme.name}
                              </span>
                              {isActive && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: theme.colors.primary }} />
                              <span className="w-5 h-5 rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: theme.colors.accent || theme.colors.gradientEnd }} />
                              <span className="text-[10px] text-slate-400 font-mono ms-auto">{theme.isDark ? 'Dark' : 'Light'}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Sound Effects */}
                  <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Volume2 className="w-4 h-4 text-emerald-500" />
                        <span>{isAr ? 'المؤثرات الصوتية عند البيع' : 'POS Audio Feedback & Chimes'}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {isAr ? 'تشغيل صوت نغمة التأكيد عند إتمام الدفع وإضافة المنتجات' : 'Play audio confirmation chime upon successful sale & cart operations'}
                      </p>
                    </div>
                    <Switch checked={posSoundEffects} onCheckedChange={setPosSoundEffects} />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: PRINTERS & HARDWARE MANAGEMENT */}
            {/* ========================================================================= */}
            {activeTab === 'printers' && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                      <Printer className="w-5 h-5 text-blue-600" />
                      <span>{isAr ? 'إدارة الطابعات والعتاد (ESC/POS Plug & Play)' : 'Thermal Printers & Hardware Devices'}</span>
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isAr
                        ? 'توصيل وتعريف طابعات الفواتير وأجهزة المطبخ (Epson, Xprinter, Star, Bixolon, Sunmi) مع فتح الدرج وجرس الإنذار.'
                        : 'Connect, test & route receipt and kitchen order tickets to ESC/POS thermal stations.'}
                    </p>
                  </div>

                  {/* Sub-tab Navigation */}
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => {
                        setPrinterSubTab('devices')
                        setEditingPrinter(null)
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        printerSubTab === 'devices'
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {isAr ? `الأجهزة (${printerSettings.printers.length})` : `Devices (${printerSettings.printers.length})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrinterSubTab('presets')
                        setEditingPrinter(null)
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        printerSubTab === 'presets'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {isAr ? 'الكتالوج الجاهز' : 'Top Presets'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPrinterSubTab('bundles')
                        setEditingPrinter(null)
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        printerSubTab === 'bundles'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {isAr ? 'باقات سريعة' : '1-Click Packs'}
                    </button>
                  </div>
                </div>

                {/* Sub-view 1: Edit/Add Printer Form */}
                {editingPrinter ? (
                  <form onSubmit={handleSavePrinterForm} className="space-y-4 p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                        <span>
                          {editingPrinter.id.startsWith('printer_') &&
                          !printerSettings.printers.some((p) => p.id === editingPrinter.id)
                            ? isAr ? 'إضافة طابعة جديدة' : 'Add New Thermal Device'
                            : isAr ? `تعديل الطابعة: ${editingPrinter.name}` : `Edit Device: ${editingPrinter.name}`}
                        </span>
                      </h3>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingPrinter(null)}
                        className="text-xs rounded-xl"
                      >
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs font-semibold">{isAr ? 'اسم الطابعة / المحطة' : 'Printer Label'}</Label>
                        <Input
                          required
                          value={editingPrinter.name}
                          onChange={(e) => setEditingPrinter({ ...editingPrinter, name: e.target.value })}
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{isAr ? 'دور الطابعة' : 'Printer Role'}</Label>
                        <Select
                          value={editingPrinter.role}
                          onValueChange={(val) => setEditingPrinter({ ...editingPrinter, role: val as PrinterRole })}
                        >
                          <SelectTrigger className="h-9 text-xs rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="receipt">🧾 Customer Receipt (فاتورة العميل)</SelectItem>
                            <SelectItem value="kitchen">🍳 Kitchen / Barista KOT (طلب المطبخ)</SelectItem>
                            <SelectItem value="both">⚡ Dual Purpose (Receipt & Kitchen)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{isAr ? 'طريقة التوصيل' : 'Interface'}</Label>
                        <Select
                          value={editingPrinter.connectionType}
                          onValueChange={(val) => setEditingPrinter({ ...editingPrinter, connectionType: val as PrinterConnectionType })}
                        >
                          <SelectTrigger className="h-9 text-xs rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="network_ip">🌐 LAN / Ethernet / WiFi IP (192.168.x.x)</SelectItem>
                            <SelectItem value="usb_serial">🔌 USB Direct / ESC-POS (WebSerial)</SelectItem>
                            <SelectItem value="bluetooth">📶 Wireless Bluetooth ESC-POS</SelectItem>
                            <SelectItem value="browser">💻 System / Browser Print Dialog</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {editingPrinter.connectionType === 'network_ip' && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">IP Address</Label>
                            <Input
                              required
                              value={editingPrinter.ipAddress || ''}
                              onChange={(e) => setEditingPrinter({ ...editingPrinter, ipAddress: e.target.value })}
                              className="h-9 text-xs font-mono rounded-xl"
                              placeholder="192.168.1.100"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">RAW Port</Label>
                            <Input
                              type="number"
                              required
                              value={editingPrinter.port || 9100}
                              onChange={(e) => setEditingPrinter({ ...editingPrinter, port: parseInt(e.target.value) || 9100 })}
                              className="h-9 text-xs font-mono rounded-xl"
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{isAr ? 'عرض الورق' : 'Paper Width'}</Label>
                        <Select
                          value={editingPrinter.paperWidth}
                          onValueChange={(val) => setEditingPrinter({ ...editingPrinter, paperWidth: val as PaperWidth })}
                        >
                          <SelectTrigger className="h-9 text-xs rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="80mm">80mm (Standard POS / 42-48 Chars)</SelectItem>
                            <SelectItem value="58mm">58mm (Compact Mobile / 32 Chars)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">{isAr ? 'ترميز الحروف' : 'Codepage'}</Label>
                        <Select
                          value={editingPrinter.characterSet || 'CP1256_ARABIC'}
                          onValueChange={(val) => setEditingPrinter({ ...editingPrinter, characterSet: val as CodePage })}
                        >
                          <SelectTrigger className="h-9 text-xs rounded-xl font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CP1256_ARABIC">CP1256 (Windows Arabic + Latin)</SelectItem>
                            <SelectItem value="PC864_ARABIC">PC864 (Simplified Arabic)</SelectItem>
                            <SelectItem value="PC437_USA">PC437 (Standard Latin)</SelectItem>
                            <SelectItem value="UTF8">UTF-8 Direct (Modern)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Toggles */}
                      <div className="sm:col-span-2 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                          <span className="text-xs font-bold">Auto-Cut</span>
                          <Switch
                            checked={editingPrinter.autoCut}
                            onCheckedChange={(c) => setEditingPrinter({ ...editingPrinter, autoCut: c })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                          <span className="text-xs font-bold">Cash Drawer</span>
                          <Switch
                            checked={editingPrinter.openCashDrawer}
                            onCheckedChange={(c) => setEditingPrinter({ ...editingPrinter, openCashDrawer: c })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                          <span className="text-xs font-bold flex items-center gap-1">
                            <Volume2 className="w-3.5 h-3.5 text-amber-500" />
                            <span>Buzzer</span>
                          </span>
                          <Switch
                            checked={editingPrinter.buzzerAlert ?? false}
                            onCheckedChange={(c) => setEditingPrinter({ ...editingPrinter, buzzerAlert: c })}
                          />
                        </div>
                        <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                          <span className="text-xs font-bold">Auto-Print</span>
                          <Switch
                            checked={editingPrinter.autoPrintOnOrder}
                            onCheckedChange={(c) => setEditingPrinter({ ...editingPrinter, autoPrintOnOrder: c })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditingPrinter(null)} className="rounded-xl text-xs">
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </Button>
                      <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs">
                        {isAr ? 'حفظ الجهاز' : 'Save Device'}
                      </Button>
                    </div>
                  </form>
                ) : printerSubTab === 'devices' ? (
                  /* Sub-view 2: Configured Devices List */
                  <div className="space-y-3.5">
                    {/* Direct Hardware Pairing Ribbon */}
                    <div className="p-3.5 rounded-3xl bg-gradient-to-r from-blue-50 to-indigo-50/40 dark:from-slate-800/50 dark:to-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Cpu className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {isAr ? 'اكتشاف وتوصيل الطابعات السريع' : 'Plug & Play Hardware Auto-Detection'}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {isAr ? 'شبك مباشر عبر منفذ USB أو اقتران بلوتوث فوري بدون برامج تشغيل خارجية' : 'Direct driverless WebSerial USB or Bluetooth SPP pairing'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isConnectingHardware}
                          onClick={handleWebSerialDirectConnect}
                          className="h-8 text-xs font-semibold rounded-xl gap-1.5 bg-white dark:bg-slate-900"
                        >
                          <Usb className="w-3.5 h-3.5 text-blue-600" />
                          <span>{isAr ? 'توصيل USB مباشر' : 'Auto-Detect USB'}</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isConnectingHardware}
                          onClick={handleWebBluetoothDirectConnect}
                          className="h-8 text-xs font-semibold rounded-xl gap-1.5 bg-white dark:bg-slate-900"
                        >
                          <Bluetooth className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{isAr ? 'اقتران بلوتوث' : 'Pair Bluetooth'}</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleOpenAddCustomPrinter}
                          className="h-8 text-xs font-bold rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إضافة جهاز يدوي' : 'Custom'}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Device Cards */}
                    <div className="space-y-2.5">
                      {printerSettings.printers.map((printer) => {
                        const isReceipt = printer.role === 'receipt' || printer.role === 'both'
                        const isKitchen = printer.role === 'kitchen' || printer.role === 'both'

                        return (
                          <div
                            key={printer.id}
                            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                                  printer.connectionType === 'network_ip'
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : printer.connectionType === 'bluetooth'
                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                    : printer.connectionType === 'usb_serial'
                                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                }`}
                              >
                                {printer.connectionType === 'network_ip' ? (
                                  <Wifi className="w-5 h-5" />
                                ) : printer.connectionType === 'bluetooth' ? (
                                  <Bluetooth className="w-5 h-5" />
                                ) : printer.connectionType === 'usb_serial' ? (
                                  <Usb className="w-5 h-5" />
                                ) : (
                                  <Monitor className="w-5 h-5" />
                                )}
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                    {printer.name}
                                  </span>
                                  {printer.brand && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                      {printer.brand}
                                    </span>
                                  )}
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                                    {printer.paperWidth}
                                  </span>
                                  {printer.buzzerAlert && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                      <Volume2 className="w-3 h-3" />
                                      <span>Buzzer Alarm</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                                  <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                                    {isReceipt && (
                                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                        <Receipt className="w-3 h-3" /> {isAr ? 'فاتورة عميل' : 'Receipt'}
                                      </span>
                                    )}
                                    {isKitchen && (
                                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                        <Coffee className="w-3 h-3" /> {isAr ? 'طلب مطبخ/بارستا' : 'Kitchen KOT'}
                                      </span>
                                    )}
                                  </span>
                                  <span>•</span>
                                  <span className="font-mono text-[11px]">
                                    {printer.connectionType === 'network_ip'
                                      ? `${printer.ipAddress}:${printer.port}`
                                      : printer.connectionType === 'usb_serial'
                                      ? `USB Serial (${printer.baudRate || 19200} baud)`
                                      : printer.connectionType === 'bluetooth'
                                      ? 'Bluetooth Wireless'
                                      : 'Browser Native'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestPrint(printer)}
                                className="h-8 text-xs font-semibold rounded-xl flex items-center gap-1.5 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600"
                              >
                                <Play className="w-3 h-3 text-blue-500 fill-blue-500" />
                                <span>{isAr ? 'اختبار طباعة' : 'Test Print'}</span>
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingPrinter(printer)}
                                className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white"
                              >
                                <Settings2 className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletePrinter(printer.id)}
                                className="h-8 w-8 p-0 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Test Terminal Simulation */}
                    {testOutput && (
                      <div className="mt-3 p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] space-y-1.5 border border-slate-800 shadow-xl">
                        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                          <span className="font-bold flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span>ESC/POS Feed Output: {testOutput.printerName}</span>
                          </span>
                          <button onClick={() => setTestOutput(null)} className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded-lg bg-slate-800">
                            ✕ Close
                          </button>
                        </div>
                        <pre className="whitespace-pre-wrap leading-relaxed">{testOutput.text}</pre>
                      </div>
                    )}
                  </div>
                ) : printerSubTab === 'presets' ? (
                  /* Sub-view 3: Preset Catalog */
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <Input
                          value={presetSearch}
                          onChange={(e) => setPresetSearch(e.target.value)}
                          placeholder={isAr ? 'بحث عن موديل أو ماركة...' : 'Search model (e.g. T20, N160, TM-T88)...'}
                          className="pl-8 h-9 text-xs rounded-xl"
                        />
                      </div>
                      <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                        <SelectTrigger className="h-9 text-xs rounded-xl">
                          <SelectValue placeholder="Brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {brands.map((b) => (
                            <SelectItem key={b.value} value={b.value} className="text-xs">
                              {b.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedRoleFilter} onValueChange={setSelectedRoleFilter}>
                        <SelectTrigger className="h-9 text-xs rounded-xl">
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleCategories.map((c) => (
                            <SelectItem key={c.value} value={c.value} className="text-xs">
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                      {filteredPresets.map((preset) => {
                        const isAlreadyAdded = printerSettings.printers.some(
                          (p) => p.presetId === preset.id || p.model === preset.modelName
                        )

                        return (
                          <div
                            key={preset.id}
                            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col justify-between gap-3 group shadow-xs overflow-hidden"
                          >
                            <div className="space-y-2 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    {preset.brand}
                                  </span>
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                                    {preset.paperWidth}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 truncate max-w-[140px]">
                                  {isAr ? preset.badgeAr : preset.badge}
                                </span>
                              </div>

                              <h4 className="font-black text-sm text-slate-900 dark:text-white pt-0.5 break-words">
                                {preset.modelName}
                              </h4>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                {isAr ? preset.descriptionAr : preset.description}
                              </p>

                              <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 dark:text-slate-400">
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 font-mono">
                                  {preset.defaultConnectionType === 'network_ip'
                                    ? `LAN Port ${preset.defaultPort || 9100}`
                                    : preset.defaultConnectionType === 'usb_serial'
                                    ? `USB ${preset.defaultBaudRate} baud`
                                    : preset.defaultConnectionType}
                                </span>
                                {preset.autoCut && <span className="text-emerald-600 font-medium">✓ Auto-cut</span>}
                                {preset.openCashDrawer && <span className="text-blue-600 font-medium">✓ Cash Drawer</span>}
                                {preset.buzzerAlert && (
                                  <span className="text-amber-600 font-medium flex items-center gap-0.5">
                                    <Volume2 className="w-2.5 h-2.5" /> Buzzer Chime
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                              <span className="text-[10px] text-slate-400">
                                {isAlreadyAdded ? (isAr ? '✓ مضافة حالياً' : '✓ Active') : (isAr ? 'جاهزة للتثبيت' : 'Plug & Play')}
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleApplyPresetToNewDevice(preset)}
                                className="h-8 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>{isAr ? 'إضافة وتجهيز' : '1-Click Add'}</span>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  /* Sub-view 4: Bundles */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {PRESET_BUNDLES.map((bundle) => (
                      <div
                        key={bundle.id}
                        className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 flex flex-col justify-between gap-4 shadow-sm"
                      >
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 inline-block">
                            {isAr ? bundle.badgeAr : bundle.badge}
                          </span>
                          <h4 className="font-black text-base text-slate-900 dark:text-white">
                            {isAr ? bundle.nameAr : bundle.name}
                          </h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {isAr ? bundle.descriptionAr : bundle.description}
                          </p>

                          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {bundle.printers.map((p, i) => (
                              <div
                                key={i}
                                className="text-xs flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 font-medium"
                              >
                                <span>{p.name}</span>
                                <span className="font-mono text-[10px] text-slate-400">{p.role.toUpperCase()}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={() => handleApplyBundle(bundle.id)}
                          className="w-full h-9 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs gap-1.5 shadow-md"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>{isAr ? 'تطبيق هذه الباقة فوراً' : 'Apply Hardware Bundle'}</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 5: STORE PROFILE & LEGAL ENTITY */}
            {/* ========================================================================= */}
            {activeTab === 'store' && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-1">
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-blue-600" />
                    <span>{isAr ? 'بيانات المتجر والمنشأة التجارية' : 'Store Entity & Branch Profile'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'الاسم التجاري، كود العميل الفريد، الرقم الضريبي، وتحديد النطاق الجغرافي للفرع.'
                      : 'Business name, client code, tax registration ID, and geofencing radius.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'اسم المتجر / الكافيه / المطعم' : 'Business / Store Name'}
                    </Label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Dafaterkom Specialty Coffee"
                      className="rounded-2xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>{isAr ? 'كود العميل / الفرع' : 'Client & Branch Code'}</span>
                      <button
                        type="button"
                        onClick={handleCopyClientCode}
                        className="text-[10px] text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
                      >
                        {copiedCode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </Label>
                    <Input
                      value={clientCode}
                      onChange={(e) => setClientCode(e.target.value)}
                      className="rounded-2xl font-mono text-xs uppercase"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'الرقم الضريبي (VAT Reg Number)' : 'VAT Registration Number'}
                    </Label>
                    <Input
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      placeholder="300000000000003"
                      className="rounded-2xl font-mono text-xs"
                    />
                  </div>

                  {/* Geofencing Radius */}
                  <div className="space-y-1.5 sm:col-span-2 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isAr ? 'النطاق الجغرافي لاكتشاف العملاء القريبين (Geofence Radius)' : 'Geofence Proximity Radius'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-[11px] text-slate-400">{isAr ? 'نصف القطر (أمتار)' : 'Radius (meters)'}</Label>
                        <Input
                          type="number"
                          value={geofenceRadius}
                          onChange={(e) => setGeofenceRadius(parseFloat(e.target.value) || 200)}
                          className="h-9 text-xs rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">Latitude</Label>
                        <Input
                          type="number"
                          step="any"
                          value={geofenceLat}
                          onChange={(e) => setGeofenceLat(parseFloat(e.target.value) || 0)}
                          className="h-9 text-xs font-mono rounded-xl"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-400">Longitude</Label>
                        <Input
                          type="number"
                          step="any"
                          value={geofenceLng}
                          onChange={(e) => setGeofenceLng(parseFloat(e.target.value) || 0)}
                          className="h-9 text-xs font-mono rounded-xl"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 6: TAX, CURRENCY & COSTING */}
            {/* ========================================================================= */}
            {activeTab === 'tax_currency' && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-1">
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    <span>{isAr ? 'الضريبة والعملة وسياسات التكلفة' : 'Tax Rate, Currency & Costing Method'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'تحديد العملة الافتراضية، نسبة ضريبة القيمة المضافة (VAT)، وطريقة حساب تكلفة الهدر المخزني.'
                      : 'Configure active store currency, VAT percentage, and inventory waste evaluation.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'العملة الرسمية' : 'Store Currency'}
                    </Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SAR">🇸🇦 SAR - Saudi Riyal (ريال سعودي)</SelectItem>
                        <SelectItem value="USD">🇺🇸 USD - US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">🇪🇺 EUR - Euro (€)</SelectItem>
                        <SelectItem value="AED">🇦🇪 AED - UAE Dirham (درهم إماراتي)</SelectItem>
                        <SelectItem value="KWD">🇰🇼 KWD - Kuwaiti Dinar (دينار كويتي)</SelectItem>
                        <SelectItem value="BHD">🇧🇭 BHD - Bahraini Dinar (دينار بحريني)</SelectItem>
                        <SelectItem value="OMR">🇴🇲 OMR - Omani Rial (ريال عماني)</SelectItem>
                        <SelectItem value="QAR">🇶🇦 QAR - Qatari Rial (ريال قطري)</SelectItem>
                        <SelectItem value="EGP">🇪🇬 EGP - Egyptian Pound (جنيه مصري)</SelectItem>
                        <SelectItem value="JOD">🇯🇴 JOD - Jordanian Dinar (دينار أردني)</SelectItem>
                        <SelectItem value="GBP">🇬🇧 GBP - British Pound (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'نسبة الضريبة المضافة (VAT %)' : 'VAT / Tax Rate (%)'}
                    </Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="rounded-2xl font-mono text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'طريقة تقييم تكلفة الهدر والمخزون' : 'Inventory Costing & Waste Valuation'}
                    </Label>
                    <Select value={wasteCostingMethod} onValueChange={(val: any) => setWasteCostingMethod(val)}>
                      <SelectTrigger className="rounded-2xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fifo">FIFO - First In, First Out (الوارد أولاً يصرف أولاً - موصى به)</SelectItem>
                        <SelectItem value="wac">WAC - Weighted Average Cost (المتوسط المرجح للتكلفة)</SelectItem>
                        <SelectItem value="lifo">LIFO - Last In, First Out (الوارد أخيراً يصرف أولاً)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 7: RECEIPT & ZATCA E-INVOICE CUSTOMIZER */}
            {/* ========================================================================= */}
            {activeTab === 'receipts' && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-1">
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-blue-600" />
                    <span>{isAr ? 'تخصيص الفاتورة الورقية والفاتورة الإلكترونية ZATCA' : 'Thermal Receipt & ZATCA Customizer'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'تعديل ترويسة وتذييل الفاتورة، كود الاستجابة السريع ZATCA QR، ورابط بطاقة أبل والت.'
                      : 'Customize receipt header, footer, tax summaries, and live 80mm preview.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Editor Column */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isAr ? 'ترويسة الفاتورة (Header Text)' : 'Receipt Header Message'}
                      </Label>
                      <textarea
                        rows={3}
                        value={receiptHeader}
                        onChange={(e) => setReceiptHeader(e.target.value)}
                        className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isAr ? 'تذييل الفاتورة (Footer Message)' : 'Receipt Footer Message'}
                      </Label>
                      <textarea
                        rows={3}
                        value={receiptFooter}
                        onChange={(e) => setReceiptFooter(e.target.value)}
                        className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Right Live Simulation Preview */}
                  <div className="lg:col-span-5 flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Live 80mm Thermal Receipt Preview
                    </span>
                    <div className="w-full max-w-[260px] bg-white text-black p-4 rounded-2xl shadow-md border border-slate-300 font-mono text-[10px] select-none space-y-2">
                      <div className="text-center border-b border-dashed border-slate-400 pb-2">
                        <div className="font-extrabold text-xs">{businessName.toUpperCase()}</div>
                        <p className="text-[9px] text-slate-600 whitespace-pre-line mt-0.5">{receiptHeader}</p>
                        <p className="text-[9px] font-bold mt-1">VAT: {taxNumber}</p>
                      </div>
                      <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2 text-[9px]">
                        <div className="flex justify-between"><span>Order: #1042</span><span>Takeaway</span></div>
                        <div className="flex justify-between"><span>Date: {new Date().toLocaleDateString()}</span><span>10:30 AM</span></div>
                      </div>
                      <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 text-[9px]">
                        <div className="flex justify-between font-bold"><span>1x Spanish Latte</span><span>18.00</span></div>
                        <div className="flex justify-between font-bold"><span>1x Almond Croissant</span><span>14.00</span></div>
                      </div>
                      <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2 text-[9px]">
                        <div className="flex justify-between"><span>Subtotal:</span><span>32.00 {currency}</span></div>
                        <div className="flex justify-between"><span>VAT ({taxRate}%):</span><span>{(32 * (taxRate / 100)).toFixed(2)} {currency}</span></div>
                        <div className="flex justify-between font-black text-[11px] pt-1 border-t border-slate-300">
                          <span>TOTAL:</span><span>{(32 * (1 + taxRate / 100)).toFixed(2)} {currency}</span>
                        </div>
                      </div>
                      <div className="text-center pt-1 flex flex-col items-center">
                        <QrCode className="w-14 h-14 text-slate-800" />
                        <span className="text-[8px] text-slate-500">ZATCA Compliant E-Invoice</span>
                        <p className="text-[9px] text-slate-600 whitespace-pre-line mt-1 font-bold">{receiptFooter}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 8: TERMINAL SECURITY & CASH POLICIES */}
            {/* ========================================================================= */}
            {activeTab === 'security' && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 space-y-1">
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-rose-600" />
                    <span>{isAr ? 'سياسات الأمان وصندوق الكاشير' : 'Terminal Security & Cash Policies'}</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'صلاحيات إلغاء الطلبات، فتح درج النقدية، وسياسات حماية العمليات المالية.'
                      : 'Configure manager overrides, refund security PINs, and register controls.'}
                  </p>
                </div>

                <div className="space-y-3.5">
                  <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? 'طلب رمز المشرف (PIN) عند الإلغاء والاسترجاع' : 'Require Manager PIN for Refunds & Voids'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {isAr ? 'منع الكاشير من إلغاء أو استرجاع أي فاتورة دون موافقة وإدخال رمز المشرف' : 'Block cashiers from voiding or refunding closed tickets without manager code'}
                      </p>
                    </div>
                    <Switch checked={requireManagerPinRefund} onCheckedChange={setRequireManagerPinRefund} />
                  </div>

                  <div className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {isAr ? 'فتح درج النقدية تلقائياً عند الدفع كاش' : 'Auto-Pop Cash Drawer on Cash Tender'}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {isAr ? 'إرسال نبضة كهربائية لفتح الدرج فور سداد العميل نقداً' : 'Send pulse signal to kick cash drawer automatically upon cash transaction'}
                      </p>
                    </div>
                    <Switch checked={autoOpenCashDrawerOnCash} onCheckedChange={setAutoOpenCashDrawerOnCash} />
                  </div>

                  {/* Terminal Node info */}
                  <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>{isAr ? 'بيانات جلسة المحطة والاتصال المحلي' : 'Station Node & Offline State'}</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-600 dark:text-slate-300">
                      <div><span className="text-slate-400">Tenant:</span> {user?.id ? 'Licensed Node' : 'Default'}</div>
                      <div><span className="text-slate-400">Sync Relay:</span> Online (LAN Hub)</div>
                      <div><span className="text-slate-400">DB Engine:</span> SQLite / Prisma Local</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  )
}
