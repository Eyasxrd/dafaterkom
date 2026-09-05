'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  MapPin,
  Send,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  Plus,
  MessageSquare,
  Flame,
  Smartphone,
  ShieldCheck,
  Palette,
  Download,
  ExternalLink,
  QrCode,
  Radio,
  Sliders,
  ChevronRight,
  TrendingUp,
  Users,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import AppleWalletPassPreview from '@/components/loyalty/AppleWalletPassPreview'
import AppleWalletButton from '@/components/loyalty/AppleWalletButton'

export default function LoyaltyCampaignManager() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // New campaign state
  const [name, setName] = useState('')
  const [rewardDescription, setRewardDescription] = useState('')
  const [discountPercent, setDiscountPercent] = useState(20)
  const [cooldownHours, setCooldownHours] = useState(12)
  const [creating, setCreating] = useState(false)

  // SMS Fallback state
  const [smsPhone, setSmsPhone] = useState('')
  const [smsSentNotice, setSmsSentNotice] = useState(false)

  // Apple Wallet Studio state
  const [tenant, setTenant] = useState<any>(null)
  const [walletConfig, setWalletConfig] = useState<any>(null)
  const [passBgColor, setPassBgColor] = useState('linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)')
  const [sampleCustomerId, setSampleCustomerId] = useState('sample-customer')

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const [res, tenantRes, configRes, custRes] = await Promise.all([
        fetch('/api/loyalty/campaigns'),
        fetch('/api/tenant'),
        fetch('/api/loyalty/apple-wallet/config'),
        fetch('/api/customers?limit=1')
      ])

      if (res.ok) {
        const data = await res.json()
        setCampaigns(data.campaigns || [])
        setRecentLogs(data.recentLogs || [])
      }
      if (tenantRes.ok) {
        const tData = await tenantRes.json()
        setTenant(tData)
      }
      if (configRes.ok) {
        const cData = await configRes.json()
        setWalletConfig(cData)
      }
      if (custRes.ok) {
        const custs = await custRes.json()
        if (Array.isArray(custs) && custs.length > 0) {
          setSampleCustomerId(custs[0].id)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !rewardDescription) return
    setCreating(true)
    try {
      const res = await fetch('/api/loyalty/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          rewardDescription,
          discountPercent,
          cooldownHours,
          triggerType: 'proximity'
        })
      })
      if (res.ok) {
        setShowCreateModal(false)
        setName('')
        setRewardDescription('')
        await loadCampaigns()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  const handleSendSmsFallback = () => {
    if (!smsPhone) return
    setSmsSentNotice(true)
    setTimeout(() => setSmsSentNotice(false), 4000)
    setSmsPhone('')
  }

  const colorPalettes = [
    {
      name: 'Emerald Green',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
      badge: 'Signature'
    },
    {
      name: 'Midnight Black',
      gradient: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #09090b 100%)'
    },
    {
      name: 'Artisan Roast',
      gradient: 'linear-gradient(135deg, #78350f 0%, #92400e 50%, #451a03 100%)'
    },
    {
      name: 'Ocean Cobalt',
      gradient: 'linear-gradient(135deg, #0369a1 0%, #0284c7 50%, #082f49 100%)'
    }
  ]

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 text-slate-900 dark:text-slate-100">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl liquid-btn-primary flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-200 dark:to-slate-300 bg-clip-text text-transparent">
              Proximity Loyalty & Apple Wallet Studio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Engage walking customers with lock-screen alerts, native Apple Wallet passes & automated reward triggers
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="liquid-btn-primary font-bold text-xs flex items-center gap-2 px-5 py-2.5 rounded-2xl cursor-pointer shadow-lg shadow-blue-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Proximity Campaign</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="glass-card p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Geofence Boundary</span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {tenant?.geofenceRadius || 250}m Radius
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Active Campaigns</span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {campaigns.length} Configured
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4 rounded-2xl flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">Recent Proximity Triggers</span>
            <div className="text-xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {recentLogs.length} Delivered
            </div>
          </div>
        </Card>
      </div>

      {/* Apple Wallet Loyalty Studio */}
      <div className="glass-panel p-6 md:p-8 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/60 dark:border-white/[0.08] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Apple Wallet Pass Designer</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider">
                  PassKit .pkpass
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Native digital loyalty card for iPhone Wallet, Apple Watch, and lock-screen proximity cards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/loyalty"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl glass-card hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Customer Enrollment Link</span>
            </a>

            <a
              href={`/api/loyalty/apple-wallet/${sampleCustomerId}`}
              className="px-4 py-2 rounded-xl liquid-btn-primary text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Test .pkpass</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Interactive Pass Mockup */}
          <div className="lg:col-span-5 flex flex-col items-center glass-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-lg">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-500" />
              <span>Live iOS Pass Preview</span>
            </div>

            <AppleWalletPassPreview
              customer={{
                id: sampleCustomerId,
                name: 'Alex Johnson',
                phone: '+1 (555) 0199',
                loyaltyPoints: 120,
                createdAt: new Date()
              }}
              tenant={tenant}
              customColors={{
                backgroundColor: passBgColor
              }}
            />

            <div className="w-full pt-4">
              <AppleWalletButton
                customerId={sampleCustomerId}
                customerName="Alex Johnson"
                className="w-full"
                buttonText="Add to Apple Wallet (Test)"
              />
            </div>
          </div>

          {/* Right: Pass Configuration & Proximity Rules */}
          <div className="lg:col-span-7 space-y-5">
            {/* Color Palette Selector */}
            <div className="space-y-3 p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <Palette className="w-4 h-4 text-blue-500" />
                <span>Card Brand Accent Palette</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {colorPalettes.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => setPassBgColor(col.gradient)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      passBgColor === col.gradient
                        ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/30 shadow-sm'
                        : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-xl mb-1.5 shadow-sm"
                      style={{ background: col.gradient }}
                    />
                    <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">{col.name}</div>
                    {col.badge && (
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase">{col.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Lock Screen Proximity Geofencing */}
            <div className="p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>Lock-Screen Proximity Geofence</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  iOS CoreLocation Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                When a customer adds this card to Apple Wallet, iOS automatically renders it on their iPhone lock screen whenever they walk within <strong>{tenant?.geofenceRadius || 200} meters</strong> of your venue:
              </p>
              <div className="p-3.5 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold shadow-inner">
                "{walletConfig?.relevantText || `Welcome to ${tenant?.businessName || 'Dafaterkom Café'}! Scan your loyalty pass to earn points.`}"
              </div>
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>Coordinates: {tenant?.geofenceLat || 40.7128}, {tenant?.geofenceLng || -74.006}</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">Boundary: {tenant?.geofenceRadius || 200}m</span>
              </div>
            </div>

            {/* Apple Developer Signing Status */}
            <div className="p-5 rounded-2xl glass-card border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>PassKit Signature & Security Status</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {walletConfig?.hasCertificates ? 'Production Signed' : 'Zero-Config Mode (Active)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Pass Type ID</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{walletConfig?.passTypeIdentifier || 'pass.com.dafaterkom.loyalty'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Apple Team ID</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{walletConfig?.teamIdentifier || '9JA6Z4KBBY'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Active Proximity Campaigns</h3>
        
        {campaigns.length === 0 ? (
          <Card className="glass-card p-8 text-center rounded-3xl">
            <div className="text-xs text-slate-400">No campaigns created yet. Click "New Proximity Campaign" to launch your first offer.</div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => (
              <div key={camp.id} className="p-5 rounded-3xl glass-card space-y-3 border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-900 dark:text-white">{camp.name}</div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{camp.rewardDescription}</p>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <span>Discount: {camp.discountPercent}%</span>
                  <span>Cooldown: {camp.cooldownHours}h</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Proximity Activity Logs */}
      <div className="space-y-4">
        <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">Recent Proximity Deliveries</h3>
        <Card className="glass-panel rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10">
          {recentLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No recent delivery logs. Proximity events will appear here when customers walk near your venue.
            </div>
          ) : (
            <div className="divide-y divide-slate-200/60 dark:divide-white/10 text-xs">
              {recentLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{log.customerName || 'Nearby Customer'}</div>
                      <div className="text-[11px] text-slate-400">{log.message}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="glass-panel bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Create Proximity Campaign</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-500 block mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Afternoon Coffee Refresher"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 block mb-1">Offer / Reward Message</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. 20% off any cold brew when you step in this afternoon!"
                  value={rewardDescription}
                  onChange={(e) => setRewardDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Discount %</label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block mb-1">Cooldown (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={cooldownHours}
                    onChange={(e) => setCooldownHours(parseInt(e.target.value) || 12)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-white/10">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="liquid-btn-primary font-bold text-xs">
                  {creating ? 'Publishing...' : 'Launch Campaign'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
