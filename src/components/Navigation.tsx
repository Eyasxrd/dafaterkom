'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import SyncStatusBadge from '@/components/SyncStatusBadge'
import { useAuthStore } from '@/lib/store'
import { 
  ShoppingCart, 
  LayoutGrid, 
  ChefHat, 
  ReceiptText, 
  Clock, 
  Package, 
  FlaskConical, 
  Users, 
  BarChart3, 
  Coffee, 
  LogOut, 
  ShieldCheck,
  Sparkles,
  Building2,
  Sliders,
  FileSpreadsheet
} from 'lucide-react'

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
  onOpenWizard?: () => void
}

export default function Navigation({ currentPage, onPageChange, onOpenWizard }: NavigationProps) {
  const { user, logout } = useAuthStore()
  const t = useTranslations('navigation')
  const tCommon = useTranslations('common')
  
  const menuItems = [
    { id: 'pos', label: t('pos'), icon: ShoppingCart },
    { id: 'tables', label: t('tables'), icon: LayoutGrid },
    { id: 'kitchen', label: t('kitchen'), icon: ChefHat },
    { id: 'orders', label: t('orders'), icon: ReceiptText },
    { id: 'shifts', label: t('shifts'), icon: Clock },
    { id: 'inventory', label: t('inventory'), icon: Package },
    { id: 'import-stock', label: 'Stock Import', icon: FileSpreadsheet, adminOnly: true },
    { id: 'ingredients', label: t('ingredients'), icon: FlaskConical },
    { id: 'campaigns', label: 'Loyalty & Proximity', icon: Sparkles },
    { id: 'subscription', label: 'Subscription', icon: ShieldCheck, adminOnly: true },
    { id: 'staff', label: t('staff'), icon: Users, adminOnly: true },
    { id: 'reports', label: t('reports'), icon: BarChart3 },
    { id: 'superadmin', label: 'SaaS Fleet', icon: Building2, adminOnly: true }
  ]

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || (user && (user.role === 'admin' || user.role === 'manager'))
  )

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      {/* Desktop Liquid Glass Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-200/80 dark:border-white/[0.08] min-h-screen fixed top-0 left-0 z-40 p-4">
        {/* Brand Header with Sync Status */}
        <div className="flex flex-col gap-2.5 px-3 py-3 mb-4 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-white/60 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl liquid-btn-primary flex items-center justify-center shrink-0 shadow-md">
              <Coffee className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent truncate">
                DAFATERKOM CLOUD
              </div>
              <div className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
                Multi-Tenant SaaS
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-white/[0.04]">
            <SyncStatusBadge />
            {onOpenWizard && (
              <button
                onClick={onOpenWizard}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                title="Launch setup wizard"
              >
                <Sliders className="w-3 h-3" />
                <span>Wizard</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1 flex-1 overflow-y-auto pr-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-semibold text-xs transition-all duration-200 text-left cursor-pointer ${
                  isActive
                    ? 'liquid-btn-primary shadow-md'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* User Footer Profile & Settings */}
        <div className="mt-auto pt-3 space-y-2 border-t border-slate-200/60 dark:border-white/[0.08]">
          <div className="p-2.5 rounded-2xl bg-white/40 dark:bg-white/[0.03] border border-white/50 dark:border-white/[0.05] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden flex-1 min-w-0">
              <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">{user?.role}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="flex-1 text-xs gap-1.5 h-8"
              title={tCommon('logout')}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{tCommon('logout')}</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Liquid Glass Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-200/80 dark:border-white/10 p-2 flex justify-around items-center z-50 overflow-x-auto">
        {filteredMenuItems.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center p-1.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] mt-0.5 font-medium truncate max-w-[60px]">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
