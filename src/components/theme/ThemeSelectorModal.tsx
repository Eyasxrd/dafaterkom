'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/lib/store'
import ThemeCreatorDialog from './ThemeCreatorDialog'
import { Palette, Check, Plus, Trash2, Sparkles, Sun, Moon } from 'lucide-react'

interface ThemeSelectorModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
  const { activeThemeId, setActiveTheme, getAllThemes, deleteCustomTheme } = useThemeStore()
  const [isCreatorOpen, setIsCreatorOpen] = useState(false)

  const allThemes = getAllThemes()

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl glass-panel border-white/40 dark:border-white/10 p-6 rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                  <Palette className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Theme & Brand Experience</span>
                </DialogTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Choose a curated theme or create custom colors for your brand.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setIsCreatorOpen(true)}
                className="gap-1.5 text-xs liquid-btn-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Theme</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Themes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mt-4">
            {allThemes.map((theme) => {
              const isActive = activeThemeId === theme.id

              return (
                <div
                  key={theme.id}
                  onClick={() => setActiveTheme(theme.id)}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isActive
                      ? 'ring-2 ring-blue-500 shadow-md border-transparent bg-white/90 dark:bg-white/[0.08]'
                      : 'border-slate-200/80 dark:border-white/[0.08] bg-white/50 dark:bg-white/[0.03] hover:border-blue-400/50 hover:bg-white/80 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {/* Theme Header with Color Swatches */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {theme.isDark ? (
                          <Moon className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {theme.name}
                        </span>
                      </div>

                      {isActive && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" />
                          <span>Active</span>
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {theme.description}
                    </p>
                  </div>

                  {/* Swatches & Gradient Bar */}
                  <div>
                    <div
                      className="h-2 w-full rounded-full shadow-inner mb-2"
                      style={{
                        background: `linear-gradient(90deg, ${theme.colors.gradientStart} 0%, ${theme.colors.primary} 50%, ${theme.colors.gradientEnd} 100%)`
                      }}
                    />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: theme.colors.primary }}
                          title="Primary"
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: theme.colors.accent }}
                          title="Accent"
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                          style={{ backgroundColor: theme.colors.background }}
                          title="Background"
                        />
                      </div>

                      {theme.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteCustomTheme(theme.id)
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                          title="Delete Custom Theme"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-slate-200/60 dark:border-white/10">
            <Button size="sm" onClick={onClose} className="text-xs">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Theme Creator Dialog */}
      <ThemeCreatorDialog
        isOpen={isCreatorOpen}
        onClose={() => setIsCreatorOpen(false)}
      />
    </>
  )
}
