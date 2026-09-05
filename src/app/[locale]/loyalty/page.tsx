'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  Award,
  Gift,
  MapPin,
  Bell,
  CheckCircle2,
  Shield,
  Smartphone,
  Coffee,
  QrCode,
  ArrowRight,
  ChevronRight,
  Radio,
  Star,
  Check,
  Zap,
  Clock,
  Share2
} from 'lucide-react'
import AppleWalletPassPreview from '@/components/loyalty/AppleWalletPassPreview'
import AppleWalletButton from '@/components/loyalty/AppleWalletButton'

export default function CustomerLoyaltyPage() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [customer, setCustomer] = useState<any>(null)
  const [tenant, setTenant] = useState<any>(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [simulatingGeo, setSimulatingGeo] = useState(false)
  const [geoStatus, setGeoStatus] = useState<string | null>(null)
  const [smsOptIn, setSmsOptIn] = useState(true)
  const [pushOptIn, setPushOptIn] = useState(true)
  const [redeemedRewards, setRedeemedRewards] = useState<string[]>([])

  useEffect(() => {
    // Load shop details
    fetch('/api/tenant')
      .then(res => res.json())
      .then(data => setTenant(data))
      .catch(console.error)
  }, [])

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) return
    setLoading(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || `Customer (${phone.slice(-4)})`,
          phone,
          loyaltyPoints: 50 // Starter bonus points
        })
      })

      if (res.ok) {
        const data = await res.json()
        setCustomer(data)
        setIsEnrolled(true)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSimulateGeofence = async () => {
    if (!customer || !tenant) return
    setSimulatingGeo(true)
    setGeoStatus('Locating device near café coordinates...')

    try {
      const lat = (tenant.geofenceLat || 40.7128) + 0.0002
      const lng = (tenant.geofenceLng || -74.0060) + 0.0002

      const res = await fetch('/api/loyalty/proximity-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          customerId: customer.id,
          latitude: lat,
          longitude: lng
        })
      })

      const data = await res.json()
      if (data.triggered) {
        setNotification(data.message)
        setGeoStatus('Geofence Entered! Personalized invitation delivered to lock screen.')
      } else {
        setGeoStatus(data.reason || 'Geofence checked — outside campaign schedule or cooldown active')
      }
    } catch (e: any) {
      setGeoStatus('Geofence check failed: ' + e.message)
    } finally {
      setSimulatingGeo(false)
    }
  }

  const handleRedeem = (rewardId: string, pointCost: number) => {
    if (!customer || customer.loyaltyPoints < pointCost) return
    setCustomer({
      ...customer,
      loyaltyPoints: customer.loyaltyPoints - pointCost
    })
    setRedeemedRewards([...redeemedRewards, rewardId])
  }

  const currentPoints = customer?.loyaltyPoints || 50
  const getTier = (points: number) => {
    if (points >= 200) return { name: 'Platinum VIP', color: 'from-amber-400 to-amber-600', nextTier: null, ptsToNext: 0 }
    if (points >= 100) return { name: 'Gold Member', color: 'from-amber-300 to-yellow-500', nextTier: 'Platinum VIP', ptsToNext: 200 - points }
    if (points >= 50) return { name: 'Silver Member', color: 'from-slate-300 to-slate-400', nextTier: 'Gold Member', ptsToNext: 100 - points }
    return { name: 'Bronze Member', color: 'from-amber-700 to-amber-900', nextTier: 'Silver Member', ptsToNext: 50 - points }
  }

  const tier = getTier(currentPoints)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-x-hidden font-sans">
      
      {/* Ambient Mesh Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/15 to-emerald-500/20 rounded-full blur-[120px]" />
      </div>

      {/* Push Notification Simulator Banner */}
      {notification && (
        <div className="fixed top-5 left-4 right-4 max-w-md mx-auto z-50 animate-in slide-in-from-top duration-300">
          <div className="p-4 rounded-3xl bg-slate-900/95 border border-emerald-500/50 shadow-2xl backdrop-blur-xl flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 shrink-0 shadow-inner">
              <Coffee className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Lock Screen Proximity Alert
                </span>
                <button
                  onClick={() => setNotification(null)}
                  className="text-slate-400 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-slate-200 font-medium mt-1 leading-relaxed">
                {notification}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-md glass-panel bg-slate-900/80 border border-white/10 rounded-3xl p-6 md:p-7 shadow-2xl space-y-6 relative z-10 backdrop-blur-2xl">
        
        {/* Café Branding Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl liquid-btn-primary text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-600/30">
            <Coffee className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {tenant?.businessName || 'Dafaterkom Rewards'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Digital Loyalty Card & Instant Apple Wallet Member Pass
            </p>
          </div>
        </div>

        {!isEnrolled ? (
          /* Enrollment Form */
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Welcome Bonus Callout */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-cyan-500/15 border border-emerald-500/30 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-black text-emerald-300 uppercase tracking-wide">
                  50 Bonus Points On Us!
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Sign up in 10 seconds to unlock your instant welcome reward.
                </div>
              </div>
            </div>

            <form onSubmit={handleEnroll} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-700 bg-slate-800/80 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white font-semibold placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-1">
                    Mobile Phone Number *
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-700 bg-slate-800/80 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-white font-semibold placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Privacy & Notification Consents */}
              <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-white/5 space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-bold text-slate-300">Privacy & Permissions</span>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-400 hover:text-slate-300 text-[11px]">
                  <input
                    type="checkbox"
                    checked={pushOptIn}
                    onChange={(e) => setPushOptIn(e.target.checked)}
                    className="rounded accent-blue-500 cursor-pointer"
                  />
                  <span>Show my loyalty card on lock screen when near the café</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-400 hover:text-slate-300 text-[11px]">
                  <input
                    type="checkbox"
                    checked={smsOptIn}
                    onChange={(e) => setSmsOptIn(e.target.checked)}
                    className="rounded accent-blue-500 cursor-pointer"
                  />
                  <span>Receive special birthday perks and seasonal discounts</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl liquid-btn-primary font-black text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span>Generating Member Pass...</span>
                ) : (
                  <>
                    <span>Join Rewards & Get 50 Points</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Perks Preview */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Member Privileges</span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-white/5 flex items-center gap-2 text-slate-300">
                  <Gift className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Free Drink on Birthday</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/40 border border-white/5 flex items-center gap-2 text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span>1 pt per $1 spent</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Enrolled Member Dashboard */
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Member Status Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-850 border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Member Tier</span>
                <div className="text-base font-black text-white flex items-center gap-1.5 mt-0.5">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span>{tier.name}</span>
                </div>
                {tier.nextTier && (
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {tier.ptsToNext} pts to {tier.nextTier}
                  </div>
                )}
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Balance</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  {currentPoints} <span className="text-xs text-slate-400 font-normal">pts</span>
                </div>
              </div>
            </div>

            {/* Apple Wallet Digital Card */}
            <div className="flex flex-col items-center space-y-3">
              <AppleWalletPassPreview customer={customer} tenant={tenant} />
              
              <div className="w-full flex flex-col items-center pt-2 space-y-2">
                <AppleWalletButton
                  customerId={customer.id}
                  customerName={customer.name}
                  className="w-full"
                />
                <p className="text-[11px] text-slate-400 text-center">
                  Tap above to add this pass to Apple Wallet on iPhone or Apple Watch.
                </p>
              </div>
            </div>

            {/* Redeemable Perks Catalog */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Rewards</h3>
                <span className="text-[11px] text-slate-500 font-semibold">{currentPoints} pts available</span>
              </div>

              <div className="space-y-2">
                {[
                  { id: 'cookie', title: 'Artisan Butter Cookie', cost: 30, desc: 'Fresh baked daily' },
                  { id: 'espresso', title: 'Double Shot Espresso', cost: 50, desc: 'Single origin roast' },
                  { id: 'latte', title: 'Signature Spanish Latte', cost: 75, desc: 'Hot or iced specialty' }
                ].map((reward) => {
                  const canAfford = currentPoints >= reward.cost
                  const isRedeemed = redeemedRewards.includes(reward.id)

                  return (
                    <div 
                      key={reward.id} 
                      className="p-3.5 rounded-2xl bg-slate-800/60 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${
                          canAfford ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-500'
                        }`}>
                          <Gift className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-white">{reward.title}</div>
                          <div className="text-slate-400 text-[10px]">{reward.cost} points • {reward.desc}</div>
                        </div>
                      </div>

                      {isRedeemed ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          Redeemed!
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRedeem(reward.id, reward.cost)}
                          disabled={!canAfford}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            canAfford
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                          }`}
                        >
                          {canAfford ? 'Redeem' : `Need ${reward.cost - currentPoints} more`}
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Geofencing Proximity Simulator */}
            <div className="p-4 rounded-3xl bg-slate-800/40 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Proximity Lock-Screen Simulator</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold">
                  {tenant?.geofenceRadius || 250}m Radius
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Test how your iPhone lock screen reacts when walking past {tenant?.businessName || 'this café'}.
              </p>
              <button
                onClick={handleSimulateGeofence}
                disabled={simulatingGeo}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Radio className={`w-3.5 h-3.5 text-amber-400 ${simulatingGeo ? 'animate-pulse' : ''}`} />
                {simulatingGeo ? 'Pinging Location Engine...' : 'Simulate Walking Near Café'}
              </button>
              {geoStatus && (
                <div className="text-[11px] text-emerald-400 font-mono text-center pt-1 animate-in fade-in">
                  {geoStatus}
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}
