'use client'

import React, { useState } from 'react'
import {
  Coffee,
  QrCode,
  Sparkles,
  Info,
  MapPin,
  CheckCircle2,
  Smartphone,
  ExternalLink,
  ChevronRight,
  RotateCw
} from 'lucide-react'
import { getLoyaltyTier } from '@/lib/apple-wallet/pass-types'

interface AppleWalletPassPreviewProps {
  customer: {
    id: string
    name: string
    phone?: string | null
    loyaltyPoints: number
    createdAt?: string | Date
  }
  tenant?: {
    businessName?: string
    geofenceLat?: number | null
    geofenceLng?: number | null
  }
  customColors?: {
    backgroundColor?: string
    labelColor?: string
    foregroundColor?: string
  }
}

export default function AppleWalletPassPreview({
  customer,
  tenant,
  customColors
}: AppleWalletPassPreviewProps) {
  const [flipped, setFlipped] = useState(false)
  const tier = getLoyaltyTier(customer.loyaltyPoints)
  const shortId = customer.id.slice(-6).toUpperCase()
  const businessName = tenant?.businessName || 'Dafaterkom Café'

  return (
    <div className="flex flex-col items-center space-y-3">
      {/* Wallet Pass Container */}
      <div className="perspective-1000 w-full max-w-[340px]">
        <div
          className={`relative w-full rounded-3xl p-5 shadow-2xl transition-all duration-500 border border-emerald-400/30 overflow-hidden text-white`}
          style={{
            background:
              customColors?.backgroundColor ||
              'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
            boxShadow: '0 20px 40px -15px rgba(5, 150, 105, 0.4)'
          }}
        >
          {/* Apple Wallet Top Notch / Cutout Accent */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-2 bg-black/20 rounded-b-xl" />

          {!flipped ? (
            /* Front of Pass */
            <div className="space-y-4 pt-1">
              {/* Header: Logo & Points */}
              <div className="flex items-start justify-between border-b border-white/15 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                    <Coffee className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">
                      {businessName}
                    </div>
                    <div className="text-[9px] text-emerald-200/80">REWARDS PASS</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200 block">
                    POINTS
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-white leading-none">
                    {customer.loyaltyPoints}
                  </span>
                </div>
              </div>

              {/* Primary Member Field */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                  MEMBER
                </div>
                <div className="text-xl font-bold tracking-tight text-white truncate">
                  {customer.name}
                </div>
              </div>

              {/* Secondary Fields Grid */}
              <div className="grid grid-cols-2 gap-2 bg-black/15 backdrop-blur-sm p-3 rounded-2xl border border-white/10">
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">
                    TIER
                  </div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                    <span>{tier}</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-200">
                    CARD ID
                  </div>
                  <div className="text-xs font-mono font-bold text-white">#{shortId}</div>
                </div>
              </div>

              {/* Barcode Section for POS Scanner */}
              <div className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center space-y-1 shadow-md text-zinc-900">
                {/* Simulated 2D QR Barcode */}
                <div className="relative p-1 bg-white">
                  <QrCode className="w-24 h-24 text-zinc-900" />
                </div>
                <div className="font-mono text-[10px] font-bold text-zinc-600 tracking-widest uppercase">
                  DAFATERKOM-CUST-{shortId}
                </div>
                <div className="text-[9px] text-zinc-400 font-medium">
                  Scan at POS register to earn & redeem
                </div>
              </div>

              {/* Card Footer: Proximity Alert & Flip Button */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <div className="flex items-center gap-1 text-emerald-100">
                  <MapPin className="w-3 h-3 text-emerald-200" />
                  <span className="text-[10px]">Lock screen alerts active</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFlipped(true)}
                  className="flex items-center gap-1 text-[10px] text-white/80 hover:text-white bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm transition-colors"
                >
                  <Info className="w-3 h-3" />
                  <span>Card Details</span>
                </button>
              </div>
            </div>
          ) : (
            /* Back of Pass */
            <div className="space-y-3 pt-1 text-left min-h-[360px] flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-white/15 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                    Pass Information
                  </span>
                  <button
                    type="button"
                    onClick={() => setFlipped(false)}
                    className="p-1 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-emerald-200">How to Earn</div>
                  <p className="text-[11px] text-white/90 leading-snug">
                    Earn 1 loyalty point for every $1 spent at {businessName}.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-emerald-200">Perks & Rewards</div>
                  <p className="text-[11px] text-white/90 leading-snug">
                    • 30 Points: Free Fresh Cookie<br />
                    • 50 Points: Free Double Espresso or Tea
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-emerald-200">Geofence Proximity</div>
                  <p className="text-[11px] text-white/90 leading-snug">
                    This card automatically surfaces on your iPhone lock screen when you are within walking distance of the café.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-emerald-200">Phone Number</div>
                  <div className="text-[11px] font-mono text-white/90">
                    {customer.phone || 'Not linked'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFlipped(false)}
                className="w-full py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors text-center"
              >
                Back to Front
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
        <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
        <span>Apple Wallet StoreCard format (.pkpass)</span>
      </div>
    </div>
  )
}
