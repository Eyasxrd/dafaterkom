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
  X,
  Gift,
  Cake,
  Calendar,
  Ticket,
  Percent,
  Phone,
  Mail,
  RefreshCw,
  HeartHandshake
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import AppleWalletPassPreview from '@/components/loyalty/AppleWalletPassPreview'
import AppleWalletButton from '@/components/loyalty/AppleWalletButton'
import { useLocale } from 'next-intl'

interface RetentionCustomer {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  loyaltyPoints: number
  dateOfBirth?: string | null
  daysSinceVisit?: number
  lastOrderDate?: string
  lastOrderAmount?: number
  isBirthdayToday?: boolean
  isUpcoming?: boolean
}

interface RetentionData {
  counts: {
    birthday: number
    twoWeeks: number
    oneMonth: number
    totalCustomers: number
  }
  segments: {
    birthday: RetentionCustomer[]
    twoWeeks: RetentionCustomer[]
    oneMonth: RetentionCustomer[]
  }
  recentLogs: any[]
}

export default function LoyaltyCampaignManager() {
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'
  const [activeTab, setActiveTab] = useState<'retention' | 'wallet'>('retention')
  const [activeSegmentFilter, setActiveSegmentFilter] = useState<'birthday' | 'two_weeks' | 'one_month'>('birthday')

  // Retention State
  const [retentionData, setRetentionData] = useState<RetentionData>({
    counts: { birthday: 0, twoWeeks: 0, oneMonth: 0, totalCustomers: 0 },
    segments: { birthday: [], twoWeeks: [], oneMonth: [] },
    recentLogs: []
  })
  const [retentionLoading, setRetentionLoading] = useState(true)

  // Send Offer Modal State
  const [isSendOfferModalOpen, setIsSendOfferModalOpen] = useState(false)
  const [targetSegment, setTargetSegment] = useState<'birthday' | 'two_weeks' | 'one_month'>('birthday')
  const [offerDiscount, setOfferDiscount] = useState('20')
  const [offerValidDays, setOfferValidDays] = useState('7')
  const [customMessage, setCustomMessage] = useState('')
  const [sendingOffer, setSendingOffer] = useState(false)
  const [offerResult, setOfferResult] = useState<{ success: boolean; message: string; promoCode?: string } | null>(null)

  // Apple Wallet & Proximity state (preserved)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [recentLogs, setRecentLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [name, setName] = useState('')
  const [rewardDescription, setRewardDescription] = useState('')
  const [discountPercent, setDiscountPercent] = useState(20)
  const [cooldownHours, setCooldownHours] = useState(12)
  const [creating, setCreating] = useState(false)
  const [smsPhone, setSmsPhone] = useState('')
  const [smsSentNotice, setSmsSentNotice] = useState(false)
  const [tenant, setTenant] = useState<any>(null)
  const [walletConfig, setWalletConfig] = useState<any>(null)
  const [passBgColor, setPassBgColor] = useState('linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)')
  const [sampleCustomerId, setSampleCustomerId] = useState('sample-customer')

  useEffect(() => {
    loadAllData()
  }, [])

  const loadAllData = async () => {
    await Promise.all([loadCampaigns(), loadRetentionData()])
  }

  const loadRetentionData = async () => {
    setRetentionLoading(true)
    try {
      const res = await fetch('/api/crm/retention')
      if (res.ok) {
        const data = await res.json()
        setRetentionData(data)
      }
    } catch (e) {
      console.error('Failed to load retention data:', e)
    } finally {
      setRetentionLoading(false)
    }
  }

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

  const openOfferModalForSegment = (segment: 'birthday' | 'two_weeks' | 'one_month') => {
    setTargetSegment(segment)
    setOfferResult(null)
    if (segment === 'birthday') {
      setOfferDiscount('25')
      setCustomMessage('🎂 Happy Birthday {name}! Celebrate with {discount} OFF your order today! Use Promo Code: {code}')
    } else if (segment === 'two_weeks') {
      setOfferDiscount('15')
      setCustomMessage('👋 We miss you, {name}! Enjoy {discount} OFF your next meal this week with code: {code}')
    } else {
      setOfferDiscount('20')
      setCustomMessage('🎉 Welcome back {name}! It has been a while—take {discount} OFF your next order with code: {code}')
    }
    setIsSendOfferModalOpen(true)
  }

  const handleSendRetentionOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSendingOffer(true)
    setOfferResult(null)

    try {
      const res = await fetch('/api/crm/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segment: targetSegment,
          discountPercent: parseFloat(offerDiscount) || 20,
          validDays: parseInt(offerValidDays) || 7,
          customMessage: customMessage.trim() || undefined
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to dispatch offer')
      }

      const result = await res.json()
      setOfferResult({
        success: true,
        message: `Successfully dispatched to ${result.dispatchedCount} customer(s)! Promo code generated: ${result.promoCode}`,
        promoCode: result.promoCode
      })

      await loadRetentionData()
    } catch (err: any) {
      setOfferResult({
        success: false,
        message: err.message || 'Dispatch failed'
      })
    } finally {
      setSendingOffer(false)
    }
  }

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

  const currentSegmentCustomers =
    activeSegmentFilter === 'birthday'
      ? retentionData.segments.birthday
      : activeSegmentFilter === 'two_weeks'
      ? retentionData.segments.twoWeeks
      : retentionData.segments.oneMonth

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl liquid-btn-primary flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-200 dark:to-slate-300 bg-clip-text text-transparent">
              Smart Retention, Offers & Loyalty Studio
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Automated customer winback triggers (2 weeks, 1 month), birthday celebration offers & Apple Wallet
            </p>
          </div>
        </div>

        <Button
          onClick={loadAllData}
          variant="outline"
          size="sm"
          className="glass-panel text-xs font-bold gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audience</span>
        </Button>
      </div>

      {/* Main Workspace Navigation Switcher */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('retention')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'retention'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Gift className="w-4 h-4 text-pink-500" />
          <span>{isAr ? 'عروض واسترجاع العملاء' : 'Smart Retention & Birthday Offers'}</span>
          {(retentionData.counts.birthday + retentionData.counts.twoWeeks + retentionData.counts.oneMonth) > 0 && (
            <span className="px-1.5 py-0.2 bg-pink-500 text-white text-[10px] font-black rounded-full">
              {retentionData.counts.birthday + retentionData.counts.twoWeeks + retentionData.counts.oneMonth}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('wallet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'wallet'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-4 h-4 text-blue-500" />
          <span>{isAr ? 'استوديو محفظة آبل والبطاقات' : 'Proximity & Apple Wallet Studio'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: SMART RETENTION & BIRTHDAY OFFERS (PHASE 5 CORE REQUIREMENT)   */}
      {/* ========================================================================= */}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          {/* 3 Automated Segment Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Birthday Offers */}
            <div className="glass-panel p-5 rounded-3xl border border-pink-200 dark:border-pink-900/50 bg-gradient-to-b from-pink-500/[0.04] to-transparent shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-2xl bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300">
                    <Cake className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-100 text-pink-800 dark:bg-pink-950/80 dark:text-pink-300">
                    {isAr ? 'أعياد الميلاد' : 'Birthdays'}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {retentionData.counts.birthday}
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {isAr ? 'أعياد الميلاد اليوم وهذا الأسبوع' : 'Birthdays Today & This Week'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAr 
                      ? 'أسعد ضيوفك في يوم ميلادهم بكود خصم واحتفال مخصص.' 
                      : 'Delight guests on their special day with a personalized birthday discount code.'}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => openOfferModalForSegment('birthday')}
                className="mt-5 w-full bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-700 hover:to-rose-600 text-white font-bold text-xs shadow-md cursor-pointer gap-1.5"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>{isAr ? '+ إرسال عرض عيد الميلاد' : '+ Send Birthday Offer'}</span>
              </Button>
            </div>

            {/* Card 2: 2-Week Absent */}
            <div className="glass-panel p-5 rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-b from-amber-500/[0.04] to-transparent shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                    {isAr ? 'غائب 14–29 يوماً' : '14–29 Days Absent'}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {retentionData.counts.twoWeeks}
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {isAr ? 'غائب منذ أسبوعين' : 'Absent for 2 Weeks'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAr 
                      ? 'أرسل دعوة دافئة لعميلك توضح أننا نفتقده مع خصم تشجيعي.' 
                      : "Send a warm 'We Miss You' invitation with a limited-time incentive."}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => openOfferModalForSegment('two_weeks')}
                className="mt-5 w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md cursor-pointer gap-1.5"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>{isAr ? '+ إرسال عرض وحشتنا' : '+ Send 2-Week Offer'}</span>
              </Button>
            </div>

            {/* Card 3: 1-Month+ Inactive */}
            <div className="glass-panel p-5 rounded-3xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-b from-blue-500/[0.04] to-transparent shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                    {isAr ? 'غائب 30+ يوماً' : '30+ Days Dormant'}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="text-3xl font-black text-slate-900 dark:text-white">
                    {retentionData.counts.oneMonth}
                  </div>
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                    {isAr ? 'غائب منذ شهر فأكثر' : 'Absent for 1 Month+'}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {isAr 
                      ? 'أعد جذب العملاء المنقطعين منذ فترة طويلة بكود خصم الترحيب بعودتهم.' 
                      : 'Re-engage long dormant customers with a VIP Welcome-Back discount code.'}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => openOfferModalForSegment('one_month')}
                className="mt-5 w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isAr ? '+ إرسال عرض استرجاع' : '+ Send 1-Month Offer'}</span>
              </Button>
            </div>
          </div>

          {/* Segment Customers Table */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-white/10">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Eligible Audience for Automated Offers</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Select a segment to inspect matching customers and their visit history
                </p>
              </div>

              {/* Segment Selector Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04]">
                <button
                  type="button"
                  onClick={() => setActiveSegmentFilter('birthday')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    activeSegmentFilter === 'birthday'
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🎂 Birthdays ({retentionData.counts.birthday})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSegmentFilter('two_weeks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    activeSegmentFilter === 'two_weeks'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  ⏳ 2 Weeks ({retentionData.counts.twoWeeks})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSegmentFilter('one_month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    activeSegmentFilter === 'one_month'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  🚨 1 Month+ ({retentionData.counts.oneMonth})
                </button>
              </div>
            </div>

            {/* Customers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Customer Name</th>
                    <th className="py-2.5 px-3">Phone / Contact</th>
                    <th className="py-2.5 px-3 text-center">Loyalty Points</th>
                    <th className="py-2.5 px-3">
                      {activeSegmentFilter === 'birthday' ? 'Birthday' : 'Last Visit'}
                    </th>
                    <th className="py-2.5 px-3 text-center">Inactivity Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {currentSegmentCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        No customers currently matching this segment criteria.
                      </td>
                    </tr>
                  ) : (
                    currentSegmentCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {cust.name}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {cust.phone || cust.email || 'No phone logged'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-indigo-600">
                          {cust.loyaltyPoints} pts
                        </td>
                        <td className="py-3 px-3">
                          {activeSegmentFilter === 'birthday' ? (
                            <span className="font-semibold text-pink-600">
                              {cust.dateOfBirth} {cust.isBirthdayToday ? '🎉 (Today!)' : '(Upcoming)'}
                            </span>
                          ) : (
                            <span>
                              {cust.lastOrderDate ? new Date(cust.lastOrderDate).toLocaleDateString() : 'N/A'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {activeSegmentFilter === 'birthday' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300">
                              Birthday Celebration
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              activeSegmentFilter === 'two_weeks'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}>
                              {cust.daysSinceVisit} days ago
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => openOfferModalForSegment(activeSegmentFilter)}
                            className="text-[11px] h-7 px-2.5 liquid-btn-primary cursor-pointer gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Send Offer</span>
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Dispatched Retention Logs */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-white/10 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span>Recent Dispatched Retention Offers & Notification Logs</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Date / Time</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">Message Preview</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {retentionData.recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-400">
                        No retention messages dispatched yet. Trigger an offer above!
                      </td>
                    </tr>
                  ) : (
                    retentionData.recentLogs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(log.sentAt).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {log.customer?.name}
                        </td>
                        <td className="py-2.5 px-3 uppercase text-[10px] font-mono text-indigo-600">
                          {log.channel}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {log.message}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PROXIMITY & APPLE WALLET STUDIO (PRESERVED)                    */}
      {/* ========================================================================= */}
      {activeTab === 'wallet' && (
        <div className="space-y-6">
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
                  href={`/${locale}/loyalty`}
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
              {/* Studio Controls */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h4 className="text-sm font-extrabold flex items-center gap-2 mb-2 text-slate-900 dark:text-white">
                    <Palette className="w-4 h-4 text-indigo-500" />
                    <span>Pass Gradient & Brand Color</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {colorPalettes.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setPassBgColor(c.gradient)}
                        className={`p-3 rounded-2xl border text-left cursor-pointer transition-all flex flex-col justify-between h-20 ${
                          passBgColor === c.gradient
                            ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-300'
                        }`}
                        style={{ background: c.gradient }}
                      >
                        <div className="flex justify-between items-start">
                          <span className="w-2.5 h-2.5 rounded-full bg-white shadow-sm" />
                          {c.badge && (
                            <span className="text-[9px] font-black uppercase tracking-wider bg-white/30 text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                              {c.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-extrabold text-white drop-shadow-sm">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Apple PassKit Integration Status</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pass Type Identifier:{' '}
                    <code className="font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1 py-0.5 rounded">
                      pass.com.dafaterkom.loyalty
                    </code>
                  </p>
                </div>
              </div>

              {/* Live Preview */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-2 font-bold">
                  iPhone Lock-Screen & Wallet Preview
                </span>
                <AppleWalletPassPreview
                  businessName={tenant?.businessName || 'Dafaterkom Cafe & Roastery'}
                  customerName="Sarah Jenkins"
                  points={340}
                  tierName="Gold Member"
                  gradient={passBgColor}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SEND AUTOMATED RETENTION OFFER                                     */}
      {/* ========================================================================= */}
      <Dialog open={isSendOfferModalOpen} onOpenChange={setIsSendOfferModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-pink-500" />
              <span>
                {isAr
                  ? (targetSegment === 'birthday'
                    ? 'إرسال عرض عيد الميلاد'
                    : targetSegment === 'two_weeks'
                    ? 'إرسال عرض استرجاع (أسبوعين)'
                    : 'إرسال عرض استرجاع العميل (شهر فأكثر)')
                  : (targetSegment === 'birthday'
                    ? 'Send Birthday Celebration Offer'
                    : targetSegment === 'two_weeks'
                    ? 'Send 2-Week Winback Offer'
                    : 'Send 1-Month Winback Offer')}
              </span>
            </DialogTitle>
          </DialogHeader>

          {offerResult ? (
            <div className="space-y-4 py-3">
              <div className={`p-3.5 rounded-2xl text-xs font-bold border ${
                offerResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}>
                {offerResult.message}
              </div>

              {offerResult.promoCode && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.04] text-center border">
                  <span className="text-xs text-slate-400">Generated Active Promo Code:</span>
                  <div className="text-xl font-black font-mono text-indigo-600 mt-1">
                    {offerResult.promoCode}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    This promo code is now live and redeemable at checkout!
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button onClick={() => setIsSendOfferModalOpen(false)} className="liquid-btn-primary text-xs font-bold w-full">
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSendRetentionOffer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Discount Percentage (%)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={100}
                    value={offerDiscount}
                    onChange={(e) => setOfferDiscount(e.target.value)}
                    className="mt-1 text-xs font-bold text-base"
                  />
                </div>
                <div>
                  <Label className="text-xs">Valid For (Days)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={offerValidDays}
                    onChange={(e) => setOfferValidDays(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">
                  Message Template (Supports <code className="text-[10px] bg-slate-100 px-1">{'{name}'}</code>,{' '}
                  <code className="text-[10px] bg-slate-100 px-1">{'{code}'}</code>,{' '}
                  <code className="text-[10px] bg-slate-100 px-1">{'{discount}'}</code>)
                </Label>
                <textarea
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="mt-1 w-full p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-transparent text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border text-xs text-slate-500">
                <span className="font-bold text-slate-700 dark:text-slate-300">Target Audience:</span>{' '}
                {targetSegment === 'birthday'
                  ? `${retentionData.counts.birthday} customer(s) with upcoming/today birthdays`
                  : targetSegment === 'two_weeks'
                  ? `${retentionData.counts.twoWeeks} customer(s) absent for 14-29 days`
                  : `${retentionData.counts.oneMonth} customer(s) absent for 30+ days`}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsSendOfferModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={sendingOffer} className="liquid-btn-primary text-xs font-bold gap-1.5">
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingOffer ? 'Dispatching...' : 'Dispatch Offer to Segment'}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
