'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Printer,
  Wifi,
  Usb,
  Bluetooth,
  Monitor,
  CheckCircle2,
  Trash2,
  Plus,
  Play,
  Settings2,
  ChefHat,
  Receipt,
  RotateCw,
  AlertCircle,
  Sparkles,
  Search,
  Check,
  Volume2,
  Tag,
  Layers,
  Zap,
  SlidersHorizontal,
  PackageCheck,
  ShieldCheck,
  Cpu
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
  requestWebUsbPrinter,
  requestWebBluetoothPrinter,
  PrinterBrand,
  PrinterRole,
  PrinterConnectionType,
  PaperWidth,
  CodePage
} from '@/lib/printer-service'
import { useLocale } from 'next-intl'

interface PrinterSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialConfig?: string | object | null
  onSaveConfig?: (config: TenantPrinterSettings) => Promise<void>
}

type TabMode = 'devices' | 'presets' | 'bundles'

export default function PrinterSettingsModal({
  isOpen,
  onClose,
  initialConfig,
  onSaveConfig
}: PrinterSettingsModalProps) {
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'

  const [settings, setSettings] = useState<TenantPrinterSettings>(() =>
    parsePrinterSettings(initialConfig)
  )
  const [activeTab, setActiveTab] = useState<TabMode>('devices')
  const [editingPrinter, setEditingPrinter] = useState<PrinterDevice | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [testOutput, setTestOutput] = useState<{ printerName: string; text: string } | null>(null)
  const [successNotice, setSuccessNotice] = useState<string | null>(null)
  const [errorNotice, setErrorNotice] = useState<string | null>(null)

  // Preset Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isConnectingHardware, setIsConnectingHardware] = useState(false)

  useEffect(() => {
    if (initialConfig) {
      setSettings(parsePrinterSettings(initialConfig))
    }
  }, [initialConfig])

  const filteredPresets = useMemo(() => {
    return TOP_PRINTER_PRESETS.filter((preset) => {
      const matchBrand = selectedBrand === 'all' || preset.brand.toLowerCase() === selectedBrand.toLowerCase()
      const matchCategory =
        selectedCategory === 'all' ||
        preset.category === selectedCategory ||
        preset.defaultRole === selectedCategory ||
        (selectedCategory === 'receipt' && (preset.category === 'both' || preset.category === 'receipt')) ||
        (selectedCategory === 'kitchen' && (preset.category === 'both' || preset.category === 'kitchen'))

      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        preset.modelName.toLowerCase().includes(q) ||
        preset.brand.toLowerCase().includes(q) ||
        preset.description.toLowerCase().includes(q) ||
        preset.badge.toLowerCase().includes(q) ||
        preset.badgeAr.includes(q)

      return matchBrand && matchCategory && matchSearch
    })
  }, [searchQuery, selectedBrand, selectedCategory])

  const handleTogglePrinterStatus = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      printers: prev.printers.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p))
    }))
  }

  const handleDeletePrinter = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      printers: prev.printers.filter((p) => p.id !== id),
      defaultReceiptPrinterId:
        prev.defaultReceiptPrinterId === id ? undefined : prev.defaultReceiptPrinterId,
      defaultKitchenPrinterId:
        prev.defaultKitchenPrinterId === id ? undefined : prev.defaultKitchenPrinterId
    }))
  }

  const handleOpenAddCustomPrinter = () => {
    const defaultGeneric = TOP_PRINTER_PRESETS.find((p) => p.id === 'generic_escpos_80mm') || TOP_PRINTER_PRESETS[0]
    const newDevice = createDeviceFromPreset(defaultGeneric, isAr ? 'طابعة حرارية جديدة' : 'New Thermal Printer')
    setEditingPrinter(newDevice)
  }

  const handleApplyPresetToNewDevice = (preset: PrinterPreset) => {
    const newDevice = createDeviceFromPreset(preset)
    setSettings((prev) => {
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
    setActiveTab('devices')
    setTimeout(() => setSuccessNotice(null), 4000)
  }

  const handleApplyBundle = (bundleId: string) => {
    const newSettings = applyBundleToSettings(bundleId)
    setSettings(newSettings)
    const bundle = PRESET_BUNDLES.find((b) => b.id === bundleId)
    setSuccessNotice(
      isAr
        ? `تم تطبيق "${bundle?.nameAr || bundle?.name}" وتثبيت الطابعات بنجاح!`
        : `Applied "${bundle?.name}" hardware package with instant plug-and-play profiles!`
    )
    setActiveTab('devices')
    setTimeout(() => setSuccessNotice(null), 4000)
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
        setSettings((prev) => ({
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
        setSettings((prev) => ({
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

  const handleSelectPresetInForm = (presetId: string) => {
    const preset = TOP_PRINTER_PRESETS.find((p) => p.id === presetId)
    if (!preset || !editingPrinter) return

    setEditingPrinter({
      ...editingPrinter,
      brand: preset.brand,
      model: preset.modelName,
      presetId: preset.id,
      connectionType: preset.defaultConnectionType,
      role: editingPrinter.role || preset.defaultRole,
      ipAddress: preset.defaultIp || editingPrinter.ipAddress,
      port: preset.defaultPort || editingPrinter.port || 9100,
      baudRate: preset.defaultBaudRate || editingPrinter.baudRate || 19200,
      paperWidth: preset.paperWidth,
      autoCut: preset.autoCut,
      openCashDrawer: preset.openCashDrawer,
      buzzerAlert: preset.buzzerAlert,
      characterSet: preset.characterSet
    })
  }

  const handleSavePrinterForm = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPrinter) return

    setSettings((prev) => {
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
    const rawTicket = generateTestReceipt(printer)
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

  const handleSaveAll = async () => {
    setIsSaving(true)
    setErrorNotice(null)
    try {
      if (onSaveConfig) {
        await onSaveConfig(settings)
      } else {
        await fetch('/api/tenant', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ printerConfig: settings })
        })
      }
      setSuccessNotice(
        isAr
          ? 'تم حفظ إعدادات وتوصيلات الطابعات بنجاح!'
          : 'Printer hardware configurations saved successfully!'
      )
      setTimeout(() => {
        setSuccessNotice(null)
        onClose()
      }, 1200)
    } catch (err: any) {
      setErrorNotice(err.message || 'Failed to save printer settings')
    } finally {
      setIsSaving(false)
    }
  }

  const brands: Array<{ label: string; value: string }> = [
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

  const categories: Array<{ label: string; value: string }> = [
    { label: isAr ? 'جميع الاستخدامات' : 'All Roles', value: 'all' },
    { label: isAr ? '🧾 فواتير كاشير (Receipt)' : '🧾 Receipt Cashier', value: 'receipt' },
    { label: isAr ? '🍳 طلبات مطبخ / بارستا (KOT)' : '🍳 Kitchen / KOT', value: 'kitchen' },
    { label: isAr ? '📱 أجهزة محمولة / فود ترك' : '📱 Mobile / Handheld', value: 'mobile' },
    { label: isAr ? '🏷️ ملصقات واستكرات أكواب' : '🏷️ Cup Stickers / Label', value: 'label' }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 p-4 sm:p-6 rounded-3xl shadow-2xl">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-400/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                  <span>
                    {isAr
                      ? 'إدارة وتعريف الطابعات الجاهزة (Plug & Play)'
                      : 'Plug & Play Hardware Printer Configuration'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    ESC/POS Ready
                  </span>
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr
                    ? 'تعريفات مسبقة لأشهر طابعات الفواتير والمطبخ (Epson, Xprinter, Star, Sunmi, Bixolon) مع دعم فتح الدرج وجرس الإنذار.'
                    : 'Pre-configured profiles for industry-leading thermal printers with auto-cut, cash drawer kick & kitchen buzzers.'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Header */}
          {!editingPrinter && (
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveTab('devices')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'devices'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? `طابعاتك النشطة (${settings.printers.length})`
                    : `Active Printers (${settings.printers.length})`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'presets'
                    ? 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white shadow-sm'
                    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'كتالوج أشهر الطابعات (Top Presets)' : 'Top Printers Catalog'}</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">
                  {TOP_PRINTER_PRESETS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bundles')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'bundles'
                    ? 'bg-amber-600 text-white dark:bg-amber-500 dark:text-white shadow-sm'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>{isAr ? 'باقات الإعداد السريع (1-Click)' : '1-Click Bundles'}</span>
              </button>
            </div>
          )}
        </DialogHeader>

        {/* Notices */}
        {successNotice && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{successNotice}</span>
          </div>
        )}

        {errorNotice && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">{errorNotice}</span>
          </div>
        )}

        {/* VIEW: 1. EDIT / ADD FORM */}
        {editingPrinter ? (
          <form onSubmit={handleSavePrinterForm} className="space-y-4 py-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>
                    {editingPrinter.id.startsWith('printer_') &&
                    !settings.printers.some((p) => p.id === editingPrinter.id)
                      ? isAr
                        ? 'إضافة طابعة جديدة وتحديد البروفايل'
                        : 'Add New Thermal Device'
                      : isAr
                      ? `تعديل الطابعة: ${editingPrinter.name}`
                      : `Edit Device: ${editingPrinter.name}`}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  {isAr
                    ? 'يمكنك اختيار موديل الطابعة لتعبئة كافة المنافذ والأوامر تلقائياً'
                    : 'Select a brand preset to auto-fill ports, baud rates, and ESC/POS commands.'}
                </p>
              </div>
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

            {/* Quick Preset Selector inside Form */}
            <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl space-y-1.5">
              <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>{isAr ? 'اختر الطابعة من القائمة المسبقة (Auto Pre-Config)' : 'Load Hardware Preset'}</span>
              </Label>
              <Select
                value={editingPrinter.presetId || ''}
                onValueChange={handleSelectPresetInForm}
              >
                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-800">
                  <SelectValue placeholder={isAr ? 'اختر موديل الطابعة الجاهز...' : 'Choose a top pre-configured printer model...'} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {TOP_PRINTER_PRESETS.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold">{p.brand} {p.modelName}</span>
                        <span className="text-[10px] text-slate-400">({p.badge})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs font-semibold">
                  {isAr ? 'اسم الطابعة / المحطة' : 'Printer Name / Station Label'}
                </Label>
                <Input
                  required
                  value={editingPrinter.name}
                  onChange={(e) =>
                    setEditingPrinter({ ...editingPrinter, name: e.target.value })
                  }
                  placeholder="e.g. Counter Cashier 1, Barista Espresso KOT"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  {isAr ? 'دور الطابعة / الغرض' : 'Printer Role / Purpose'}
                </Label>
                <Select
                  value={editingPrinter.role}
                  onValueChange={(val) =>
                    setEditingPrinter({ ...editingPrinter, role: val as PrinterRole })
                  }
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
                <Label className="text-xs font-semibold">
                  {isAr ? 'طريقة التوصيل' : 'Connection Interface'}
                </Label>
                <Select
                  value={editingPrinter.connectionType}
                  onValueChange={(val) =>
                    setEditingPrinter({ ...editingPrinter, connectionType: val as PrinterConnectionType })
                  }
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
                    <Label className="text-xs font-semibold">
                      {isAr ? 'عنوان الآي بي (Network IP)' : 'Network IP Address'}
                    </Label>
                    <Input
                      required
                      value={editingPrinter.ipAddress || ''}
                      onChange={(e) =>
                        setEditingPrinter({ ...editingPrinter, ipAddress: e.target.value })
                      }
                      placeholder="192.168.1.100"
                      className="h-9 text-xs font-mono rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">
                      {isAr ? 'رقم المنفذ (Port)' : 'Port Number (RAW)'}
                    </Label>
                    <Input
                      type="number"
                      required
                      value={editingPrinter.port || 9100}
                      onChange={(e) =>
                        setEditingPrinter({
                          ...editingPrinter,
                          port: parseInt(e.target.value) || 9100
                        })
                      }
                      placeholder="9100"
                      className="h-9 text-xs font-mono rounded-xl"
                    />
                  </div>
                </>
              )}

              {editingPrinter.connectionType === 'usb_serial' && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">
                    {isAr ? 'معدل الباود (Baud Rate)' : 'Serial Baud Rate'}
                  </Label>
                  <Select
                    value={String(editingPrinter.baudRate || 19200)}
                    onValueChange={(val) =>
                      setEditingPrinter({ ...editingPrinter, baudRate: parseInt(val) || 19200 })
                    }
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9600">9600 bps (Standard)</SelectItem>
                      <SelectItem value="19200">19200 bps (Xprinter / Common)</SelectItem>
                      <SelectItem value="38400">38400 bps (Epson / Star / Bixolon)</SelectItem>
                      <SelectItem value="115200">115200 bps (Sunmi / High-speed)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs font-semibold">
                  {isAr ? 'عرض الورق' : 'Paper Width'}
                </Label>
                <Select
                  value={editingPrinter.paperWidth}
                  onValueChange={(val) =>
                    setEditingPrinter({ ...editingPrinter, paperWidth: val as PaperWidth })
                  }
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
                <Label className="text-xs font-semibold">
                  {isAr ? 'ترميز الحروف واللغة' : 'Codepage / Character Set'}
                </Label>
                <Select
                  value={editingPrinter.characterSet || 'CP1256_ARABIC'}
                  onValueChange={(val) =>
                    setEditingPrinter({ ...editingPrinter, characterSet: val as CodePage })
                  }
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CP1256_ARABIC">CP1256 (Windows Arabic + English)</SelectItem>
                    <SelectItem value="PC864_ARABIC">PC864 (Simplified Arabic)</SelectItem>
                    <SelectItem value="PC437_USA">PC437 (Standard USA / Western)</SelectItem>
                    <SelectItem value="UTF8">UTF-8 Direct (Modern Drivers)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Hardware Feature Switches */}
              <div className="sm:col-span-2 pt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold cursor-pointer">Auto Cut</Label>
                    <p className="text-[10px] text-slate-400">قص الورق آلياً</p>
                  </div>
                  <Switch
                    checked={editingPrinter.autoCut}
                    onCheckedChange={(c: boolean) =>
                      setEditingPrinter({ ...editingPrinter, autoCut: c })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold cursor-pointer">Cash Drawer</Label>
                    <p className="text-[10px] text-slate-400">فتح درج النقود</p>
                  </div>
                  <Switch
                    checked={editingPrinter.openCashDrawer}
                    onCheckedChange={(c: boolean) =>
                      setEditingPrinter({ ...editingPrinter, openCashDrawer: c })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold cursor-pointer flex items-center gap-1">
                      <Volume2 className="w-3 h-3 text-amber-500" />
                      <span>Buzzer Chime</span>
                    </Label>
                    <p className="text-[10px] text-slate-400">جرس إنذار المطبخ</p>
                  </div>
                  <Switch
                    checked={editingPrinter.buzzerAlert ?? false}
                    onCheckedChange={(c: boolean) =>
                      setEditingPrinter({ ...editingPrinter, buzzerAlert: c })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold cursor-pointer">Auto Print</Label>
                    <p className="text-[10px] text-slate-400">طباعة فورية بالطلب</p>
                  </div>
                  <Switch
                    checked={editingPrinter.autoPrintOnOrder}
                    onCheckedChange={(c: boolean) =>
                      setEditingPrinter({ ...editingPrinter, autoPrintOnOrder: c })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingPrinter(null)}
                className="rounded-xl text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs"
              >
                {isAr ? 'حفظ وإضافة للأجهزة' : 'Apply & Add to Devices'}
              </Button>
            </div>
          </form>
        ) : (
          /* TAB VIEWS */
          <div className="space-y-4 py-1">
            {/* TAB 1: ACTIVE CONNECTED DEVICES */}
            {activeTab === 'devices' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isAr ? 'الطابعات المعرفة بالنظام' : 'Configured POS & Kitchen Devices'}
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {isAr
                        ? 'تحديد طابعة الفواتير الافتراضية وطابعة أوامر المطبخ'
                        : 'Assign primary receipt and kitchen order dispatchers'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('presets')}
                      className="text-xs rounded-xl text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تصفح أشهر الطابعات' : 'Browse Top Presets'}</span>
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOpenAddCustomPrinter}
                      className="bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-slate-900 text-xs font-bold flex items-center gap-1.5 rounded-xl shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إضافة جهاز جديد' : 'Add Custom Device'}</span>
                    </Button>
                  </div>
                </div>

                {/* Auto Hardware Pair Tools Bar */}
                <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-800/40 dark:to-blue-950/20 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {isAr ? 'اكتشاف وتوصيل الطابعة المباشر (Plug & Play)' : '1-Click Direct Hardware Discovery'}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isAr
                          ? 'شبك الطابعة فوراً عبر كابل الـ USB أو اقتران البلوتوث بنقرة واحدة'
                          : 'Pair thermal printers instantly via WebSerial USB or Bluetooth SPP'}
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
                  </div>
                </div>

                {/* Printers Device List */}
                <div className="space-y-2.5">
                  {settings.printers.map((printer) => {
                    const isReceipt = printer.role === 'receipt' || printer.role === 'both'
                    const isKitchen = printer.role === 'kitchen' || printer.role === 'both'

                    return (
                      <div
                        key={printer.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          printer.isActive
                            ? 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-xs'
                            : 'border-slate-200/60 dark:border-slate-800/40 bg-slate-50/50 dark:bg-slate-900/30 opacity-60'
                        }`}
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
                                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                  {printer.brand}
                                </span>
                              )}
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                                {printer.paperWidth}
                              </span>
                              {printer.buzzerAlert && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                                  <Volume2 className="w-3 h-3" />
                                  <span>Buzzer</span>
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
                                    <ChefHat className="w-3 h-3" /> {isAr ? 'طلب مطبخ/بارستا' : 'Kitchen KOT'}
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
                                  : 'System Browser'}
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
                            title="Run ESC/POS Hardware Test Print"
                          >
                            <Play className="w-3 h-3 text-blue-500 fill-blue-500" />
                            <span>{isAr ? 'اختبار طباعة' : 'Test Print'}</span>
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPrinter(printer)}
                            className="h-8 w-8 p-0 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                            title="Edit Printer Configuration"
                          >
                            <Settings2 className="w-4 h-4" />
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePrinter(printer.id)}
                            className="h-8 w-8 p-0 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Remove Printer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Interactive Test Feed Preview */}
                {testOutput && (
                  <div className="mt-3 p-3.5 rounded-2xl bg-slate-900 text-emerald-400 font-mono text-[11px] space-y-1.5 border border-slate-800 shadow-xl">
                    <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-1.5">
                      <span className="font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>ESC/POS Feed Output: {testOutput.printerName}</span>
                      </span>
                      <button
                        onClick={() => setTestOutput(null)}
                        className="text-slate-400 hover:text-white text-xs px-2 py-0.5 rounded-lg bg-slate-800"
                      >
                        ✕ Close
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap leading-relaxed">{testOutput.text}</pre>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TOP PRINTERS PRESETS CATALOG */}
            {activeTab === 'presets' && (
              <div className="space-y-3.5">
                {/* Search & Brand Filter Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="relative sm:col-span-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isAr ? 'بحث عن موديل أو ماركة...' : 'Search model (e.g. T20, N160, TM-T88)...'}
                      className="pl-8 h-9 text-xs rounded-xl"
                    />
                  </div>

                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Filter Brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.value} value={b.value} className="text-xs">
                          {b.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Filter Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value} className="text-xs">
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preset Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {filteredPresets.map((preset) => {
                    const isAlreadyAdded = settings.printers.some(
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

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 truncate max-w-[140px]" title={isAr ? preset.badgeAr : preset.badge}>
                              {isAr ? preset.badgeAr : preset.badge}
                            </span>
                          </div>

                          <h4 className="font-black text-sm text-slate-900 dark:text-white pt-0.5 break-words">
                            {preset.modelName}
                          </h4>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {isAr ? preset.descriptionAr : preset.description}
                          </p>

                          {/* Quick spec indicators */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 font-mono">
                              {preset.defaultConnectionType === 'network_ip'
                                ? `LAN Port ${preset.defaultPort || 9100}`
                                : preset.defaultConnectionType === 'usb_serial'
                                ? `USB ${preset.defaultBaudRate} baud`
                                : preset.defaultConnectionType}
                            </span>
                            {preset.autoCut && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium">
                                ✓ Auto-cut
                              </span>
                            )}
                            {preset.openCashDrawer && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium">
                                ✓ Cash Drawer
                              </span>
                            )}
                            {preset.buzzerAlert && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-medium flex items-center gap-0.5">
                                <Volume2 className="w-2.5 h-2.5" /> Buzzer Chime
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] text-slate-400">
                            {isAlreadyAdded ? (isAr ? '✓ مضافة حالياً' : '✓ Active in list') : (isAr ? 'جاهزة للتثبيت الفوري' : 'Pre-configured')}
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
            )}

            {/* TAB 3: 1-CLICK BUNDLES */}
            {activeTab === 'bundles' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isAr
                    ? 'اختر باقة كاملة تناسب نشاطك لتجهيز طابعات الكاشير والمطبخ والبارستا بضغطة زر واحدة:'
                    : 'Select a complete pre-configured hardware pack matching your venue format:'}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {PRESET_BUNDLES.map((bundle) => (
                    <div
                      key={bundle.id}
                      className="p-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/70 hover:border-amber-400 dark:hover:border-amber-600 transition-all flex flex-col justify-between gap-4 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                            {isAr ? bundle.badgeAr : bundle.badge}
                          </span>
                        </div>

                        <h4 className="font-black text-base text-slate-900 dark:text-white">
                          {isAr ? bundle.nameAr : bundle.name}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {isAr ? bundle.descriptionAr : bundle.description}
                        </p>

                        <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {isAr ? 'الطابعات المشمولة في الباقة:' : 'Included Stations:'}
                          </span>
                          {bundle.printers.map((p, i) => (
                            <div
                              key={i}
                              className="text-xs flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 font-medium"
                            >
                              <span className="flex items-center gap-1.5">
                                {p.role === 'receipt' ? (
                                  <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                                )}
                                <span>{p.name}</span>
                              </span>
                              {p.ipAddress && (
                                <span className="font-mono text-[10px] text-slate-400">
                                  {p.ipAddress}
                                </span>
                              )}
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
                        <span>{isAr ? 'تطبيق هذه الباقة فوراً' : 'Apply & Configure Pack'}</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center sm:justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {isAr
                ? 'تعريفات ESC/POS جاهزة للتوصيل الفوري مع أدراج الكاشير وأجراس المطبخ'
                : 'Full ESC/POS Drivers & Network Sockets Ready'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
              {isAr ? 'إغلاق' : 'Close'}
            </Button>
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm"
            >
              {isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التغييرات' : 'Save Configuration')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
