'use client'

import { useState, useRef, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Check, 
  RotateCcw,
  Sparkles,
  PackageCheck,
  Columns3,
  Eye,
  Layers,
  Search,
  Filter,
  Package,
  TrendingUp,
  AlertTriangle,
  FolderOpen,
  ArrowUpRight,
  Info
} from 'lucide-react'

interface ColumnMapping {
  name: string
  quantity: string
  category: string
  price: string
  unit: string
  threshold: string
  description: string
}

interface ParsedRow {
  index: number
  name: string
  quantity: number
  category: string
  price: number
  unit: string
  threshold: number
  description: string
  isValid: boolean
  errorReason?: string
  raw: any
}

interface StockExcelImporterProps {
  onNavigateToInventory?: () => void
}

export default function StockExcelImporter({ onNavigateToInventory }: StockExcelImporterProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // File state
  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<string>('')
  const [availableSheets, setAvailableSheets] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string>('')
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([])
  const [rawSheetData, setRawSheetData] = useState<any[]>([])

  // Configuration state
  const [targetType, setTargetType] = useState<'menu_items' | 'ingredients'>('menu_items')
  const [duplicateMode, setDuplicateMode] = useState<'add' | 'overwrite'>('add')
  const [mapping, setMapping] = useState<ColumnMapping>({
    name: '',
    quantity: '',
    category: '',
    price: '',
    unit: '',
    threshold: '',
    description: ''
  })

  // Preview & filter state
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'invalid'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Import execution state
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    createdCount: number
    updatedCount: number
    skippedCount: number
    totalProcessed: number
    errors: string[]
  } | null>(null)

  // Sample spreadsheet templates
  const handleDownloadSample = (templateType: 'coffee' | 'bakery' | 'qsr') => {
    let sampleData: any[] = []
    let templateFileName = 'dafaterkom_stock_template.xlsx'

    if (templateType === 'coffee') {
      templateFileName = 'dafaterkom_coffee_stock_template.xlsx'
      sampleData = [
        {
          "Product Name": "Espresso Blend Beans (1kg)",
          "Category": "Whole Beans",
          "Stock Quantity": 40,
          "Unit": "kg",
          "Retail Price": 24.50,
          "Low Stock Alert": 10,
          "Description": "Premium arabica blend"
        },
        {
          "Product Name": "Oat Milk Barista Edition (1L)",
          "Category": "Dairy & Milk",
          "Stock Quantity": 120,
          "Unit": "liters",
          "Retail Price": 3.80,
          "Low Stock Alert": 24,
          "Description": "Plant-based oat milk"
        },
        {
          "Product Name": "Spanish Vanilla Syrup (750ml)",
          "Category": "Syrups & Flavors",
          "Stock Quantity": 25,
          "Unit": "bottles",
          "Retail Price": 12.00,
          "Low Stock Alert": 5,
          "Description": "Pure Madagascar vanilla syrup"
        },
        {
          "Product Name": "Single Origin Ethiopia Yirgacheffe (250g)",
          "Category": "Whole Beans",
          "Stock Quantity": 50,
          "Unit": "bags",
          "Retail Price": 18.00,
          "Low Stock Alert": 12,
          "Description": "Floral notes with citrus acidity"
        }
      ]
    } else if (templateType === 'bakery') {
      templateFileName = 'dafaterkom_bakery_stock_template.xlsx'
      sampleData = [
        {
          "Product Name": "Butter Croissant",
          "Category": "Viennoiserie",
          "Stock Quantity": 60,
          "Unit": "pieces",
          "Retail Price": 3.50,
          "Low Stock Alert": 15,
          "Description": "French laminated all-butter pastry"
        },
        {
          "Product Name": "Pain au Chocolat",
          "Category": "Viennoiserie",
          "Stock Quantity": 45,
          "Unit": "pieces",
          "Retail Price": 4.00,
          "Low Stock Alert": 12,
          "Description": "Belgian dark chocolate croissant"
        },
        {
          "Product Name": "Rustic Sourdough Loaf (800g)",
          "Category": "Artisan Breads",
          "Stock Quantity": 30,
          "Unit": "loaves",
          "Retail Price": 7.50,
          "Low Stock Alert": 8,
          "Description": "36-hour slow fermented sourdough"
        }
      ]
    } else {
      templateFileName = 'dafaterkom_qsr_stock_template.xlsx'
      sampleData = [
        {
          "Product Name": "Smash Burger Patty (Beef)",
          "Category": "Patties & Proteins",
          "Stock Quantity": 150,
          "Unit": "pieces",
          "Retail Price": 9.50,
          "Low Stock Alert": 30,
          "Description": "Certified Angus beef 100g patty"
        },
        {
          "Product Name": "Brioche Burger Buns",
          "Category": "Buns & Breads",
          "Stock Quantity": 180,
          "Unit": "pieces",
          "Retail Price": 1.25,
          "Low Stock Alert": 40,
          "Description": "Golden glazed toasted brioche"
        },
        {
          "Product Name": "Skin-On Fries (2.5kg Bag)",
          "Category": "Sides & Frozen",
          "Stock Quantity": 35,
          "Unit": "bags",
          "Retail Price": 4.50,
          "Low Stock Alert": 10,
          "Description": "Crispy seasoned cut fries"
        }
      ]
    }

    const worksheet = XLSX.utils.json_to_sheet(sampleData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Template')
    XLSX.writeFile(workbook, templateFileName)
  }

  // Handle File Load
  const processUploadedFile = (file: File) => {
    setFileName(file.name)
    setFileSize((file.size / 1024).toFixed(1) + ' KB')

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        setRawWorkbook(wb)
        setAvailableSheets(wb.SheetNames)

        const initialSheet = wb.SheetNames[0]
        setSelectedSheet(initialSheet)
        processSheet(wb, initialSheet)
        setCurrentStep(2)
      } catch (err) {
        console.error('Failed to parse spreadsheet file:', err)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processUploadedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      processUploadedFile(file)
    }
  }

  const processSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName]
    const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })

    if (json.length > 0) {
      const headers = Object.keys(json[0])
      setSheetHeaders(headers)
      setRawSheetData(json)
      autoDetectColumns(headers)
    }
  }

  // Smart Header Auto-Matching
  const autoDetectColumns = (headers: string[]) => {
    const findHeader = (keywords: string[]) => {
      return headers.find(h => {
        const lower = h.toLowerCase().trim()
        return keywords.some(k => lower.includes(k))
      }) || ''
    }

    const autoMapping: ColumnMapping = {
      name: findHeader(['product', 'item', 'title', 'name', 'article', 'description']),
      quantity: findHeader(['quantity', 'qty', 'stock', 'count', 'amount', 'balance', 'units']),
      category: findHeader(['category', 'cat', 'group', 'department', 'type', 'section']),
      price: findHeader(['price', 'cost', 'retail', 'rate', 'selling']),
      unit: findHeader(['unit', 'uom', 'measure']),
      threshold: findHeader(['threshold', 'min', 'low', 'alert', 'reorder']),
      description: findHeader(['desc', 'notes', 'detail', 'info'])
    }

    setMapping(autoMapping)
  }

  // Sample value from row 1 for a given column
  const getSampleValue = (columnKey: string): string => {
    if (!columnKey || columnKey === '__none__' || rawSheetData.length === 0) return ''
    const firstRowVal = rawSheetData[0][columnKey]
    if (firstRowVal === undefined || firstRowVal === null || firstRowVal === '') return '(empty)'
    return String(firstRowVal)
  }

  // Parse Rows for Preview
  const handleProceedToPreview = () => {
    const parsed: ParsedRow[] = rawSheetData.map((row, idx) => {
      const rawName = mapping.name ? String(row[mapping.name] || '').trim() : ''
      const rawQty = mapping.quantity ? parseFloat(row[mapping.quantity]) : 0
      const rawCategory = mapping.category && mapping.category !== '__none__' ? String(row[mapping.category] || '').trim() : 'General'
      const rawPrice = mapping.price && mapping.price !== '__none__' ? parseFloat(row[mapping.price]) : 0
      const rawUnit = mapping.unit && mapping.unit !== '__none__' ? String(row[mapping.unit] || '').trim() : (targetType === 'ingredients' ? 'grams' : 'pieces')
      const rawThreshold = mapping.threshold && mapping.threshold !== '__none__' ? parseFloat(row[mapping.threshold]) : 10
      const rawDesc = mapping.description && mapping.description !== '__none__' ? String(row[mapping.description] || '').trim() : ''

      let isValid = true
      let errorReason = ''

      if (!rawName) {
        isValid = false
        errorReason = 'Missing item name'
      } else if (isNaN(rawQty) || rawQty < 0) {
        isValid = false
        errorReason = 'Invalid quantity'
      }

      return {
        index: idx + 1,
        name: rawName,
        quantity: isNaN(rawQty) ? 0 : rawQty,
        category: rawCategory || 'General',
        price: isNaN(rawPrice) ? 0 : rawPrice,
        unit: rawUnit || 'pieces',
        threshold: isNaN(rawThreshold) ? 10 : rawThreshold,
        description: rawDesc,
        isValid,
        errorReason,
        raw: row
      }
    })

    setParsedRows(parsed)
    setCurrentStep(3)
  }

  // Filtered Preview Data
  const filteredRows = useMemo(() => {
    return parsedRows.filter((r) => {
      if (previewFilter === 'valid' && !r.isValid) return false
      if (previewFilter === 'invalid' && r.isValid) return false
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        return r.name.toLowerCase().includes(query) || r.category.toLowerCase().includes(query)
      }
      return true
    })
  }, [parsedRows, previewFilter, searchQuery])

  // Submit to Import API
  const handleExecuteImport = async () => {
    setImporting(true)
    const validItems = parsedRows.filter(r => r.isValid).map(r => ({
      name: r.name,
      category: r.category,
      quantity: r.quantity,
      unit: r.unit,
      price: r.price,
      threshold: r.threshold,
      description: r.description
    }))

    try {
      const res = await fetch('/api/inventory/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          duplicateMode,
          items: validItems
        })
      })

      const data = await res.json()
      setImportResult(data)
      setCurrentStep(4)
    } catch (err: any) {
      setImportResult({
        success: false,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: validItems.length,
        totalProcessed: validItems.length,
        errors: [err.message || 'Import failed']
      })
      setCurrentStep(4)
    } finally {
      setImporting(false)
    }
  }

  const validCount = parsedRows.filter(r => r.isValid).length
  const invalidCount = parsedRows.length - validCount
  const totalValuation = parsedRows.filter(r => r.isValid).reduce((acc, r) => acc + (r.price * r.quantity), 0)

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl liquid-btn-primary flex items-center justify-center shadow-md">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-200 dark:to-slate-300 bg-clip-text text-transparent">
                Excel & CSV Stock Importer
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulk catalog synchronization with auto-column matching, live row preview, and stock valuation
              </p>
            </div>
          </div>
        </div>

        {currentStep === 1 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Templates:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadSample('coffee')}
              className="text-xs gap-1.5 h-8 font-semibold rounded-xl"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span>Café</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadSample('bakery')}
              className="text-xs gap-1.5 h-8 font-semibold rounded-xl"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>Bakery</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDownloadSample('qsr')}
              className="text-xs gap-1.5 h-8 font-semibold rounded-xl"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Restaurant</span>
            </Button>
          </div>
        )}
      </div>

      {/* Stepper Header */}
      <div className="grid grid-cols-4 gap-2.5 text-xs">
        {[
          { step: 1, title: 'Upload Sheet', desc: 'Excel or CSV' },
          { step: 2, title: 'Map Columns', desc: 'Live Field Match' },
          { step: 3, title: 'Preview & Verify', desc: 'Audit & Filter' },
          { step: 4, title: 'Import Summary', desc: 'Sync Result' }
        ].map((s) => {
          const isActive = currentStep === s.step
          const isDone = currentStep > s.step

          return (
            <div
              key={s.step}
              className={`p-3 rounded-2xl border transition-all flex items-center gap-3 ${
                isActive
                  ? 'liquid-btn-primary font-bold shadow-md'
                  : isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'glass-card border-slate-200/80 dark:border-white/5 text-slate-400'
              }`}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                isActive 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : isDone 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
              }`}>
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.step}
              </div>
              <div className="min-w-0 hidden sm:block">
                <div className="font-extrabold truncate">{s.title}</div>
                <div className={`text-[10px] truncate ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{s.desc}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* STEP 1: Upload File */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`glass-panel border-2 border-dashed p-10 text-center rounded-3xl transition-all duration-200 ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
                : 'border-slate-300 dark:border-white/10 hover:border-blue-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="max-w-md mx-auto space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600/15 via-indigo-600/15 to-cyan-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-inner border border-blue-500/20">
                <UploadCloud className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  Drag & Drop your Stock Spreadsheet
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                  Upload your Microsoft Excel (.xlsx, .xls) or CSV file. We will automatically detect headers and let you map each column in the next step.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="liquid-btn-primary font-bold gap-2 px-6 h-11 rounded-2xl cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Choose Spreadsheet File</span>
                </Button>
              </div>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2 font-medium">
                <span>• Supports .XLSX, .XLS, .CSV</span>
                <span>• Up to 5,000 items</span>
                <span>• Multi-sheet support</span>
              </div>
            </div>
          </Card>

          {/* Quick Guide Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl glass-card flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Smart Column Match</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Dafaterkom automatically recognises column names like "Item", "Qty", "Cost", and "Category".</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card flex items-start gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Duplicate Resolution</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Choose whether existing items should accumulate stock counts or overwrite existing values.</div>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card flex items-start gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Zero-Risk Preview</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Audit every row with validation error indicators before any changes touch your database.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Column Mapping */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* File & Target Config Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Loaded File</span>
              <div className="text-sm font-black text-slate-900 dark:text-white truncate">{fileName}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-2">
                <span>{rawSheetData.length} Rows</span>
                <span>•</span>
                <span>{fileSize}</span>
                {availableSheets.length > 1 && (
                  <select
                    value={selectedSheet}
                    onChange={(e) => {
                      setSelectedSheet(e.target.value)
                      if (rawWorkbook) processSheet(rawWorkbook, e.target.value)
                    }}
                    className="ml-auto text-[11px] font-semibold bg-transparent border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded px-1.5 py-0.5 outline-none"
                  >
                    {availableSheets.map(s => (
                      <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        {s}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </Card>

            <Card className="glass-card p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Catalog Destination</span>
              <Select value={targetType} onValueChange={(v: any) => setTargetType(v)}>
                <SelectTrigger className="h-9 text-xs font-bold rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="menu_items">POS Menu Items & Retail Stock</SelectItem>
                  <SelectItem value="ingredients">Raw Kitchen Recipe Ingredients</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            <Card className="glass-card p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Existing Item Handling</span>
              <Select value={duplicateMode} onValueChange={(v: any) => setDuplicateMode(v)}>
                <SelectTrigger className="h-9 text-xs font-bold rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Accumulate (+ Add to current count)</SelectItem>
                  <SelectItem value="overwrite">Overwrite (Exact count reset)</SelectItem>
                </SelectContent>
              </Select>
            </Card>
          </div>

          {/* Interactive Column Mapping Panel */}
          <Card className="glass-panel rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-xl">
            <CardHeader className="pb-4 border-b border-slate-200/60 dark:border-white/[0.08] flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-black flex items-center gap-2">
                  <Columns3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Map Spreadsheet Columns to POS Fields</span>
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confirm which header in your sheet corresponds to each Dafaterkom system field
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => autoDetectColumns(sheetHeaders)}
                className="text-xs gap-1.5 h-8 rounded-xl font-bold"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Auto-Detect Headers</span>
              </Button>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                
                {/* Product Name (Required) */}
                <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/[0.04] border border-blue-500/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-extrabold text-blue-900 dark:text-blue-300">
                      Product / Item Name *
                    </Label>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                      Required
                    </span>
                  </div>
                  <Select value={mapping.name} onValueChange={(v) => setMapping({ ...mapping, name: v })}>
                    <SelectTrigger className="h-9 bg-white dark:bg-slate-900 font-semibold rounded-xl">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetHeaders.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping.name && (
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate flex items-center gap-1.5">
                      <span className="text-slate-400">Row 1 sample:</span>
                      <span className="font-bold bg-blue-500/10 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                        "{getSampleValue(mapping.name)}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Stock Quantity (Required) */}
                <div className="p-4 rounded-2xl bg-blue-500/5 dark:bg-blue-500/[0.04] border border-blue-500/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-extrabold text-blue-900 dark:text-blue-300">
                      Stock Quantity *
                    </Label>
                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                      Required
                    </span>
                  </div>
                  <Select value={mapping.quantity} onValueChange={(v) => setMapping({ ...mapping, quantity: v })}>
                    <SelectTrigger className="h-9 bg-white dark:bg-slate-900 font-semibold rounded-xl">
                      <SelectValue placeholder="Select column..." />
                    </SelectTrigger>
                    <SelectContent>
                      {sheetHeaders.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping.quantity && (
                    <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium truncate flex items-center gap-1.5">
                      <span className="text-slate-400">Row 1 sample:</span>
                      <span className="font-bold bg-blue-500/10 px-2 py-0.5 rounded-md">
                        {getSampleValue(mapping.quantity)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Category (Optional) */}
                <div className="p-4 rounded-2xl glass-card space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Category
                    </Label>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold">Optional</span>
                  </div>
                  <Select value={mapping.category} onValueChange={(v) => setMapping({ ...mapping, category: v })}>
                    <SelectTrigger className="h-9 bg-white dark:bg-slate-900 font-semibold rounded-xl">
                      <SelectValue placeholder="Select column (or default 'General')" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None (Assign to General) --</SelectItem>
                      {sheetHeaders.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping.category && mapping.category !== '__none__' && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1.5">
                      <span className="text-slate-400">Row 1 sample:</span>
                      <span className="font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                        "{getSampleValue(mapping.category)}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Retail Price (Optional) */}
                <div className="p-4 rounded-2xl glass-card space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Retail Selling Price ($)
                    </Label>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold">Optional</span>
                  </div>
                  <Select value={mapping.price} onValueChange={(v) => setMapping({ ...mapping, price: v })}>
                    <SelectTrigger className="h-9 bg-white dark:bg-slate-900 font-semibold rounded-xl">
                      <SelectValue placeholder="Select column (or default $0.00)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None ($0.00 default) --</SelectItem>
                      {sheetHeaders.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping.price && mapping.price !== '__none__' && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1.5">
                      <span className="text-slate-400">Row 1 sample:</span>
                      <span className="font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        ${getSampleValue(mapping.price)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Unit of Measure (Optional) */}
                <div className="p-4 rounded-2xl glass-card space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Unit of Measure
                    </Label>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold">Optional</span>
                  </div>
                  <Select value={mapping.unit} onValueChange={(v) => setMapping({ ...mapping, unit: v })}>
                    <SelectTrigger className="h-9 bg-white dark:bg-slate-900 font-semibold rounded-xl">
                      <SelectValue placeholder="Select column (e.g. pieces, kg)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None (Default 'pieces') --</SelectItem>
                      {sheetHeaders.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping.unit && mapping.unit !== '__none__' && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1.5">
                      <span className="text-slate-400">Row 1 sample:</span>
                      <span className="font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {getSampleValue(mapping.unit)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Low Stock Alert Threshold (Optional) */}
                <div className="p-4 rounded-2xl glass-card space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Low Stock Alert Threshold
                    </Label>
                    <span className="text-[10px] uppercase text-slate-400 font-semibold">Optional</span>
                  </div>
                  <Select value={mapping.threshold} onValueChange={(v) => setMapping({ ...mapping, threshold: v })}>
                    <SelectTrigger className="h-9 bg-white dark:bg-slate-900 font-semibold rounded-xl">
                      <SelectValue placeholder="Select column (or default 10)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">-- None (Default 10) --</SelectItem>
                      {sheetHeaders.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mapping.threshold && mapping.threshold !== '__none__' && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center gap-1.5">
                      <span className="text-slate-400">Row 1 sample:</span>
                      <span className="font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {getSampleValue(mapping.threshold)}
                      </span>
                    </div>
                  )}
                </div>

              </div>

              {/* Step 2 Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200/60 dark:border-white/[0.08]">
                <Button variant="outline" onClick={() => setCurrentStep(1)} className="gap-1.5 rounded-xl h-10">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Choose Another File</span>
                </Button>

                <Button
                  onClick={handleProceedToPreview}
                  disabled={!mapping.name || !mapping.quantity}
                  className="liquid-btn-primary font-bold gap-2 rounded-xl h-10 px-6 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <span>Preview & Verify Rows</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: Preview & Validation Table */}
      {currentStep === 3 && (
        <div className="space-y-4">
          
          {/* Top Control Banner */}
          <div className="glass-panel p-4 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setPreviewFilter('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  All ({parsedRows.length})
                </button>
                <button
                  onClick={() => setPreviewFilter('valid')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    previewFilter === 'valid'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'text-emerald-600 dark:text-emerald-400 hover:opacity-80'
                  }`}
                >
                  Valid ({validCount})
                </button>
                {invalidCount > 0 && (
                  <button
                    onClick={() => setPreviewFilter('invalid')}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      previewFilter === 'invalid'
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'text-rose-600 dark:text-rose-400 hover:opacity-80'
                    }`}
                  >
                    Errors ({invalidCount})
                  </button>
                )}
              </div>

              <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span>Estimated Valuation:</span>
                <span className="font-extrabold text-slate-900 dark:text-white font-mono">
                  ${totalValuation.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter preview..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(2)}
                className="text-xs gap-1.5 h-9 rounded-xl font-semibold shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Edit Mapping</span>
              </Button>

              <Button
                onClick={handleExecuteImport}
                disabled={validCount === 0 || importing}
                className="liquid-btn-primary font-bold text-xs gap-1.5 h-9 px-5 rounded-xl shrink-0 cursor-pointer shadow-md disabled:opacity-50"
              >
                {importing ? (
                  <span>Importing...</span>
                ) : (
                  <>
                    <span>Import {validCount} Items</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <Card className="glass-panel rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-xl">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-black z-10">
                  <tr>
                    <th className="p-3.5 w-12 text-center">#</th>
                    <th className="p-3.5 w-24">Status</th>
                    <th className="p-3.5">Product Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5 text-right">Quantity</th>
                    <th className="p-3.5">Unit</th>
                    <th className="p-3.5 text-right">Price</th>
                    <th className="p-3.5 text-right">Low Stock</th>
                    <th className="p-3.5">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.06]">
                  {filteredRows.map((row) => (
                    <tr 
                      key={row.index}
                      className={`hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors ${
                        !row.isValid ? 'bg-rose-500/[0.04]' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">{row.index}</td>
                      <td className="p-3.5">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 uppercase">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                            Ready
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 uppercase cursor-help"
                            title={row.errorReason}
                          >
                            <AlertCircle className="w-2.5 h-2.5" />
                            {row.errorReason}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                        {row.name || <span className="text-rose-500 italic">Missing name</span>}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-300">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                          {row.category}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {row.quantity}
                      </td>
                      <td className="p-3.5 text-slate-500 text-[11px] font-medium">{row.unit}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${row.price.toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-mono text-slate-400">{row.threshold}</td>
                      <td className="p-3.5 text-slate-400 text-[11px] max-w-[180px] truncate">
                        {row.description || '—'}
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                        No rows match your current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 4: Results */}
      {currentStep === 4 && importResult && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <Card className="glass-panel p-8 text-center rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
            <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-4 ${
              importResult.success 
                ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/20' 
                : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 shadow-amber-500/20'
            }`}>
              {importResult.success ? <PackageCheck className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {importResult.success ? 'Catalog Synchronization Complete!' : 'Import Finished with Warnings'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              Your inventory count and POS catalog items have been synchronized into the database.
            </p>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-6">
              <div className="p-4 rounded-2xl glass-card text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Processed</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                  {importResult.totalProcessed}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block">Created</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                  {importResult.createdCount}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Updated</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-0.5 block">
                  {importResult.updatedCount}
                </span>
              </div>

              <div className="p-4 rounded-2xl glass-card text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Skipped</span>
                <span className="text-2xl font-black text-slate-500 font-mono mt-0.5 block">
                  {importResult.skippedCount}
                </span>
              </div>
            </div>

            {/* Error logs if any */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="max-w-2xl mx-auto mt-6 text-left p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Import Notices & Errors:</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 pt-8 flex-wrap">
              {onNavigateToInventory && (
                <Button
                  onClick={onNavigateToInventory}
                  className="liquid-btn-primary font-bold gap-2 px-6 h-11 rounded-2xl cursor-pointer shadow-lg shadow-blue-600/20"
                >
                  <Package className="w-4 h-4" />
                  <span>Go to Inventory Management</span>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep(1)
                  setImportResult(null)
                  setParsedRows([])
                  setFileName('')
                }}
                className="gap-2 h-11 px-5 rounded-2xl font-semibold"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Import Another File</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  )
}
