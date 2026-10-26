'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Utensils, 
  Truck, 
  Smartphone, 
  Calendar, 
  Users, 
  Sparkles, 
  QrCode, 
  Check, 
  Globe,
  Sliders,
  Palette,
  X,
  ExternalLink,
  Copy,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react'
import { MENU_CHANNELS } from './DietaryBadge'

interface MenuEditorModalProps {
  isOpen: boolean
  onClose: () => void
  menuToEdit?: any | null
  onSaved: (menu: any) => void
}

const PRESET_QR_COLORS = [
  { label: 'Slate Dark', color: '#0f172a' },
  { label: 'Emerald Green', color: '#059669' },
  { label: 'Amber Orange', color: '#ea580c' },
  { label: 'Indigo Blue', color: '#4338ca' },
  { label: 'Rose Pink', color: '#e11d48' },
  { label: 'Royal Violet', color: '#7c3aed' },
  { label: 'Teal Cyan', color: '#0d9488' }
]

const CHANNEL_DESCRIPTIONS: Record<string, string> = {
  dine_in: 'Contactless table QR ordering inside the dining room',
  delivery: 'Direct order-ahead for pickup or venue fleet delivery',
  apps: 'Formatted for third-party food delivery aggregators',
  seasonal: 'Limited-edition specials, holiday menus & pop-ups',
  catering: 'Large group platters, corporate events & packages'
}

