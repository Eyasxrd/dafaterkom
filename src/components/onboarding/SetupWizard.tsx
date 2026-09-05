'use client'

import React, { useState, useEffect } from 'react'
import { STARTER_TEMPLATES } from '@/lib/onboarding/starter-templates'
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
  X
} from 'lucide-react'

interface SetupWizardProps {
  initialStep?: number
  onComplete: () => void
  onCancel?: () => void
}

export default function SetupWizard({ initialStep = 1, onComplete, onCancel }: SetupWizardProps) {
  const [step, setStep] = useState(initialStep)
  const totalSteps = 6

  // Form State
  const [shopName, setShopName] = useState('My Awesome Café')
  const [currency, setCurrency] = useState('USD')
  const [taxRate, setTaxRate] = useState(15)
  const [taxNumber, setTaxNumber] = useState('TAX-12345678')
  const [receiptHeader, setReceiptHeader] = useState('Welcome to our Café!\nFresh Coffee & Warm Bakes')
  const [receiptFooter, setReceiptFooter] = useState('Thank you for your visit!\nWiFi: CafeGuest / Pass: coffee2026')
  const [geofenceRadius, setGeofenceRadius] = useState(250)
  const [selectedTemplate, setSelectedTemplate] = useState('coffee-shop')
  const [deviceRole, setDeviceRole] = useState('hub')
  const [staffJoinCode, setStaffJoinCode] = useState('')
  const [codeCopied, setCodeCopied] = useState(false)
  
  // Submission & Loading State
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Load existing tenant and onboarding data
  useEffect(() => {
    let isMounted = true
    async function fetchInitialData() {
      try {
        const [tenantRes, statusRes] = await Promise.all([
          fetch('/api/tenant'),
          fetch('/api/onboarding/status')
        ])

        if (tenantRes.ok && isMounted) {
          const tenant = await tenantRes.json()
          if (tenant) {
            if (tenant.businessName) setShopName(tenant.businessName)
            if (tenant.currency) setCurrency(tenant.currency)
            if (tenant.taxRate !== undefined) setTaxRate(tenant.taxRate)
            if (tenant.taxNumber) setTaxNumber(tenant.taxNumber)
            if (tenant.receiptHeader) setReceiptHeader(tenant.receiptHeader)
            if (tenant.receiptFooter) setReceiptFooter(tenant.receiptFooter)
            if (tenant.geofenceRadius) setGeofenceRadius(tenant.geofenceRadius)
          }
        }

        if (statusRes.ok && isMounted) {
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

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'SAR': return 'ر.س '
      case 'AED': return 'د.إ '
      case 'EUR': return '€'
      case 'GBP': return '£'
      default: return '$'
    }
  }

  const handleFinishSetup = async () => {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      // 1. Update Tenant Settings & Join Code & Device Role
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
          deviceRole
        })
      })

      if (!tenantRes.ok) {
        const errorData = await tenantRes.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save shop settings.')
      }

      // 2. Apply Starter Template if selected
      if (selectedTemplate) {
        const tplRes = await fetch('/api/onboarding/apply-template', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId: selectedTemplate })
        })

        if (!tplRes.ok) {
          const tplError = await tplRes.json().catch(() => ({}))
          console.warn('Template application notice:', tplError.error)
        }
      }

      // 3. Persist flags in localStorage
      localStorage.setItem('dafaterkom_onboarding_completed', 'true')
      localStorage.setItem('cashir_onboarding_completed', 'true')
      localStorage.setItem('dafaterkom_device_role', deviceRole)
      localStorage.setItem('cashir_device_role', deviceRole)
      if (staffJoinCode) {
        localStorage.setItem('dafaterkom_primary_join_code', staffJoinCode)
        localStorage.setItem('cashir_primary_join_code', staffJoinCode)
      }

      // Trigger completion callback
      onComplete()
    } catch (e: any) {
      console.error('Setup failed:', e)
      setErrorMessage(e.message || 'An error occurred while saving your configuration.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepTitles = [
    'Profile',
    'Catalog',
    'Receipts',
    'Staff',
    'Station',
    'Launch'
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-white/10 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Wizard Header */}
        <div className="p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Quick Setup Wizard</h2>
              <p className="text-xs text-blue-100 font-medium">
                Step {step} of {totalSteps} — {stepTitles[step - 1]}
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

        {/* Interactive Step Navigator */}
        <div className="w-full bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200/60 dark:border-white/5 flex items-center justify-between gap-1 overflow-x-auto text-[11px] font-semibold">
          {stepTitles.map((title, idx) => {
            const stepNum = idx + 1
            const isActive = step === stepNum
            const isCompleted = step > stepNum

            return (
              <button
                key={title}
                onClick={() => setStep(stepNum)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
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
                <span>{title}</span>
              </button>
            )
          })}
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1">
          <div
            className="bg-gradient-to-r from-blue-600 to-cyan-500 h-1 transition-all duration-300"
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

        {/* Wizard Body */}
        <div className="p-6 md:p-8 flex-1 overflow-y-auto space-y-6 text-slate-900 dark:text-slate-100 max-h-[62vh]">

          {/* STEP 1: Business Profile */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Store className="w-4 h-4" />
                <span>Step 1: Your Business Profile</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">Tell us about your venue</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                These settings configure your tax receipts, currency formatting, and location-based customer proximity alerts.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1.5">
                    Shop / Café Name *
                  </label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                    placeholder="e.g. Blue Bottle Specialty Roastery"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1.5">
                    Primary Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-semibold"
                  >
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="SAR">SAR (ر.س - Saudi Riyal)</option>
                    <option value="AED">AED (د.إ - UAE Dirham)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                  </select>
                </div>

                <div className="md:col-span-2 glass-card p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Nearby Customer Push Radius
                    </span>
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                      {geofenceRadius} meters
                    </span>
                  </div>
                  <input
                    type="range"
                    min={100}
                    max={500}
                    step={25}
                    value={geofenceRadius}
                    onChange={(e) => setGeofenceRadius(parseInt(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                    <span>100m (Same block)</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">250m (Recommended)</span>
                    <span>500m (Neighborhood)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Choose Starter Template */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Utensils className="w-4 h-4" />
                <span>Step 2: Choose a Starter Menu Template</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">Select your business type</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                We'll pre-load popular items, pricing, and categories so your registers are instantly ready to take orders.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {STARTER_TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => setSelectedTemplate(tpl.id)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      selectedTemplate === tpl.id
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                        : 'glass-card border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-3xl mb-2">{tpl.icon}</div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">{tpl.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{tpl.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/10 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">
                        {tpl.categories.reduce((acc, c) => acc + c.items.length, 0)} pre-configured items
                      </span>
                      {selectedTemplate === tpl.id && (
                        <span className="p-1 rounded-full bg-blue-600 text-white">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Tax & Receipt Live Preview */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Receipt className="w-4 h-4" />
                <span>Step 3: Tax & 80mm Receipt Live Preview</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">Configure Tax & Receipt Design</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      Tax / VAT Rate (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={taxRate}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                      placeholder="e.g. 15"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      VAT / Tax ID Number
                    </label>
                    <input
                      type="text"
                      value={taxNumber}
                      onChange={(e) => setTaxNumber(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      Receipt Header Message
                    </label>
                    <textarea
                      rows={2}
                      value={receiptHeader}
                      onChange={(e) => setReceiptHeader(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      Receipt Footer Note
                    </label>
                    <textarea
                      rows={2}
                      value={receiptFooter}
                      onChange={(e) => setReceiptFooter(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/70 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Live 80mm Receipt Preview */}
                <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/10 flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
                    <Printer className="w-3.5 h-3.5 text-blue-500" />
                    <span>Live 80mm Thermal Receipt</span>
                  </div>

                  <div className="w-full max-w-[260px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-4 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 font-mono text-[11px] leading-relaxed">
                    <div className="text-center font-extrabold text-sm uppercase tracking-tight">{shopName}</div>
                    <div className="text-center text-[10px] text-slate-500 dark:text-slate-400 whitespace-pre-line mt-1">
                      {receiptHeader}
                    </div>
                    <div className="text-center text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                      VAT #: {taxNumber}
                    </div>
                    <div className="border-b border-dashed border-slate-300 dark:border-slate-700 my-2" />
                    <div className="flex justify-between">
                      <span>1x Double Espresso</span>
                      <span>{getCurrencySymbol(currency)}3.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1x Butter Croissant</span>
                      <span>{getCurrencySymbol(currency)}3.25</span>
                    </div>
                    <div className="border-b border-dashed border-slate-300 dark:border-slate-700 my-2" />
                    <div className="flex justify-between text-[10px]">
                      <span>Subtotal:</span>
                      <span>{getCurrencySymbol(currency)}6.75</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span>Tax ({taxRate}%):</span>
                      <span>+{getCurrencySymbol(currency)}{((6.75 * taxRate) / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200 dark:border-slate-800 mt-1">
                      <span>TOTAL:</span>
                      <span>{getCurrencySymbol(currency)}{(6.75 + (6.75 * taxRate) / 100).toFixed(2)}</span>
                    </div>
                    <div className="border-b border-dashed border-slate-300 dark:border-slate-700 my-2" />
                    <div className="text-center text-[10px] text-slate-500 dark:text-slate-400 whitespace-pre-line">
                      {receiptFooter}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Staff & Roles */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Users className="w-4 h-4" />
                <span>Step 4: Instant Staff Onboarding</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">Fast 6-digit staff join code</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Staff don't need complicated passwords. Share this join code with cashiers to let them sign in directly on the login screen.
              </p>

              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-cyan-500/10 border border-blue-500/20 text-center space-y-3">
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  Your Primary Staff Join Code
                </div>
                
                <div className="flex items-center justify-center gap-3">
                  <div className="text-4xl font-black tracking-widest text-blue-600 dark:text-blue-400 font-mono bg-white/70 dark:bg-slate-800/80 px-6 py-2 rounded-2xl border border-blue-500/30 shadow-inner">
                    {staffJoinCode || '123456'}
                  </div>
                  <button
                    onClick={handleCopyJoinCode}
                    className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all cursor-pointer"
                    title="Copy Join Code"
                  >
                    {codeCopied ? <CheckCheck className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {codeCopied ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied to clipboard!</span>
                  ) : (
                    'This code is saved to your register staff account automatically.'
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-4 rounded-2xl glass-card">
                  <div className="font-bold text-slate-900 dark:text-white">Store Manager</div>
                  <div className="text-slate-500 dark:text-slate-400 mt-1">Full control over reports, catalog, stock & settings.</div>
                </div>
                <div className="p-4 rounded-2xl glass-card">
                  <div className="font-bold text-slate-900 dark:text-white">Cashier Register</div>
                  <div className="text-slate-500 dark:text-slate-400 mt-1">Speedy order entry, split bills, receipts & discounts.</div>
                </div>
                <div className="p-4 rounded-2xl glass-card">
                  <div className="font-bold text-slate-900 dark:text-white">Kitchen Display (KDS)</div>
                  <div className="text-slate-500 dark:text-slate-400 mt-1">Live order tickets with prep timers and fulfillment checks.</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Device Station Role */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Monitor className="w-4 h-4" />
                <span>Step 5: Configure this Station Role</span>
              </div>
              <h3 className="text-2xl font-black tracking-tight">What is this terminal used for?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dafaterkom automatically connects secondary registers and kitchen displays over your local network.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {[
                  {
                    id: 'hub',
                    title: 'Main Counter (LAN Hub)',
                    desc: 'Acts as the primary register and local SQLite sync server. Keeps registers operating even without internet.'
                  },
                  {
                    id: 'terminal',
                    title: 'Secondary Register',
                    desc: 'An additional counter register or tablet linked directly to the main counter.'
                  },
                  {
                    id: 'kds',
                    title: 'Kitchen Display (KDS)',
                    desc: 'Dedicated display for baristas and kitchen staff to fulfill incoming tickets in real-time.'
                  }
                ].map((role) => (
                  <div
                    key={role.id}
                    onClick={() => setDeviceRole(role.id)}
                    className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      deviceRole === role.id
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                        : 'glass-card border-slate-200/80 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white">{role.title}</div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{role.desc}</p>
                    </div>
                    {deviceRole === role.id && (
                      <div className="mt-4 pt-3 border-t border-blue-500/20 flex justify-end">
                        <span className="p-1 rounded-full bg-blue-600 text-white">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Review & Launch */}
          {step === 6 && (
            <div className="space-y-5 text-center py-2 animate-in fade-in duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <ShieldCheck className="w-8 h-8" />
              </div>
              
              <div>
                <h3 className="text-2xl font-black tracking-tight">Your shop is ready to launch!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
                  We'll write your settings, populate the starter menu catalog, and configure offline LAN sync.
                </p>
              </div>

              <div className="p-5 rounded-2xl glass-card max-w-md mx-auto text-left text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Business Name:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{shopName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Starter Menu:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 capitalize">{selectedTemplate.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">VAT / Tax Rate:</span>
                  <span className="font-mono font-bold">{taxRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Staff Join Code:</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{staffJoinCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Station Role:</span>
                  <span className="font-bold uppercase tracking-wider">{deviceRole}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Navigation */}
        <div className="p-5 bg-slate-50/80 dark:bg-slate-950/80 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-6 py-2.5 rounded-xl liquid-btn-primary font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinishSetup}
              disabled={isSubmitting}
              className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Configuring System...' : 'Finish Setup & Open POS'}
              <Check className="w-4 h-4 stroke-[3]" />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
