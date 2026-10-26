'use client'

import React, { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Truck, 
  Building2, 
  Receipt, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Plus, 
  Search, 
  FileText, 
  Coins, 
  Warehouse, 
  Printer, 
  Trash2,
  Phone,
  Mail,
  FileSpreadsheet,
  Scan,
  Sparkles,
  UploadCloud
} from 'lucide-react'
import InvoiceScannerModal from '@/components/InvoiceScannerModal'

interface Supplier {
  id: string
  name: string
  contactPerson?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  taxNumber?: string | null
  balance: number
  totalPurchases?: number
  totalPaid?: number
  invoicesCount?: number
  unpaidInvoicesCount?: number
  overdueInvoicesCount?: number
  notes?: string | null
  createdAt?: string
}

interface PurchaseInvoiceItem {
  id?: string
  ingredientId?: string | null
  itemName: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
}

interface PurchaseInvoice {
  id: string
  invoiceNumber: string
  supplierId: string
  supplier: { id: string; name: string; phone?: string | null; email?: string | null }
  issueDate: string
  dueDate?: string | null
  status: string
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  subtotal: number
  tax: number
  totalAmount: number
  paidAmount: number
  remainingAmount?: number
  destinationWarehouse: 'raw_materials' | 'finished_goods'
  notes?: string | null
  isOverdue?: boolean
  daysOverdue?: number
  items: PurchaseInvoiceItem[]
  payments?: any[]
}

interface RawMaterial {
  id: string
  name: string
  quantity: number
  unit: string
  lowStockThreshold: number
  costPerUnit?: number
  lastRestocked?: string | null
}

interface StatementLedger {
  id: string
  date: string
  type: 'invoice' | 'payment'
  reference: string
  description: string
  debit: number
  credit: number
  runningBalance: number
  paymentMethod?: string
  dueDate?: string | null
  paymentStatus?: string
}