export default function MenuEditorModal({
  isOpen,
  onClose,
  menuToEdit,
  onSaved
}: MenuEditorModalProps) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('dine_in')
  const [isActive, setIsActive] = useState(true)
  const [badgeText, setBadgeText] = useState('')
  const [qrColor, setQrColor] = useState('#0f172a')
  const [orderingEnabled, setOrderingEnabled] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState(false)

  useEffect(() => {
    if (menuToEdit) {
      setName(menuToEdit.name || '')
      setSlug(menuToEdit.slug || '')
      setDescription(menuToEdit.description || '')
      setType(menuToEdit.type || 'dine_in')
      setIsActive(menuToEdit.isActive !== false)
      setBadgeText(menuToEdit.badgeText || '')
      setQrColor(menuToEdit.qrColor || '#0f172a')
      setOrderingEnabled(menuToEdit.orderingEnabled !== false)
    } else {
      setName('')
      setSlug('')
      setDescription('')
      setType('dine_in')
      setIsActive(true)
      setBadgeText('Dine-In Contactless Ordering • Free Guest Wi-Fi')
      setQrColor('#0f172a')
      setOrderingEnabled(true)
    }
    setError(null)
    setCopiedSlug(false)
  }, [menuToEdit, isOpen])

  // Auto-slugify when creating new menu
  const handleNameChange = (val: string) => {
    setName(val)
    if (!menuToEdit) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setSlug(generated)
    }
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = `${window.location.origin}/en/menu/${slug || 'in-house'}`
      navigator.clipboard.writeText(fullUrl)
      setCopiedSlug(true)
      setTimeout(() => setCopiedSlug(false), 2000)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Please provide a menu channel name')
      return
    }

    setSubmitting(true)
    setError(null)

    const payload = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: description.trim() || null,
      type,
      isActive,
      badgeText: badgeText.trim() || null,
      qrColor,
      orderingEnabled
    }

    try {
      const url = menuToEdit ? `/api/menus/${menuToEdit.id}` : '/api/menus'
      const method = menuToEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save menu channel')
      }

      onSaved(data)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error occurred while saving menu channel')
    } finally {
      setSubmitting(false)
    }
  }

  const activeChannelConfig = MENU_CHANNELS[type] || MENU_CHANNELS.dine_in
  const ActiveChannelIcon = activeChannelConfig.icon

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[96vw] md:w-full glass-panel border border-slate-200/80 dark:border-white/10 p-6 sm:p-8 rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Header */}
          <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-white/10 mb-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl liquid-btn-primary flex items-center justify-center text-white shadow-md shrink-0">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <DialogTitle className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span>{menuToEdit ? `Edit Menu Channel: ${menuToEdit.name}` : 'Create Menu Channel'}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Channel Studio
                    </span>
                  </DialogTitle>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure multi-channel digital menus with dedicated public links, customizable QR stands, and ordering rules.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  isActive 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>{isActive ? 'Channel Live' : 'Channel Inactive'}</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/15 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer"
                  title="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </DialogHeader>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 2-Column Responsive Studio Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Menu Core Settings (Col 7) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Menu Name */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Menu Channel Name *
                  </Label>
                  <span className="text-[10px] text-slate-400">Display name for staff and guests</span>
                </div>
                <Input
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Main Dining Room, Express Takeout, Rooftop Lounge"
                  className="h-10 text-sm font-semibold rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/15 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Channel / Purpose Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Channel & Operational Purpose *
                  </Label>
                  <span className="text-[10px] text-slate-400">Determines ordering flow & badging</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(MENU_CHANNELS).map(([key, config]) => {
                    const IconComponent = config.icon
                    const isSelected = type === key
                    const desc = CHANNEL_DESCRIPTIONS[key] || 'Digital menu channel'
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setType(key)}
                        className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/25 shadow-sm'
                            : 'border-slate-200/80 dark:border-white/10 bg-white/50 dark:bg-white/[0.02] hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.05]'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${config.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {config.label}
                            </span>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                            {desc}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Subtitle / Description */}
              <div className="space-y-1.5">
                <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                  Customer Subtitle / Welcoming Note
                </Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Freshly roasted specialty coffee, artisan sandwiches & sweet treats."
                  className="h-10 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/15"
                />
              </div>

              {/* Badge Tagline */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    Badge Tagline (Visible on Menu Header & QR Card)
                  </Label>
                  <span className="text-[10px] text-slate-400">Short hospitality perks</span>
                </div>
                <Input
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g. Table Service • Free Wi-Fi • Organic Milk Available"
                  className="h-10 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/15"
                />
              </div>
            </div>

            {/* Right Column: URL, QR Styling, Live Preview & Toggles (Col 5) */}
            <div className="lg:col-span-5 space-y-4">
              {/* URL Slug */}
              <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>Public Web Link Slug *</span>
                  </Label>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedSlug ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center rounded-xl overflow-hidden border border-slate-200 dark:border-white/15 bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-xs">
                  <span className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-mono border-r border-slate-200 dark:border-white/10 select-none shrink-0">
                    /menu/
                  </span>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="dine-in"
                    className="flex-1 px-3 py-2 text-xs font-mono font-bold bg-transparent outline-none text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* QR Accent Color Picker */}
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-purple-500" />
                    <span>QR Brand Accent Color</span>
                  </Label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                    {qrColor}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {PRESET_QR_COLORS.map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() => setQrColor(c.color)}
                      className={`w-7 h-7 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center shadow-xs ${
                        qrColor === c.color ? 'border-blue-500 scale-110 ring-2 ring-blue-500/30' : 'border-white dark:border-zinc-800 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.label}
                    >
                      {qrColor === c.color && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <div className="relative flex items-center">
                    <input
                      type="color"
                      value={qrColor}
                      onChange={(e) => setQrColor(e.target.value)}
                      className="w-7 h-7 rounded-xl border border-slate-300 dark:border-white/20 cursor-pointer p-0 bg-transparent overflow-hidden"
                      title="Custom Color"
                    />
                  </div>
                </div>
              </div>

              {/* Live Card Preview Box */}
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-800 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Live Guest Scan Preview
                  </span>
                  <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400">
                    /menu/{slug || '...'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-white/10 flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: qrColor }}
                  >
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {name || 'New Menu Channel'}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        {activeChannelConfig.label}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {badgeText || description || 'Contactless Ordering Ready'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Toggles: Active & Online Ordering */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  isActive 
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-950 dark:text-emerald-200' 
                    : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                  />
                  <div className="text-xs">
                    <div className="font-bold">Active Status</div>
                    <div className="text-[10px] text-slate-400">Visible on QR link</div>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                  orderingEnabled 
                    ? 'border-blue-500/40 bg-blue-500/10 text-blue-950 dark:text-blue-200' 
                    : 'border-slate-200 dark:border-white/10 bg-white/40 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400'
                }`}>
                  <input
                    type="checkbox"
                    checked={orderingEnabled}
                    onChange={(e) => setOrderingEnabled(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                  <div className="text-xs">
                    <div className="font-bold">Self-Ordering</div>
                    <div className="text-[10px] text-slate-400">Instant digital cart</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 px-5 text-xs font-bold rounded-xl border-slate-200 dark:border-white/15"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 px-6 text-xs font-bold liquid-btn-primary rounded-xl shadow-md gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Channel...</span>
                </>
              ) : (
                <>
                  <span>{menuToEdit ? 'Save Menu Changes' : 'Create Menu Channel'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
