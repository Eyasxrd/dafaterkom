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

export default function Home() {
  const [currentPage, setCurrentPage] = useState('pos')
  const [showWizard, setShowWizard] = useState(false)
  const [wizardStep, setWizardStep] = useState(1)
  const [showFirstSaleTour, setShowFirstSaleTour] = useState(false)
  const [posRefreshKey, setPosRefreshKey] = useState(0)
  const { isAuthenticated, user } = useAuthStore()
  const { isDarkMode } = useThemeStore()
  const { setLocale } = useLanguageStore()
  const locale = useLocale()

  useEffect(() => {
    // If user is kitchen staff, navigate directly to kitchen view
    if (user?.role === 'kitchen') {
      setCurrentPage('kitchen')
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
      case 'campaigns':
        return <LoyaltyCampaignManager />
      case 'subscription':
        return <SubscriptionSettings />
      case 'staff':
        return <StaffManager />
      case 'reports':
        return <ReportsDashboard />
      case 'superadmin':
        return <SuperAdminPortal />
      default:
        return <PointOfSale key={posRefreshKey} />
    }
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
      />
      <main className="flex-1 md:ms-64 mb-16 md:mb-0 pt-4 px-2 md:px-6">
        <SubscriptionBanner onNavigateToBilling={() => setCurrentPage('subscription')} />
        {renderPage()}
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