export default function SuppliersManager() {
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'

  const [activeTab, setActiveTab] = useState<'invoices' | 'suppliers' | 'statement' | 'warehouse'>('invoices')
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [menuItemsList, setMenuItemsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'overdue' | 'unpaid' | 'partial' | 'paid'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('')

  // Dialogs
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<PurchaseInvoice | null>(null)
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] = useState<PurchaseInvoice | null>(null)

  // Statement State
  const [selectedStatementSupplierId, setSelectedStatementSupplierId] = useState<string>('')
  const [statementData, setStatementData] = useState<{
    supplier: Supplier | null
    ledger: StatementLedger[]
    totalInvoiced: number
    totalPaid: number
    netBalance: number
  }>({
    supplier: null,
    ledger: [],
    totalInvoiced: 0,
    totalPaid: 0,
    netBalance: 0
  })
  const [statementLoading, setStatementLoading] = useState(false)

  // Forms
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
    openingBalance: '0',
    notes: ''
  })

  const [invoiceForm, setInvoiceForm] = useState({
    supplierId: '',
    invoiceNumber: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    destinationWarehouse: 'raw_materials',
    tax: '0',
    paidAmount: '0',
    paymentMethod: 'cash',
    notes: '',
    items: [
      { ingredientId: '', menuItemId: '', itemName: '', quantity: '1', unit: 'pieces', unitPrice: '0' }
    ]
  })

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    notes: ''
  })

  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchSuppliers(), fetchInvoices(), fetchRawMaterials(), fetchMenuItemsList()])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMenuItemsList = async () => {
    try {
      const res = await fetch('/api/menu')
      if (res.ok) {
        const data = await res.json()
        setMenuItemsList(data || [])
      }
    } catch (e) {
      console.error('Failed to fetch menu items:', e)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers')
      if (res.ok) {
        const data = await res.json()
        setSuppliers(data)
        if (data.length > 0 && !selectedStatementSupplierId) {
          setSelectedStatementSupplierId(data[0].id)
        }
      }
    } catch (e) {
      console.error('Failed to fetch suppliers:', e)
    }
  }

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/purchases')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data)
      }
    } catch (e) {
      console.error('Failed to fetch purchase invoices:', e)
    }
  }

  const fetchRawMaterials = async () => {
    try {
      const res = await fetch('/api/ingredients')
      if (res.ok) {
        const data = await res.json()
        setRawMaterials(data)
      }
    } catch (e) {
      console.error('Failed to fetch raw materials:', e)
    }
  }

  // Fetch statement when selectedStatementSupplierId changes
  useEffect(() => {
    if (!selectedStatementSupplierId) return
    fetchSupplierStatement(selectedStatementSupplierId)
  }, [selectedStatementSupplierId])

  const fetchSupplierStatement = async (supplierId: string) => {
    setStatementLoading(true)
    try {
      const res = await fetch(`/api/suppliers/${supplierId}`)
      if (res.ok) {
        const data = await res.json()
        setStatementData({
          supplier: data,
          ledger: data.statement?.ledger || [],
          totalInvoiced: data.statement?.totalInvoiced || 0,
          totalPaid: data.statement?.totalPaid || 0,
          netBalance: data.statement?.netBalance || 0
        })
      }
    } catch (e) {
      console.error('Failed to fetch statement:', e)
    } finally {
      setStatementLoading(false)
    }
  }

  // Handle Supplier Creation
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierForm)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || (isAr ? 'فشل حفظ المورد' : 'Failed to create supplier'))
      }
      setIsAddSupplierOpen(false)
      setSupplierForm({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: '',
        taxNumber: '',
        openingBalance: '0',
        notes: ''
      })
      await fetchSuppliers()
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Invoice Creation
  const handleAddItemRow = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [
        ...invoiceForm.items,
        { ingredientId: '', menuItemId: '', itemName: '', quantity: '1', unit: 'pieces', unitPrice: '0' }
      ]
    })
  }

  const handleRemoveItemRow = (index: number) => {
    if (invoiceForm.items.length <= 1) return
    const next = [...invoiceForm.items]
    next.splice(index, 1)
    setInvoiceForm({ ...invoiceForm, items: next })
  }

  const handleItemChange = (index: number, field: string, value: string) => {
    const next = [...invoiceForm.items]
    const item = { ...next[index], [field]: value }

    if (field === 'itemSelection') {
      if (value.startsWith('ing_')) {
        const ingId = value.replace('ing_', '')
        const found = rawMaterials.find(m => m.id === ingId)
        item.ingredientId = ingId
        item.menuItemId = ''
        if (found) {
          item.itemName = found.name
          item.unit = found.unit
          if (found.costPerUnit && found.costPerUnit > 0) {
            item.unitPrice = found.costPerUnit.toString()
          }
        }
      } else if (value.startsWith('menu_')) {
        const mId = value.replace('menu_', '')
        const found = menuItemsList.find(m => m.id === mId)
        item.menuItemId = mId
        item.ingredientId = ''
        if (found) {
          item.itemName = found.name
          item.unit = (found as any).inventory?.unit || 'pieces'
          if (found.price && found.price > 0) {
            item.unitPrice = (found.price * 0.5).toFixed(2)
          }
        }
      } else {
        item.ingredientId = ''
        item.menuItemId = ''
      }
    }

    next[index] = item
    setInvoiceForm({ ...invoiceForm, items: next })
  }

  const calculateInvoiceSubtotal = () => {
    return invoiceForm.items.reduce((sum, it) => {
      const q = parseFloat(it.quantity) || 0
      const p = parseFloat(it.unitPrice) || 0
      return sum + (q * p)
    }, 0)
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    try {
      if (!invoiceForm.supplierId) {
        throw new Error(isAr ? 'يرجى اختيار مورد' : 'Please select a supplier')
      }
      const invalidItem = invoiceForm.items.find(it => !it.itemName.trim())
      if (invalidItem) {
        throw new Error(isAr ? 'يجب إدخال اسم لكل بند في الفاتورة' : 'All items must have a name or selected raw material')
      }

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceForm)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || (isAr ? 'فشل إنشاء الفاتورة' : 'Failed to create invoice'))
      }

      setIsAddInvoiceOpen(false)
      setInvoiceForm({
        supplierId: '',
        invoiceNumber: '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        destinationWarehouse: 'raw_materials',
        tax: '0',
        paidAmount: '0',
        paymentMethod: 'cash',
        notes: '',
        items: [{ ingredientId: '', menuItemId: '', itemName: '', quantity: '1', unit: 'kg', unitPrice: '0' }]
      })

      await Promise.all([fetchInvoices(), fetchSuppliers(), fetchRawMaterials()])
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenRestockMaterial = (mat: RawMaterial) => {
    setInvoiceForm({
      supplierId: suppliers[0]?.id || '',
      invoiceNumber: '',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      destinationWarehouse: 'raw_materials',
      tax: '0',
      paidAmount: '0',
      paymentMethod: 'cash',
      notes: isAr ? `طلب توريد مادة خام: ${mat.name}` : `Restock order for raw material: ${mat.name}`,
      items: [
        {
          ingredientId: mat.id,
          menuItemId: '',
          itemName: mat.name,
          quantity: mat.lowStockThreshold ? String(Math.max(mat.lowStockThreshold * 2, 10)) : '10',
          unit: mat.unit,
          unitPrice: mat.costPerUnit ? String(mat.costPerUnit) : '1'
        }
      ]
    })
    setIsAddInvoiceOpen(true)
  }

  // Handle Payment Recording
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedInvoiceForPayment) return
    setSubmitting(true)
    setFormError(null)

    try {
      const res = await fetch(`/api/purchases/${selectedInvoiceForPayment.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentForm)
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || (isAr ? 'فشل تسجيل الدفعة' : 'Failed to record payment'))
      }

      setIsPaymentModalOpen(false)
      setSelectedInvoiceForPayment(null)
      setPaymentForm({
        amount: '',
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString().split('T')[0],
        referenceNumber: '',
        notes: ''
      })

      await Promise.all([fetchInvoices(), fetchSuppliers()])
    } catch (err: any) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Computed metrics
  const totalPayables = suppliers.reduce((sum, s) => sum + s.balance, 0)
  const overdueCount = invoices.filter(i => i.isOverdue).length
  const totalPurchasesAmount = invoices.reduce((sum, i) => sum + i.totalAmount, 0)

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    if (invoiceFilter === 'overdue' && !inv.isOverdue) return false
    if (invoiceFilter === 'unpaid' && inv.paymentStatus !== 'unpaid') return false
    if (invoiceFilter === 'partial' && inv.paymentStatus !== 'partial') return false
    if (invoiceFilter === 'paid' && inv.paymentStatus !== 'paid') return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q)
      const matchSupplier = inv.supplier?.name.toLowerCase().includes(q)
      if (!matchNum && !matchSupplier) return false
    }

    return true
  })

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter(s => {
    if (!supplierSearchQuery.trim()) return true
    const q = supplierSearchQuery.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      (s.phone && s.phone.includes(q)) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header & Main Navigation Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                {isAr ? 'الموردين والمشتريات' : 'Suppliers & Purchases'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr 
                  ? 'مخزن المواد الخام وفواتير المشتريات والدفعات وكشوفات الحساب'
                  : 'Raw materials warehouse, purchase bills, installments & account statements'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => setIsScannerOpen(true)}
            className="shadow-md text-xs font-bold gap-1.5 cursor-pointer bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 transition-all hover:shadow-lg hover:scale-[1.02]"
          >
            <Scan className="w-4 h-4 text-blue-100" />
            <span>{isAr ? '✨ مسح فاتورة ذكية (OCR)' : '✨ Scan Invoice (OCR)'}</span>
          </Button>
          <Button
            onClick={() => setIsAddInvoiceOpen(true)}
            className="liquid-btn-primary shadow-sm text-xs font-bold gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? '+ فاتورة مشتريات يدوية' : '+ New Purchase Bill'}</span>
          </Button>
          <Button
            onClick={() => setIsAddSupplierOpen(true)}
            variant="outline"
            className="glass-panel text-xs font-bold gap-1.5 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>{isAr ? '+ إضافة مورد' : '+ Add Supplier'}</span>
          </Button>
        </div>
      </div>

      {/* Top 4 Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isAr ? 'إجمالي المستحقات' : 'Total Payables'}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
            ${totalPayables.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'صافي الرصيد المستحق للموردين' : 'Net balance owed to suppliers'}
          </span>
        </div>

        <div className={`glass-panel p-4 rounded-2xl border shadow-sm relative overflow-hidden ${
          overdueCount > 0 
            ? 'border-rose-400/80 dark:border-rose-700/80 bg-rose-500/[0.03]' 
            : 'border-slate-200/60 dark:border-white/10'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isAr ? 'فواتير متأخرة' : 'Overdue Bills'}
            </span>
            <div className={`p-2 rounded-xl ${overdueCount > 0 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-2 text-2xl font-black ${overdueCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {overdueCount}
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'فواتير تجاوزت موعد الاستحقاق' : 'Bills past due date needing payment'}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isAr ? 'إجمالي المشتريات' : 'Total Purchases'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            ${totalPurchasesAmount.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">
            {invoices.length} {isAr ? 'فاتورة مشتريات مسجلة' : 'lifetime purchase invoices'}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isAr ? 'دليل الموردين' : 'Suppliers'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {suppliers.length}
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'مورد مسجل بالنظام' : 'Registered supplier accounts'}
          </span>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'invoices'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{isAr ? 'فواتير المشتريات' : 'Purchase Invoices'}</span>
          {overdueCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full">
              {overdueCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'suppliers'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{isAr ? 'دليل الموردين' : 'Suppliers Directory'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('statement')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'statement'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isAr ? 'كشف حساب مورد' : 'Account Statement'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('warehouse')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'warehouse'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>{isAr ? 'مخزن المواد الخام' : 'Raw Materials Warehouse'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PURCHASE INVOICES */}
      {/* ========================================================================= */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: isAr ? 'الكل' : 'All Bills', count: invoices.length },
                { id: 'overdue', label: isAr ? '⚠️ متأخرة' : '⚠️ Overdue', count: overdueCount, alert: overdueCount > 0 },
                { id: 'unpaid', label: isAr ? 'غير مسددة' : 'Unpaid', count: invoices.filter(i => i.paymentStatus === 'unpaid').length },
                { id: 'partial', label: isAr ? 'سداد جزئي' : 'Partial', count: invoices.filter(i => i.paymentStatus === 'partial').length },
                { id: 'paid', label: isAr ? 'مسددة' : 'Fully Paid', count: invoices.filter(i => i.paymentStatus === 'paid').length }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setInvoiceFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    invoiceFilter === tab.id
                      ? tab.alert
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="opacity-75 text-[10px] font-mono">({tab.count})</span>
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={isAr ? 'بحث برقم الفاتورة أو اسم المورد...' : 'Search invoice # or supplier...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 text-xs glass-panel"
              />
            </div>
          </div>

          {/* Quick Dropzone & Scan Action Card */}
          <div 
            onClick={() => setIsScannerOpen(true)}
            className="p-4 rounded-2xl border-2 border-dashed border-blue-300/70 dark:border-blue-900/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-indigo-950/10 hover:border-blue-500 hover:bg-blue-50/80 dark:hover:bg-blue-950/30 transition-all cursor-pointer flex items-center justify-between gap-4 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Scan className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>{isAr ? 'اسحب وأفلت فاتورة المورد هنا أو انقر للمسح التلقائي' : 'Drag & drop supplier invoice here or click to auto-scan'}</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    {isAr ? 'قراءة ذكية' : 'Smart OCR'}
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr 
                    ? 'يتم استخراج الأصناف والكميات والأسعار والتاريخ تلقائياً وإضافتها إلى مخزن المواد الخام'
                    : 'Automatically extracts item names, quantities, unit prices & dates directly into inventory'}
                </p>
              </div>
            </div>

            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shrink-0 pointer-events-none gap-1.5 shadow-sm"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isAr ? 'مسح الفاتورة' : 'Scan Invoice'}</span>
            </Button>
          </div>

          {/* Invoices List / Table */}
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-2xl border border-slate-200/60 dark:border-white/10 text-slate-500">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-sm">{isAr ? 'لا توجد فواتير مشتريات' : 'No purchase invoices found'}</p>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'اسحب فاتورة أعلاه أو أنشئ فاتورة يدوية لتوريد المواد الخام' : 'Drop an invoice above or create a bill manually'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className={`glass-panel p-4 rounded-2xl border transition-all hover:shadow-md ${
                    inv.isOverdue
                      ? 'border-rose-400/80 dark:border-rose-700/80 bg-rose-500/[0.02]'
                      : 'border-slate-200/60 dark:border-white/10'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Left details */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-black text-slate-900 dark:text-white text-base">
                          {inv.invoiceNumber}
                        </span>
                        <span className="font-semibold text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {inv.supplier?.name}
                        </span>

                        {/* Overdue Alert Badge */}
                        {inv.isOverdue ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-400 dark:border-rose-700 flex items-center gap-1 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            {isAr ? `متأخرة (${inv.daysOverdue} يوم)` : `Overdue (${inv.daysOverdue} days late)`}
                          </span>
                        ) : inv.paymentStatus === 'paid' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            {isAr ? 'مسددة بالكامل' : 'Fully Paid'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            {inv.paymentStatus === 'partial' 
                              ? (isAr ? 'سداد جزئي' : 'Partial Payment') 
                              : (isAr ? 'غير مسددة' : 'Unpaid')}
                          </span>
                        )}

                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                          {inv.destinationWarehouse === 'raw_materials' 
                            ? (isAr ? 'مخزن المواد الخام' : 'Raw Materials WH') 
                            : (isAr ? 'مخزن المنتجات التامة' : 'Finished Goods WH')}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {isAr ? 'التاريخ:' : 'Issue:'} {new Date(inv.issueDate).toLocaleDateString()}
                        </span>
                        {inv.dueDate && (
                          <span className={`flex items-center gap-1 ${inv.isOverdue ? 'font-bold text-rose-600 dark:text-rose-400' : ''}`}>
                            <Clock className="w-3.5 h-3.5" />
                            {isAr ? 'الاستحقاق:' : 'Due:'} {new Date(inv.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        <span>{inv.items?.length || 0} {isAr ? 'أصناف' : 'line items'}</span>
                      </div>
                    </div>

                    {/* Right amounts & actions */}
                    <div className="flex items-center justify-between lg:justify-end gap-6 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-white/10">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">{isAr ? 'الإجمالي / المتبقي' : 'Total / Remaining'}</div>
                        <div className="font-black text-slate-900 dark:text-white text-base">
                          ${inv.totalAmount.toFixed(2)}
                        </div>
                        <div className={`text-xs font-bold ${inv.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {isAr ? 'المتبقي:' : 'Remaining:'} ${(inv.remainingAmount ?? (inv.totalAmount - inv.paidAmount)).toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {inv.paymentStatus !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedInvoiceForPayment(inv)
                              setPaymentForm({
                                amount: (inv.remainingAmount ?? (inv.totalAmount - inv.paidAmount)).toString(),
                                paymentMethod: 'cash',
                                paymentDate: new Date().toISOString().split('T')[0],
                                referenceNumber: '',
                                notes: ''
                              })
                              setIsPaymentModalOpen(true)
                            }}
                            className="liquid-btn-primary text-xs font-bold cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5 me-1" />
                            <span>{isAr ? '+ سداد دفعة' : '+ Pay'}</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedInvoiceForDetails(inv)}
                          className="text-xs font-semibold glass-panel cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 me-1" />
                          <span>{isAr ? 'التفاصيل' : 'Details'}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUPPLIERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder={isAr ? 'بحث عن مورد بالاسم أو الهاتف...' : 'Search suppliers by name or phone...'}
                value={supplierSearchQuery}
                onChange={(e) => setSupplierSearchQuery(e.target.value)}
                className="ps-9 text-xs glass-panel"
              />
            </div>
            <Button
              onClick={() => setIsAddSupplierOpen(true)}
              className="liquid-btn-primary text-xs font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4 me-1" />
              <span>{isAr ? '+ إضافة مورد' : '+ Add Supplier'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSuppliers.map((sup) => (
              <div
                key={sup.id}
                className="glass-panel p-5 rounded-2xl border border-slate-200/60 dark:border-white/10 flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {sup.name}
                      </h3>
                      {sup.contactPerson && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {isAr ? 'المسؤول:' : 'Attn:'} {sup.contactPerson}
                        </p>
                      )}
                    </div>
                    <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      <Building2 className="w-4 h-4" />
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
                    {sup.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 opacity-60" />
                        <span>{sup.phone}</span>
                      </div>
                    )}
                    {sup.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 opacity-60" />
                        <span>{sup.email}</span>
                      </div>
                    )}
                    {sup.taxNumber && (
                      <div className="text-[11px] font-mono text-slate-400">
                        {isAr ? 'الرقم الضريبي:' : 'Tax ID:'} {sup.taxNumber}
                      </div>
                    )}
                  </div>

                  {/* Financial Balance Summary */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/40 dark:border-white/5 mb-4">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">{isAr ? 'الرصيد المستحق للمورد:' : 'Current Balance Owed:'}</span>
                      <span className={`font-black text-sm ${sup.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}`}>
                        ${sup.balance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                      <span>{isAr ? 'عدد الفواتير:' : 'Total Invoices:'} {sup.invoicesCount || 0}</span>
                      {sup.overdueInvoicesCount ? (
                        <span className="text-rose-500 font-bold">{sup.overdueInvoicesCount} {isAr ? 'متأخرة' : 'overdue'}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-white/10">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedStatementSupplierId(sup.id)
                      setActiveTab('statement')
                    }}
                    className="w-full text-xs font-bold glass-panel cursor-pointer"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 me-1 text-blue-500" />
                    <span>{isAr ? 'كشف حساب' : 'Statement'}</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setInvoiceForm(prev => ({ ...prev, supplierId: sup.id }))
                      setIsAddInvoiceOpen(true)
                    }}
                    className="text-xs font-bold liquid-btn-primary cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SUPPLIER ACCOUNT STATEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'statement' && (
        <div className="space-y-4">
          {/* Supplier Picker & Print Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-white/10">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Label className="text-xs font-bold whitespace-nowrap">{isAr ? 'اختر المورد:' : 'Select Supplier:'}</Label>
              <Select
                value={selectedStatementSupplierId}
                onValueChange={(val) => setSelectedStatementSupplierId(val)}
              >
                <SelectTrigger className="w-full sm:w-64 glass-panel text-xs">
                  <SelectValue placeholder={isAr ? 'اختر مورداً...' : 'Choose supplier'} />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({isAr ? 'الرصيد:' : 'Balance:'} ${s.balance.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs font-bold glass-panel gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة الكشف' : 'Print Statement'}</span>
            </Button>
          </div>

          {statementLoading ? (
            <div className="text-center py-16">{isAr ? 'جاري تحميل كشف الحساب...' : 'Loading account ledger...'}</div>
          ) : (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200/60 dark:border-white/10 space-y-6">
              {/* Statement Header Card */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200/60 dark:border-white/10">
                <div>
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                    {isAr ? 'كشف حساب مورد' : 'Supplier Account Statement'}
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                    {statementData.supplier?.name}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {isAr ? 'الهاتف:' : 'Phone:'} {statementData.supplier?.phone || 'N/A'} | {isAr ? 'الرقم الضريبي:' : 'Tax ID:'} {statementData.supplier?.taxNumber || 'N/A'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">{isAr ? 'إجمالي المشتريات' : 'Total Invoiced'}</div>
                    <div className="font-black text-sm text-slate-900 dark:text-white">
                      ${statementData.totalInvoiced.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-right">
                    <div className="text-[10px] text-slate-400 uppercase font-bold">{isAr ? 'إجمالي المسدد' : 'Total Paid'}</div>
                    <div className="font-black text-sm text-emerald-600">
                      ${statementData.totalPaid.toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-right border border-rose-200 dark:border-rose-900">
                    <div className="text-[10px] text-rose-500 uppercase font-bold">{isAr ? 'صافي الرصيد المستحق' : 'Net Balance Owed'}</div>
                    <div className="font-black text-base text-rose-600 dark:text-rose-400">
                      ${statementData.netBalance.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">{isAr ? 'التاريخ' : 'Date'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'نوع المعاملة' : 'Transaction'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'المرجع' : 'Reference'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'البيان' : 'Description'}</th>
                      <th className="py-2.5 px-3 text-right">{isAr ? 'مدين (+ مستحق)' : 'Debit (+ We Owe)'}</th>
                      <th className="py-2.5 px-3 text-right">{isAr ? 'دائن (- مسدد)' : 'Credit (- Paid)'}</th>
                      <th className="py-2.5 px-3 text-right font-black">{isAr ? 'الرصيد التراكمي' : 'Running Balance'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {statementData.ledger.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-400">
                          {isAr ? 'لا توجد حركات مسجلة لهذا المورد.' : 'No transactions recorded for this supplier.'}
                        </td>
                      </tr>
                    ) : (
                      statementData.ledger.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-3 text-slate-500">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3">
                            {tx.type === 'invoice' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                {isAr ? 'فاتورة مشتريات' : 'Purchase Bill'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                {isAr ? 'دفعة نقدية / سداد' : 'Payment / Installment'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                            {tx.reference}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                            {tx.description}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                            {tx.debit > 0 ? `$${tx.debit.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                            {tx.credit > 0 ? `$${tx.credit.toFixed(2)}` : '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-slate-900 dark:text-white font-mono">
                            ${tx.runningBalance.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: RAW MATERIALS WAREHOUSE */}
      {/* ========================================================================= */}
      {activeTab === 'warehouse' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl glass-panel border border-slate-200/60 dark:border-white/10 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                {isAr ? 'مخزن المواد الخام' : 'Raw Materials Warehouse Stock'}
              </h3>
              <p className="text-xs text-slate-500">
                {isAr 
                  ? 'المواد الأولية والمكونات المستهلكة في وصفات المطبخ' 
                  : 'Ingredients and raw inventory consumed by kitchen recipes'}
              </p>
            </div>
            <Button
              onClick={() => setIsAddInvoiceOpen(true)}
              className="liquid-btn-primary text-xs font-bold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 me-1" />
              <span>{isAr ? 'شراء وتوريد مواد خام' : 'Purchase Raw Materials'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {rawMaterials.map((mat) => {
              const isLow = mat.quantity <= mat.lowStockThreshold
              return (
                <div
                  key={mat.id}
                  className={`glass-panel p-4 rounded-2xl border transition-all ${
                    isLow ? 'border-amber-400 bg-amber-500/[0.02]' : 'border-slate-200/60 dark:border-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {mat.name}
                    </span>
                    {isLow && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        {isAr ? 'مخزون منخفض' : 'Low Stock'}
                      </span>
                    )}
                  </div>

                  <div className="my-3">
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {mat.quantity}{' '}
                      <span className="text-xs font-normal text-slate-400">{mat.unit}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex justify-between">
                      <span>{isAr ? 'الحد الأدنى:' : 'Threshold:'} {mat.lowStockThreshold} {mat.unit}</span>
                      {mat.costPerUnit ? <span>{isAr ? 'التكلفة:' : 'Cost:'} ${mat.costPerUnit}/{mat.unit}</span> : null}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div>
                      <span>{isAr ? 'آخر توريد:' : 'Last Restocked:'}{' '}</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">
                        {mat.lastRestocked ? new Date(mat.lastRestocked).toLocaleDateString() : (isAr ? 'أبداً' : 'Never')}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenRestockMaterial(mat)}
                      className="h-6 text-[10px] px-2 rounded-lg font-bold gap-1 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 cursor-pointer"
                      title={isAr ? 'طلب توريد من المورد' : 'Restock / Purchase from supplier'}
                    >
                      <Truck className="w-3 h-3" />
                      <span>{isAr ? 'توريد' : 'Restock'}</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD SUPPLIER */}
      {/* ========================================================================= */}
      <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>{isAr ? 'إضافة مورد جديد' : 'Add New Supplier'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSupplier} className="space-y-3.5">
            {formError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs border border-rose-200">
                {formError}
              </div>
            )}

            <div>
              <Label className="text-xs">{isAr ? 'اسم المورد / الشركة *' : 'Supplier / Company Name *'}</Label>
              <Input
                required
                placeholder={isAr ? 'مثال: شركة الأمل للمنتجات الغذائية' : 'e.g. Al-Amal Dairy Co.'}
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? 'الشخص المسؤول' : 'Contact Person'}</Label>
                <Input
                  placeholder={isAr ? 'مثال: أحمد صالح' : 'e.g. Ahmed Saleh'}
                  value={supplierForm.contactPerson}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">{isAr ? 'رقم الهاتف' : 'Phone Number'}</Label>
                <Input
                  placeholder="+966 50 123 4567"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input
                  type="email"
                  placeholder="supplier@mail.com"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs">{isAr ? 'الرقم الضريبي' : 'Tax ID / VAT No.'}</Label>
                <Input
                  placeholder="3000..."
                  value={supplierForm.taxNumber}
                  onChange={(e) => setSupplierForm({ ...supplierForm, taxNumber: e.target.value })}
                  className="mt-1 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">{isAr ? 'العنوان / المدينة' : 'Address / City'}</Label>
              <Input
                placeholder={isAr ? 'المنطقة الصناعية، الرياض' : 'Industrial Area, Riyadh'}
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs">{isAr ? 'الرصيد الافتتاحي المستحق للمورد ($)' : 'Opening Payable Balance ($)'}</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={supplierForm.openingBalance}
                onChange={(e) => setSupplierForm({ ...supplierForm, openingBalance: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddSupplierOpen(false)}
                className="text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={submitting} className="liquid-btn-primary text-xs font-bold">
                {submitting ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ المورد' : 'Save Supplier')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: NEW PURCHASE INVOICE */}
      {/* ========================================================================= */}
      <Dialog open={isAddInvoiceOpen} onOpenChange={setIsAddInvoiceOpen}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2.5 text-base sm:text-lg font-bold">
              <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
              </div>
              <span>{isAr ? 'تسجيل فاتورة مشتريات وتوريد مخزون' : 'Create & Receive Purchase Invoice'}</span>
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleCreateInvoice}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                e.preventDefault()
              }
            }}
            className="space-y-4 pt-2"
          >
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs border border-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'المورد *' : 'Supplier *'}</Label>
                <Select
                  value={invoiceForm.supplierId}
                  onValueChange={(val) => setInvoiceForm({ ...invoiceForm, supplierId: val })}
                >
                  <SelectTrigger className="mt-1 h-10 text-sm">
                    <SelectValue placeholder={isAr ? 'اختر المورد...' : 'Select supplier...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'رقم الفاتورة' : 'Invoice Reference / No.'}</Label>
                <Input
                  placeholder="e.g. PUR-001 / INV-8942"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                  className="mt-1 h-10 text-sm font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'تاريخ الفاتورة' : 'Issue Date'}</Label>
                <Input
                  type="date"
                  value={invoiceForm.issueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, issueDate: e.target.value })}
                  className="mt-1 h-10 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-rose-600 dark:text-rose-400">
                  {isAr ? 'تاريخ الاستحقاق *' : 'Due Date *'}
                </Label>
                <Input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="mt-1 h-10 text-sm border-rose-300 dark:border-rose-800"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'المخزن المستلم' : 'Destination Warehouse'}</Label>
                <Select
                  value={invoiceForm.destinationWarehouse}
                  onValueChange={(val: any) => setInvoiceForm({ ...invoiceForm, destinationWarehouse: val })}
                >
                  <SelectTrigger className="mt-1 h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw_materials">{isAr ? '🌿 مخزن المواد الخام والمقادير' : '🌿 Raw Materials & Ingredients'}</SelectItem>
                    <SelectItem value="finished_goods">{isAr ? '📦 مخزن المنتجات التامة للبيع' : '📦 Finished Retail Goods'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dynamic Items Rows */}
            <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    {isAr ? 'الأصناف والمواد المشتراة' : 'Purchased Items & Inventory Links'}
                  </Label>
                  <p className="text-[11px] text-slate-400">
                    {isAr ? 'اختر مادة خام أو صنف متجر لتحديث رصيد المخزن ومتوسط التكلفة تلقائياً' : 'Select a raw ingredient or item to automatically replenish stock and costing.'}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddItemRow}
                  className="text-xs h-8 px-3 font-bold cursor-pointer gap-1.5 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAr ? '+ إضافة صنف' : '+ Add Item Row'}</span>
                </Button>
              </div>

              <div className="space-y-2.5">
                {invoiceForm.items.map((item, idx) => {
                  const currentSelection = item.ingredientId 
                    ? `ing_${item.ingredientId}` 
                    : item.menuItemId 
                      ? `menu_${item.menuItemId}` 
                      : 'custom'

                  const rowTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0)

                  return (
                    <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-white/5 space-y-2">
                      <div className="grid grid-cols-12 gap-2.5 items-end">
                        <div className="col-span-12 sm:col-span-4">
                          <Label className="text-[11px] font-semibold text-slate-500">
                            {isAr ? 'البحث وربط المخزون' : 'Item / Inventory Search Link'}
                          </Label>
                          <Select
                            value={currentSelection}
                            onValueChange={(val) => handleItemChange(idx, 'itemSelection', val)}
                          >
                            <SelectTrigger className="text-xs h-9 mt-1">
                              <SelectValue placeholder={isAr ? 'اختر صنف أو مادة...' : 'Pick product/ingredient...'} />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                              <SelectItem value="custom">{isAr ? '📝 -- صنف مخصص غير مرتبط --' : '📝 -- Custom (Not linked) --'}</SelectItem>
                              
                              {/* Raw Materials */}
                              {rawMaterials.length > 0 && (
                                <div className="px-2 py-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                  🌿 {isAr ? 'المواد الخام والمقادير' : 'Raw Materials & Ingredients'}
                                </div>
                              )}
                              {rawMaterials.map(m => (
                                <SelectItem key={`ing_${m.id}`} value={`ing_${m.id}`}>
                                  {m.name} ({m.quantity} {m.unit} in stock)
                                </SelectItem>
                              ))}

                              {/* Sellable Inventory Products */}
                              {menuItemsList.length > 0 && (
                                <div className="px-2 py-1 text-[10px] font-bold text-blue-600 uppercase tracking-wider border-t border-slate-200/50 mt-1 pt-1">
                                  📦 {isAr ? 'منتجات المتجر والمخزون' : 'Retail Products & Menu'}
                                </div>
                              )}
                              {menuItemsList.map(m => (
                                <SelectItem key={`menu_${m.id}`} value={`menu_${m.id}`}>
                                  {m.name} (${m.price?.toFixed(2)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="col-span-12 sm:col-span-3">
                          <Label className="text-[11px] font-semibold text-slate-500">{isAr ? 'اسم الصنف' : 'Item Name'}</Label>
                          <Input
                            placeholder="Item name"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                            className="text-xs h-9 mt-1"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[11px] font-semibold text-slate-500">{isAr ? 'الكمية' : 'Qty'} ({item.unit})</Label>
                          <Input
                            type="number"
                            step="any"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="text-xs h-9 mt-1 font-bold"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-2">
                          <Label className="text-[11px] font-semibold text-slate-500">{isAr ? 'سعر الوحدة ($)' : 'Unit Cost ($)'}</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            className="text-xs h-9 mt-1 font-bold font-mono"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-1 flex items-center justify-between sm:justify-center gap-1">
                          <div className="sm:hidden text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
                            ${rowTotal.toFixed(2)}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={invoiceForm.items.length <= 1}
                            onClick={() => handleRemoveItemRow(idx)}
                            className="h-9 w-9 p-0 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Calculations & Initial Payment */}
            <div className="p-4 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-sm font-semibold">
                <span>{isAr ? 'المجموع قبل الضريبة:' : 'Subtotal:'}</span>
                <span className="font-mono">${calculateInvoiceSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="font-semibold">{isAr ? 'ضريبة القيمة المضافة ($):' : 'Tax / VAT ($):'}</span>
                <Input
                  type="number"
                  step="0.01"
                  value={invoiceForm.tax}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, tax: e.target.value })}
                  className="w-32 text-xs h-8 text-right font-mono font-bold"
                />
              </div>
              <div className="flex justify-between text-base font-black pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>{isAr ? 'الإجمالي النهائي للفاتورة:' : 'Total Invoice Amount:'}</span>
                <span className="text-blue-600 dark:text-blue-400 font-mono">
                  ${(calculateInvoiceSubtotal() + (parseFloat(invoiceForm.tax) || 0)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Down Payment Option */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-slate-200/60 dark:border-white/10">
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'دفعة مسددة الآن ($)' : 'Initial Payment Paid Now ($)'}</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={invoiceForm.paidAmount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, paidAmount: e.target.value })}
                  className="mt-1 h-10 text-sm font-mono font-bold"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">{isAr ? 'طريقة الدفع' : 'Payment Method'}</Label>
                <Select
                  value={invoiceForm.paymentMethod}
                  onValueChange={(val) => setInvoiceForm({ ...invoiceForm, paymentMethod: val })}
                >
                  <SelectTrigger className="mt-1 h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">{isAr ? '💵 نقدي' : '💵 Cash'}</SelectItem>
                    <SelectItem value="bank_transfer">{isAr ? '🏦 تحويل بنكي' : '🏦 Bank Transfer'}</SelectItem>
                    <SelectItem value="check">{isAr ? '📄 شيك' : '📄 Check'}</SelectItem>
                    <SelectItem value="petty_cash">{isAr ? '🪙 درج الكاشير / النثرية' : '🪙 Petty Cash Drawer'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center sm:justify-between">
              <span className="text-[11px] text-slate-400">
                Pressing Enter will not accidentally submit the form
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddInvoiceOpen(false)}
                  className="h-10 text-xs px-4"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  size="sm"
                  className="liquid-btn-primary h-10 text-xs font-bold px-5 shadow-md"
                >
                  {submitting
                    ? (isAr ? 'جاري الحفظ والتوريد...' : 'Saving & Replenishing...')
                    : (isAr ? 'تأكيد واستلام الفاتورة' : 'Confirm & Receive Bill')}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: RECORD PAYMENT / INSTALLMENT */}
      {/* ========================================================================= */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <span>{isAr ? 'تسجيل دفعة للمورد' : 'Record Installment Payment'}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedInvoiceForPayment && (
            <form onSubmit={handleRecordPayment} className="space-y-3.5">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 text-xs border border-rose-200">
                  {formError}
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04] text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'رقم الفاتورة:' : 'Bill Number:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedInvoiceForPayment.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'المورد:' : 'Supplier:'}</span>
                  <span className="font-bold">{selectedInvoiceForPayment.supplier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'إجمالي الفاتورة:' : 'Total Bill Amount:'}</span>
                  <span>${selectedInvoiceForPayment.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-rose-500 font-bold pt-1 border-t border-slate-200 dark:border-white/10">
                  <span>{isAr ? 'المتبقي غير المسدد:' : 'Remaining Unpaid:'}</span>
                  <span>
                    ${(selectedInvoiceForPayment.remainingAmount ?? (selectedInvoiceForPayment.totalAmount - selectedInvoiceForPayment.paidAmount)).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-xs">{isAr ? 'مبلغ الدفعة ($) *' : 'Payment Amount ($) *'}</Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="mt-1 text-xs font-bold text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{isAr ? 'طريقة الدفع' : 'Payment Method'}</Label>
                  <Select
                    value={paymentForm.paymentMethod}
                    onValueChange={(val) => setPaymentForm({ ...paymentForm, paymentMethod: val })}
                  >
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">{isAr ? 'نقدي' : 'Cash'}</SelectItem>
                      <SelectItem value="bank_transfer">{isAr ? 'تحويل بنكي' : 'Bank Transfer'}</SelectItem>
                      <SelectItem value="check">{isAr ? 'شيك' : 'Check'}</SelectItem>
                      <SelectItem value="petty_cash">{isAr ? 'صندوق الكاشير' : 'Petty Cash'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">{isAr ? 'تاريخ السداد' : 'Payment Date'}</Label>
                  <Input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="mt-1 text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">{isAr ? 'رقم الشيك / المرجع / الإيصال' : 'Reference / Check # / Receipt Ref'}</Label>
                <Input
                  placeholder="e.g. Cheque #4928"
                  value={paymentForm.referenceNumber}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })}
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs">{isAr ? 'ملاحظات' : 'Notes'}</Label>
                <Input
                  placeholder={isAr ? 'ملاحظات اختيارية' : 'Optional payment notes'}
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="text-xs"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button type="submit" disabled={submitting} className="liquid-btn-primary text-xs font-bold">
                  {submitting ? (isAr ? 'جاري السداد...' : 'Processing...') : (isAr ? 'تأكيد السداد' : 'Confirm Payment')}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: INVOICE DETAILS */}
      {/* ========================================================================= */}
      <Dialog open={!!selectedInvoiceForDetails} onOpenChange={() => setSelectedInvoiceForDetails(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>{isAr ? 'تفاصيل فاتورة المشتريات:' : 'Purchase Invoice:'} {selectedInvoiceForDetails?.invoiceNumber}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedInvoiceForDetails && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.04]">
                <div>
                  <span className="text-slate-400">{isAr ? 'المورد:' : 'Supplier:'}</span>{' '}
                  <span className="font-bold">{selectedInvoiceForDetails.supplier?.name}</span>
                </div>
                <div>
                  <span className="text-slate-400">{isAr ? 'التاريخ:' : 'Issue Date:'}</span>{' '}
                  <span>{new Date(selectedInvoiceForDetails.issueDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400">{isAr ? 'الاستحقاق:' : 'Due Date:'}</span>{' '}
                  <span className={selectedInvoiceForDetails.isOverdue ? 'font-bold text-rose-500' : ''}>
                    {selectedInvoiceForDetails.dueDate ? new Date(selectedInvoiceForDetails.dueDate).toLocaleDateString() : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">{isAr ? 'المخزن:' : 'Warehouse:'}</span>{' '}
                  <span>
                    {selectedInvoiceForDetails.destinationWarehouse === 'raw_materials' 
                      ? (isAr ? 'مخزن المواد الخام' : 'Raw Materials WH') 
                      : (isAr ? 'مخزن المنتجات التامة' : 'Finished Goods')}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'بنود الفاتورة' : 'Line Items'}
                </Label>
                <div className="mt-2 border rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
                  <div className="grid grid-cols-12 gap-2 p-2 font-bold bg-slate-50 dark:bg-white/[0.03] text-[11px] text-slate-500">
                    <div className="col-span-6">{isAr ? 'الصنف' : 'Item'}</div>
                    <div className="col-span-2 text-right">{isAr ? 'الكمية' : 'Qty'}</div>
                    <div className="col-span-2 text-right">{isAr ? 'التكلفة' : 'Cost'}</div>
                    <div className="col-span-2 text-right">{isAr ? 'الإجمالي' : 'Total'}</div>
                  </div>
                  {selectedInvoiceForDetails.items.map((it, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 p-2 text-slate-700 dark:text-slate-300">
                      <div className="col-span-6 font-medium">{it.itemName}</div>
                      <div className="col-span-2 text-right">{it.quantity} {it.unit}</div>
                      <div className="col-span-2 text-right">${it.unitPrice.toFixed(2)}</div>
                      <div className="col-span-2 text-right font-bold">${it.totalPrice.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments History on this invoice */}
              {selectedInvoiceForDetails.payments && selectedInvoiceForDetails.payments.length > 0 && (
                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {isAr ? 'الدفعات المسجلة' : 'Payments Recorded'} ({selectedInvoiceForDetails.payments.length})
                  </Label>
                  <div className="mt-2 space-y-1.5">
                    {selectedInvoiceForDetails.payments.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-center p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300">
                        <span>{new Date(p.paymentDate).toLocaleDateString()} via {p.paymentMethod}</span>
                        <span className="font-bold">${p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t font-bold">
                <span>{isAr ? 'المتبقي غير المسدد:' : 'Remaining Balance:'}</span>
                <span className="text-sm text-rose-500">
                  ${(selectedInvoiceForDetails.remainingAmount ?? (selectedInvoiceForDetails.totalAmount - selectedInvoiceForDetails.paidAmount)).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* SMART INVOICE SCANNER (DRAG & DROP OCR INVENTORY INTAKE) */}
      {/* ========================================================================= */}
      <InvoiceScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        suppliers={suppliers}
        rawMaterials={rawMaterials}
        menuItemsList={menuItemsList}
        onSuccess={async () => {
          await Promise.all([fetchInvoices(), fetchSuppliers(), fetchRawMaterials(), fetchMenuItemsList()])
        }}
      />
    </div>
  )
}
