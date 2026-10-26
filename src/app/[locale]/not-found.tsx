'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
  AlertTriangle, 
  Home, 
  ArrowLeft, 
  Coffee, 
  Phone, 
  Mail, 
  Search, 
  FileQuestion,
  LifeBuoy,
  QrCode,
  Compass
} from 'lucide-react'
import Footer from '@/components/Footer'

export default function NotFound() {
  const params = useParams()
  const locale = (params?.locale as string) || 'en'
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    document.title = '404 - Page Not Found | Dafaterkom Cloud POS'
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between overflow-x-hidden">
      
      {/* Top Navbar */}
      <header className="w-full border-b border-slate-200/80 dark:border-white/10 glass-panel px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 group cursor-pointer"
            title="Return to Dafaterkom Home"
          >
            <div className="w-9 h-9 rounded-xl liquid-btn-primary flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Coffee className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent block">
                DAFATERKOM
              </span>
              <span className="text-[10px] text-slate-400 font-medium block">
                Cloud POS & Tables
              </span>
            </div>
          </Link>

          <Link
            href={`/${locale}`}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Open Terminal</span>
          </Link>
        </div>
      </header>

      {/* Main 404 Hero Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="max-w-lg w-full p-6 sm:p-8 rounded-3xl glass-card border border-slate-200/80 dark:border-white/10 shadow-2xl text-center space-y-6">
          
          {/* Badge & Graphic */}
          <div className="relative mx-auto w-24 h-24">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-xl shadow-blue-500/25 mx-auto">
              <Compass className="w-12 h-12 animate-pulse" />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-mono font-black text-xs shadow-md">
              404
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Page Not Found
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              The station, order receipt, or digital menu route you requested does not exist or has been relocated.
            </p>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              href={`/${locale}`}
              className="py-3 px-4 rounded-2xl liquid-btn-primary font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Home className="w-4 h-4" />
              <span>Back to POS Register</span>
            </Link>

            <Link
              href={`/${locale}/menu/in-house`}
              className="py-3 px-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-white/[0.08] font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <QrCode className="w-4 h-4 text-blue-500" />
              <span>View Digital Menu</span>
            </Link>
          </div>

          {/* Direct Support Contacts */}
          <div className="pt-4 border-t border-slate-200/60 dark:border-white/[0.08] space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
              <LifeBuoy className="w-3.5 h-3.5 text-blue-500" />
              <span>Need help finding an order or configuring hardware?</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
              <a
                href="tel:+15550192834"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5"
                title="Call 24/7 Helpline"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>+1 (555) 019-2834</span>
              </a>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <a
                href="mailto:support@dafaterkom.com"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1.5"
                title="Email Support Desk"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>support@dafaterkom.com</span>
              </a>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
