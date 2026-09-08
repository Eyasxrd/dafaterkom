'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useThemeStore } from '@/lib/store'
import { ThemeDefinition } from '@/lib/theme-engine'
import { Palette, Sparkles, Check, Sun, Moon, ShoppingBag } from 'lucide-react'

interface ThemeCreatorDialogProps {
  isOpen: boolean
  onClose: () => void
}

const COLOR_SHORTCUTS = [
  '#2563eb', // Blue
  '#059669', // Emerald
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0891b2', // Cyan
  '#ea580c', // Orange
  '#475569', // Slate
]

export default function ThemeCreatorDialog({ isOpen, onClose }: ThemeCreatorDialogProps) {
  const { addCustomTheme } = useThemeStore()

  const [themeName, setThemeName] = useState('')
  const [themeNameAr, setThemeNameAr] = useState('')
  const [isDark, setIsDark] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#2563eb')
  const [accentColor, setAccentColor] = useState('#06b6d4')
  const [bgColor, setBgColor] = useState('#f8fafc')

  const handleDarkToggle = (dark: boolean) => {
    setIsDark(dark)
    if (dark && bgColor === '#f8fafc') {
      setBgColor('#090d16')
    } else if (!dark && bgColor === '#090d16') {
      setBgColor('#f8fafc')
    }
  }

  const handleSave = () => {
    if (!themeName.trim()) return

    const customId = `custom-${Date.now()}`
    const newTheme: ThemeDefinition = {
      id: customId,
      name: themeName.trim(),
      nameAr: themeNameAr.trim() || themeName.trim(),
      description: 'Custom user-created brand theme',
      isDark,
      isCustom: true,
      colors: {
        primary: primaryColor,
        primaryForeground: '#ffffff',
        accent: accentColor,
        background: bgColor,
        foreground: isDark ? '#f8fafc' : '#0f172a',
        card: isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.8)',
        cardForeground: isDark ? '#f8fafc' : '#0f172a',
        border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(226, 232, 240, 0.8)',
        ring: primaryColor,
        gradientStart: primaryColor,
        gradientEnd: accentColor,
        mesh1: `${primaryColor}22`,
        mesh2: `${accentColor}18`
      }
    }

    addCustomTheme(newTheme)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-panel border-white/40 dark:border-white/10 p-6 rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Create Custom Brand Theme</span>
          </DialogTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tailor Dafaterkom to your restaurant or store colors. Preview updates live below.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {/* Controls Column */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold">Theme Name (English)</Label>
              <Input
                placeholder="e.g. Roastery Gold"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">اسم السمة (بالعربية - اختياري)</Label>
              <Input
                placeholder="مثال: ذهبي المحمصة"
                value={themeNameAr}
                onChange={(e) => setThemeNameAr(e.target.value)}
                className="mt-1 h-9 text-xs text-right"
                dir="rtl"
              />
            </div>

            {/* Light / Dark Mode Toggle */}
            <div>
              <Label className="text-xs font-semibold">Base Mode</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => handleDarkToggle(false)}
                  className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    !isDark
                      ? 'border-blue-600 bg-blue-50/80 text-blue-700 dark:bg-blue-900/30'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDarkToggle(true)}
                  className={`flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    isDark
                      ? 'border-blue-500 bg-slate-900 text-white shadow-sm'
                      : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Dark</span>
                </button>
              </div>
            </div>

            {/* Primary Brand Color */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Primary Brand Color</Label>
                <span className="text-[10px] font-mono text-slate-400">{primaryColor}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-300 dark:border-white/10 cursor-pointer p-0.5 bg-transparent"
                />
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_SHORTCUTS.slice(0, 6).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPrimaryColor(c)}
                      className="w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Accent Gradient Color */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Accent Gradient Color</Label>
                <span className="text-[10px] font-mono text-slate-400">{accentColor}</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-slate-300 dark:border-white/10 cursor-pointer p-0.5 bg-transparent"
                />
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_SHORTCUTS.slice(3, 9).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setAccentColor(c)}
                      className="w-5 h-5 rounded-full border border-black/10 transition-transform hover:scale-110 cursor-pointer"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live POS Preview Column */}
          <div className="flex flex-col">
            <Label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Live POS Terminal Preview</span>
            </Label>

            <div
              className="flex-1 rounded-2xl p-4 border transition-all shadow-inner flex flex-col justify-between"
              style={{
                backgroundColor: bgColor,
                color: isDark ? '#f8fafc' : '#0f172a',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
              }}
            >
              {/* Mini POS Product Card */}
              <div
                className="rounded-xl p-3 border shadow-sm transition-all"
                style={{
                  backgroundColor: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.85)',
                  borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-xs">Caffe Latte</div>
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white shadow-xs"
                    style={{ backgroundColor: primaryColor }}
                  >
                    $4.50
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mb-3">Double shot espresso with steamed velvety milk</div>
                <button
                  type="button"
                  className="w-full py-1.5 rounded-lg text-xs font-semibold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-default"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${accentColor} 100%)`
                  }}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add to Order</span>
                </button>
              </div>

              {/* Mini Cart Summary */}
              <div
                className="mt-3 p-3 rounded-xl border"
                style={{
                  backgroundColor: isDark ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.6)',
                  borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'
                }}
              >
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Grand Total</span>
                  <span style={{ color: primaryColor }}>$12.50</span>
                </div>
                <div className="text-[10px] text-slate-400">Includes 15% VAT & Service</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!themeName.trim()}
            className="text-xs gap-1.5 liquid-btn-primary"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save & Apply Theme</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
