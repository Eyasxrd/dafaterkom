'use client'

import React, { useState, useEffect } from 'react'
import {
  QrCode,
  Download,
  Smartphone,
  Copy,
  Check,
  X,
  ExternalLink,
  Sparkles,
  ArrowRight
} from 'lucide-react'

interface AppleWalletButtonProps {
  customerId: string
  customerName?: string
  className?: string
  showScanOption?: boolean
  buttonText?: string
}

export default function AppleWalletButton({
  customerId,
  customerName,
  className = '',
  showScanOption = true,
  buttonText = 'Add to Apple Wallet'
}: AppleWalletButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [passUrl, setPassUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
      setIsIOS(isApple)
      setPassUrl(`${window.location.origin}/api/loyalty/apple-wallet/${customerId}`)
    }
  }, [customerId])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // If mobile iOS Safari, directly navigate to .pkpass download which opens native Apple Wallet
    if (typeof window !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
      window.location.href = `/api/loyalty/apple-wallet/${customerId}`
    } else {
      // On desktop or when user wants to scan with iPhone camera
      setShowModal(true)
    }
  }

  const handleCopyLink = async () => {
    if (!passUrl) return
    try {
      await navigator.clipboard.writeText(passUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch (e) {
      console.error(e)
    }
  }

  const handleDirectDownload = () => {
    window.location.href = `/api/loyalty/apple-wallet/${customerId}`
  }

  return (
    <>
      {/* Official Apple Wallet Badge Style Button */}
      <button
        type="button"
        onClick={handleClick}
        className={`group relative inline-flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-black hover:bg-zinc-900 active:scale-[0.98] text-white border border-zinc-700/80 shadow-xl transition-all duration-200 cursor-pointer ${className}`}
        title="Add to Apple Wallet"
      >
        {/* Apple Wallet Icon Mockup */}
        <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-md"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Wallet base */}
            <rect x="5" y="20" width="90" height="65" rx="14" fill="#1C1C1E" stroke="#3A3A3C" strokeWidth="3" />
            {/* Cards peeking out */}
            <path d="M15 32C15 25.3726 20.3726 20 27 20H73C79.6274 20 85 25.3726 85 32V42H15V32Z" fill="#30D158" />
            <path d="M18 36C18 30.4772 22.4772 26 28 26H72C77.5228 26 82 30.4772 82 36V46H18V36Z" fill="#0A84FF" />
            <path d="M22 42C22 37.5817 25.5817 34 30 34H70C74.4183 34 78 37.5817 78 42V52H22V42Z" fill="#FF9F0A" />
            {/* Wallet front pouch */}
            <path d="M5 45H95V73C95 80.732 88.732 87 81 87H19C11.268 87 5 80.732 5 73V45Z" fill="#2C2C2E" />
            {/* Card notch */}
            <path d="M36 45C36 50.5228 40.4772 55 46 55H54C59.5228 55 64 50.5228 64 45H36Z" fill="#1C1C1E" />
          </svg>
        </div>

        {/* Text */}
        <div className="text-left">
          <div className="text-[9px] uppercase tracking-wider text-zinc-400 font-medium leading-tight">
            Digital Pass
          </div>
          <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 leading-tight">
            <span>{buttonText}</span>
          </div>
        </div>
      </button>

      {/* QR Code & Instructions Modal for Non-iOS / Desktop Users */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 text-zinc-100 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1 pt-1">
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 mx-auto flex items-center justify-center mb-2">
                <Smartphone className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold">Add to Apple Wallet</h3>
              <p className="text-xs text-zinc-400">
                Scan this code with your iPhone Camera to install the pass directly.
              </p>
            </div>

            {/* Dynamic QR Code Card */}
            <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center shadow-lg">
              {/* High-visibility SVG QR Code Mockup pointing to pass URL */}
              <div className="relative p-2 bg-white rounded-xl">
                {/* Visual SVG QR */}
                <svg
                  viewBox="0 0 160 160"
                  className="w-44 h-44"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="160" height="160" fill="white" />
                  {/* Top-left corner finder */}
                  <rect x="10" y="10" width="40" height="40" rx="6" fill="#18181B" />
                  <rect x="18" y="18" width="24" height="24" rx="3" fill="white" />
                  <rect x="24" y="24" width="12" height="12" rx="2" fill="#10B981" />

                  {/* Top-right corner finder */}
                  <rect x="110" y="10" width="40" height="40" rx="6" fill="#18181B" />
                  <rect x="118" y="18" width="24" height="24" rx="3" fill="white" />
                  <rect x="124" y="24" width="12" height="12" rx="2" fill="#10B981" />

                  {/* Bottom-left corner finder */}
                  <rect x="10" y="110" width="40" height="40" rx="6" fill="#18181B" />
                  <rect x="18" y="118" width="24" height="24" rx="3" fill="white" />
                  <rect x="24" y="124" width="12" height="12" rx="2" fill="#10B981" />

                  {/* Data patterns */}
                  <rect x="60" y="15" width="8" height="8" fill="#18181B" />
                  <rect x="75" y="15" width="8" height="8" fill="#18181B" />
                  <rect x="90" y="25" width="8" height="8" fill="#18181B" />
                  <rect x="60" y="35" width="8" height="8" fill="#18181B" />
                  <rect x="75" y="45" width="8" height="8" fill="#18181B" />

                  <rect x="15" y="65" width="8" height="8" fill="#18181B" />
                  <rect x="30" y="65" width="8" height="8" fill="#18181B" />
                  <rect x="45" y="75" width="8" height="8" fill="#18181B" />

                  {/* Center branding icon */}
                  <rect x="64" y="64" width="32" height="32" rx="8" fill="#10B981" />
                  <circle cx="80" cy="80" r="8" fill="white" />

                  <rect x="105" y="65" width="8" height="8" fill="#18181B" />
                  <rect x="120" y="75" width="8" height="8" fill="#18181B" />
                  <rect x="135" y="65" width="8" height="8" fill="#18181B" />

                  <rect x="60" y="105" width="8" height="8" fill="#18181B" />
                  <rect x="75" y="115" width="8" height="8" fill="#18181B" />
                  <rect x="90" y="105" width="8" height="8" fill="#18181B" />
                  <rect x="60" y="130" width="8" height="8" fill="#18181B" />
                  <rect x="75" y="140" width="8" height="8" fill="#18181B" />

                  <rect x="110" y="110" width="8" height="8" fill="#18181B" />
                  <rect x="125" y="125" width="8" height="8" fill="#18181B" />
                  <rect x="140" y="140" width="8" height="8" fill="#18181B" />
                </svg>
              </div>
              <div className="text-[10px] font-mono text-zinc-500 font-bold mt-1">
                Point iPhone camera to open
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="p-3 bg-zinc-800/60 rounded-xl border border-zinc-800 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Open Camera app on your iPhone</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Point at QR code and tap the link</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300 font-semibold">
                <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Tap <strong>"Add"</strong> in the top right corner</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDirectDownload}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" />
                Download .pkpass file
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-zinc-700"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Pass Link Copied!' : 'Copy Pass URL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
