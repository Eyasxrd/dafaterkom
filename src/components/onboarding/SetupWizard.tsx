'use client'

import React, { useState, useEffect } from 'react'
import { STARTER_TEMPLATES, StarterTemplate } from '@/lib/onboarding/starter-templates'
import { CURRENCY_LIST, getCurrencySymbol } from '@/lib/currency'
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Store, 
  Utensils, 
  Receipt, 
  Users, 
  Monitor, 
  ShieldCheck, 
  Printer, 
  AlertCircle,
  Copy,
  CheckCheck,
  X,
  Layers,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  QrCode,
  Flame,
  Coffee,
  Croissant,
  Pizza,
  ShoppingBag,
  Sliders,
  Percent,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  Building,
  ChefHat,
  Smartphone,
  Eye,
  Info
} from 'lucide-react'

interface SetupWizardProps {
  initialStep?: number
  onComplete: () => void
  onCancel?: () => void
}

export default function SetupWizard({ initialStep = 1, onComplete, onCancel }: SetupWizardProps) {
  const [step, setStep] = useState(initialStep)
  const totalSteps = 7

  // ==========================================
  // 1. Store Profile & Venue State
  // ==========================================
  const [shopName, setShopName] = useState('Elixir Specialty Roastery')
  const [businessType, setBusinessType] = useState('coffee-shop')
  const [branchName, setBranchName] = useState('Main Flagship - Downtown')
  const [storePhone, setStorePhone] = useState('+966 50 123 4567')
  const [storeEmail, setStoreEmail] = useState('contact@elixir-roastery.com')
  const [storeAddress, setStoreAddress] = useState('King Fahd Road, Al Olaya District')
  const [currency, setCurrency] = useState('SAR')
  const [clientCode, setClientCode] = useState(() => `CL-${Math.floor(1000 + Math.random() * 9000)}`)
  const [geofenceRadius, setGeofenceRadius] = useState(250)

  // ==========================================
  // 2. Operations & Service Model State
  // ==========================================
  const [enableCounterPOS, setEnableCounterPOS] = useState(true)
  const [enableDineIn, setEnableDineIn] = useState(true)
  const [enableTakeaway, setEnableTakeaway] = useState(true)
  const [enableQRMenu, setEnableQRMenu] = useState(true)
  const [tableCount, setTableCount] = useState(12)
  const [tableCapacity, setTableCapacity] = useState(4)
  const [enableKDS, setEnableKDS] = useState(true)
  const [orderSoundAlerts, setOrderSoundAlerts] = useState(true)

  // ==========================================
  // 3. Menu Template & Catalog State
  // ==========================================
  const [selectedTemplate, setSelectedTemplate] = useState('coffee-shop')
  const [seedInitialStock, setSeedInitialStock] = useState(true)
  const [previewTemplateModal, setPreviewTemplateModal] = useState<StarterTemplate | null>(null)

  // ==========================================
  // 4. Fiscal, VAT & Accounting State
  // ==========================================
  const [taxRate, setTaxRate] = useState(15)
  const [taxNumber, setTaxNumber] = useState('310123456700003')
  const [isTaxInclusive, setIsTaxInclusive] = useState(true)
  const [wasteCostingMethod, setWasteCostingMethod] = useState<'fifo' | 'lifo' | 'wac'>('fifo')
  const [defaultOpeningFloat, setDefaultOpeningFloat] = useState(500)

  // ==========================================
  // 5. Thermal Receipt & Hardware State
  // ==========================================
  const [receiptWidth, setReceiptWidth] = useState<'80mm' | '58mm'>('80mm')
  const [receiptHeader, setReceiptHeader] = useState('Welcome to Elixir Specialty Roastery\nCraft Coffee & Fresh Artisanal Bakes')
  const [receiptFooter, setReceiptFooter] = useState('Thank you for visiting!\nWiFi: ElixirGuest / Pass: coffee2026\nFollow us on IG @elixir.roasters')
  const [showZatcaQR, setShowZatcaQR] = useState(true)
  const [deviceRole, setDeviceRole] = useState('hub')
  const [autoOpenCashDrawer, setAutoOpenCashDrawer] = useState(true)

  // ==========================================
  // 6. Staff & Security State
  // ==========================================
  const [managerName, setManagerName] = useState('Store General Manager')
  const [staffJoinCode, setStaffJoinCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  const [cashierName, setCashierName] = useState('Counter Cashier 1')
  const [cashierPin, setCashierPin] = useState('1234')
  const [requireManagerPinRefund, setRequireManagerPinRefund] = useState(true)
  const [requireManagerPinDiscount, setRequireManagerPinDiscount] = useState(true)

  // ==========================================
  // Submission & Loading State
  // ==========================================
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionProgressStage, setSubmissionProgressStage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Load existing tenant and onboarding data
  useEffect(() => {
    let isMounted = true
    async function fetchInitialData() {
      try {
        const [tenantRes, statusRes] = await Promise.all([
          fetch('/api/tenant').catch(() => null),
          fetch('/api/onboarding/status').catch(() => null)
        ])

        if (tenantRes && tenantRes.ok && isMounted) {
          const tenant = await tenantRes.json()
          if (tenant) {
            if (tenant.businessName) setShopName(tenant.businessName)
            if (tenant.currency) setCurrency(tenant.currency)
            if (tenant.taxRate !== undefined) setTaxRate(tenant.taxRate)
            if (tenant.taxNumber) setTaxNumber(tenant.taxNumber)
            if (tenant.receiptHeader) setReceiptHeader(tenant.receiptHeader)
            if (tenant.receiptFooter) setReceiptFooter(tenant.receiptFooter)
            if (tenant.geofenceRadius) setGeofenceRadius(tenant.geofenceRadius)
            if (tenant.clientCode) setClientCode(tenant.clientCode)
            if (tenant.wasteCostingMethod) setWasteCostingMethod(tenant.wasteCostingMethod)
          }
        }

        if (statusRes && statusRes.ok && isMounted) {
          const status = await statusRes.json()
          if (status.staffJoinCode) {
            setStaffJoinCode(status.staffJoinCode)
          } else {
            setStaffJoinCode(Math.floor(100000 + Math.random() * 900000).toString())
          }
        } else if (!staffJoinCode) {
          setStaffJoinCode(Math.floor(100000 + Math.random() * 900000).toString())
        }

        const savedRole = localStorage.getItem('dafaterkom_device_role') || localStorage.getItem('cashir_device_role')
        if (savedRole && isMounted) {
          setDeviceRole(savedRole)
        }
      } catch (err) {
        console.error('Failed to load initial onboarding data:', err)
        if (!staffJoinCode) {
          setStaffJoinCode(Math.floor(100000 + Math.random() * 900000).toString())
        }
      } finally {
        if (isMounted) setLoadingInitial(false)
      }
    }

    fetchInitialData()
    return () => {
      isMounted = false
    }
  }, [])

  const handleCopyJoinCode = () => {
    if (!staffJoinCode) return
    navigator.clipboard.writeText(staffJoinCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2500)
  }

  const handleFinishSetup = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // Step 1: Update Tenant Profile & Fiscal Settings
      setSubmissionProgressStage('Saving store profile, tax configuration & accounting...')
      const tenantRes = await fetch('/api/tenant', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: shopName,
          currency,
          taxRate,
          taxNumber,
          receiptHeader,
          receiptFooter,
          geofenceRadius,
          staffJoinCode,
          deviceRole,
          clientCode,
          wasteCostingMethod,
          printerConfig: {
            paperWidth: receiptWidth,
            showZatcaQR,
            autoOpenDrawer: autoOpenCashDrawer
          }
        })
      })

      if (!tenantRes.ok) {
        const errorData = await tenantRes.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save shop settings.')
      }

      // Step 2: Apply Starter Catalog & Seed Tables
      setSubmissionProgressStage('Provisioning industry menu catalog, recipes & tables...')
      if (selectedTemplate) {
        const tplRes = await fetch('/api/onboarding/apply-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            templateId: selectedTemplate,
            tableCount: enableDineIn ? tableCount : 0,
            tableCapacity
          })
        })

        if (!tplRes.ok) {
          const tplError = await tplRes.json().catch(() => ({}))
          console.warn('Template application notice:', tplError.error)
        }
      }

      // Step 3: Configure Local Device & Local Storage
      setSubmissionProgressStage('Finalizing offline LAN node & staff registers...')
      localStorage.setItem('dafaterkom_onboarding_completed', 'true')
      localStorage.setItem('cashir_onboarding_completed', 'true')
      localStorage.setItem('dafaterkom_device_role', deviceRole)
      localStorage.setItem('cashir_device_role', deviceRole)
      localStorage.setItem('dafaterkom_opening_float', String(defaultOpeningFloat))
      localStorage.setItem('dafaterkom_sound_alerts', orderSoundAlerts ? 'true' : 'false')
      if (staffJoinCode) {
        localStorage.setItem('dafaterkom_primary_join_code', staffJoinCode)
        localStorage.setItem('cashir_primary_join_code', staffJoinCode)
      }

      // Trigger completion
      setSubmissionProgressStage('Setup complete! Opening Point of Sale...')
      setTimeout(() => {
        onComplete()
      }, 500)
    } catch (e: any) {
      console.error('Setup failed:', e)
      setErrorMessage(e.message || 'An error occurred while saving your configuration.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepTitles = [
    { title: 'Store Profile', subtitle: 'Name, Currency & Location' },
    { title: 'Operations', subtitle: 'Service Models & Tables' },
    { title: 'Menu Catalog', subtitle: 'Industry Template & Stock' },
    { title: 'Tax & Fiscal', subtitle: 'VAT & Accounting Method' },
    { title: 'Receipt & Hardware', subtitle: '80mm Thermal & Station' },
    { title: 'Staff & Security', subtitle: 'Join Code & Permissions' },
    { title: 'Review & Launch', subtitle: 'Diagnostics & Provision' }
  ]

  const activeTemplateObj = STARTER_TEMPLATES.find(t => t.id === selectedTemplate) || STARTER_TEMPLATES[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-white/10 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* ========================================================= */}
        {/* Wizard Top Header */}
        {/* ========================================================= */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight">System Onboarding & Store Setup</h2>
                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Detailed Mode
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium mt-0.5">
                Step {step} of {totalSteps}: {stepTitles[step - 1].title} — <span className="opacity-80">{stepTitles[step - 1].subtitle}</span>
              </p>
            </div>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all cursor-pointer"
              title="Close Wizard"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* Interactive Step Navigator */}
        {/* ========================================================= */}
        <div className="w-full bg-slate-100 dark:bg-slate-800/90 px-4 py-2.5 border-b border-slate-200/80 dark:border-white/5 flex items-center justify-between gap-1 overflow-x-auto text-[11px] font-semibold scrollbar-none">
          {stepTitles.map((st, idx) => {
            const stepNum = idx + 1
            const isActive = step === stepNum
            const isCompleted = step > stepNum

            return (
              <button
                key={st.title}
                onClick={() => setStep(stepNum)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold scale-102'
                    : isCompleted
                    ? 'text-emerald-600 dark:text-emerald-400 hover:bg-slate-200/60 dark:hover:bg-white/5'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  isActive ? 'bg-white text-blue-600' : isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {isCompleted ? <Check className="w-2.5 h-2.5 stroke-[3]" /> : stepNum}
                </span>
                <span>{st.title}</span>
              </button>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5">
          <div
            className="bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 h-1.5 transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Setup Error: </span>
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* Wizard Main Content Body */}
        {/* ========================================================= */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100">

          {/* --------------------------------------------------------- */}
          {/* STEP 1: Venue & Store Profile */}
          {/* --------------------------------------------------------- */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Store className="w-4 h-4" />
                <span>Step 1 of {totalSteps}: Store Identity & Profile</span>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Tell us about your venue</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure your business trade name, primary operating currency, unique account code, and store location details.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Store Name */}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    Store / Brand Name * (اسم المنشأة)
                  </label>
                  <input
                    type="text"
                    required
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="e.g. Elixir Specialty Roastery"
                  />
                </div>

                {/* Primary Currency */}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    Primary Currency (العملة الأساسية)
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  >
                    {CURRENCY_LIST.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code} ({c.symbolAr.trim()} - {c.nameAr} / {c.nameEn})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch / Outlet Name */}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    Branch / Outlet Name (اسم الفرع)
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Flagship Branch - Olaya"
                  />
                </div>

                {/* Client Code */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                      Client Account Code (كود العميل)
                    </label>
                    <button
                      type="button"
                      onClick={() => setClientCode(`CL-${Math.floor(1000 + Math.random() * 9000)}`)}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-mono font-bold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="CL-1001"
                  />
                </div>

                {/* Store Phone */}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    Contact Phone Number (رقم الهاتف)
                  </label>
                  <input
                    type="tel"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+966 50 123 4567"
                  />
                </div>

                {/* Store Email */}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    Official Store Email (البريد الإلكتروني)
                  </label>
                  <input
                    type="email"
                    value={storeEmail}
                    onChange={(e) => setStoreEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="info@yourshop.com"
                  />
                </div>

                {/* Store Address */}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    Physical Store Address (العنوان الفعلي)
                  </label>
                  <input
                    type="text"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="King Fahd Road, Al Olaya, Riyadh, Saudi Arabia"
                  />
                </div>

                {/* Geofencing Radius */}
                <div className="md:col-span-2 glass-card p-4 rounded-2xl space-y-2 border border-slate-200/80 dark:border-white/10">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      Nearby Customer Push Geofence Radius
                    </span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono text-sm">
                      {geofenceRadius} meters
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={1000}
                    step={50}
                    value={geofenceRadius}
                    onChange={(e) => setGeofenceRadius(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>100m (Immediate Street)</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">250m (Recommended)</span>
                    <span>1000m (District)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* STEP 2: Operations & Service Model */}
          {/* --------------------------------------------------------- */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4" />
                <span>Step 2 of {totalSteps}: Operations & Service Model</span>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">How does your venue operate?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose the service channels you support and let Dafaterkom automatically set up dining tables and kitchen routing.
                </p>
              </div>

              {/* Service Channels Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                {[
                  {
                    id: 'counter',
                    title: 'Counter POS',
                    desc: 'Fast checkout, cash drawer, and barcode scanning.',
                    checked: enableCounterPOS,
                    toggle: () => setEnableCounterPOS(p => !p),
                    icon: Store
                  },
                  {
                    id: 'dine_in',
                    title: 'Dine-In Tables',
                    desc: 'Table floor plans, seat counts, and split tickets.',
                    checked: enableDineIn,
                    toggle: () => setEnableDineIn(p => !p),
                    icon: Utensils
                  },
                  {
                    id: 'takeaway',
                    title: 'Takeaway / Pickup',
                    desc: 'Customer name tagging and pickup call board.',
                    checked: enableTakeaway,
                    toggle: () => setEnableTakeaway(p => !p),
                    icon: ShoppingBag
                  },
                  {
                    id: 'qr_menu',
                    title: 'QR Digital Menu',
                    desc: 'Self-ordering via smartphone table QR codes.',
                    checked: enableQRMenu,
                    toggle: () => setEnableQRMenu(p => !p),
                    icon: QrCode
                  }
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      onClick={item.toggle}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        item.checked
                          ? 'border-blue-500 bg-blue-500/10 shadow-sm'
                          : 'glass-card border-slate-200 dark:border-white/10 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`p-2 rounded-xl ${item.checked ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            item.checked ? 'bg-blue-600 text-white' : 'border border-slate-300 dark:border-slate-700'
                          }`}>
                            {item.checked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{item.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Dining Floor Generator (If Dine-In Enabled) */}
              {enableDineIn && (
                <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-blue-500" />
                        Dining Floor Auto Table Generator
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        We'll pre-create your dining tables so waitstaff and hostesses can seat guests right away.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                        Number of Tables to Generate
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={tableCount}
                        onChange={(e) => setTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-blue-600 dark:text-blue-400 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                        Default Capacity Per Table
                      </label>
                      <select
                        value={tableCapacity}
                        onChange={(e) => setTableCapacity(parseInt(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold outline-none"
                      >
                        <option value={2}>2 Persons (Couples / Intimate)</option>
                        <option value={4}>4 Persons (Standard Booth)</option>
                        <option value={6}>6 Persons (Family Table)</option>
                        <option value={8}>8 Persons (Large Group / VIP)</option>
                      </select>
                    </div>
                  </div>

                  {/* Table Live Badges Preview */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Table Layout Preview ({tableCount} Tables, {tableCount * tableCapacity} total seats):
                    </span>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                      {Array.from({ length: Math.min(tableCount, 24) }, (_, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>T-{i + 1}</span>
                          <span className="text-[10px] text-blue-500">({tableCapacity}p)</span>
                        </span>
                      ))}
                      {tableCount > 24 && (
                        <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 text-xs font-bold">
                          +{tableCount - 24} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Kitchen Display & Workflow */}
              <div className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">Kitchen Display System (KDS) Integration</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Send completed POS orders automatically to baristas & kitchen preparation screens with ticket audio alerts.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEnableKDS(p => !p)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      enableKDS ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {enableKDS ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* STEP 3: Menu Template & Catalog */}
          {/* --------------------------------------------------------- */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Utensils className="w-4 h-4" />
                <span>Step 3 of {totalSteps}: Industry Menu Template & Stock</span>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Choose your starter catalog</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  We'll pre-load popular categories, prices, preparation times, and recipes with raw ingredients for realistic inventory costing.
                </p>
              </div>

              {/* Template Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                {STARTER_TEMPLATES.map((tpl) => {
                  const isSelected = selectedTemplate === tpl.id
                  const itemCount = tpl.categories.reduce((acc, c) => acc + c.items.length, 0)
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setSelectedTemplate(tpl.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 shadow-lg shadow-blue-500/10'
                          : 'glass-card border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-3xl">{tpl.icon}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {tpl.badge}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">{tpl.name}</h4>
                        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5 font-sans">{tpl.nameAr}</div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed line-clamp-2">{tpl.description}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-400">
                          {tpl.categories.length} Cats • {itemCount} Items
                        </span>
                        {isSelected && (
                          <span className="p-1 rounded-full bg-blue-600 text-white">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Template Items & Recipe Inspector Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-blue-500" />
                    Selected Catalog Overview: <span className="text-blue-600 dark:text-blue-400 font-extrabold">{activeTemplateObj.name}</span>
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Includes Raw Ingredients & COGS Recipes
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  {activeTemplateObj.categories.map((c) => (
                    <div key={c.name} className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-white/5">
                      <div className="font-bold text-slate-900 dark:text-white flex justify-between items-center">
                        <span>{c.name}</span>
                        <span className="text-[10px] text-slate-400">({c.items.length})</span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-1">
                        {c.items.map(i => i.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* STEP 4: Fiscal, VAT & Accounting */}
          {/* --------------------------------------------------------- */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <DollarSign className="w-4 h-4" />
                <span>Step 4 of {totalSteps}: Fiscal, VAT & Valuation Accounting</span>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Tax compliance & stock valuation</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Configure your Value Added Tax (VAT) rate, commercial tax ID, price calculation rules, and stock costing method.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Tax Rate % */}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    VAT / Tax Rate (%) * (نسبة الضريبة)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none pr-10"
                      placeholder="15"
                    />
                    <Percent className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    {[15, 5, 10, 0].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setTaxRate(r)}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                          taxRate === r ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {r}% {r === 15 ? '(KSA)' : r === 5 ? '(UAE)' : ''}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tax / VAT Number */}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    Tax / VAT Identification Number (الرقم الضريبي)
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="300000000000003"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Printed on 80mm receipts and encoded inside electronic QR codes.
                  </p>
                </div>

                {/* Opening Cash Drawer Float */}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    Default Shift Opening Cash Float ({getCurrencySymbol(currency)})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={defaultOpeningFloat}
                    onChange={(e) => setDefaultOpeningFloat(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-semibold outline-none"
                    placeholder="500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Initial change loaded into cash drawer at the start of each cashier shift.
                  </p>
                </div>

                {/* Tax Inclusivity */}
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    Price Tax Calculation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsTaxInclusive(true)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center border cursor-pointer transition-all ${
                        isTaxInclusive
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      Tax Inclusive (شامل الضريبة)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTaxInclusive(false)}
                      className={`p-2.5 rounded-xl text-xs font-bold text-center border cursor-pointer transition-all ${
                        !isTaxInclusive
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      Tax Exclusive (يضاف عند الدفع)
                    </button>
                  </div>
                </div>

                {/* Waste & Stock Valuation Accounting Method */}
                <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <label className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300 block">
                    Waste & Stock Valuation Method (طريقة تقييم الهادر والمخزون في المحاسبة)
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Choose how damaged ingredients, spillage, and stock deductions are priced in your general ledger:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                    <div
                      onClick={() => setWasteCostingMethod('fifo')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        wasteCostingMethod === 'fifo'
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 shadow-xs'
                          : 'glass-card border-slate-200 dark:border-white/10 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">FIFO (السعر القديم)</span>
                        {wasteCostingMethod === 'fifo' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        First-In, First-Out: Deducts and values waste at the oldest recorded purchase invoice price.
                      </p>
                    </div>

                    <div
                      onClick={() => setWasteCostingMethod('lifo')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        wasteCostingMethod === 'lifo'
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 shadow-xs'
                          : 'glass-card border-slate-200 dark:border-white/10 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">LIFO (السعر الجديد)</span>
                        {wasteCostingMethod === 'lifo' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        Last-In, First-Out: Deducts and values waste at the latest/newest purchase invoice price.
                      </p>
                    </div>

                    <div
                      onClick={() => setWasteCostingMethod('wac')}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        wasteCostingMethod === 'wac'
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 shadow-xs'
                          : 'glass-card border-slate-200 dark:border-white/10 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs">WAC (متوسط السعر)</span>
                        {wasteCostingMethod === 'wac' && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        Weighted Average Cost: Calculates a moving average purchase cost across all supplier batches.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* STEP 5: Thermal Receipt Design & Hardware */}
          {/* --------------------------------------------------------- */}
          {step === 5 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Receipt className="w-4 h-4" />
                <span>Step 5 of {totalSteps}: Thermal Receipt Customizer & Station Hardware</span>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Receipt styling & station terminal</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Design your thermal slip, enable ZATCA electronic QR codes, and configure this terminal's role.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                {/* Form Controls */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Station Hardware Role */}
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                      Station Hardware Role (دور هذا الجهاز)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'hub', name: 'Main Hub POS', desc: 'Primary counter & SQLite LAN sync server' },
                        { id: 'terminal', name: 'Secondary POS', desc: 'Counter register linked to Main Hub' },
                        { id: 'kds', name: 'Kitchen KDS', desc: 'Dedicated kitchen ticket display' }
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setDeviceRole(r.id)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            deviceRole === r.id
                              ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200'
                              : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          <div className="font-bold text-xs">{r.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{r.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Receipt Width & QR */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                        Thermal Paper Width
                      </label>
                      <select
                        value={receiptWidth}
                        onChange={(e) => setReceiptWidth(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-xs font-bold outline-none"
                      >
                        <option value="80mm">80mm (Standard POS Printer)</option>
                        <option value="58mm">58mm (Compact Mobile Printer)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                        E-Invoice QR Code
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowZatcaQR(p => !p)}
                        className={`w-full px-3 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          showZatcaQR
                            ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>{showZatcaQR ? 'ZATCA QR Enabled' : 'QR Disabled'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Receipt Header Message */}
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                      Receipt Header Slogan (ترويسة الفاتورة)
                    </label>
                    <textarea
                      rows={2}
                      value={receiptHeader}
                      onChange={(e) => setReceiptHeader(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Welcome to our café!"
                    />
                  </div>

                  {/* Receipt Footer Message */}
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                      Receipt Footer Note & WiFi (تذييل الفاتورة)
                    </label>
                    <textarea
                      rows={2}
                      value={receiptFooter}
                      onChange={(e) => setReceiptFooter(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Thank you for visiting! WiFi password..."
                    />
                  </div>
                </div>

                {/* Live Real-Time 80mm Receipt Simulator */}
                <div className="lg:col-span-5 p-4 rounded-3xl bg-slate-100 dark:bg-slate-950/90 border border-slate-200/80 dark:border-white/10 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2.5">
                    <Printer className="w-3.5 h-3.5 text-blue-500" />
                    <span>Live {receiptWidth} Thermal Slip Preview</span>
                  </div>

                  <div className={`w-full ${receiptWidth === '80mm' ? 'max-w-[280px]' : 'max-w-[220px]'} bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] leading-relaxed transition-all`}>
                    <div className="text-center font-black text-sm uppercase tracking-tight">{shopName}</div>
                    <div className="text-center text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{branchName}</div>
                    <div className="text-center text-[9px] text-slate-500 dark:text-slate-400 whitespace-pre-line mt-1 font-sans">
                      {receiptHeader}
                    </div>
                    <div className="text-center text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      VAT #: {taxNumber}
                    </div>
                    
                    <div className="border-b border-dashed border-slate-300 dark:border-slate-700 my-2" />
                    
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold mb-1">
                      <span>ITEM</span>
                      <span>QTY / TOTAL</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1x Cortado (Oat Milk)</span>
                      <span>{getCurrencySymbol(currency)}4.25</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1x French Butter Croissant</span>
                      <span>{getCurrencySymbol(currency)}3.50</span>
                    </div>

                    <div className="border-b border-dashed border-slate-300 dark:border-slate-700 my-2" />
                    
                    <div className="flex justify-between text-[10px]">
                      <span>Subtotal:</span>
                      <span>{getCurrencySymbol(currency)}7.75</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Tax ({taxRate}%):</span>
                      <span>+{getCurrencySymbol(currency)}{((7.75 * taxRate) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-200 dark:border-slate-800 mt-1 text-slate-900 dark:text-white">
                      <span>TOTAL:</span>
                      <span>{getCurrencySymbol(currency)}{(7.75 + (7.75 * taxRate) / 100).toFixed(2)}</span>
                    </div>

                    {showZatcaQR && (
                      <div className="my-2.5 flex flex-col items-center justify-center p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/5">
                        <QrCode className="w-12 h-12 text-slate-800 dark:text-slate-200" />
                        <span className="text-[8px] text-slate-400 font-sans mt-0.5">ZATCA Compliant QR</span>
                      </div>
                    )}

                    <div className="border-b border-dashed border-slate-300 dark:border-slate-700 my-2" />
                    
                    <div className="text-center text-[9px] text-slate-500 dark:text-slate-400 whitespace-pre-line font-sans">
                      {receiptFooter}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* STEP 6: Staff & Security */}
          {/* --------------------------------------------------------- */}
          {step === 6 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Step 6 of {totalSteps}: Staff Onboarding & Manager Controls</span>
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Instant staff join code & PINs</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Cashiers and baristas sign in instantly with a 6-digit join code without tedious password setup.
                </p>
              </div>

              {/* Fast 6-digit Join Code Banner */}
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-cyan-500/10 border border-blue-500/30 text-center space-y-3">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Primary Staff Fast Join Code (رمز الدخول السريع للموظفين)</span>
                </div>
                
                <div className="flex items-center justify-center gap-3">
                  <div className="text-4xl font-black tracking-widest text-blue-600 dark:text-blue-400 font-mono bg-white/80 dark:bg-slate-900/90 px-8 py-2.5 rounded-2xl border border-blue-500/30 shadow-inner">
                    {staffJoinCode || '123456'}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyJoinCode}
                    className="p-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer"
                    title="Copy Join Code"
                  >
                    {codeCopied ? <CheckCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {codeCopied ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Copied to clipboard!</span>
                  ) : (
                    'Share this 6-digit code with your cashiers and baristas to let them clock in.'
                  )}
                </p>
              </div>

              {/* Cashier & Manager Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    Default Cashier Profile Name
                  </label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-semibold outline-none"
                    placeholder="Front Register Cashier"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 block mb-1.5">
                    Manager Override PIN (4-Digits)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cashierPin}
                    onChange={(e) => setCashierPin(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm font-mono font-bold outline-none"
                    placeholder="1234"
                  />
                </div>

                {/* Manager Permission Controls */}
                <div className="md:col-span-2 glass-card p-4 rounded-2xl space-y-3 border border-slate-200/80 dark:border-white/10">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Manager Approval & Anti-Theft Guardrails:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requireManagerPinRefund}
                        onChange={(e) => setRequireManagerPinRefund(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">Require Manager PIN for Order Refunds & Voids</div>
                        <div className="text-[10px] text-slate-400">Prevents unauthorized receipt cancellations at register</div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requireManagerPinDiscount}
                        onChange={(e) => setRequireManagerPinDiscount(e.target.checked)}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                      />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">Require Approval for Custom Discounts</div>
                        <div className="text-[10px] text-slate-400">Protects profit margins against manual price overrides</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* --------------------------------------------------------- */}
          {/* STEP 7: Review & Launch */}
          {/* --------------------------------------------------------- */}
          {step === 7 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Step 7 of {totalSteps}: System Readiness & Final Review</span>
              </div>
              
              <div className="text-center max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-3">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Your store is ready for launch!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Review your configured parameters below. Clicking finish will seed your menu catalog, generate tables, and initialize offline sync.
                </p>
              </div>

              {/* Comprehensive Summary Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Venue & Currency</span>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{shopName}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">{branchName}</div>
                  <div className="font-mono text-blue-600 dark:text-blue-400 font-bold pt-1">{currency} ({getCurrencySymbol(currency)})</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Catalog & Tables</span>
                  <div className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">{activeTemplateObj.name}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                    {activeTemplateObj.categories.reduce((acc, c) => acc + c.items.length, 0)} Items with Recipe COGS
                  </div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                    {enableDineIn ? `${tableCount} Dining Tables (${tableCount * tableCapacity} Seats)` : 'Counter Service Only'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Tax & Valuation</span>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm">{taxRate}% VAT ({isTaxInclusive ? 'Inclusive' : 'Exclusive'})</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] font-mono">Tax ID: {taxNumber || 'None'}</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 uppercase pt-1 text-[11px]">Method: {wasteCostingMethod}</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Station & Printing</span>
                  <div className="font-extrabold text-slate-900 dark:text-white text-sm uppercase">{deviceRole} Station</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">{receiptWidth} Thermal Slip</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 pt-1 text-[11px]">
                    {showZatcaQR ? '✓ ZATCA E-Invoice QR' : 'Standard Slip'}
                  </div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Staff Access Code</span>
                  <div className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-lg tracking-wider">
                    {staffJoinCode}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Passwordless Cashier Clock-in</div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 pt-1 text-[11px]">Float: {getCurrencySymbol(currency)}{defaultOpeningFloat}</div>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Customer Proximity</span>
                  <div className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">{geofenceRadius} Meters Radius</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px]">Push Notification Trigger</div>
                  <div className="font-bold text-slate-700 dark:text-slate-300 pt-1 text-[11px]">Client: {clientCode}</div>
                </div>
              </div>

              {/* Submission Progress Status */}
              {isSubmitting && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-500/30 text-center animate-pulse space-y-1">
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{submissionProgressStage || 'Provisioning store configuration...'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Please keep this window open while we set up your database.
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ========================================================= */}
        {/* Wizard Bottom Navigation Bar */}
        {/* ========================================================= */}
        <div className="p-5 bg-slate-50/90 dark:bg-slate-950/90 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {step < totalSteps ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="px-6 py-2.5 rounded-xl liquid-btn-primary font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishSetup}
                disabled={isSubmitting}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-extrabold flex items-center gap-2.5 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Provisioning Store...</span>
                  </>
                ) : (
                  <>
                    <span>Deploy & Open POS Register</span>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
