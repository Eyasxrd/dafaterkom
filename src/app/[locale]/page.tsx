'use client'

import { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import Navigation from '@/components/Navigation'
import PointOfSale from '@/components/PointOfSale'
import InventoryManager from '@/components/InventoryManager'
import IngredientsManager from '@/components/IngredientsManager'
import StaffManager from '@/components/StaffManager'
import OrdersManager from '@/components/OrdersManager'
import ReportsDashboard from '@/components/ReportsDashboard'
import LoginForm from '@/components/LoginForm'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageToggle from '@/components/LanguageToggle'
import { useAuthStore } from '@/lib/store'
import { useThemeStore } from '@/lib/store'
import { useLanguageStore } from '@/lib/store'

import KitchenDisplay from '@/components/KitchenDisplay'
import TableManager from '@/components/TableManager'
import ShiftManager from '@/components/ShiftManager'
import SubscriptionSettings from '@/components/SubscriptionSettings'
import LoyaltyCampaignManager from '@/components/LoyaltyCampaignManager'
import SuperAdminPortal from '@/components/SuperAdminPortal'
import SetupWizard from '@/components/onboarding/SetupWizard'
import SetupChecklist from '@/components/onboarding/SetupChecklist'
import SubscriptionBanner from '@/components/SubscriptionBanner'
import FirstSaleTour from '@/components/onboarding/FirstSaleTour'
import StockExcelImporter from '@/components/StockExcelImporter'
import MenuManager from '@/components/menu/MenuManager'
import PromoCodeManager from '@/components/PromoCodeManager'
import SuppliersManager from '@/components/SuppliersManager'
import HRManager from '@/components/HRManager'
import AccountingManager from '@/components/AccountingManager'
import SettingsManager from '@/components/SettingsManager'
import Footer from '@/components/Footer'

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [currentPage, setCurrentPage] = useState('pos')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [showFirstSaleTour, setShowFirstSaleTour] = useState(false)
  const [posRefreshKey, setPosRefreshKey] = useState(0)
  const { isAuthenticated, user } = useAuthStore()
  const { isDarkMode } = useThemeStore()
  const { setLocale } = useLanguageStore()
  const locale = useLocale()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const titles: Record<string, string> = {
      pos: 'Point of Sale | Dafaterkom Cloud POS',
      tables: 'Table Management & Dining Floor | Dafaterkom Cloud POS',
      'menu-builder': 'Menu Builder & QR Ordering | Dafaterkom Cloud POS',
      kitchen: 'Kitchen Display System (KDS) | Dafaterkom Cloud POS',
      orders: 'Live Orders & Receipts | Dafaterkom Cloud POS',
      shifts: 'Cashier Shifts & Cash Management | Dafaterkom Cloud POS',
      inventory: 'Inventory & Stock Control | Dafaterkom Cloud POS',
      'import-stock': 'Stock Excel Importer | Dafaterkom Cloud POS',
      ingredients: 'Ingredients & Recipe Costing | Dafaterkom Cloud POS',
      suppliers: 'Suppliers & Purchases | Dafaterkom Cloud POS',
      promos: 'Promo Codes & Discount Coupons | Dafaterkom Cloud POS',
      campaigns: 'Loyalty & Geofencing Campaigns | Dafaterkom Cloud POS',
      subscription: 'Subscription & License | Dafaterkom Cloud POS',
      staff: 'Staff & Team Permissions | Dafaterkom Cloud POS',
      hr: 'HR & Staff Attendance | Dafaterkom Cloud POS',
      accounting: 'Accounting & Financial Management | Dafaterkom Cloud POS',
      reports: 'Sales Analytics & Reports | Dafaterkom Cloud POS',
      settings: 'System Settings & Hardware Customization | Dafaterkom Cloud POS',
      superadmin: 'SaaS Fleet Control Plane | Dafaterkom'
    }
    if (titles[currentPage]) {
      document.title = titles[currentPage]
    }
  }, [currentPage])

  useEffect(() => {
    // If user is kitchen staff, navigate directly to kitchen view
    if (user?.role === 'kitchen') {
      const timer = setTimeout(() => setCurrentPage('kitchen'), 0)
      return () => clearTimeout(timer)
    }
  }, [user])

  useEffect(() => {
    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  useEffect(() => {
    // Initialize language from URL
    setLocale(locale)
  }, [locale, setLocale])

  const handleOpenWizard = (step: number = 1) => {
    setWizardStep(step)
    setShowWizard(true)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'pos':
        return (
          <>
            <SetupChecklist
              onOpenWizard={handleOpenWizard}
              onStartTour={() => setShowFirstSaleTour(true)}
              onRefreshTrigger={posRefreshKey}
            />
            <PointOfSale key={posRefreshKey} />
          </>
        )
      case 'tables':
        return <TableManager onSelectTableForPOS={() => setCurrentPage('pos')} />
      case 'menu-builder':
        return <MenuManager />
      case 'kitchen':
        return <KitchenDisplay />
      case 'orders':
        return <OrdersManager />
      case 'shifts':
        return <ShiftManager />
      case 'inventory':
        return <InventoryManager onNavigateToImport={() => setCurrentPage('import-stock')} />
      case 'import-stock':
        return <StockExcelImporter onNavigateToInventory={() => setCurrentPage('inventory')} />
      case 'ingredients':
        return <IngredientsManager />
      case 'suppliers':
        return <SuppliersManager />
      case 'promos':
        return <PromoCodeManager />
      case 'campaigns':
        return <LoyaltyCampaignManager />
      case 'subscription':
        return <SubscriptionSettings />
      case 'staff':
        return <StaffManager />
      case 'hr':
        return <HRManager />
      case 'accounting':
        return <AccountingManager />
      case 'reports':
        return <ReportsDashboard />
      case 'settings':
        return <SettingsManager onOpenWizard={() => handleOpenWizard(1)} />
      case 'superadmin':
        return <SuperAdminPortal />
      default:
        return <PointOfSale key={posRefreshKey} />
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl liquid-btn-primary flex items-center justify-center text-white animate-pulse shadow-lg">
            <span className="font-black text-lg">D</span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Loading Dafaterkom POS...
          </span>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-transparent relative">
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <ThemeToggle />
          <LanguageToggle />
        </div>
        <LoginForm />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-transparent transition-colors">
      <Navigation
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onOpenWizard={() => handleOpenWizard(1)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
      />
      <main className={`flex-1 ${isSidebarCollapsed ? 'md:ms-20' : 'md:ms-64'} transition-all duration-300 mb-20 md:mb-0 pt-16 md:pt-4 px-2 sm:px-4 md:px-6 w-full max-w-full overflow-x-hidden flex flex-col justify-between`}>
        <div className="flex-1">
          <SubscriptionBanner onNavigateToBilling={() => setCurrentPage('subscription')} />
          {renderPage()}
        </div>
        <Footer onNavigate={setCurrentPage} />
      </main>

      {/* Guided Setup Wizard Modal */}
      {showWizard && (
        <SetupWizard
          initialStep={wizardStep}
          onComplete={() => {
            setShowWizard(false)
            setPosRefreshKey(prev => prev + 1)
            setShowFirstSaleTour(true)
          }}
          onCancel={() => setShowWizard(false)}
        />
      )}

      {/* First Sale Interactive Tour */}
      <FirstSaleTour
        isOpen={showFirstSaleTour}
        onClose={() => {
          setShowFirstSaleTour(false)
          setPosRefreshKey(prev => prev + 1)
        }}
      />
    </div>
  )
}
