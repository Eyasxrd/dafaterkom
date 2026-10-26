'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import SyncStatusBadge from '@/components/SyncStatusBadge'
import ThemeSelectorModal from '@/components/theme/ThemeSelectorModal'
import { useAuthStore } from '@/lib/store'
import { 
  ShoppingCart, 
  LayoutGrid, 
  ChefHat, 
  ReceiptText, 
  Clock, 
  Package, 
  FlaskConical, 
  Truck,
  Fingerprint,
  Calculator,
  Users, 
  BarChart3, 
  Coffee, 
  LogOut, 
  ShieldCheck,
  Sparkles,
  Sliders,
  Palette,
  QrCode,
  Menu,
  X,
  Phone,
  Mail,
  Tag,
  Settings,
  ChevronRight
} from 'lucide-react'

interface NavigationProps {
  currentPage: string
  onPageChange: (page: string) => void
  onOpenWizard?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Navigation({ 
  currentPage, 
  onPageChange, 
  onOpenWizard,
  isCollapsed = false,
  onToggleCollapse
}: NavigationProps) {
  const { user, logout } = useAuthStore()
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'
  const t = useTranslations('navigation')
  const tCommon = useTranslations('common')
  const currentYear = new Date().getFullYear()

  // Clean, focused navigation with role-based restriction for cashiers
  const menuItems = [
    { id: 'pos', label: t('pos'), icon: ShoppingCart },
    { id: 'tables', label: t('tables'), icon: LayoutGrid },
    { id: 'menu-builder', label: t('menuBuilder'), icon: QrCode, adminOnly: true },
    { id: 'kitchen', label: t('kitchen'), icon: ChefHat },
    { id: 'orders', label: t('orders'), icon: ReceiptText },
    { id: 'shifts', label: t('shifts'), icon: Clock },
    { id: 'inventory', label: t('inventory'), icon: Package, adminOnly: true },
    { id: 'ingredients', label: t('ingredients'), icon: FlaskConical, adminOnly: true },
    { id: 'suppliers', label: t('suppliers'), icon: Truck, adminOnly: true },
    { id: 'promos', label: t('promos'), icon: Tag, adminOnly: true },
    { id: 'campaigns', label: isAr ? 'عروض واسترجاع العملاء' : 'Loyalty & Proximity', icon: Sparkles, adminOnly: true },
    { id: 'subscription', label: isAr ? 'الاشتراك' : 'Subscription', icon: ShieldCheck, adminOnly: true },
    { id: 'staff', label: t('staff'), icon: Users, adminOnly: true },
    { id: 'hr', label: t('hr'), icon: Fingerprint, adminOnly: true },
    { id: 'accounting', label: isAr ? 'المحاسبة والمالية' : 'Accounting & Finance', icon: Calculator, adminOnly: true },
    { id: 'reports', label: t('reports'), icon: BarChart3, adminOnly: true },
    { id: 'settings', label: isAr ? 'الإعدادات والتخصيص' : (t('settings') || 'Settings & Customization'), icon: Settings }
  ]

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || (user && (user.role === 'admin' || user.role === 'manager'))
  )

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  const handleLogout = () => {
    logout()
  }

  const handleNavClick = (pageId: string) => {
    onPageChange(pageId)
    setIsMobileDrawerOpen(false)
  }

