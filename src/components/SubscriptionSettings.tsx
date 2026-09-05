'use client'

import React, { useState, useEffect } from 'react'
import { 
  Shield, 
  Check, 
  Smartphone, 
  ArrowUpRight, 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  FileText,
  CreditCard,
  Building,
  KeyRound,
  ShieldCheck,
  Download,
  Printer,
  Sparkles,
  Layers,
  ChevronRight,
  Wifi,
  Lock
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function SubscriptionSettings() {
  const [tenant, setTenant] = useState<any>(null)
  const [licenseData, setLicenseData] = useState<any>(null)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState<any | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [resLic, resBill] = await Promise.all([
        fetch('/api/license'),
        fetch('/api/billing')
      ])
      if (resLic.ok) {
        const data = await resLic.json()
        setLicenseData(data)
      }
      if (resBill.ok) {
        const data = await resBill.json()
        setTenant(data.tenant)
        setInvoices(data.records || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handlePlanChange = async (newPlan: string) => {
    setUpgrading(true)
    setSuccessMessage('')
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPlan })
      })
      if (res.ok) {
        setSuccessMessage(`Successfully updated your subscription to the ${newPlan.toUpperCase()} plan! Your offline cryptographic license has been refreshed.`)
        await fetchData()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setUpgrading(false)
    }
  }

  const currentPlan = tenant?.plan || 'growth'
  const maxDevices = licenseData?.verification?.claims?.maxDevices || (currentPlan === 'pro' ? 999 : currentPlan === 'growth' ? 5 : 1)
  const activeDevices = licenseData?.deviceCount || 1

  const plans = [
    {
      id: 'starter',
      name: 'Starter Register',
      monthlyPrice: 29,
      annualPrice: 23,
      desc: 'Ideal for coffee carts, kiosks, food trucks & solo barista operations.',
      features: [
        '1 Main Counter Register',
        'Cloud Backup & Multi-lingual POS',
        'Direct 80mm Thermal Receipt Printing',
        'Customer Profile & Points Tracker',
        'Offline Sales Resilience'
      ],
      disabledFeatures: [
        'Kitchen Display System (KDS)',
        'Granular Recipe Ingredient Depletion',
        'Apple Wallet Pass Proximity Engine'
      ]
    },
    {
      id: 'growth',
      name: 'Growth Venue',
      monthlyPrice: 79,
      annualPrice: 63,
      popular: true,
      desc: 'For active sit-down cafés, busy bakeries, and high-turnover counters.',
      features: [
        'Up to 5 Devices on Local LAN Hub',
        'Dedicated Kitchen Display System (KDS)',
        'Granular Ingredient Recipe Stock Tracking',
        'Customer Loyalty Points & Shift Cash Float',
        'Table Management & Split Billing',
        'Instant 6-Digit Staff Join Codes'
      ],
      disabledFeatures: [
        'Multi-Branch Consolidated Fleet Dashboard',
        'Custom Apple Wallet Pass Signing'
      ]
    },
    {
      id: 'pro',
      name: 'Pro Multi-Branch',
      monthlyPrice: 199,
      annualPrice: 159,
      desc: 'For high-volume chains and venues utilizing mobile proximity marketing.',
      features: [
        'Unlimited Registers, KDS Displays & Tablets',
        'Apple Wallet Lock-Screen Proximity Geofencing',
        'Custom PassKit .pkpass Signature Branding',
        'Multi-Location Centralized SaaS Fleet Reports',
        'Full Audit Trail & Price Override Tracking',
        '24/7 Priority SLA Technical Support'
      ],
      disabledFeatures: []
    }
  ]

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl liquid-btn-primary flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-200 dark:to-slate-300 bg-clip-text text-transparent">
              Subscription & Offline Licenses
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your SaaS plan, cryptographically verified offline license tokens, and station device allowances
            </p>
          </div>
        </div>

        {/* Billing Frequency Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl glass-panel border border-slate-200 dark:border-white/10 self-start sm:self-auto">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              billingCycle === 'monthly'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              billingCycle === 'annual'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span>Annual</span>
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Plan Status Banner */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-black uppercase tracking-wider shadow-sm">
              {currentPlan.toUpperCase()} PLAN
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Subscription
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {tenant?.businessName || 'Dafaterkom Specialty Coffee'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
            Your offline license signature is cryptographically verified on-device. Dafaterkom will continue executing local sales, shifts, and 80mm receipts for up to a 14-day offline grace period.
          </p>
        </div>

        {/* Device Allowance Visual Meter */}
        <div className="p-5 rounded-3xl glass-card border border-slate-200/80 dark:border-white/10 text-center min-w-[240px] z-10 shadow-lg">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Smartphone className="w-3.5 h-3.5 text-blue-500" />
            <span>Station Allowance</span>
          </div>
          <div className="text-3xl font-black mt-1 text-slate-900 dark:text-white font-mono">
            {activeDevices} <span className="text-base text-slate-400 font-normal">/ {maxDevices === 999 ? 'Unlimited' : `${maxDevices} Devices`}</span>
          </div>
          
          <div className="w-full bg-slate-200/80 dark:bg-white/10 h-2 rounded-full mt-3 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-blue-600 to-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (activeDevices / (maxDevices === 999 ? 10 : maxDevices)) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-2">
            <Wifi className="w-3 h-3" />
            <span>LAN Hub Zero-Config Sync Active</span>
          </div>
        </div>
      </div>

      {/* Plan Comparison Cards */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Compare & Select Subscription Tier</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Upgrade or switch tiers anytime. Instant license token re-generation.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const isCurrent = currentPlan === p.id
            const price = billingCycle === 'annual' ? p.annualPrice : p.monthlyPrice

            return (
              <div 
                key={p.id}
                className={`p-6 rounded-3xl border-2 flex flex-col justify-between transition-all relative ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-500/5 dark:bg-blue-500/[0.04] shadow-xl shadow-blue-500/10'
                    : p.popular
                    ? 'glass-panel border-blue-400/50 shadow-lg'
                    : 'glass-card border-slate-200/80 dark:border-white/5'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full liquid-btn-primary text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                    Most Popular
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">{p.name}</span>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-full bg-emerald-500 text-white">
                        Current Tier
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">${price}</span>
                      <span className="text-xs font-semibold text-slate-400">/ month</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {billingCycle === 'annual' ? 'Billed annually ($' + (price * 12) + '/yr)' : 'Billed monthly'}
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.desc}</p>

                  <div className="pt-3 border-t border-slate-200/60 dark:border-white/10 space-y-2 text-xs">
                    {p.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5 stroke-[3]" />
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{feat}</span>
                      </div>
                    ))}
                    {p.disabledFeatures.map((feat) => (
                      <div key={feat} className="flex items-start gap-2 text-slate-400">
                        <span className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 text-center font-bold">✕</span>
                        <span className="line-through">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-white/10">
                  <button
                    onClick={() => handlePlanChange(p.id)}
                    disabled={isCurrent || upgrading}
                    className={`w-full py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default border border-slate-200 dark:border-white/10'
                        : p.popular
                        ? 'liquid-btn-primary shadow-lg shadow-blue-600/20'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700'
                    } disabled:opacity-50`}
                  >
                    {isCurrent ? 'Current Active Tier' : upgrading ? 'Upgrading Plan...' : `Switch to ${p.name}`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cryptographic License Verification Card */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 dark:text-white">Offline Cryptographic License Token</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
                  Verified Valid
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Ed25519 / HMAC detached cryptographic token verified by local SQLite engine
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="text-xs gap-1.5 h-8 rounded-xl font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Verify Token</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-3.5 rounded-2xl glass-card space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">License Claims</span>
            <div className="font-extrabold text-slate-900 dark:text-white">
              {licenseData?.verification?.claims?.plan?.toUpperCase() || currentPlan.toUpperCase()} TIER
            </div>
            <div className="text-[11px] text-slate-400">Max Devices: {maxDevices} Station(s)</div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Expiry & Renewal</span>
            <div className="font-extrabold text-slate-900 dark:text-white font-mono">
              {licenseData?.license?.expiresAt ? new Date(licenseData.license.expiresAt).toLocaleDateString() : 'Auto-Renewing'}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">14-day offline grace active</div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400">Security Checksum</span>
            <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {licenseData?.license?.signedToken ? licenseData.license.signedToken.slice(0, 32) + '...' : 'SECURE_TOKEN_ACTIVE'}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Tamper-Resistant Signatures</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method & Invoices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Payment Card on File */}
        <div className="lg:col-span-5 glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <CreditCard className="w-4 h-4 text-blue-500" />
              <span>Payment Method on File</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
              Default Card
            </span>
          </div>

          {/* Dummy Card Preview */}
          <div className="p-5 rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono tracking-widest text-slate-300">VISA BUSINESS</span>
              <div className="w-8 h-5 rounded bg-amber-400/80 shadow-inner" />
            </div>
            <div className="text-lg font-mono tracking-widest text-white pt-2">
              •••• •••• •••• 4242
            </div>
            <div className="flex justify-between text-[10px] text-slate-300 font-mono">
              <span>EXP: 12/28</span>
              <span>DAFATERKOM SaaS VAULT</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-slate-500 dark:text-slate-400">Encrypted via Stripe 256-bit SSL</span>
            <button className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">
              Update Card
            </button>
          </div>
        </div>

        {/* Invoice History */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Billing Invoices & Receipts</span>
            </div>
            <span className="text-xs text-slate-400 font-semibold">{invoices.length} Invoices</span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden divide-y divide-slate-200/60 dark:divide-white/[0.06] text-xs">
            {invoices.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No past invoices. You are currently operating in your active subscription cycle.
              </div>
            ) : (
              invoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white font-mono">{inv.invoiceNumber || 'INV-001'}</div>
                      <div className="text-[11px] text-slate-400">{new Date(inv.createdAt).toLocaleDateString()} • {inv.paymentProvider || 'Card'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                      ${inv.amount.toFixed(2)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black uppercase text-[10px]">
                      {inv.status}
                    </span>
                    <button
                      onClick={() => setSelectedInvoiceForReceipt(inv)}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                      title="View Receipt"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Invoice Receipt Modal */}
      {selectedInvoiceForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="glass-panel bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 font-mono text-xs animate-in zoom-in-95 duration-200">
            <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
              <div className="font-black text-base uppercase">DAFATERKOM CLOUD SAAS</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Subscription Tax Invoice</div>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Invoice:</span>
                <span className="font-bold">{selectedInvoiceForReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Date:</span>
                <span>{new Date(selectedInvoiceForReceipt.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Customer:</span>
                <span className="font-bold">{tenant?.businessName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Plan:</span>
                <span className="uppercase font-bold">{tenant?.plan} Subscription</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 dark:border-slate-700 py-2 flex justify-between font-bold text-sm">
              <span>TOTAL PAID:</span>
              <span>${selectedInvoiceForReceipt.amount.toFixed(2)} USD</span>
            </div>

            <div className="text-center text-[10px] text-slate-500 dark:text-slate-400">
              Status: PAID via {selectedInvoiceForReceipt.paymentProvider || 'Stripe'}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedInvoiceForReceipt(null)}
                className="w-full text-xs font-bold"
              >
                Close Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
