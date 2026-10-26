'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { 
  QrCode, 
  Printer, 
  Download, 
  Copy, 
  ExternalLink, 
  Coffee, 
  Sparkles, 
  Check, 
  Wifi, 
  Smartphone,
  Palette,
  Layers,
  X
} from 'lucide-react'
import QRCode from 'qrcode'
import DietaryBadge, { MENU_CHANNELS } from './DietaryBadge'

interface MenuQrModalProps {
  isOpen: boolean
  onClose: () => void
  menu: {
    id: string
    name: string
    slug: string
    type: string
    description?: string | null
    badgeText?: string | null
    qrColor?: string | null
  } | null
  businessName?: string
}

export default function MenuQrModal({
  isOpen,
  onClose,
  menu,
  businessName = 'Dafaterkom Café & Bakery'
}: MenuQrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [publicUrl, setPublicUrl] = useState('')
  const [customQrColor, setCustomQrColor] = useState('#0f172a')
  const [copied, setCopied] = useState(false)
  const [standFormat, setStandFormat] = useState<'stand' | 'flyer'>('stand')

  useEffect(() => {
    if (menu && typeof window !== 'undefined') {
      const origin = window.location.origin
      const url = `${origin}/en/menu/${menu.slug}`
      setPublicUrl(url)
      const color = menu.qrColor || '#0f172a'
      setCustomQrColor(color)

      QRCode.toDataURL(url, {
        width: 600,
        margin: 2,
        color: {
          dark: color,
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
        .then(setQrDataUrl)
        .catch((err) => console.error('Failed generating menu QR:', err))
    }
  }, [menu])

  // Re-generate QR if custom color changes
  const handleColorChange = (newColor: string) => {
    setCustomQrColor(newColor)
    if (publicUrl) {
      QRCode.toDataURL(publicUrl, {
        width: 600,
        margin: 2,
        color: {
          dark: newColor,
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
        .then(setQrDataUrl)
        .catch((err) => console.error('Failed generating menu QR:', err))
    }
  }

  if (!menu) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `${menu.slug}-menu-qr.png`
    a.click()
  }

  const handleCopyLink = () => {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleOpenLink = () => {
    if (publicUrl) {
      window.open(publicUrl, '_blank')
    }
  }

  const channelConfig = MENU_CHANNELS[menu.type] || MENU_CHANNELS.dine_in

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-menu-card,
          #printable-menu-card * {
            visibility: visible !important;
          }
          #printable-menu-card {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 110mm !important;
            height: 155mm !important;
            margin: 0 !important;
            padding: 10mm !important;
            background: white !important;
            color: #0f172a !important;
            border: 2px solid #0f172a !important;
            border-radius: 10mm !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            text-align: center !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl w-[96vw] md:w-full glass-panel border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="no-print pb-3 border-b border-slate-200/80 dark:border-white/10">
            <DialogTitle className="flex items-center justify-between text-base sm:text-lg font-black text-slate-900 dark:text-white">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl liquid-btn-primary flex items-center justify-center text-white shadow-md shrink-0">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span>QR Code Studio & Print Stands</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Print Ready
                    </span>
                  </div>
                  <p className="text-xs font-normal text-slate-400 mt-0.5">
                    Generate instant acrylic table stands, contactless ordering flyers & high-res vector QRs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/15 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </DialogTitle>
          </DialogHeader>

          {/* 2-Column Responsive Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-2">
            {/* Left Column: QR Controls & Export (Col 6 / 12) */}
            <div className="md:col-span-6 space-y-4 no-print">
              {/* Stand Format Selector */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                  Print Format & Layout Style
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setStandFormat('stand')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      standFormat === 'stand'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>🪧 Acrylic Table Stand</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStandFormat('flyer')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      standFormat === 'flyer'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>📄 Tabletop Flyer / Tent</span>
                  </button>
                </div>
              </div>

              {/* Color Switcher */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-500" />
                    <span>QR Brand Color Palette</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    {customQrColor}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {['#0f172a', '#059669', '#ea580c', '#4338ca', '#e11d48', '#7c3aed', '#0d9488'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleColorChange(c)}
                      className={`w-7 h-7 rounded-xl border cursor-pointer transition-transform shadow-xs ${
                        customQrColor === c ? 'scale-110 ring-2 ring-blue-500' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Quick Copy Link Box */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-2">
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                  Public Digital Menu Link
                </span>
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10">
                  <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate flex-1">
                    {publicUrl}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                    title="Copy Public URL"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Button
                  onClick={handlePrint}
                  className="liquid-btn-primary text-white font-bold gap-1.5 text-xs h-10 rounded-xl shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Stand</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={!qrDataUrl}
                  className="font-bold gap-1.5 text-xs h-10 rounded-xl border-slate-200 dark:border-white/15"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save PNG</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenLink}
                  className="font-bold gap-1.5 text-xs h-10 rounded-xl border-slate-200 dark:border-white/15"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Live</span>
                </Button>
              </div>
            </div>

            {/* Right Column: Printable Acrylic Table Stand Card (Col 6 / 12) */}
            <div className="md:col-span-6 flex justify-center">
              <div
                id="printable-menu-card"
                className="bg-white text-zinc-950 p-6 sm:p-7 rounded-3xl border-2 border-zinc-200 shadow-xl text-center space-y-4 w-full max-w-[340px] select-none transition-all"
              >
                {/* Header / Brand */}
                <div className="space-y-1 border-b border-zinc-200 pb-3">
                  <div className="flex items-center justify-center gap-1.5 text-zinc-900">
                    <Coffee className="w-5 h-5" style={{ color: customQrColor }} />
                    <span className="font-black text-sm tracking-wider uppercase">
                      {businessName}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-semibold tracking-wide">
                    Specialty Coffee & Artisan Treats
                  </p>
                </div>

                {/* Menu Title Highlight */}
                <div className="py-1 space-y-1">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full text-white inline-block shadow-xs"
                    style={{ backgroundColor: customQrColor }}
                  >
                    {channelConfig.label}
                  </span>
                  <h2 className="text-xl font-black tracking-tight text-zinc-900">
                    {menu.name}
                  </h2>
                  {menu.badgeText && (
                    <p className="text-[11px] text-zinc-500 font-medium">
                      {menu.badgeText}
                    </p>
                  )}
                </div>

                {/* High-Resolution QR Code Container */}
                <div className="flex justify-center my-2">
                  {qrDataUrl ? (
                    <div
                      className="p-3 bg-white rounded-2xl border-2 shadow-md"
                      style={{ borderColor: customQrColor }}
                    >
                      <img
                        src={qrDataUrl}
                        alt={`QR for ${menu.name}`}
                        className="w-44 h-44 object-contain rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-44 h-44 bg-zinc-100 rounded-2xl flex items-center justify-center">
                      <span className="text-xs text-zinc-400">Generating QR...</span>
                    </div>
                  )}
                </div>

                {/* Scan Instructions & Features */}
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-bold text-zinc-800">
                    Scan with your phone's camera
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-tight">
                    {menu.description || 'Browse live menu with ingredients, dietary tags & contactless checkout.'}
                  </p>

                  <div className="flex items-center justify-center gap-3 pt-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      No App Needed
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-blue-500" />
                      Fast & Live
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