  const handleLogoClick = () => {
    onPageChange('pos')
    setIsMobileDrawerOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. Mobile Top Header Bar (md:hidden) */}
      {/* ========================================================================= */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 glass-panel border-b border-slate-200/80 dark:border-white/10 px-3 flex items-center justify-between z-40">
        {/* Clickable Brand Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-2 cursor-pointer text-left active:scale-95 transition-transform"
          title="Go to POS Home"
        >
          <div className="w-8 h-8 rounded-xl liquid-btn-primary flex items-center justify-center text-white shadow-sm shrink-0">
            <Coffee className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-xs tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
              DAFATERKOM
            </span>
            <span className="text-[8px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
              Cloud POS
            </span>
          </div>
        </button>

        {/* Top Header Actions */}
        <div className="flex items-center gap-1.5">
          <SyncStatusBadge />
          <ThemeToggle />
          <LanguageToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="h-8 w-8 p-0 rounded-xl cursor-pointer"
            title="Open Mobile Menu"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-4 h-4 text-slate-700 dark:text-slate-200" />
          </Button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. Responsive Mobile Drawer (Slide-out Sheet) */}
      {/* ========================================================================= */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative ms-auto w-[85%] max-w-sm h-screen h-[100dvh] max-h-screen glass-panel bg-white/95 dark:bg-slate-900/95 border-s border-slate-200/80 dark:border-white/10 flex flex-col p-4 shadow-2xl z-10 overflow-hidden">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-white/[0.08] shrink-0">
              <button
                onClick={handleLogoClick}
                className="flex items-center gap-2.5 text-left cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl liquid-btn-primary flex items-center justify-center text-white shadow-sm">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
                    DAFATERKOM
                  </div>
                  <div className="text-[9px] text-slate-400 font-medium">
                    Multi-Tenant System
                  </div>
                </div>
              </button>

              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                title="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card (Clickable to open Settings) */}
            <button
              type="button"
              onClick={() => handleNavClick('settings')}
              className="my-3 p-3 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] hover:bg-blue-500/10 border border-slate-200/50 dark:border-white/[0.06] flex items-center justify-between gap-2 text-left rtl:text-right cursor-pointer transition-colors w-full shrink-0"
              title="Account Settings & Preferences"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">
                    {user?.name || 'Operator'}
                  </div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    {user?.role || 'Staff'} • {isAr ? 'الإعدادات' : 'Settings'}
                  </div>
                </div>
              </div>
              <Settings className="w-4 h-4 text-blue-500 shrink-0" />
            </button>

            {/* Setup Wizard Button */}
            {onOpenWizard && (
              <button
                onClick={() => {
                  setIsMobileDrawerOpen(false)
                  onOpenWizard()
                }}
                className="w-full mb-3 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-between cursor-pointer transition-colors shrink-0"
              >
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Launch Setup Wizard</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Navigation Menu Links */}
            <div className="space-y-1 flex-1 min-h-0 overflow-y-auto sidebar-scroll overscroll-contain pr-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider px-2 py-1 block">
                Menu & Terminals
              </span>
              {filteredMenuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer text-left rtl:text-right ${
                      isActive
                        ? 'liquid-btn-primary shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate flex-1">{item.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-70" />}
                  </button>
                )
              })}
            </div>

            {/* Drawer Footer & Support Contacts */}
            <div className="mt-auto pt-3 shrink-0 border-t border-slate-200/60 dark:border-white/[0.08] space-y-2.5">
              {/* Clickable Support Hotline & Email */}
              <div className="p-2.5 rounded-xl bg-slate-100/50 dark:bg-white/[0.02] border border-slate-200/50 dark:border-white/[0.05] space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                  24/7 Operations Support
                </span>
                <div className="flex flex-col gap-1 text-xs">
                  <a
                    href="tel:+15550192834"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-bold"
                    title="Call support hotline"
                  >
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>+1 (555) 019-2834</span>
                  </a>
                  <a
                    href="mailto:support@dafaterkom.com"
                    className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline font-medium text-[11px]"
                    title="Email support"
                  >
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>support@dafaterkom.com</span>
                  </a>
                </div>
              </div>

