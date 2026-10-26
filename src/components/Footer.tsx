'use client'

import React, { useState } from 'react'
import { 
  Coffee, 
  Phone, 
  Mail, 
  ShieldCheck, 
  FileText, 
  HelpCircle, 
  Globe2, 
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface FooterProps {
  onNavigate?: (pageId: string) => void
  currentYear?: number
}

export default function Footer({ onNavigate }: FooterProps) {
  const params = useParams()
  const locale = (params?.locale as string) || 'en'
  const currentYear = new Date().getFullYear()

  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'help' | null>(null)

  const handleLinkClick = (pageId: string) => {
    if (onNavigate) {
      onNavigate(pageId)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <footer className="w-full mt-12 pt-8 pb-12 border-t border-slate-200/80 dark:border-white/[0.08] bg-white/40 dark:bg-slate-950/40 backdrop-blur-md transition-colors text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Column 1: Brand & Clickable Logo */}
            <div className="space-y-3 md:col-span-1">
              <button
                type="button"
                onClick={() => handleLinkClick('pos')}
                className="flex items-center gap-2.5 text-left group cursor-pointer"
                title="Return to POS Home"
              >
                <div className="w-9 h-9 rounded-xl liquid-btn-primary flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                  <Coffee className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-black text-sm tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
                    DAFATERKOM CLOUD
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Smart POS & Hospitality Platform
                  </div>
                </div>
              </button>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Offline-first point of sale, kitchen display automation, and Apple Wallet member passes for specialty cafes and restaurants.
              </p>

              {/* Live Status indicator */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>LAN Sync Ready • All Systems Online</span>
              </div>
            </div>

            {/* Column 2: Quick Navigation Links */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Quick Navigation
              </span>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li>
                  <button
                    onClick={() => handleLinkClick('pos')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span>Point of Sale Terminal</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('tables')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span>Dine-In Floor & Tables</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('kitchen')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span>Kitchen Display System (KDS)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLinkClick('campaigns')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span>Loyalty & Digital Member Pass</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Legal & Documentation */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Resources & Legal
              </span>
              <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                <li>
                  <button
                    onClick={() => setActiveModal('privacy')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('terms')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Terms of Service</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveModal('help')}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Help Center & Documentation</span>
                  </button>
                </li>
                <li>
                  <Link
                    href={`/${locale}/super-admin`}
                    prefetch={false}
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Globe2 className="w-3.5 h-3.5 text-cyan-500" />
                    <span>SaaS Fleet Portal</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Clickable Direct Contact Info */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                Contact & Support
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Our support team and system engineers are available 24/7 for café operations.
              </p>

              <div className="space-y-2 pt-1">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Phone Support:</span>
                  <a
                    href="tel:+15550192834"
                    className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs"
                    title="Call Dafaterkom Support"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>+1 (555) 019-2834</span>
                  </a>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Email Inquiries:</span>
                  <a
                    href="mailto:support@dafaterkom.com"
                    className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs"
                    title="Email Dafaterkom Support"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>support@dafaterkom.com</span>
                  </a>
                </div>
              </div>
            </div>

          </div>

          {/* Subfooter with Dynamic Copyright Year */}
          <div className="pt-6 border-t border-slate-200/60 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 dark:text-slate-500 text-[11px]">
            <div>
              © {currentYear} Dafaterkom Cloud POS. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveModal('privacy')}
                className="hover:underline hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                Privacy
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveModal('terms')}
                className="hover:underline hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                Terms
              </button>
              <span>•</span>
              <button
                onClick={() => setActiveModal('help')}
                className="hover:underline hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
              >
                Support
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* Privacy Policy Modal */}
      <Dialog open={activeModal === 'privacy'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-lg glass-panel border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <span>Privacy Policy</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Last updated: {currentYear}. Multi-Tenant Offline-First Architecture.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
            <p>
              At <strong>Dafaterkom Cloud POS</strong>, we prioritize the protection and privacy of your café business, staff data, customer loyalty accounts, and financial transactions.
            </p>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">1. Data Storage & Local Persistence</h4>
            <p>
              Your register transactions and menu formulations are stored securely on local SQLite databases on your physical devices, and synced with high-security multi-tenant encryption to cloud relays.
            </p>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">2. Customer Loyalty & Apple Wallet</h4>
            <p>
              When guests join your loyalty program, their phone numbers and points balance are securely signed into Apple Wallet PKPass packages. Geofencing coordinates are used solely to trigger proximity lock-screen notifications.
            </p>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">3. Contact Us</h4>
            <p>
              For privacy inquiries or data removal requests, please email{' '}
              <a href="mailto:privacy@dafaterkom.com" className="text-blue-500 underline font-bold">
                privacy@dafaterkom.com
              </a>{' '}
              or call{' '}
              <a href="tel:+15550192834" className="text-blue-500 underline font-bold">
                +1 (555) 019-2834
              </a>.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Modal */}
      <Dialog open={activeModal === 'terms'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-lg glass-panel border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <FileText className="w-5 h-5 text-indigo-500" />
              <span>Terms of Service</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Commercial software agreement & operational license terms.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
            <p>
              By accessing or using the Dafaterkom Cloud POS system, hardware agents, or digital ordering portals, you agree to be bound by these service terms.
            </p>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">1. Software License & Offline Capability</h4>
            <p>
              Dafaterkom grants authorized café operators a non-exclusive license to operate the POS software on licensed local cash registers, kitchen displays, and waiter tablets.
            </p>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">2. Taxes & Electronic Invoicing</h4>
            <p>
              Merchants are solely responsible for setting accurate VAT / sales tax percentages and complying with regional e-invoicing laws (including ZATCA Phase 2 compliance where applicable).
            </p>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">3. Availability & SLA</h4>
            <p>
              Thanks to our offline-first architecture, cash registers remain fully operational during Internet outages. Orders automatically queue and sync once connection is restored.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Center Modal */}
      <Dialog open={activeModal === 'help'} onOpenChange={(open) => !open && setActiveModal(null)}>
        <DialogContent className="max-w-lg glass-panel border border-slate-200/80 dark:border-white/10 p-6 rounded-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-white">
              <HelpCircle className="w-5 h-5 text-emerald-500" />
              <span>Help Center & Quick Guides</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Need assistance with your terminal, printers, or orders?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-800 dark:text-blue-300 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Quick Tip: Guided Setup Wizard
              </span>
              <p className="text-[11px]">
                You can relaunch the setup wizard anytime from the sidebar or top mobile menu to configure receipt printers, tax rates, and WiFi details.
              </p>
            </div>
            <h4 className="font-bold text-slate-800 dark:text-slate-100">Contact Support</h4>
            <ul className="space-y-1.5">
              <li>
                <strong>Phone Hotline:</strong>{' '}
                <a href="tel:+15550192834" className="text-blue-500 underline font-bold">
                  +1 (555) 019-2834
                </a>
              </li>
              <li>
                <strong>Email Support:</strong>{' '}
                <a href="mailto:support@dafaterkom.com" className="text-blue-500 underline font-bold">
                  support@dafaterkom.com
                </a>
              </li>
              <li>
                <strong>Emergency Floor Line:</strong> Available 24/7 during business hours.
              </li>
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
