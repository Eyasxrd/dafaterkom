'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Scan, 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  DollarSign, 
  Calendar, 
  Building2, 
  Warehouse, 
  Eye, 
  X,
  FileCheck2,
  Cpu,
  Settings,
  Key,
  Camera,
  Zap
} from 'lucide-react'
import { ParsedInvoiceItem, ParsedInvoiceResult } from '@/lib/invoice-parser'
import { createWorker } from 'tesseract.js'

interface Supplier {
  id: string
  name: string
  phone?: string | null
}

interface RawMaterial {
  id: string
  name: string
  unit: string
  costPerUnit?: number
}

interface MenuItem {
  id: string
  name: string
  price: number
  category?: { name: string }
}

interface InvoiceScannerModalProps {
  isOpen: boolean
  onClose: () => void
  suppliers: Supplier[]
  rawMaterials: RawMaterial[]
  menuItemsList: MenuItem[]
  onSuccess: () => void
}

export default function InvoiceScannerModal({
  isOpen,
  onClose,
  suppliers,
  rawMaterials,
  menuItemsList,
  onSuccess
}: InvoiceScannerModalProps) {
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'

  // Steps: 'upload' -> 'scanning' -> 'review' -> 'submitting'
  const [step, setStep] = useState<'upload' | 'scanning' | 'review'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // OCR Progress State
  const [scanProgress, setScanProgress] = useState(0)
  const [scanStatusText, setScanStatusText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Extracted and Editable Form State
  const [supplierId, setSupplierId] = useState('')
  const [newSupplierName, setNewSupplierName] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [destinationWarehouse, setDestinationWarehouse] = useState<'raw_materials' | 'finished_goods'>('raw_materials')
  const [tax, setTax] = useState('0')
  const [paidAmount, setPaidAmount] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ParsedInvoiceItem[]>([])
  
  // AI Vision & Engine state
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [engineUsed, setEngineUsed] = useState<'gemini_vision' | 'tesseract_ocr' | null>(null)
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dafaterkom_gemini_key') || ''
      setGeminiApiKey(saved)
    }
  }, [])

  const handleSaveApiKey = (val: string) => {
    setGeminiApiKey(val)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dafaterkom_gemini_key', val.trim())
    }
  }

  // Reset modal state
  const handleReset = () => {
    setStep('upload')
    setSelectedFile(null)
    setPreviewUrl(null)
    setScanProgress(0)
    setScanStatusText('')
    setErrorMessage(null)
    setEngineUsed(null)
    setSupplierId('')
    setNewSupplierName('')
    setInvoiceNumber('')
    setIssueDate(new Date().toISOString().split('T')[0])
    setDueDate('')
    setDestinationWarehouse('raw_materials')
    setTax('0')
    setPaidAmount('0')
    setPaymentMethod('cash')
    setNotes('')
    setItems([])
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  // Handle Drag & Drop Events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0])
    }
  }

  const handleLoadSampleInvoice = async (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    try {
      const res = await fetch('/sample-invoice.jpg')
      const blob = await res.blob()
      const file = new File([blob], 'sample-invoice.jpg', { type: 'image/jpeg' })
      processFile(file)
    } catch (err) {
      console.error('Failed to load sample invoice:', err)
    }
  }

  // Enhance image contrast & resolution for optimal OCR
  const enhanceImageForOCR = async (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) {
        return resolve(file)
      }

      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return resolve(file)

        const maxDim = 2000
        const scale = Math.min(2, Math.max(1, maxDim / Math.max(img.width, img.height)))
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imgData.data

        // Grayscale & dynamic contrast stretching
        for (let i = 0; i < d.length; i += 4) {
          const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
          d[i] = v
          d[i + 1] = v
          d[i + 2] = v
        }

        ctx.putImageData(imgData, 0, 0)
        canvas.toBlob((blob) => {
          resolve(blob || file)
        }, 'image/png')
      }

      img.onerror = () => resolve(file)
      img.src = url
    })
  }

  // Process File and Perform Multilingual OCR
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      setErrorMessage(isAr ? 'يرجى رفع صورة أو ملف PDF صالح' : 'Please upload a valid image (PNG, JPG, WEBP) or PDF invoice')
      return
    }

    setSelectedFile(file)
    setErrorMessage(null)
    setStep('scanning')
    setScanProgress(10)
    setScanStatusText(isAr ? 'جاري تحضير ومعالجة الفاتورة...' : 'Preparing invoice document...')

    // Create preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }

    try {
      let extractedOcrText = ''

      // Attempt 1: Fast client-side OCR worker using Tesseract.js (Arabic + English)
      try {
        setScanProgress(20)
        setScanStatusText(isAr ? 'معالجة جودة الصورة والتباين...' : 'Enhancing document resolution & contrast...')
        const enhancedBlob = await enhanceImageForOCR(file)

        setScanProgress(35)
        setScanStatusText(isAr ? 'تشغيل ماسح OCR الذكي (عربي + إنجليزي)...' : 'Initializing bilingual OCR engine (Arabic + English)...')

        const worker = await createWorker(['eng', 'ara'], 1, {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              const p = Math.min(85, Math.round(35 + (m.progress || 0) * 45))
              setScanProgress(p)
              setScanStatusText(
                isAr 
                  ? `قراءة وتدقيق النصوص والأرقام (${Math.round((m.progress || 0) * 100)}%)...` 
                  : `Recognizing text, quantities & prices (${Math.round((m.progress || 0) * 100)}%)...`
              )
            }
          }
        })

        const res = await worker.recognize(enhancedBlob)
        extractedOcrText = res.data.text || ''
        await worker.terminate()
      } catch (clientOcrErr) {
        console.warn('Client OCR notice, falling back to server parsing:', clientOcrErr)
      }

      setScanProgress(85)
      setScanStatusText(isAr ? 'استخراج الأصناف والأسعار ومطابقة المخزون...' : 'Extracting items, quantities, totals & matching inventory...')

      // Send to server parsing endpoint
      const formData = new FormData()
      formData.append('file', file)
      if (extractedOcrText) {
        formData.append('ocrText', extractedOcrText)
      }

      const scanHeaders: Record<string, string> = {}
      if (geminiApiKey && geminiApiKey.trim()) {
        scanHeaders['x-gemini-api-key'] = geminiApiKey.trim()
      }

      const response = await fetch('/api/purchases/scan', {
        method: 'POST',
        headers: scanHeaders,
        body: formData
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || (isAr ? 'فشل استخراج البيانات من الفاتورة' : 'Failed to parse invoice'))
      }

      const scanResult = await response.json()
      const data: ParsedInvoiceResult & { matchedSupplierId?: string } = scanResult.data
      setEngineUsed(scanResult.engineUsed || 'tesseract_ocr')

      // Populate Form Fields
      setInvoiceNumber(data.invoiceNumber || `PUR-${Date.now().toString().slice(-6)}`)
      setIssueDate(data.issueDate || new Date().toISOString().split('T')[0])
      setDueDate(data.dueDate || '')
      setTax(data.tax ? data.tax.toString() : '0')
      
      // Supplier matching
      if (data.matchedSupplierId) {
        setSupplierId(data.matchedSupplierId)
      } else if (data.supplierName) {
        // Find existing or set candidate
        const match = suppliers.find(s => s.name.toLowerCase() === data.supplierName?.toLowerCase())
        if (match) {
          setSupplierId(match.id)
        } else {
          setNewSupplierName(data.supplierName)
        }
      }

      // Populate items
      if (data.items && data.items.length > 0) {
        setItems(data.items)
      } else {
        // If no items detected, insert 1 default editable row
        setItems([{
          id: `item_${Date.now()}`,
          rawName: '',
          itemName: '',
          quantity: 1,
          unit: 'pieces',
          unitPrice: 0,
          totalPrice: 0,
          matchType: 'new'
        }])
      }

      setScanProgress(100)
      setScanStatusText(isAr ? 'تم استخراج البيانات بنجاح!' : 'Invoice parsed successfully!')
      setTimeout(() => {
        setStep('review')
      }, 400)

    } catch (err: any) {
      console.error('Invoice scanning error:', err)
      setErrorMessage(err.message || (isAr ? 'حدث خطأ أثناء قراءة الفاتورة' : 'An error occurred while scanning the invoice'))
      setStep('upload')
    }
  }

  // Row Modification Handlers
  const handleItemFieldChange = (index: number, field: keyof ParsedInvoiceItem, value: any) => {
    const next = [...items]
    const item = { ...next[index], [field]: value }

    // Recalculate line total if qty or unitPrice changed
    if (field === 'quantity' || field === 'unitPrice') {
      const q = parseFloat(field === 'quantity' ? value : item.quantity.toString()) || 0
      const p = parseFloat(field === 'unitPrice' ? value : item.unitPrice.toString()) || 0
      item.totalPrice = Math.round(q * p * 100) / 100
    }

    next[index] = item
    setItems(next)
  }

  const handleLinkItemChange = (index: number, selectionValue: string) => {
    const next = [...items]
    const item = { ...next[index] }

    if (selectionValue.startsWith('ing_')) {
      const ingId = selectionValue.replace('ing_', '')
      const found = rawMaterials.find(r => r.id === ingId)
      item.matchedIngredientId = ingId
      item.matchedMenuItemId = null
      item.matchType = 'ingredient'
      if (found) {
        item.itemName = found.name
        item.unit = found.unit
        if (found.costPerUnit && found.costPerUnit > 0 && item.unitPrice === 0) {
          item.unitPrice = found.costPerUnit
          item.totalPrice = Math.round(item.quantity * found.costPerUnit * 100) / 100
        }
      }
    } else if (selectionValue.startsWith('menu_')) {
      const mId = selectionValue.replace('menu_', '')
      const found = menuItemsList.find(m => m.id === mId)
      item.matchedMenuItemId = mId
      item.matchedIngredientId = null
      item.matchType = 'menu_item'
      if (found) {
        item.itemName = found.name
      }
    } else {
      item.matchedIngredientId = null
      item.matchedMenuItemId = null
      item.matchType = 'new'
    }

    next[index] = item
    setItems(next)
  }

  const handleAddItemRow = () => {
    setItems([
      ...items,
      {
        id: `item_${Date.now()}_${items.length}`,
        rawName: '',
        itemName: '',
        quantity: 1,
        unit: 'pieces',
        unitPrice: 0,
        totalPrice: 0,
        matchType: 'new'
      }
    ])
  }

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return
    const next = [...items]
    next.splice(index, 1)
    setItems(next)
  }

  // Calculated Summary Totals
  const calculatedSubtotal = items.reduce((sum, it) => sum + (it.totalPrice || 0), 0)
  const numTax = parseFloat(tax) || 0
  const calculatedGrandTotal = Math.round((calculatedSubtotal + numTax) * 100) / 100

  // Confirm and save invoice to database and inventory
  const [submitting, setSubmitting] = useState(false)
  const handleConfirmAndSave = async () => {
    setSubmitting(true)
    setErrorMessage(null)

    try {
      let finalSupplierId = supplierId

      // If a new supplier name is typed, auto-create the supplier first
      if (!finalSupplierId && newSupplierName.trim()) {
        const createSupRes = await fetch('/api/suppliers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newSupplierName.trim(),
            openingBalance: '0',
            notes: 'Auto-created via Invoice Scanner'
          })
        })
        if (createSupRes.ok) {
          const newSup = await createSupRes.json()
          finalSupplierId = newSup.id
        }
      }

      if (!finalSupplierId) {
        throw new Error(isAr ? 'يرجى اختيار مورد أو كتابة اسم المورد' : 'Please select or enter a supplier')
      }

      const validItems = items.filter(it => it.itemName.trim().length > 0)
      if (validItems.length === 0) {
        throw new Error(isAr ? 'يجب وجود صنف واحد على الأقل في الفاتورة' : 'Invoice must have at least one valid line item')
      }

      // Prepare payload for /api/purchases
      const payload = {
        supplierId: finalSupplierId,
        invoiceNumber: invoiceNumber.trim() || `PUR-${Date.now().toString().slice(-6)}`,
        issueDate: issueDate || new Date().toISOString(),
        dueDate: dueDate || null,
        destinationWarehouse,
        tax: numTax,
        paidAmount: parseFloat(paidAmount) || 0,
        paymentMethod,
        notes: notes ? `[Scanned via Smart Invoice OCR] ${notes}` : 'Scanned via Smart Invoice OCR',
        status: 'received', // Immediately restocks warehouse inventory
        items: validItems.map(it => ({
          ingredientId: it.matchedIngredientId || null,
          menuItemId: it.matchedMenuItemId || null,
          itemName: it.itemName.trim(),
          quantity: it.quantity,
          unit: it.unit || 'pieces',
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice
        }))
      }

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || (isAr ? 'فشل حفظ الفاتورة وتحديث المخزون' : 'Failed to save invoice and restock inventory'))
      }

      handleClose()
      onSuccess()
    } catch (err: any) {
      setErrorMessage(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()} className="max-w-4xl max-h-[92vh]">
      <DialogContent className="p-0 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200/60 dark:border-white/10 flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-md">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isAr ? 'ماسح الفواتير الذكي للموردين' : 'Smart Invoice Scanner'}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {isAr ? 'عربي + English' : 'Bilingual OCR'}
                </span>
                {geminiApiKey ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    {isAr ? 'ذكاء اصطناعي مفعّل' : 'AI Vision Active'}
                  </span>
                ) : null}
              </DialogTitle>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr 
                  ? 'يدعم صور كاميرا الجوال، الفواتير الورقية، السكنر، والإيصالات الحرارية مع معالجة الظلال والضوضاء'
                  : 'Supports mobile camera photos, paper receipts, scanner documents & handles shadows/noise'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowApiKeyConfig(!showApiKeyConfig)}
              className={`h-8 text-xs gap-1.5 cursor-pointer glass-panel ${
                geminiApiKey ? 'text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700' : 'text-slate-600'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>{isAr ? 'مفتاح AI مجاني' : 'AI Vision Key'}</span>
            </Button>

            <button 
              type="button" 
              onClick={handleClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Optional Gemini API Key Drawer */}
        {showApiKeyConfig && (
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 border-b border-amber-200/80 dark:border-amber-800/40 text-xs space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {isAr ? 'تفعيل الذكاء الاصطناعي للصور الملتقطة بكاميرا الجوال (اختياري - مجاني)' : 'Enable AI Vision for Mobile Phone Camera Photos (Optional & Free)'}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr 
                    ? 'يمنح دقة 100% للصور غير الواضحة، الإيصالات الحرارية الباهتة، والخط اليدوي عبر Google Gemini Flash.'
                    : 'Provides human-level accuracy on crumpled receipts, mobile shadows, thermal paper & Arabic handwriting.'}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowApiKeyConfig(false)}
                className="h-6 text-[10px] text-slate-400"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </Button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Input
                type="password"
                placeholder={isAr ? 'الصق مفتاح Google Gemini API المجاني هنا...' : 'Paste free Google Gemini API Key here (AIzaSy...)'}
                value={geminiApiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                className="h-8 text-xs flex-1 font-mono bg-white dark:bg-slate-900"
              />
              {geminiApiKey && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveApiKey('')}
                  className="h-8 text-[11px] text-rose-500"
                >
                  {isAr ? 'مسح' : 'Clear'}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 text-xs border border-rose-200 dark:border-rose-800/60 flex items-center gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 1: UPLOAD & DRAG DROP */}
          {/* ------------------------------------------------------------- */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 relative overflow-hidden group ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]'
                    : 'border-slate-300 dark:border-white/15 hover:border-blue-400 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100">
                    {isAr ? 'اسحب وأفلت الفاتورة هنا أو انقر للتصفح' : 'Drag & drop invoice here, or click to browse'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr 
                      ? 'يدعم صور الفواتير الورقية والإلكترونية (PNG, JPG, JPEG, WEBP) وملفات PDF'
                      : 'Supports receipt photos, scanned documents (PNG, JPG, WEBP) & PDF invoices'}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {isAr ? 'استخراج الأصناف والأسعار تلقائياً' : 'Auto Price & Item Extraction'}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1.5">
                    <Warehouse className="w-3.5 h-3.5 text-emerald-500" />
                    {isAr ? 'مطابقة مع مخزن المواد الخام' : 'Auto Inventory Matching'}
                  </span>
                </div>
              </div>

              {/* Sample Invoice One-Click Test Bar */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/40 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-blue-600 text-white text-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isAr ? 'فاتورة تجريبية جاهزة للاختبار (عربي + English)' : 'Sample Ready-to-Test Invoice (Bilingual)'}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isAr ? 'شركة البركة للتوريدات الغذائية (حليب، جبنة، طماطم، قهوة)' : 'Al-Baraka Food Supplies (Milk, Cheese, Tomato, Coffee)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/sample-invoice.jpg"
                    download="sample-invoice.jpg"
                    onClick={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold hover:bg-white dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
                  >
                    {isAr ? 'تحميل الملف' : 'Download File'}
                  </a>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleLoadSampleInvoice}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isAr ? 'اختبار المسح فوراً' : 'Test Scan Now'}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 2: SCANNING ANIMATION */}
          {/* ------------------------------------------------------------- */}
          {step === 'scanning' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
              <div className="relative w-28 h-36 rounded-2xl border-2 border-blue-400/80 bg-slate-900/5 dark:bg-white/5 overflow-hidden flex items-center justify-center shadow-lg">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-60" />
                ) : (
                  <FileText className="w-12 h-12 text-slate-400 opacity-40" />
                )}

                {/* Laser Scanning Bar */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_rgba(59,130,246,1)] animate-[bounce_1.5s_infinite]" />
              </div>

              <div className="space-y-2 max-w-sm">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                  <span>{scanStatusText}</span>
                </h4>
                
                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300 rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <div className="text-[11px] font-mono text-slate-400">{scanProgress}%</div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 3: REVIEW & EDIT TABLE */}
          {/* ------------------------------------------------------------- */}
          {step === 'review' && (
            <div className="space-y-5">
              {/* Header Details Form (Supplier, Inv #, Date, Due Date, Warehouse) */}
              <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-blue-600" />
                      {isAr ? 'بيانات الفاتورة المستخرجة' : 'Invoice General Information'}
                    </span>
                    {engineUsed === 'gemini_vision' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        {isAr ? 'تم الاستخراج بـ AI Vision (معالجة الصور والظلال)' : 'AI Vision (Mobile & Shadow Optimized)'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 flex items-center gap-1">
                        <Cpu className="w-3 h-3 text-blue-500" />
                        {isAr ? 'محرك OCR المحلي' : 'Local OCR Engine'}
                      </span>
                    )}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setStep('upload')}
                    className="text-xs h-7 text-slate-500 hover:text-blue-600 cursor-pointer gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'مسح فاتورة أخرى' : 'Scan Another File'}</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Supplier Select / Create */}
                  <div className="sm:col-span-2">
                    <Label className="text-xs">{isAr ? 'المورد *' : 'Supplier *'}</Label>
                    <div className="flex gap-2 mt-1">
                      <Select value={supplierId} onValueChange={setSupplierId}>
                        <SelectTrigger className="text-xs flex-1">
                          <SelectValue placeholder={isAr ? 'اختر مورد مسجل...' : 'Select supplier...'} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {suppliers.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {!supplierId && (
                        <Input
                          placeholder={isAr ? 'أو اكتب اسم مورد جديد...' : 'Or enter new supplier name...'}
                          value={newSupplierName}
                          onChange={(e) => setNewSupplierName(e.target.value)}
                          className="text-xs flex-1"
                        />
                      )}
                    </div>
                  </div>

                  {/* Invoice Number */}
                  <div>
                    <Label className="text-xs">{isAr ? 'رقم الفاتورة' : 'Invoice Number'}</Label>
                    <Input
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="INV-001"
                      className="mt-1 text-xs font-mono font-bold"
                    />
                  </div>

                  {/* Warehouse Destination */}
                  <div>
                    <Label className="text-xs">{isAr ? 'المخزن المستلم' : 'Destination Warehouse'}</Label>
                    <Select
                      value={destinationWarehouse}
                      onValueChange={(val: any) => setDestinationWarehouse(val)}
                    >
                      <SelectTrigger className="mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="raw_materials">{isAr ? 'مخزن المواد الخام' : 'Raw Materials'}</SelectItem>
                        <SelectItem value="finished_goods">{isAr ? 'مخزن المنتجات التامة' : 'Finished Goods'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Issue Date */}
                  <div>
                    <Label className="text-xs">{isAr ? 'تاريخ الفاتورة' : 'Issue Date'}</Label>
                    <Input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>

                  {/* Due Date */}
                  <div>
                    <Label className="text-xs">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</Label>
                    <Input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>

                  {/* Tax */}
                  <div>
                    <Label className="text-xs">{isAr ? 'قيمة الضريبة ($)' : 'Tax Amount ($)'}</Label>
                    <Input
                      type="number"
                      step="any"
                      value={tax}
                      onChange={(e) => setTax(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>

                  {/* Initial Paid Amount */}
                  <div>
                    <Label className="text-xs">{isAr ? 'المدفوع مقدماً ($)' : 'Paid Amount ($)'}</Label>
                    <Input
                      type="number"
                      step="any"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Editable Table */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {isAr ? 'جدول الأصناف والكميات والأسعار المستخرجة' : 'Extracted Items, Quantities & Prices'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-mono">
                      {items.length} {isAr ? 'بند' : 'items'}
                    </span>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddItemRow}
                    className="text-xs h-7 gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? '+ إضافة بند' : '+ Add Item'}</span>
                  </Button>
                </div>

                <div className="border border-slate-200/70 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-72">
                    <table className="w-full text-start text-xs border-collapse">
                      <thead className="bg-slate-100/90 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 sticky top-0 z-10 border-b border-slate-200 dark:border-white/10">
                        <tr>
                          <th className="p-2.5 text-start font-bold">{isAr ? 'اسم الصنف بالفاتورة' : 'Scraped Item Name'}</th>
                          <th className="p-2.5 text-start font-bold">{isAr ? 'ربط بالمخزون / المادة' : 'Inventory Item Link'}</th>
                          <th className="p-2.5 text-start font-bold w-24">{isAr ? 'الكمية' : 'Quantity'}</th>
                          <th className="p-2.5 text-start font-bold w-24">{isAr ? 'الوحدة' : 'Unit'}</th>
                          <th className="p-2.5 text-start font-bold w-24">{isAr ? 'سعر الوحدة' : 'Unit Price'}</th>
                          <th className="p-2.5 text-start font-bold w-24">{isAr ? 'الإجمالي' : 'Total'}</th>
                          <th className="p-2.5 text-center font-bold w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 bg-white dark:bg-slate-900/40">
                        {items.map((item, idx) => {
                          const currentLinkValue = item.matchedIngredientId 
                            ? `ing_${item.matchedIngredientId}`
                            : item.matchedMenuItemId
                              ? `menu_${item.matchedMenuItemId}`
                              : 'custom'

                          return (
                            <tr key={item.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02]">
                              {/* Scraped / Item Name */}
                              <td className="p-2 min-w-[140px]">
                                <Input
                                  value={item.itemName}
                                  onChange={(e) => handleItemFieldChange(idx, 'itemName', e.target.value)}
                                  placeholder={isAr ? 'اسم الصنف' : 'Item name'}
                                  className="h-8 text-xs font-semibold"
                                />
                              </td>

                              {/* Inventory Link Select */}
                              <td className="p-2 min-w-[180px]">
                                <Select
                                  value={currentLinkValue}
                                  onValueChange={(val) => handleLinkItemChange(idx, val)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder={isAr ? 'اختر مادة للربط...' : 'Link to stock...'} />
                                  </SelectTrigger>
                                  <SelectContent className="max-h-56">
                                    <SelectItem value="custom">{isAr ? '-- صنف مخصص غير مرتبط --' : '-- Custom (Not linked) --'}</SelectItem>
                                    
                                    {rawMaterials.length > 0 && (
                                      <div className="px-2 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                        🌿 {isAr ? 'المواد الخام والأولية' : 'Raw Materials'}
                                      </div>
                                    )}
                                    {rawMaterials.map(r => (
                                      <SelectItem key={`ing_${r.id}`} value={`ing_${r.id}`}>
                                        {r.name} ({r.unit})
                                      </SelectItem>
                                    ))}

                                    {menuItemsList.length > 0 && (
                                      <div className="px-2 py-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider border-t border-slate-100 dark:border-white/5 mt-1 pt-1">
                                        📦 {isAr ? 'منتجات المتجر والمخزون' : 'Retail Products'}
                                      </div>
                                    )}
                                    {menuItemsList.map(m => (
                                      <SelectItem key={`menu_${m.id}`} value={`menu_${m.id}`}>
                                        {m.name} (${m.price.toFixed(2)})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>

                              {/* Quantity */}
                              <td className="p-2">
                                <Input
                                  type="number"
                                  step="any"
                                  value={item.quantity}
                                  onChange={(e) => handleItemFieldChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="h-8 text-xs text-center font-mono font-bold"
                                />
                              </td>

                              {/* Unit */}
                              <td className="p-2">
                                <Select
                                  value={item.unit}
                                  onValueChange={(val) => handleItemFieldChange(idx, 'unit', val)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pieces">{isAr ? 'قطعة (pcs)' : 'pieces'}</SelectItem>
                                    <SelectItem value="kg">{isAr ? 'كجم (kg)' : 'kg'}</SelectItem>
                                    <SelectItem value="grams">{isAr ? 'جرام (g)' : 'grams'}</SelectItem>
                                    <SelectItem value="liters">{isAr ? 'لتر (L)' : 'liters'}</SelectItem>
                                    <SelectItem value="ml">{isAr ? 'مل (ml)' : 'ml'}</SelectItem>
                                    <SelectItem value="box">{isAr ? 'كرتون (box)' : 'box'}</SelectItem>
                                    <SelectItem value="pack">{isAr ? 'باكيت (pack)' : 'pack'}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>

                              {/* Unit Price */}
                              <td className="p-2">
                                <Input
                                  type="number"
                                  step="any"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemFieldChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  className="h-8 text-xs text-end font-mono"
                                />
                              </td>

                              {/* Total Price */}
                              <td className="p-2 text-end font-mono font-bold text-slate-800 dark:text-slate-100">
                                ${(item.totalPrice || 0).toFixed(2)}
                              </td>

                              {/* Delete Row Button */}
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemRow(idx)}
                                  disabled={items.length <= 1}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 disabled:opacity-30 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Financial Summary Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 text-white flex flex-wrap items-center justify-between gap-4 shadow-md">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[11px] text-slate-400 block">{isAr ? 'المجموع قبل الضريبة' : 'Subtotal'}</span>
                    <span className="text-sm font-bold font-mono">${calculatedSubtotal.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block">{isAr ? 'الضريبة' : 'Tax'}</span>
                    <span className="text-sm font-bold font-mono">${numTax.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-amber-400 font-semibold block">{isAr ? 'إجمالي الفاتورة' : 'Grand Total'}</span>
                    <span className="text-lg font-black text-amber-400 font-mono">${calculatedGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-[11px] text-slate-400 block">{isAr ? 'المدفوع مقدماً' : 'Paid Now'}</span>
                    <span className="text-sm font-bold font-mono">${(parseFloat(paidAmount) || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-rose-300 block">{isAr ? 'المتبقي كذمم' : 'Remaining Due'}</span>
                    <span className="text-sm font-bold font-mono text-rose-300">
                      ${Math.max(0, calculatedGrandTotal - (parseFloat(paidAmount) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200/60 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="text-xs cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>

          {step === 'review' && (
            <Button
              type="button"
              onClick={handleConfirmAndSave}
              disabled={submitting}
              className="liquid-btn-primary text-xs font-bold gap-2 cursor-pointer shadow-md"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري ترحيل الفاتورة وتحديث المخزون...' : 'Adding to inventory & posting...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد الفاتورة وإضافتها للمخزون' : 'Confirm & Add to Inventory'}</span>
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