              {/* Settings, Theme & Logout Controls */}
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNavClick('settings')}
                  className="flex-1 text-xs gap-1 h-9 rounded-xl cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isAr ? 'الإعدادات' : 'Settings'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsMobileDrawerOpen(false)
                    setIsThemeModalOpen(true)
                  }}
                  className="flex-1 text-xs gap-1 h-9 rounded-xl cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5 text-blue-500" />
                  <span>Theme</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="h-9 px-3 text-xs gap-1 rounded-xl cursor-pointer text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Dynamic Copyright Year */}
              <div className="text-[10px] text-center text-slate-400 dark:text-slate-500 pt-1">
                © {currentYear} Dafaterkom Cloud POS
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. Desktop Liquid Glass Sidebar (hidden on mobile) */}
      {/* ========================================================================= */}
      <aside 
        className={`hidden md:flex flex-col glass-panel border-e border-slate-200/80 dark:border-white/[0.08] h-screen h-[100dvh] max-h-screen fixed top-0 start-0 z-40 overflow-hidden transition-all duration-300 ${
          isCollapsed ? 'w-20 p-2.5 items-center' : 'w-64 p-4'
        }`}
      >
        {/* Clickable Brand Header with Collapse Toggle */}
        <div className={`w-full flex flex-col gap-2.5 mb-4 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-white/60 dark:border-white/[0.08] shrink-0 ${
          isCollapsed ? 'p-2 items-center' : 'px-3 py-3'
        }`}>
          <div className={`flex items-center w-full ${isCollapsed ? 'flex-col gap-2 justify-center' : 'justify-between'}`}>
            <button
              onClick={handleLogoClick}
              className={`flex items-center gap-3 text-left cursor-pointer group ${isCollapsed ? 'justify-center' : ''}`}
              title="Go to POS Home"
            >
              <div className="w-10 h-10 rounded-xl liquid-btn-primary flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-base tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent truncate">
                    DAFATERKOM
                  </div>
                  <div className="text-[10px] font-medium tracking-wide text-slate-400 dark:text-slate-500">
                    Cloud POS & Retail
                  </div>
                </div>
              )}
            </button>

            {/* Desktop Burger / Collapse Toggle Button */}
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="h-8 w-8 p-0 rounded-xl hover:bg-slate-200/60 dark:hover:bg-white/10 cursor-pointer shrink-0"
                title={isCollapsed ? (t('expandSidebar') || 'Expand Sidebar') : (t('collapseSidebar') || 'Collapse Sidebar')}
                aria-label="Toggle Navigation Sidebar"
              >
                <Menu className="w-4 h-4 text-slate-700 dark:text-slate-200" />
              </Button>
            )}
          </div>

          {!isCollapsed && (
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
          )}
        </div>

        {/* Navigation Items */}
        <div className={`space-y-1 flex-1 min-h-0 overflow-y-auto sidebar-scroll overscroll-contain w-full ${isCollapsed ? 'px-0' : 'pe-1'}`}>
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id

            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer ${
                  isCollapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2 ltr:text-left rtl:text-right'
                } ${
                  isActive
                    ? 'liquid-btn-primary shadow-md text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`shrink-0 ${isCollapsed ? 'w-5 h-5' : 'w-3.5 h-3.5'} ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </div>

        {/* User Footer Profile & Settings */}
        <div className={`mt-auto pt-3 space-y-2 border-t border-slate-200/60 dark:border-white/[0.08] w-full shrink-0 ${isCollapsed ? 'flex flex-col items-center gap-2' : ''}`}>
          {!isCollapsed ? (
            <>
              {/* User Profile Card (Clickable to open Settings) */}
              <button
                type="button"
                onClick={() => handleNavClick('settings')}
                className="w-full p-2.5 rounded-2xl bg-white/40 dark:bg-white/[0.03] hover:bg-blue-500/10 dark:hover:bg-blue-500/10 border border-white/50 dark:border-white/[0.05] hover:border-blue-400/40 flex items-center justify-between gap-2.5 transition-all cursor-pointer text-left rtl:text-right group"
                title="Account Settings & Preferences"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="overflow-hidden flex-1 min-w-0">
                    <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{user?.name || 'System User'}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">{user?.role || 'OPERATOR'}</div>
                  </div>
                </div>
                <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
              </button>

              {/* Preferences Row: Language Toggle + Settings & Theme Controls */}
              <div className="flex items-center justify-between gap-1.5 w-full">
                <LanguageToggle />
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNavClick('settings')}
                    className="h-8 w-8 p-0 shrink-0 rounded-xl cursor-pointer hover:bg-blue-500/10 hover:border-blue-400/40"
                    title="Open Full Settings Page"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsThemeModalOpen(true)}
                    className="h-8 w-8 p-0 shrink-0 rounded-xl cursor-pointer hover:bg-blue-500/10 hover:border-blue-400/40"
                    title="Change Theme & Colors"
                  >
                    <Palette className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </Button>
                  <ThemeToggle className="h-8 w-8 p-0 rounded-xl shrink-0" />
                </div>
              </div>

              {/* Dedicated Full-Width Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 h-8 rounded-xl border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 font-semibold text-xs transition-all cursor-pointer"
                title={tCommon('logout')}
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>{tCommon('logout')}</span>
              </Button>
            </>
          ) : (
            <>
              {/* Collapsed Mode Profile */}
              <button
                type="button"
                onClick={() => handleNavClick('settings')}
                className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 flex items-center justify-center cursor-pointer shadow-sm hover:scale-105 transition-transform"
                title={`${user?.name || 'Account Settings'} (${user?.role || 'OPERATOR'}) - Click to open Settings`}
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Collapsed Controls */}
              <ThemeToggle className="w-9 h-9 p-0 rounded-xl" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsThemeModalOpen(true)}
                className="w-9 h-9 p-0 rounded-xl cursor-pointer hover:bg-blue-500/10 hover:border-blue-400/40"
                title="Change Theme & Colors"
              >
                <Palette className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </Button>
              <LanguageToggle compact={true} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-9 h-9 p-0 rounded-xl cursor-pointer text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/30"
                title={tCommon('logout')}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </aside>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      {/* ========================================================================= */}
      {/* 4. Mobile Bottom Liquid Glass Navigation Bar */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-slate-200/80 dark:border-white/10 px-2 py-1.5 flex justify-around items-center z-40">
        {[
          { id: 'pos', label: 'POS', icon: ShoppingCart },
          { id: 'tables', label: 'Tables', icon: LayoutGrid },
          { id: 'orders', label: 'Orders', icon: ReceiptText },
          { id: 'kitchen', label: 'KDS', icon: ChefHat }
        ].map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[9px] mt-0.5 font-bold">{item.label}</span>
            </button>
          )
        })}

        {/* 5th Button: Open Full Mobile Menu Drawer */}
        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex flex-col items-center py-1 px-2.5 rounded-xl transition-all text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white cursor-pointer"
          title="Open All Menu Items"
        >
          <Menu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-[9px] mt-0.5 font-bold text-blue-600 dark:text-blue-400">More</span>
        </button>
      </nav>
    </>
  )
}
