'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Coffee, Printer, Download, ExternalLink, QrCode, Sparkles, Wifi } from 'lucide-react'
import QRCode from 'qrcode'

interface TableTentModalProps {
  isOpen: boolean
  onClose: () => void
  table: {
    number: number
    name?: string | null
    capacity?: number
  } | null
}

export default function TableTentModal({ isOpen, onClose, table }: TableTentModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [tableUrl, setTableUrl] = useState<string>('')

  useEffect(() => {
    if (table && typeof window !== 'undefined') {
      const url = `${window.location.origin}/en/table/${table.number}`
      setTableUrl(url)

      QRCode.toDataURL(url, {
        width: 480,
        margin: 2,
        color: {
          dark: '#09090b',
          light: '#ffffff'
        },
        errorCorrectionLevel: 'H'
      })
        .then(setQrDataUrl)
        .catch((err) => console.error('Failed to generate table QR:', err))
    }
  }, [table])

  if (!table) return null

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadQr = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `table-${table.number}-qr.png`
    a.click()
  }

  const handleOpenLink = () => {
    if (tableUrl) {
      window.open(tableUrl, '_blank')
    }
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #printable-table-tent,
          #printable-table-tent * {
            visibility: visible !important;
          }
          #printable-table-tent {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 105mm !important;
            height: 148mm !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: white !important;
            color: #09090b !important;
            border: 2px solid #09090b !important;
            border-radius: 8mm !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            text-align: center !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100">
          <DialogHeader className="no-print">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-500" />
                <span>Table #{table.number} QR Stand</span>
              </div>
              {table.name && (
                <span className="text-xs font-normal text-zinc-400">
                  {table.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Printable Acrylic Table Stand Card */}
          <div
            id="printable-table-tent"
            className="bg-white text-zinc-950 p-6 rounded-3xl border-2 border-zinc-200 shadow-xl text-center space-y-4 max-w-[320px] mx-auto select-none"
          >
            {/* Top Brand Banner */}
            <div className="space-y-1 border-b border-zinc-200 pb-3">
              <div className="flex items-center justify-center gap-1.5 text-zinc-900">
                <Coffee className="w-5 h-5" />
                <span className="font-black text-sm tracking-wider uppercase">DAFATERKOM CAFÉ</span>
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold tracking-wide">
                Specialty Coffee & Artisan Treats
              </p>
            </div>

            {/* Table Number Highlight */}
            <div className="py-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                Dine-In Contactless Menu
              </span>
              <h2 className="text-4xl font-black tracking-tight text-zinc-900 mt-2">
                TABLE {table.number}
              </h2>
              {table.name && table.name !== `Table ${table.number}` && (
                <p className="text-xs text-zinc-500 font-medium mt-0.5">{table.name}</p>
              )}
            </div>

            {/* High-Resolution QR Code */}
            <div className="flex justify-center my-2">
              {qrDataUrl ? (
                <div className="p-2.5 bg-white rounded-2xl border-2 border-zinc-900 shadow-md">
                  <img
                    src={qrDataUrl}
                    alt={`QR for Table ${table.number}`}
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 bg-zinc-100 rounded-2xl flex items-center justify-center">
                  <span className="text-xs text-zinc-400">Generating QR...</span>
                </div>
              )}
            </div>

            {/* Instructions & Features */}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-zinc-800">
                Scan with your phone's camera
              </p>
              <p className="text-[11px] text-zinc-500 leading-tight">
                Browse our live menu, customize your order & send directly to the barista.
              </p>

              <div className="flex items-center justify-center gap-3 pt-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  No App Required
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Wifi className="w-3 h-3 text-blue-500" />
                  Free Guest Wi-Fi
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-3 no-print">
            <Button
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs h-9"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Stand</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadQr}
              disabled={!qrDataUrl}
              className="font-bold gap-1.5 text-xs h-9"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save PNG</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenLink}
              className="font-bold gap-1.5 text-xs h-9"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Test Menu</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
