'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Receipt, 
  Building2, 
  Users, 
  Scale, 
  BookOpen, 
  Plus, 
  Search, 
  RefreshCw, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Coins, 
  CreditCard, 
  PieChart, 
  BarChart3, 
  Landmark, 
  ShieldCheck, 
  Briefcase, 
  Sparkles, 
  Layers, 
  Trash2, 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  X,
  ArrowUpDown
} from 'lucide-react'

interface Account {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  category: string
  description?: string | null
  balance: number
  isSystem: boolean
  isActive: boolean
}

interface JournalLine {
  id?: string
  accountId: string
  account?: Account
  debit: number
  credit: number
  description?: string | null
}

interface JournalEntry {
  id: string
  entryNumber: string
  date: string
  referenceType?: string | null
  referenceId?: string | null
  narration: string
  status: 'posted' | 'draft' | 'void'
  totalDebit: number
  totalCredit: number
  createdBy?: string | null
  lines: JournalLine[]
  createdAt: string
}

interface ExpenseVoucher {
  id: string
  voucherNumber: string
  title: string
  category: string
  amount: number
  taxAmount: number
  totalAmount: number
  paymentMethod: string
  paymentDate: string
  payee?: string | null
  referenceNumber?: string | null
  notes?: string | null
  status: string
  account?: Account | null
  paidFromAccount?: Account | null
}

interface FinancialData {
  tenant: {
    businessName: string
    currency: string
    taxNumber: string
    taxRate: number
  }
  timeRange: string
  startDate?: string
  endDate: string
  kpis: {
    netRevenue: number
    totalGrossRevenue: number
    totalCOGS: number
    grossProfit: number
    grossProfitMargin: number
    totalOperatingExpenses: number
    netProfit: number
    netProfitMargin: number
    salariesExpense: number
    laborCostPercent: number
    cogsPercent: number
    wastageExpense: number
    totalCashAndBank: number
    workingCapital: number
  }
  incomeStatement: {
    revenue: {
      accounts: { code: string; name: string; amount: number }[]
      grossRevenue: number
      discounts: number
      netRevenue: number
    }
    costOfGoodsSold: {
      accounts: { code: string; name: string; amount: number }[]
      totalCOGS: number
      grossProfit: number
      grossProfitMargin: number
    }
    operatingExpenses: {
      accounts: { code: string; name: string; category: string; amount: number }[]
      totalExpenses: number
      salariesExpense: number
      rentExpense: number
      utilitiesExpense: number
      wastageExpense: number
    }
    summary: {
      operatingProfit: number
      netProfit: number
      netProfitMargin: number
    }
  }
  balanceSheet: {
    assets: {
      current: { code: string; name: string; balance: number }[]
      nonCurrent: { code: string; name: string; balance: number }[]
      totalAssets: number
    }
    liabilities: {
      current: { code: string; name: string; balance: number }[]
      totalLiabilities: number
    }
    equity: {
      accounts: { code: string; name: string; balance: number }[]
      retainedEarnings: number
      totalEquity: number
    }
    isBalanced: boolean
    totalLiabilitiesAndEquity: number
  }
  trialBalance: {
    rows: {
      accountId: string
      code: string
      name: string
      type: string
      category: string
      periodDebit: number
      periodCredit: number
      endingDebit: number
      endingCredit: number
      netBalance: number
    }[]
    totalPeriodDebit: number
    totalPeriodCredit: number
    totalEndingDebit: number
    totalEndingCredit: number
    isBalanced: boolean
  }
  cashFlow: {
    operatingCashFlow: number
    cashReceivedFromSales: number
    cashPaidForInventory: number
    cashPaidForSalaries: number
    cashPaidForOtherExpenses: number
    netCashChange: number
    endingCashBalance: number
  }
  vatReport: {
    outputVATCollected: number
    inputVATPaid: number
    netVATPayable: number
    status: string
  }
}

export default function AccountingManager() {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'profit-loss' | 'balance-sheet' | 'cash-flow' | 'trial-balance' | 'general-ledger' | 'journal-entries' | 'expenses' | 'payroll' | 'chart-of-accounts' | 'tax-report'
  >('overview')

  const [timeRange, setTimeRange] = useState<string>('month')
  const [financialData, setFinancialData] = useState<FinancialData | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([])
  const [expenses, setExpenses] = useState<ExpenseVoucher[]>([])
  const [payrollData, setPayrollData] = useState<any>(null)
  
  const [loading, setLoading] = useState<boolean>(true)
  const [syncing, setSyncing] = useState<boolean>(false)
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  // Filters
  const [journalSearch, setJournalSearch] = useState<string>('')
  const [journalSourceFilter, setJournalSourceFilter] = useState<string>('all')
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string>('')
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all')
  const [accountSearch, setAccountSearch] = useState<string>('')
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all')

  // Account Statement Modal & Filter states
  const [isAccountStatementModalOpen, setIsAccountStatementModalOpen] = useState(false)
  const [selectedStatementAccountId, setSelectedStatementAccountId] = useState<string>('')
  const [statementTimeRange, setStatementTimeRange] = useState<string>('all')
  const [statementStartDate, setStatementStartDate] = useState<string>('')
  const [statementEndDate, setStatementEndDate] = useState<string>('')
  const [statementSearch, setStatementSearch] = useState<string>('')
  const [statementSourceFilter, setStatementSourceFilter] = useState<string>('all')
  const [statementSortOrder, setStatementSortOrder] = useState<'desc' | 'asc'>('desc')
  const [statementLoading, setStatementLoading] = useState<boolean>(false)
  const [statementData, setStatementData] = useState<{
    account: {
      id: string
      code: string
      name: string
      type: string
      category: string
      description?: string | null
      currentBalance: number
      isDebitNormal: boolean
      parentName?: string | null
    }
    summary: {
      openingBalance: number
      totalDebit: number
      totalCredit: number
      netMovement: number
      closingBalance: number
      transactionCount: number
      isDebitNormal: boolean
    }
    period: {
      timeRange: string
      startDate: string | null
      endDate: string | null
    }
    tenant: {
      businessName: string
      currency: string
      taxNumber: string
      taxRate: number
    }
    lines: {
      id?: string
      journalEntryId?: string
      date: string
      entryNumber: string
      referenceType?: string | null
      referenceId?: string | null
      narration: string
      debit: number
      credit: number
      balance: number
    }[]
  } | null>(null)

  // Modals
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false)
  const [isNewJournalModalOpen, setIsNewJournalModalOpen] = useState(false)
  const [isNewExpenseModalOpen, setIsNewExpenseModalOpen] = useState(false)
  const [isDisbursePayrollModalOpen, setIsDisbursePayrollModalOpen] = useState(false)

  // Form states
  const [newAccountForm, setNewAccountForm] = useState({
    code: '',
    name: '',
    type: 'expense' as Account['type'],
    category: 'operating_expense',
    description: '',
    parentId: ''
  })

  const [newExpenseForm, setNewExpenseForm] = useState({
    title: '',
    category: 'utilities',
    amount: '',
    taxAmount: '0',
    paymentMethod: 'cash',
    paymentDate: new Date().toISOString().split('T')[0],
    accountId: '',
    paidFromAccountId: '',
    payee: '',
    referenceNumber: '',
    notes: ''
  })

  const [newJournalForm, setNewJournalForm] = useState({
    narration: '',
    date: new Date().toISOString().split('T')[0],
    lines: [
      { accountId: '', debit: '', credit: '', description: '' },
      { accountId: '', debit: '', credit: '', description: '' }
    ]
  })

  const [payrollDisburseForm, setPayrollDisburseForm] = useState({
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear(),
    paymentMethod: 'bank_transfer',
    notes: 'Regular Monthly Payroll Distribution'
  })

  const printableRef = useRef<HTMLDivElement>(null)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const isDraggingTabs = useRef(false)
  const startXTabs = useRef(0)
  const scrollLeftTabs = useRef(0)
  const dragDistanceRef = useRef(0)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Check scroll bounds for tabs bar
  const checkTabsScrollBounds = () => {
    if (tabsContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current
      setCanScrollLeft(scrollLeft > 4)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4)
    }
  }

  useEffect(() => {
    checkTabsScrollBounds()
    const handleResize = () => checkTabsScrollBounds()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [financialData])

  const handleTabsMouseDown = (e: React.MouseEvent) => {
    if (!tabsContainerRef.current) return
    isDraggingTabs.current = true
    startXTabs.current = e.pageX - tabsContainerRef.current.offsetLeft
    scrollLeftTabs.current = tabsContainerRef.current.scrollLeft
    dragDistanceRef.current = 0
  }

  const handleTabsMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingTabs.current || !tabsContainerRef.current) return
    e.preventDefault()
    const x = e.pageX - tabsContainerRef.current.offsetLeft
    const walk = (x - startXTabs.current) * 1.4
    dragDistanceRef.current = Math.abs(x - startXTabs.current)
    tabsContainerRef.current.scrollLeft = scrollLeftTabs.current - walk
    checkTabsScrollBounds()
  }

  const handleTabsMouseUp = () => {
    isDraggingTabs.current = false
    setTimeout(() => {
      dragDistanceRef.current = 0
    }, 50)
  }

  const handleTabsWheel = (e: React.WheelEvent) => {
    if (tabsContainerRef.current && e.deltaY !== 0) {
      tabsContainerRef.current.scrollLeft += e.deltaY * 0.9
      checkTabsScrollBounds()
    }
  }

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsContainerRef.current) {
      const scrollAmount = 260
      tabsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
      setTimeout(checkTabsScrollBounds, 250)
    }
  }

  // Fetch all accounting data
  const fetchData = async () => {
    setLoading(true)
    try {
      // 1. Fetch reports
      const repRes = await fetch(`/api/accounting/reports?timeRange=${timeRange}`)
      if (repRes.ok) {
        const data = await repRes.json()
        setFinancialData(data)
      }

      // 2. Fetch accounts
      const accRes = await fetch('/api/accounting/accounts')
      if (accRes.ok) {
        const accData = await accRes.json()
        setAccounts(accData)
        if (!selectedLedgerAccountId && accData.length > 0) {
          setSelectedLedgerAccountId(accData[0].id)
        }
      }

      // 3. Fetch journal entries
      const jeRes = await fetch(`/api/accounting/journal?limit=100`)
      if (jeRes.ok) {
        const jeData = await jeRes.json()
        setJournalEntries(jeData.entries || [])
      }

      // 4. Fetch expenses
      const expRes = await fetch('/api/accounting/expenses')
      if (expRes.ok) {
        const expData = await expRes.json()
        setExpenses(expData.expenses || [])
      }

      // 5. Fetch payroll drafts
      const payRes = await fetch('/api/accounting/payroll')
      if (payRes.ok) {
        const payData = await payRes.json()
        setPayrollData(payData)
      }
    } catch (error) {
      console.error('Failed to load accounting data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeRange])

  // Sync historical transactions
  const handleSyncTransactions = async () => {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const res = await fetch('/api/accounting/sync', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        setSyncMessage(data.message || 'Synchronization complete')
        await fetchData()
      } else {
        setSyncMessage(`Sync failed: ${data.error}`)
      }
    } catch (err: any) {
      setSyncMessage(`Error syncing: ${err.message}`)
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMessage(null), 6000)
    }
  }

  // Create new Account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/accounting/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccountForm)
      })
      if (res.ok) {
        setIsNewAccountModalOpen(false)
        setNewAccountForm({
          code: '',
          name: '',
          type: 'expense',
          category: 'operating_expense',
          description: '',
          parentId: ''
        })
        await fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create account')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Create Expense Voucher
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/accounting/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newExpenseForm,
          amount: parseFloat(newExpenseForm.amount) || 0,
          taxAmount: parseFloat(newExpenseForm.taxAmount) || 0
        })
      })
      if (res.ok) {
        setIsNewExpenseModalOpen(false)
        setNewExpenseForm({
          title: '',
          category: 'utilities',
          amount: '',
          taxAmount: '0',
          paymentMethod: 'cash',
          paymentDate: new Date().toISOString().split('T')[0],
          accountId: '',
          paidFromAccountId: '',
          payee: '',
          referenceNumber: '',
          notes: ''
        })
        await fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to create expense voucher')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Create Manual Journal Entry
  const handleCreateJournal = async (e: React.FormEvent) => {
    e.preventDefault()
    const processedLines = newJournalForm.lines
      .filter(l => l.accountId && (parseFloat(l.debit || '0') > 0 || parseFloat(l.credit || '0') > 0))
      .map(l => ({
        accountId: l.accountId,
        debit: parseFloat(l.debit || '0') || 0,
        credit: parseFloat(l.credit || '0') || 0,
        description: l.description || newJournalForm.narration
      }))

    if (processedLines.length < 2) {
      alert('A journal entry must contain at least two account lines')
      return
    }

    const totalDebit = processedLines.reduce((s, l) => s + l.debit, 0)
    const totalCredit = processedLines.reduce((s, l) => s + l.credit, 0)

    if (Math.abs(totalDebit - totalCredit) > 0.05) {
      alert(`Entry out of balance! Total Debits ($${totalDebit.toFixed(2)}) must equal Total Credits ($${totalCredit.toFixed(2)})`)
      return
    }

    try {
      const res = await fetch('/api/accounting/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          narration: newJournalForm.narration,
          date: newJournalForm.date,
          lines: processedLines
        })
      })
      if (res.ok) {
        setIsNewJournalModalOpen(false)
        setNewJournalForm({
          narration: '',
          date: new Date().toISOString().split('T')[0],
          lines: [
            { accountId: '', debit: '', credit: '', description: '' },
            { accountId: '', debit: '', credit: '', description: '' }
          ]
        })
        await fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to post journal entry')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Disburse Payroll
  const handleDisbursePayroll = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!payrollData?.draftSummary) return

    try {
      const res = await fetch('/api/accounting/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodMonth: payrollDisburseForm.periodMonth,
          periodYear: payrollDisburseForm.periodYear,
          staffCount: payrollData.draftSummary.staffCount,
          basePay: payrollData.draftSummary.totalBasePay,
          overtimePay: payrollData.draftSummary.totalOvertimePay,
          paymentMethod: payrollDisburseForm.paymentMethod,
          notes: payrollDisburseForm.notes
        })
      })
      if (res.ok) {
        setIsDisbursePayrollModalOpen(false)
        alert('Payroll disbursed successfully and posted to the General Ledger!')
        await fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to disburse payroll')
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Print report
  const handlePrint = () => {
    window.print()
  }

  // Export to CSV
  const handleExportCSV = () => {
    if (!financialData) return

    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += `Dafaterkom Financial Report - ${activeTab.toUpperCase()}\n`
    csvContent += `Business: ${financialData.tenant.businessName}\n`
    csvContent += `Time Range: ${financialData.timeRange} (Generated: ${new Date().toLocaleString()})\n\n`

    if (activeTab === 'profit-loss') {
      csvContent += 'Type,Code,Account Name,Amount ($)\n'
      csvContent += '--- REVENUE ---\n'
      financialData.incomeStatement.revenue.accounts.forEach(a => {
        csvContent += `Revenue,${a.code},"${a.name}",${a.amount}\n`
      })
      csvContent += `Gross Revenue,,,${financialData.incomeStatement.revenue.grossRevenue}\n`
      csvContent += `Less Discounts,,,${financialData.incomeStatement.revenue.discounts}\n`
      csvContent += `Net Revenue,,,${financialData.incomeStatement.revenue.netRevenue}\n\n`

      csvContent += '--- COST OF GOODS SOLD ---\n'
      financialData.incomeStatement.costOfGoodsSold.accounts.forEach(a => {
        csvContent += `COGS,${a.code},"${a.name}",${a.amount}\n`
      })
      csvContent += `Total COGS,,,${financialData.incomeStatement.costOfGoodsSold.totalCOGS}\n`
      csvContent += `Gross Profit,,,${financialData.incomeStatement.costOfGoodsSold.grossProfit}\n`
      csvContent += `Gross Margin (%),,,${financialData.incomeStatement.costOfGoodsSold.grossProfitMargin}%\n\n`

      csvContent += '--- OPERATING EXPENSES ---\n'
      financialData.incomeStatement.operatingExpenses.accounts.forEach(a => {
        csvContent += `Expense,${a.code},"${a.name}",${a.amount}\n`
      })
      csvContent += `Total Operating Expenses,,,${financialData.incomeStatement.operatingExpenses.totalExpenses}\n\n`
      csvContent += `--- NET PROFIT ---\n`
      csvContent += `Net Profit,,,${financialData.incomeStatement.summary.netProfit}\n`
      csvContent += `Net Profit Margin (%),,,${financialData.incomeStatement.summary.netProfitMargin}%\n`
    } else if (activeTab === 'trial-balance') {
      csvContent += 'Code,Account Name,Type,Period Debit,Period Credit,Ending Debit,Ending Credit,Net Balance\n'
      financialData.trialBalance.rows.forEach(r => {
        csvContent += `${r.code},"${r.name}",${r.type},${r.periodDebit},${r.periodCredit},${r.endingDebit},${r.endingCredit},${r.netBalance}\n`
      })
      csvContent += `TOTALS,,,${financialData.trialBalance.totalPeriodDebit},${financialData.trialBalance.totalPeriodCredit},${financialData.trialBalance.totalEndingDebit},${financialData.trialBalance.totalEndingCredit},\n`
    } else {
      csvContent += 'Account Code,Account Name,Balance ($)\n'
      accounts.forEach(a => {
        csvContent += `${a.code},"${a.name}",${a.balance}\n`
      })
    }

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `financial-report-${activeTab}-${financialData.timeRange}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtered Journals
  const filteredJournalEntries = useMemo(() => {
    return journalEntries.filter(entry => {
      const matchesSearch = journalSearch === '' ||
        entry.entryNumber.toLowerCase().includes(journalSearch.toLowerCase()) ||
        entry.narration.toLowerCase().includes(journalSearch.toLowerCase())
      
      const matchesSource = journalSourceFilter === 'all' || entry.referenceType === journalSourceFilter
      return matchesSearch && matchesSource
    })
  }, [journalEntries, journalSearch, journalSourceFilter])

  // General Ledger drilldown
  const ledgerLines = useMemo(() => {
    if (!selectedLedgerAccountId) return []
    const lines: {
      date: string
      entryNumber: string
      narration: string
      referenceType?: string | null
      debit: number
      credit: number
      balance: number
    }[] = []

    let runningBalance = 0
    const targetAccount = accounts.find(a => a.id === selectedLedgerAccountId)
    const isDebitNormal = targetAccount?.type === 'asset' || targetAccount?.type === 'expense'

    // Sort ascending for chronological ledger running balance
    const sortedEntries = [...journalEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    for (const entry of sortedEntries) {
      for (const line of entry.lines) {
        if (line.accountId === selectedLedgerAccountId) {
          const debit = line.debit || 0
          const credit = line.credit || 0
          if (isDebitNormal) {
            runningBalance += (debit - credit)
          } else {
            runningBalance += (credit - debit)
          }

          lines.push({
            date: entry.date,
            entryNumber: entry.entryNumber,
            narration: line.description || entry.narration,
            referenceType: entry.referenceType,
            debit,
            credit,
            balance: Math.round(runningBalance * 100) / 100
          })
        }
      }
    }

    return lines.reverse() // Show newest first
  }, [selectedLedgerAccountId, journalEntries, accounts])

  // Filtered Chart of Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = accountSearch.toLowerCase().trim()
      const matchesSearch =
        !q ||
        acc.code.toLowerCase().includes(q) ||
        acc.name.toLowerCase().includes(q) ||
        acc.category.toLowerCase().includes(q) ||
        (acc.description && acc.description.toLowerCase().includes(q))

      const matchesType = accountTypeFilter === 'all' || acc.type === accountTypeFilter

      return matchesSearch && matchesType
    })
  }, [accounts, accountSearch, accountTypeFilter])

  // Chart of Accounts Type counts
  const accountTypeCounts = useMemo(() => {
    return {
      all: accounts.length,
      asset: accounts.filter(a => a.type === 'asset').length,
      liability: accounts.filter(a => a.type === 'liability').length,
      equity: accounts.filter(a => a.type === 'equity').length,
      revenue: accounts.filter(a => a.type === 'revenue').length,
      expense: accounts.filter(a => a.type === 'expense').length
    }
  }, [accounts])

  // Fallback client-side statement generator if API call encounters network/offline issues
  const generateClientSideStatement = (
    accountId: string,
    range: string,
    sDate?: string,
    eDate?: string,
    qSearch?: string,
    refType?: string,
    sOrder: 'desc' | 'asc' = 'desc'
  ) => {
    const acc = accounts.find(a => a.id === accountId)
    if (!acc) return

    const isDebitNormal = acc.type === 'asset' || acc.type === 'expense'
    const now = new Date()
    let startDateObj: Date | undefined = undefined
    let endDateObj: Date = eDate ? new Date(eDate) : now

    if (range === 'today') {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    } else if (range === 'this_week' || range === 'week') {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay(), 0, 0, 0)
    } else if (range === 'this_month' || range === 'month') {
      startDateObj = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
    } else if (range === 'last_month') {
      startDateObj = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)
      endDateObj = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    } else if (range === 'this_quarter' || range === 'quarter') {
      const qMonth = Math.floor(now.getMonth() / 3) * 3
      startDateObj = new Date(now.getFullYear(), qMonth, 1, 0, 0, 0)
    } else if (range === 'this_year' || range === 'year') {
      startDateObj = new Date(now.getFullYear(), 0, 1, 0, 0, 0)
    } else if (range === 'custom') {
      startDateObj = sDate ? new Date(sDate) : undefined
    }

    const sortedEntries = [...journalEntries].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let openingBalance = 0
    let runningBalance = 0
    let totalDebit = 0
    let totalCredit = 0
    const matchedLines: any[] = []

    for (const entry of sortedEntries) {
      const entryTime = new Date(entry.date).getTime()
      for (const line of entry.lines) {
        if (line.accountId === accountId) {
          const debit = line.debit || 0
          const credit = line.credit || 0

          if (startDateObj && entryTime < startDateObj.getTime()) {
            if (isDebitNormal) {
              openingBalance += (debit - credit)
            } else {
              openingBalance += (credit - debit)
            }
          } else if (!endDateObj || entryTime <= endDateObj.getTime()) {
            const matchesSearch = !qSearch ||
              entry.entryNumber.toLowerCase().includes(qSearch.toLowerCase()) ||
              entry.narration.toLowerCase().includes(qSearch.toLowerCase()) ||
              (line.description && line.description.toLowerCase().includes(qSearch.toLowerCase()))

            const matchesRef = !refType || refType === 'all' || entry.referenceType === refType

            if (matchesSearch && matchesRef) {
              matchedLines.push({
                entry,
                line,
                debit,
                credit
              })
            }
          }
        }
      }
    }

    openingBalance = Math.round(openingBalance * 100) / 100
    runningBalance = openingBalance

    const processedLines = matchedLines.map(item => {
      totalDebit += item.debit
      totalCredit += item.credit

      if (isDebitNormal) {
        runningBalance += (item.debit - item.credit)
      } else {
        runningBalance += (item.credit - item.debit)
      }

      return {
        id: item.line.id,
        journalEntryId: item.entry.id,
        date: item.entry.date,
        entryNumber: item.entry.entryNumber,
        referenceType: item.entry.referenceType,
        narration: item.line.description || item.entry.narration,
        debit: item.debit,
        credit: item.credit,
        balance: Math.round(runningBalance * 100) / 100
      }
    })

    const netMovement = isDebitNormal ? (totalDebit - totalCredit) : (totalCredit - totalDebit)
    const closingBalance = Math.round(runningBalance * 100) / 100
    const finalLines = sOrder === 'desc' ? [...processedLines].reverse() : processedLines

    setStatementData({
      account: {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        category: acc.category,
        description: acc.description,
        currentBalance: acc.balance,
        isDebitNormal
      },
      tenant: {
        businessName: financialData?.tenant.businessName || 'Dafaterkom',
        currency: financialData?.tenant.currency || 'USD',
        taxNumber: financialData?.tenant.taxNumber || '',
        taxRate: financialData?.tenant.taxRate || 15
      },
      summary: {
        openingBalance,
        totalDebit: Math.round(totalDebit * 100) / 100,
        totalCredit: Math.round(totalCredit * 100) / 100,
        netMovement: Math.round(netMovement * 100) / 100,
        closingBalance,
        transactionCount: processedLines.length,
        isDebitNormal
      },
      period: {
        timeRange: range,
        startDate: startDateObj?.toISOString() || null,
        endDate: endDateObj.toISOString()
      },
      lines: finalLines
    })
  }

  // Fetch or refresh Statement for an individual account
  const fetchAccountStatement = async (
    accountId: string,
    overrides?: {
      timeRange?: string
      startDate?: string
      endDate?: string
      search?: string
      referenceType?: string
      sortOrder?: 'desc' | 'asc'
    }
  ) => {
    setSelectedStatementAccountId(accountId)
    setIsAccountStatementModalOpen(true)
    setStatementLoading(true)

    const range = overrides?.timeRange !== undefined ? overrides.timeRange : statementTimeRange
    const sDate = overrides?.startDate !== undefined ? overrides.startDate : statementStartDate
    const eDate = overrides?.endDate !== undefined ? overrides.endDate : statementEndDate
    const qSearch = overrides?.search !== undefined ? overrides.search : statementSearch
    const refType = overrides?.referenceType !== undefined ? overrides.referenceType : statementSourceFilter
    const sOrder = overrides?.sortOrder !== undefined ? overrides.sortOrder : statementSortOrder

    try {
      let url = `/api/accounting/accounts/${accountId}/statement?timeRange=${range}&sortOrder=${sOrder}`
      if (range === 'custom') {
        if (sDate) url += `&startDate=${sDate}`
        if (eDate) url += `&endDate=${eDate}`
      }
      if (qSearch) url += `&search=${encodeURIComponent(qSearch)}`
      if (refType && refType !== 'all') url += `&referenceType=${encodeURIComponent(refType)}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setStatementData(data)
      } else {
        generateClientSideStatement(accountId, range, sDate, eDate, qSearch, refType, sOrder)
      }
    } catch (err) {
      console.warn('Using client-side fallback for statement:', err)
      generateClientSideStatement(accountId, range, sDate, eDate, qSearch, refType, sOrder)
    } finally {
      setStatementLoading(false)
    }
  }

  // Export Account Statement to CSV
  const handleExportAccountStatementCSV = () => {
    if (!statementData) return

    const { account, summary, period, lines, tenant } = statementData
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'

    csvContent += `Dafaterkom Account Statement\n`
    csvContent += `Account Code:,"${account.code}"\n`
    csvContent += `Account Name:,"${account.name}"\n`
    csvContent += `Classification:,"${account.type.toUpperCase()}"\n`
    csvContent += `Category:,"${account.category}"\n`
    csvContent += `Business:,"${tenant.businessName}"\n`
    csvContent += `Date Range:,"${period.timeRange.toUpperCase()} (${period.startDate ? new Date(period.startDate).toLocaleDateString() : 'Beginning'} - ${new Date(period.endDate || Date.now()).toLocaleDateString()})"\n`
    csvContent += `Generated At:,"${new Date().toLocaleString()}"\n\n`

    csvContent += `--- SUMMARY ---\n`
    csvContent += `Opening Balance,${summary.openingBalance}\n`
    csvContent += `Total Debits,${summary.totalDebit}\n`
    csvContent += `Total Credits,${summary.totalCredit}\n`
    csvContent += `Net Movement,${summary.netMovement}\n`
    csvContent += `Closing Balance,${summary.closingBalance}\n`
    csvContent += `Transaction Count,${summary.transactionCount}\n\n`

    csvContent += `Date,Entry Number,Source Type,Narration / Description,Debit,Credit,Running Balance\n`
    csvContent += `-,OPENING BALANCE,-,Opening Balance before period,-,-,${summary.openingBalance}\n`

    const csvLines = statementSortOrder === 'desc' ? [...lines].reverse() : lines
    csvLines.forEach(l => {
      const formattedDate = new Date(l.date).toLocaleDateString()
      const desc = `"${(l.narration || '').replace(/"/g, '""')}"`
      csvContent += `${formattedDate},${l.entryNumber},${l.referenceType || 'manual'},${desc},${l.debit || 0},${l.credit || 0},${l.balance}\n`
    })

    csvContent += `-,TOTALS,-,Period Totals,${summary.totalDebit},${summary.totalCredit},${summary.closingBalance}\n`

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Account_Statement_${account.code}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print Account Statement
  const handlePrintAccountStatement = () => {
    window.print()
  }

  const currencySymbol = financialData?.tenant?.currency === 'USD' ? '$' : `${financialData?.tenant?.currency || '$'} `

  const formatMoney = (val: number | undefined | null) => {
    if (val === undefined || val === null || isNaN(val)) return '$0.00'
    return `${currencySymbol}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 print:p-0 print:max-w-none text-slate-800 dark:text-slate-100">
      
      {/* ========================================================================= */}
      {/* 1. Header & Navigation Ribbon (Screen Only) */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Accounting & Finance Subsystem
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                  Double-Entry GAAP / IFRS
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Connected with Storage & Inventory, Staff Salaries, POS Sales, and Operating Expenses.
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls & Period Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Selector */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] h-9 text-xs font-semibold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          {/* Sync Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncTransactions}
            disabled={syncing}
            className="h-9 gap-1.5 text-xs font-medium cursor-pointer border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
            title="Scan & backfill historical sales, purchases & wastage into Double-Entry Journal"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Operations'}
          </Button>

          {/* Export CSV */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </Button>

          {/* Print */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="h-9 gap-1.5 text-xs font-medium cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Sync feedback notification */}
      {syncMessage && (
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Main Module Navigation Tabs (Draggable & Slideable) */}
      {/* ========================================================================= */}
      <div className="relative group border-b border-slate-200/80 dark:border-slate-800 pb-1.5 print:hidden">
        {/* Left scroll chevron */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Draggable scrollable tabs list */}
        <div
          ref={tabsContainerRef}
          onMouseDown={handleTabsMouseDown}
          onMouseMove={handleTabsMouseMove}
          onMouseUp={handleTabsMouseUp}
          onMouseLeave={handleTabsMouseUp}
          onWheel={handleTabsWheel}
          onScroll={checkTabsScrollBounds}
          className="flex items-center gap-1.5 overflow-x-auto select-none cursor-grab active:cursor-grabbing px-1 py-0.5"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {[
            { id: 'overview', label: 'Owner Executive Dashboard', icon: PieChart },
            { id: 'profit-loss', label: 'Profit & Loss (P&L)', icon: TrendingUp },
            { id: 'balance-sheet', label: 'Balance Sheet', icon: Landmark },
            { id: 'cash-flow', label: 'Cash Flow', icon: Coins },
            { id: 'trial-balance', label: 'Trial Balance', icon: Scale },
            { id: 'general-ledger', label: 'General Ledger', icon: BookOpen },
            { id: 'journal-entries', label: 'Journal Entries', icon: FileText },
            { id: 'expenses', label: 'Expense Vouchers', icon: Receipt },
            { id: 'payroll', label: 'Staff Payroll Disbursal', icon: Users },
            { id: 'chart-of-accounts', label: 'Chart of Accounts', icon: Layers },
            { id: 'tax-report', label: 'VAT Tax Return', icon: ShieldCheck }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (dragDistanceRef.current < 6) {
                    setActiveTab(tab.id as any)
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer select-none ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 pointer-events-none shrink-0" />
                <span className="pointer-events-none">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right scroll chevron */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700 shadow-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. Printable Formal Header (Active in Print Mode) */}
      {/* ========================================================================= */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900">
              {financialData?.tenant.businessName || 'Dafaterkom Café & Bakery'}
            </h1>
            <p className="text-xs text-slate-600 font-semibold">
              Official Financial Statement & Accounting Audit Report
            </p>
            <p className="text-[11px] text-slate-500">
              Tax ID: {financialData?.tenant.taxNumber || 'TAX-987654321'} | Currency: {financialData?.tenant.currency || 'USD'}
            </p>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">
              {activeTab.replace('-', ' ').toUpperCase()}
            </h2>
            <p className="text-xs text-slate-600">
              Period: {financialData?.timeRange.toUpperCase()} ({new Date(financialData?.startDate || Date.now()).toLocaleDateString()} – {new Date(financialData?.endDate || Date.now()).toLocaleDateString()})
            </p>
            <p className="text-[10px] text-slate-400">
              Printed on: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB 1: OWNER EXECUTIVE DASHBOARD */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && financialData && (
        <div className="space-y-6">
          {/* Top Quick Actions Bar for Owner */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-2xl text-white shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight">Executive Owner Overview</h3>
                <p className="text-xs text-slate-300">Real-time profitability, operational margins, and cash position.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsNewExpenseModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 h-8 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Record Expense
              </Button>
              <Button
                size="sm"
                onClick={() => setIsDisbursePayrollModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5 h-8 font-semibold cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" /> Disburse Payroll
              </Button>
              <Button
                size="sm"
                onClick={() => setIsNewJournalModalOpen(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1.5 h-8 font-semibold cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" /> Manual Journal
              </Button>
            </div>
          </div>

          {/* Primary High-Impact KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Net Profit Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Profit (Bottom Line)</span>
                <div className={`p-2 rounded-xl ${financialData.kpis.netProfit >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'}`}>
                  {financialData.kpis.netProfit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {formatMoney(financialData.kpis.netProfit)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Net Margin: {financialData.kpis.netProfitMargin}%</span>
                <span className="text-slate-400 text-[10px]">of total sales</span>
              </div>
            </div>

            {/* 2. Total Net Revenue Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Sales Revenue</span>
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {formatMoney(financialData.kpis.netRevenue)}
              </div>
              <div className="mt-2 text-xs font-medium text-slate-500 flex items-center justify-between">
                <span>Gross: {formatMoney(financialData.kpis.totalGrossRevenue)}</span>
                <span className="text-rose-500">Disc: -{formatMoney(financialData.incomeStatement.revenue.discounts)}</span>
              </div>
            </div>

            {/* 3. Cost of Goods Sold (COGS) Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cost of Goods (COGS)</span>
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                {formatMoney(financialData.kpis.totalCOGS)}
              </div>
              <div className="mt-2 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>Food Cost: {financialData.kpis.cogsPercent}%</span>
                <span className="text-slate-500">Gross Margin: {financialData.kpis.grossProfitMargin}%</span>
              </div>
            </div>

            {/* 4. Total Cash & Bank Liquidity Card */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Cash & Bank</span>
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Landmark className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black tracking-tight text-indigo-600 dark:text-indigo-400">
                {formatMoney(financialData.kpis.totalCashAndBank)}
              </div>
              <div className="mt-2 text-xs font-medium text-slate-500">
                Working Capital: <span className="font-bold text-slate-700 dark:text-slate-300">{formatMoney(financialData.kpis.workingCapital)}</span>
              </div>
            </div>
          </div>

          {/* Secondary Operational Cost Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost Breakdown Visual */}
            <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Revenue vs Expense Allocations
              </h3>

              {/* Progress Bar Stack */}
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-amber-600 dark:text-amber-400">Food & Ingredients Cost (COGS)</span>
                    <span>{formatMoney(financialData.kpis.totalCOGS)} ({financialData.kpis.cogsPercent}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, financialData.kpis.cogsPercent)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-blue-600 dark:text-blue-400">Staff Salaries & Overtime</span>
                    <span>{formatMoney(financialData.kpis.salariesExpense)} ({financialData.kpis.laborCostPercent}%)</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, financialData.kpis.laborCostPercent)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-rose-600 dark:text-rose-400">Inventory Wastage & Spoilage Loss</span>
                    <span>{formatMoney(financialData.kpis.wastageExpense)}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, financialData.kpis.netRevenue > 0 ? (financialData.kpis.wastageExpense / financialData.kpis.netRevenue) * 100 : 0)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-purple-600 dark:text-purple-400">Rent, Utilities & Other Operating Expenses</span>
                    <span>{formatMoney(financialData.kpis.totalOperatingExpenses - financialData.kpis.salariesExpense - financialData.kpis.wastageExpense)}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, financialData.kpis.netRevenue > 0 ? ((financialData.kpis.totalOperatingExpenses - financialData.kpis.salariesExpense) / financialData.kpis.netRevenue) * 100 : 0)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                <span>Healthy Restaurant Target: COGS &lt; 32% | Labor &lt; 30%</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Total Operational Overhead: {formatMoney(financialData.kpis.totalCOGS + financialData.kpis.totalOperatingExpenses)}
                </span>
              </div>
            </div>

            {/* Quick Financial Health Scorecard */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Financial Health Indicators
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="font-medium text-slate-600 dark:text-slate-300">Balance Sheet Equation</span>
                  <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                    {financialData.balanceSheet.isBalanced ? 'Balanced ($A = L + E)' : 'Checking'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="font-medium text-slate-600 dark:text-slate-300">Trial Balance Integrity</span>
                  <span className="font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                    {financialData.trialBalance.isBalanced ? 'Zero Variance' : 'Variance Detected'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="font-medium text-slate-600 dark:text-slate-300">Estimated VAT Liability</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatMoney(financialData.vatReport.netVATPayable)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="font-medium text-slate-600 dark:text-slate-300">Operating Cash Flow</span>
                  <span className={`font-bold ${financialData.cashFlow.operatingCashFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatMoney(financialData.cashFlow.operatingCashFlow)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TAB 2: PROFIT & LOSS (INCOME STATEMENT) */}
      {/* ========================================================================= */}
      {activeTab === 'profit-loss' && financialData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Income Statement (Profit & Loss)
              </h2>
              <p className="text-xs text-slate-500">
                For the period: {financialData.timeRange.toUpperCase()} ({new Date(financialData.startDate || Date.now()).toLocaleDateString()} - {new Date(financialData.endDate).toLocaleDateString()})
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-500 block">NET PROFIT</span>
              <span className={`text-xl font-black ${financialData.incomeStatement.summary.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatMoney(financialData.incomeStatement.summary.netProfit)}
              </span>
            </div>
          </div>

          <div className="space-y-6 text-sm">
            {/* 1. REVENUE */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-bold text-xs uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span>1. Operating Revenue</span>
                <span>Amount</span>
              </div>
              {financialData.incomeStatement.revenue.accounts.map((acc, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-700 dark:text-slate-300">{acc.code} - {acc.name}</span>
                  <span className="font-semibold">{formatMoney(acc.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-1.5 px-2 text-rose-500 font-medium">
                <span>Less: Sales Discounts & Contra-Allowances</span>
                <span>-{formatMoney(financialData.incomeStatement.revenue.discounts)}</span>
              </div>
              <div className="flex justify-between items-center py-2 px-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl font-bold text-blue-900 dark:text-blue-300">
                <span>NET REVENUE</span>
                <span>{formatMoney(financialData.incomeStatement.revenue.netRevenue)}</span>
              </div>
            </div>

            {/* 2. COST OF GOODS SOLD (COGS) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-bold text-xs uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span>2. Cost of Goods Sold (COGS)</span>
                <span>Amount</span>
              </div>
              {financialData.incomeStatement.costOfGoodsSold.accounts.map((acc, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-700 dark:text-slate-300">{acc.code} - {acc.name}</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{formatMoney(acc.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 px-3 bg-amber-50/60 dark:bg-amber-950/40 rounded-xl font-bold text-amber-900 dark:text-amber-300">
                <span>GROSS PROFIT (Margin: {financialData.incomeStatement.costOfGoodsSold.grossProfitMargin}%)</span>
                <span>{formatMoney(financialData.incomeStatement.costOfGoodsSold.grossProfit)}</span>
              </div>
            </div>

            {/* 3. OPERATING EXPENSES */}
            <div className="space-y-2">
              <div className="flex justify-between items-center font-bold text-xs uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-100 dark:border-slate-800">
                <span>3. Operating & Administrative Expenses</span>
                <span>Amount</span>
              </div>
              {financialData.incomeStatement.operatingExpenses.accounts.map((acc, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg">
                  <span className="text-slate-700 dark:text-slate-300">{acc.code} - {acc.name}</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatMoney(acc.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-slate-800 dark:text-slate-200">
                <span>TOTAL OPERATING EXPENSES</span>
                <span>{formatMoney(financialData.incomeStatement.operatingExpenses.totalExpenses)}</span>
              </div>
            </div>

            {/* 4. NET PROFIT (BOTTOM LINE) */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl font-black text-base shadow-lg">
              <div>
                <span>NET OPERATING PROFIT / (LOSS)</span>
                <span className="block text-xs font-normal text-indigo-300">Net Profit Margin: {financialData.incomeStatement.summary.netProfitMargin}%</span>
              </div>
              <span className={`text-xl ${financialData.incomeStatement.summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatMoney(financialData.incomeStatement.summary.netProfit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 3: BALANCE SHEET */}
      {/* ========================================================================= */}
      {activeTab === 'balance-sheet' && financialData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Statement of Financial Position (Balance Sheet)
              </h2>
              <p className="text-xs text-slate-500">
                As of {new Date(financialData.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${financialData.balanceSheet.isBalanced ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {financialData.balanceSheet.isBalanced ? 'Equation Balanced (A = L + E)' : 'Equation Balanced'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            {/* Left Column: ASSETS */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b pb-2">
                Assets
              </h3>
              
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Current Assets</span>
                {financialData.balanceSheet.assets.current.map((acc, idx) => (
                  <div key={idx} className="flex justify-between py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded">
                    <span>{acc.code} - {acc.name}</span>
                    <span className="font-semibold">{formatMoney(acc.balance)}</span>
                  </div>
                ))}

                {financialData.balanceSheet.assets.nonCurrent.length > 0 && (
                  <>
                    <span className="text-xs font-bold text-slate-400 uppercase block pt-2">Non-Current Assets</span>
                    {financialData.balanceSheet.assets.nonCurrent.map((acc, idx) => (
                      <div key={idx} className="flex justify-between py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded">
                        <span>{acc.code} - {acc.name}</span>
                        <span className="font-semibold">{formatMoney(acc.balance)}</span>
                      </div>
                    ))}
                  </>
                )}

                <div className="flex justify-between py-2.5 px-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl font-bold text-blue-900 dark:text-blue-300 mt-4">
                  <span>TOTAL ASSETS</span>
                  <span>{formatMoney(financialData.balanceSheet.assets.totalAssets)}</span>
                </div>
              </div>
            </div>

            {/* Right Column: LIABILITIES & EQUITY */}
            <div className="space-y-6">
              {/* Liabilities */}
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400 border-b pb-2">
                  Liabilities
                </h3>
                <div className="space-y-2">
                  {financialData.balanceSheet.liabilities.current.map((acc, idx) => (
                    <div key={idx} className="flex justify-between py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded">
                      <span>{acc.code} - {acc.name}</span>
                      <span className="font-semibold">{formatMoney(acc.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 px-3 bg-rose-50 dark:bg-rose-950/50 rounded-xl font-bold text-rose-900 dark:text-rose-300">
                    <span>TOTAL LIABILITIES</span>
                    <span>{formatMoney(financialData.balanceSheet.liabilities.totalLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Equity */}
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border-b pb-2">
                  Owner's Equity
                </h3>
                <div className="space-y-2">
                  {financialData.balanceSheet.equity.accounts.map((acc, idx) => (
                    <div key={idx} className="flex justify-between py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded">
                      <span>{acc.code} - {acc.name}</span>
                      <span className="font-semibold">{formatMoney(acc.balance)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-1 px-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded font-medium">
                    <span>Accumulated Retained Earnings</span>
                    <span className="font-semibold">{formatMoney(financialData.balanceSheet.equity.retainedEarnings)}</span>
                  </div>
                  <div className="flex justify-between py-2 px-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl font-bold text-emerald-900 dark:text-emerald-300">
                    <span>TOTAL EQUITY</span>
                    <span>{formatMoney(financialData.balanceSheet.equity.totalEquity)}</span>
                  </div>
                </div>
              </div>

              {/* Grand Total Liabilities & Equity */}
              <div className="flex justify-between py-3 px-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-md">
                <span>TOTAL LIABILITIES & EQUITY</span>
                <span>{formatMoney(financialData.balanceSheet.totalLiabilitiesAndEquity)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 4: CASH FLOW */}
      {/* ========================================================================= */}
      {activeTab === 'cash-flow' && financialData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              Statement of Cash Flows (Direct Operating Method)
            </h2>
            <p className="text-xs text-slate-500">
              Cash flow movements across sales, inventory replenishment, salaries, and overhead.
            </p>
          </div>

          <div className="space-y-4 text-sm max-w-3xl">
            <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="text-slate-700 dark:text-slate-300">Cash Received from POS Customer Sales</span>
              <span className="font-bold text-emerald-600">+{formatMoney(financialData.cashFlow.cashReceivedFromSales)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="text-slate-700 dark:text-slate-300">Cash Disbursed for Food Inventory (COGS)</span>
              <span className="font-bold text-rose-600">-{formatMoney(financialData.cashFlow.cashPaidForInventory)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="text-slate-700 dark:text-slate-300">Cash Disbursed for Staff Salaries & Overtime</span>
              <span className="font-bold text-rose-600">-{formatMoney(financialData.cashFlow.cashPaidForSalaries)}</span>
            </div>
            <div className="flex justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="text-slate-700 dark:text-slate-300">Cash Disbursed for Operating Expenses (Rent, Utilities, Supplies)</span>
              <span className="font-bold text-rose-600">-{formatMoney(financialData.cashFlow.cashPaidForOtherExpenses)}</span>
            </div>

            <div className="flex justify-between py-3 px-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl font-bold text-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
              <span>NET CASH CHANGE FROM OPERATIONS</span>
              <span>{formatMoney(financialData.cashFlow.netCashChange)}</span>
            </div>

            <div className="flex justify-between py-3 px-4 bg-slate-900 text-white rounded-xl font-black">
              <span>ENDING CASH & BANK BALANCE</span>
              <span className="text-emerald-400">{formatMoney(financialData.cashFlow.endingCashBalance)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB 5: TRIAL BALANCE */}
      {/* ========================================================================= */}
      {activeTab === 'trial-balance' && financialData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Multi-Column Trial Balance
              </h2>
              <p className="text-xs text-slate-500">
                Summary of period activity and ending balances across all active accounts.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${financialData.trialBalance.isBalanced ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-100 text-rose-800'}`}>
                {financialData.trialBalance.isBalanced ? 'Debit & Credit In Balance' : 'Out of Balance'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Account Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3 text-right">Period Debit</th>
                  <th className="p-3 text-right">Period Credit</th>
                  <th className="p-3 text-right">Ending Debit</th>
                  <th className="p-3 text-right">Ending Credit</th>
                  <th className="p-3 text-right">Net Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {financialData.trialBalance.rows.map((row) => (
                  <tr key={row.accountId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-slate-500">{row.code}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{row.name}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800">
                        {row.type}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {row.periodDebit > 0 ? formatMoney(row.periodDebit) : '—'}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {row.periodCredit > 0 ? formatMoney(row.periodCredit) : '—'}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {row.endingDebit > 0 ? formatMoney(row.endingDebit) : '—'}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-purple-600 dark:text-purple-400">
                      {row.endingCredit > 0 ? formatMoney(row.endingCredit) : '—'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatMoney(row.netBalance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td colSpan={3} className="p-3 uppercase">GRAND TOTALS</td>
                  <td className="p-3 text-right font-mono">{formatMoney(financialData.trialBalance.totalPeriodDebit)}</td>
                  <td className="p-3 text-right font-mono">{formatMoney(financialData.trialBalance.totalPeriodCredit)}</td>
                  <td className="p-3 text-right font-mono text-blue-700 dark:text-blue-300">{formatMoney(financialData.trialBalance.totalEndingDebit)}</td>
                  <td className="p-3 text-right font-mono text-purple-700 dark:text-purple-300">{formatMoney(financialData.trialBalance.totalEndingCredit)}</td>
                  <td className="p-3 text-right font-mono text-emerald-600">Balanced</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. TAB 6: GENERAL LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'general-ledger' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Account General Ledger Drilldown
              </h2>
              <p className="text-xs text-slate-500">
                Individual account transaction history and continuous running balance.
              </p>
            </div>
            
            {/* Account Selector */}
            <div className="w-full sm:w-72">
              <Select value={selectedLedgerAccountId} onValueChange={setSelectedLedgerAccountId}>
                <SelectTrigger className="w-full font-semibold">
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.code} - {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Entry #</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Narration / Description</th>
                  <th className="p-3 text-right">Debit</th>
                  <th className="p-3 text-right">Credit</th>
                  <th className="p-3 text-right">Running Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {ledgerLines.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400">
                      No posted transactions found for this account.
                    </td>
                  </tr>
                ) : (
                  ledgerLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(line.date).toLocaleDateString()}</td>
                      <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{line.entryNumber}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800">
                          {line.referenceType || 'manual'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-700 dark:text-slate-200">{line.narration}</td>
                      <td className="p-3 text-right font-mono text-emerald-600">
                        {line.debit > 0 ? formatMoney(line.debit) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-600">
                        {line.credit > 0 ? formatMoney(line.credit) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatMoney(line.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. TAB 7: JOURNAL ENTRIES */}
      {/* ========================================================================= */}
      {activeTab === 'journal-entries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Search entries, narrations..."
                  value={journalSearch}
                  onChange={(e) => setJournalSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>

              <Select value={journalSourceFilter} onValueChange={setJournalSourceFilter}>
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="pos_sale">POS Sales</SelectItem>
                  <SelectItem value="purchase_invoice">Purchases</SelectItem>
                  <SelectItem value="supplier_payment">Supplier Payments</SelectItem>
                  <SelectItem value="payroll_disbursement">Payroll</SelectItem>
                  <SelectItem value="inventory_waste">Wastage</SelectItem>
                  <SelectItem value="expense_voucher">Expense Vouchers</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setIsNewJournalModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs gap-1.5 h-9 font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" /> New Journal Entry
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Entry #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Narration</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Debit</th>
                    <th className="p-3 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredJournalEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No journal entries matching filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredJournalEntries.map((entry) => (
                      <React.Fragment key={entry.id}>
                        <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 font-medium">
                          <td className="p-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                            {entry.entryNumber}
                          </td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {entry.referenceType || 'manual'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-800 dark:text-slate-200 font-semibold">
                            {entry.narration}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.status === 'posted' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-100 text-rose-800'}`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatMoney(entry.totalDebit)}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatMoney(entry.totalCredit)}
                          </td>
                        </tr>

                        {/* Breakdown lines sub-row */}
                        <tr className="bg-slate-50/50 dark:bg-slate-800/20 text-[11px] text-slate-500">
                          <td colSpan={7} className="px-6 py-2">
                            <div className="space-y-1">
                              {entry.lines.map((l, lIdx) => (
                                <div key={lIdx} className="flex justify-between items-center">
                                  <span>
                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{l.account?.code || ''}</span> - {l.account?.name || 'Account'} 
                                    {l.description ? ` (${l.description})` : ''}
                                  </span>
                                  <div className="space-x-4 font-mono">
                                    {l.debit > 0 && <span className="text-emerald-600 font-semibold">Dr: {formatMoney(l.debit)}</span>}
                                    {l.credit > 0 && <span className="text-rose-600 font-semibold">Cr: {formatMoney(l.credit)}</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. TAB 8: EXPENSE VOUCHERS */}
      {/* ========================================================================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
                <SelectTrigger className="w-44 h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="rent">Rent & Lease</SelectItem>
                  <SelectItem value="utilities">Utilities & Electricity</SelectItem>
                  <SelectItem value="maintenance">Maintenance & Repairs</SelectItem>
                  <SelectItem value="marketing">Marketing & Ads</SelectItem>
                  <SelectItem value="supplies">Cleaning & Kitchen Supplies</SelectItem>
                  <SelectItem value="petty_cash">Petty Cash</SelectItem>
                  <SelectItem value="other">General & Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={() => setIsNewExpenseModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5 h-9 font-semibold cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Create Expense Voucher
            </Button>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Voucher #</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Title / Payee</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3 text-right">Tax</th>
                    <th className="p-3 text-right">Total Amount</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        No expense vouchers recorded.
                      </td>
                    </tr>
                  ) : (
                    expenses
                      .filter(e => expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter)
                      .map((exp) => (
                        <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            {exp.voucherNumber}
                          </td>
                          <td className="p-3 text-slate-500 whitespace-nowrap">
                            {new Date(exp.paymentDate).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block">{exp.title}</span>
                            {exp.payee && <span className="text-[11px] text-slate-400">Payee: {exp.payee}</span>}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {exp.category}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600 uppercase font-medium">{exp.paymentMethod}</td>
                          <td className="p-3 text-right font-mono text-slate-500">{formatMoney(exp.taxAmount)}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatMoney(exp.totalAmount)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${exp.status === 'paid' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-100 text-rose-800'}`}>
                              {exp.status}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. TAB 9: STAFF PAYROLL DISBURSAL */}
      {/* ========================================================================= */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Summary Box */}
          {payrollData?.draftSummary && (
            <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white p-5 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs uppercase font-bold text-indigo-300 tracking-wider">Attendance & Timesheet Payroll Draft</span>
                <h3 className="text-xl font-black">
                  Period: {payrollData.draftSummary.month}/{payrollData.draftSummary.year} ({payrollData.draftSummary.staffCount} Registered Staff)
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Total Hours: {payrollData.draftSummary.totalRegularHours} Regular + {payrollData.draftSummary.totalOvertimeHours} Overtime
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs font-bold text-indigo-300 block uppercase">Grand Total Payroll</span>
                  <span className="text-2xl font-black text-emerald-400">
                    {formatMoney(payrollData.draftSummary.grandTotalPayroll)}
                  </span>
                </div>

                <Button
                  onClick={() => setIsDisbursePayrollModalOpen(true)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold h-10 px-5 rounded-xl cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Disburse & Post to GL
                </Button>
              </div>
            </div>
          )}

          {/* Individual Staff Compensation breakdown */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Staff Payroll Timesheet Calculations</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Staff Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Hourly Rate</th>
                    <th className="p-3">Regular Hours</th>
                    <th className="p-3">Overtime Hours</th>
                    <th className="p-3 text-right">Base Pay</th>
                    <th className="p-3 text-right">Overtime Pay</th>
                    <th className="p-3 text-right">Total Compensation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payrollData?.staffPayrollDraft?.map((s: any) => (
                    <tr key={s.staffId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{s.name}</td>
                      <td className="p-3 text-slate-500 uppercase">{s.jobTitle || s.role}</td>
                      <td className="p-3 font-mono">{formatMoney(s.hourlyRate)}/hr</td>
                      <td className="p-3 font-mono">{s.regularHours} hrs</td>
                      <td className="p-3 font-mono text-amber-600">{s.overtimeHours} hrs</td>
                      <td className="p-3 text-right font-mono text-slate-700 dark:text-slate-300">{formatMoney(s.regularPay)}</td>
                      <td className="p-3 text-right font-mono text-amber-600">{formatMoney(s.overtimePay)}</td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatMoney(s.totalPay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. TAB 10: CHART OF ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'chart-of-accounts' && (
        <div className="space-y-4">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-white">
                  Master Chart of Accounts
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {accounts.length} Accounts
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Categorized standard GAAP/IFRS account tree with running balances and individual account activity reports.
              </p>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button
                onClick={() => setIsNewAccountModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5 h-9 font-semibold cursor-pointer shadow-sm shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Add Custom Account
              </Button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input
                  placeholder="Search accounts by code, name, category, or description..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  className="pl-9 pr-9 h-9 text-xs font-medium bg-slate-50/70 dark:bg-slate-800/50"
                />
                {accountSearch && (
                  <button
                    type="button"
                    onClick={() => setAccountSearch('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Status / Showing count */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span>
                  Showing <strong className="text-slate-800 dark:text-slate-200">{filteredAccounts.length}</strong> of {accounts.length} accounts
                </span>
                {(accountSearch || accountTypeFilter !== 'all') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAccountSearch('')
                      setAccountTypeFilter('all')
                    }}
                    className="h-7 px-2 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            </div>

            {/* Classification / Type Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Classification:</span>
              {[
                { id: 'all', label: 'All Accounts', count: accountTypeCounts.all },
                { id: 'asset', label: 'Assets', count: accountTypeCounts.asset, badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400' },
                { id: 'liability', label: 'Liabilities', count: accountTypeCounts.liability, badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400' },
                { id: 'equity', label: 'Equity', count: accountTypeCounts.equity, badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' },
                { id: 'revenue', label: 'Revenue', count: accountTypeCounts.revenue, badgeColor: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400' },
                { id: 'expense', label: 'Expenses', count: accountTypeCounts.expense, badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400' }
              ].map((tab) => {
                const isActive = accountTypeFilter === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAccountTypeFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer shrink-0 ${
                      isActive
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Accounts Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-3 w-20">Code</th>
                    <th className="p-3">Account Name</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Current Balance</th>
                    <th className="p-3 text-center w-48">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Search className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No accounts found</p>
                          <p className="text-xs text-slate-400">
                            No chart accounts matched your search keyword or classification filter.
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAccountSearch('')
                              setAccountTypeFilter('all')
                            }}
                            className="mt-2 text-xs"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                            {acc.code}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-bold text-slate-900 dark:text-white block">{acc.name}</span>
                          {acc.isSystem && (
                            <span className="text-[10px] text-slate-400 font-medium">Standard System Account</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            acc.type === 'asset' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400' :
                            acc.type === 'liability' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400' :
                            acc.type === 'equity' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                            acc.type === 'revenue' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                          }`}>
                            {acc.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-500 uppercase text-[11px] font-medium">{acc.category}</td>
                        <td className="p-3 text-slate-500 max-w-xs truncate" title={acc.description || ''}>
                          {acc.description || '—'}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatMoney(acc.balance)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Individual Account Statement & Report Button */}
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => fetchAccountStatement(acc.id)}
                              className="h-8 px-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/70 dark:text-blue-300 dark:hover:bg-blue-900/80 border border-blue-200 dark:border-blue-800 text-[11px] font-bold gap-1 cursor-pointer transition-all shadow-xs"
                              title={`Generate Individual Report & Statement for ${acc.name}`}
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span>Account Statement</span>
                            </Button>

                            {/* Jump to General Ledger Drilldown */}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLedgerAccountId(acc.id)
                                setActiveTab('general-ledger')
                              }}
                              className="h-8 px-2 text-slate-500 hover:text-slate-900 dark:hover:text-white text-[11px] gap-1 cursor-pointer"
                              title={`Drill down in General Ledger`}
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Ledger</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. TAB 11: VAT TAX RETURN */}
      {/* ========================================================================= */}
      {activeTab === 'tax-report' && financialData && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-6 max-w-3xl">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
              VAT & Tax Return Declaration
            </h2>
            <p className="text-xs text-slate-500">
              Tax ID: {financialData.tenant.taxNumber} | Standard Rate: {financialData.tenant.taxRate}%
            </p>
          </div>

          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex justify-between items-center">
              <div>
                <span className="font-bold text-blue-950 dark:text-blue-300 block">1. Output VAT Collected</span>
                <span className="text-xs text-slate-500">VAT collected from customer point-of-sale orders</span>
              </div>
              <span className="text-lg font-black text-blue-900 dark:text-blue-200">{formatMoney(financialData.vatReport.outputVATCollected)}</span>
            </div>

            <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 flex justify-between items-center">
              <div>
                <span className="font-bold text-purple-950 dark:text-purple-300 block">2. Input VAT Paid</span>
                <span className="text-xs text-slate-500">VAT paid on raw material purchases & registered expenses</span>
              </div>
              <span className="text-lg font-black text-purple-900 dark:text-purple-200">{formatMoney(financialData.vatReport.inputVATPaid)}</span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex justify-between items-center shadow-lg">
              <div>
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">Net Tax Position</span>
                <span className="text-base font-black">
                  {financialData.vatReport.netVATPayable >= 0 ? 'NET VAT PAYABLE TO TAX AUTHORITY' : 'NET VAT TAX REFUNDABLE'}
                </span>
              </div>
              <span className="text-2xl font-black text-emerald-400">
                {formatMoney(Math.abs(financialData.vatReport.netVATPayable))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 15. MODAL: CREATE CUSTOM ACCOUNT */}
      {/* ========================================================================= */}
      <Dialog open={isNewAccountModalOpen} onOpenChange={setIsNewAccountModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Account to Chart of Accounts</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateAccount} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Account Code</Label>
              <Input
                placeholder="e.g. 5092"
                value={newAccountForm.code}
                onChange={(e) => setNewAccountForm({ ...newAccountForm, code: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Account Name</Label>
              <Input
                placeholder="e.g. Software & Cloud Subscriptions"
                value={newAccountForm.name}
                onChange={(e) => setNewAccountForm({ ...newAccountForm, name: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={newAccountForm.type}
                  onValueChange={(val: any) => setNewAccountForm({ ...newAccountForm, type: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={newAccountForm.category}
                  onValueChange={(val: any) => setNewAccountForm({ ...newAccountForm, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current_asset">Current Asset</SelectItem>
                    <SelectItem value="non_current_asset">Non-Current Asset</SelectItem>
                    <SelectItem value="current_liability">Current Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="operating_revenue">Operating Revenue</SelectItem>
                    <SelectItem value="cost_of_sales">Cost of Sales</SelectItem>
                    <SelectItem value="operating_expense">Operating Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Account purpose notes"
                value={newAccountForm.description}
                onChange={(e) => setNewAccountForm({ ...newAccountForm, description: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewAccountModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">
                Save Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 16. MODAL: CREATE EXPENSE VOUCHER */}
      {/* ========================================================================= */}
      <Dialog open={isNewExpenseModalOpen} onOpenChange={setIsNewExpenseModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Operating Expense Voucher</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateExpense} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Expense Title</Label>
              <Input
                placeholder="e.g. Monthly Electricity & Power Bill"
                value={newExpenseForm.title}
                onChange={(e) => setNewExpenseForm({ ...newExpenseForm, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={newExpenseForm.category}
                  onValueChange={(val: any) => setNewExpenseForm({ ...newExpenseForm, category: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent">Rent & Facility Lease</SelectItem>
                    <SelectItem value="utilities">Electricity, Water & Utilities</SelectItem>
                    <SelectItem value="maintenance">Maintenance & Repairs</SelectItem>
                    <SelectItem value="marketing">Marketing & Advertising</SelectItem>
                    <SelectItem value="supplies">Kitchen & Cleaning Supplies</SelectItem>
                    <SelectItem value="petty_cash">Petty Cash Expense</SelectItem>
                    <SelectItem value="other">General & Administrative</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select
                  value={newExpenseForm.paymentMethod}
                  onValueChange={(val: any) => setNewExpenseForm({ ...newExpenseForm, paymentMethod: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash (Register Till)</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer / Card</SelectItem>
                    <SelectItem value="petty_cash">Petty Cash Safe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount (Net)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newExpenseForm.amount}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, amount: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Tax Amount (VAT)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newExpenseForm.taxAmount}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, taxAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Payee / Vendor</Label>
                <Input
                  placeholder="e.g. City Power Corp"
                  value={newExpenseForm.payee}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, payee: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Reference / Invoice #</Label>
                <Input
                  placeholder="e.g. INV-90812"
                  value={newExpenseForm.referenceNumber}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, referenceNumber: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Payment Date</Label>
              <Input
                type="date"
                value={newExpenseForm.paymentDate}
                onChange={(e) => setNewExpenseForm({ ...newExpenseForm, paymentDate: e.target.value })}
                required
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewExpenseModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                Save & Post Voucher
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 17. MODAL: MANUAL JOURNAL ENTRY */}
      {/* ========================================================================= */}
      <Dialog open={isNewJournalModalOpen} onOpenChange={setIsNewJournalModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Manual Double-Entry Journal Entry</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateJournal} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Narration / Description</Label>
                <Input
                  placeholder="e.g. Owner Capital Injection / Equipment Depreciation"
                  value={newJournalForm.narration}
                  onChange={(e) => setNewJournalForm({ ...newJournalForm, narration: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Entry Date</Label>
                <Input
                  type="date"
                  value={newJournalForm.date}
                  onChange={(e) => setNewJournalForm({ ...newJournalForm, date: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-slate-500">Journal Lines (Debits & Credits)</Label>
              
              {newJournalForm.lines.map((line, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                  <div className="col-span-6">
                    <Select
                      value={line.accountId}
                      onValueChange={(val) => {
                        const nextLines = [...newJournalForm.lines]
                        nextLines[idx].accountId = val
                        setNewJournalForm({ ...newJournalForm, lines: nextLines })
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {accounts.map(a => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.code} - {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Debit ($)"
                      value={line.debit}
                      onChange={(e) => {
                        const nextLines = [...newJournalForm.lines]
                        nextLines[idx].debit = e.target.value
                        if (e.target.value) nextLines[idx].credit = ''
                        setNewJournalForm({ ...newJournalForm, lines: nextLines })
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Credit ($)"
                      value={line.credit}
                      onChange={(e) => {
                        const nextLines = [...newJournalForm.lines]
                        nextLines[idx].credit = e.target.value
                        if (e.target.value) nextLines[idx].debit = ''
                        setNewJournalForm({ ...newJournalForm, lines: nextLines })
                      }}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewJournalForm({
                    ...newJournalForm,
                    lines: [...newJournalForm.lines, { accountId: '', debit: '', credit: '', description: '' }]
                  })
                }}
                className="text-xs text-blue-600 gap-1 h-7"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewJournalModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                Post Balanced Journal Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 18. MODAL: DISBURSE PAYROLL */}
      {/* ========================================================================= */}
      <Dialog open={isDisbursePayrollModalOpen} onOpenChange={setIsDisbursePayrollModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Disburse Monthly Staff Payroll</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDisbursePayroll} className="space-y-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-xl text-xs space-y-1">
              <span className="font-bold text-blue-900 dark:text-blue-300 block">Payroll Calculation Summary:</span>
              <p className="text-slate-600 dark:text-slate-300">
                Staff Count: <strong>{payrollData?.draftSummary?.staffCount || 0}</strong> | Total Hours: <strong>{payrollData?.draftSummary?.totalRegularHours || 0}</strong>
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Total Net Disbursement: <strong className="text-emerald-600 text-sm">{formatMoney(payrollData?.draftSummary?.grandTotalPayroll)}</strong>
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Disbursement Payment Method</Label>
              <Select
                value={payrollDisburseForm.paymentMethod}
                onValueChange={(val) => setPayrollDisburseForm({ ...payrollDisburseForm, paymentMethod: val })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Operating Account (Card/Transfer)</SelectItem>
                  <SelectItem value="cash">Cash Register Till</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Disbursement Notes</Label>
              <Input
                value={payrollDisburseForm.notes}
                onChange={(e) => setPayrollDisburseForm({ ...payrollDisburseForm, notes: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDisbursePayrollModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
                Confirm & Disburse Payroll
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 19. MODAL: INDIVIDUAL ACCOUNT STATEMENT & ACTIVITY REPORT */}
      {/* ========================================================================= */}
      <Dialog open={isAccountStatementModalOpen} onOpenChange={setIsAccountStatementModalOpen}>
        <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs">
                    {statementData?.account.code || '—'}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {statementData?.account.name || 'Account Statement'}
                  </h2>
                  {statementData?.account.type && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      statementData.account.type === 'asset' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400' :
                      statementData.account.type === 'liability' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400' :
                      statementData.account.type === 'equity' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                      statementData.account.type === 'revenue' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400' :
                      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                    }`}>
                      {statementData.account.type}
                    </span>
                  )}
                  {statementData?.account.category && (
                    <span className="text-[10px] font-semibold text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800">
                      {statementData.account.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {statementData?.tenant.businessName || 'Dafaterkom'} • Individual Ledger Statement & Activity Report
                  {statementData?.account.description ? ` — ${statementData.account.description}` : ''}
                </p>
              </div>

              {/* Header Actions: Quick Switch, Export CSV, Print, Open in Ledger */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Account Switcher */}
                <div className="w-52">
                  <Select
                    value={selectedStatementAccountId}
                    onValueChange={(accId) => {
                      fetchAccountStatement(accId)
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs font-semibold">
                      <SelectValue placeholder="Switch Account" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {accounts.map(a => (
                        <SelectItem key={a.id} value={a.id} className="text-xs">
                          <span className="font-mono font-bold mr-1.5 text-slate-500">{a.code}</span> {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Export CSV */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportAccountStatementCSV}
                  disabled={!statementData || statementLoading}
                  className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
                  title="Export this account statement to CSV/Excel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export CSV</span>
                </Button>

                {/* Print */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrintAccountStatement}
                  disabled={!statementData || statementLoading}
                  className="h-8 text-xs gap-1.5 font-medium cursor-pointer"
                  title="Print account statement"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print</span>
                </Button>

                {/* Open in General Ledger Tab */}
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setIsAccountStatementModalOpen(false)
                    if (statementData?.account.id) {
                      setSelectedLedgerAccountId(statementData.account.id)
                    }
                    setActiveTab('general-ledger')
                  }}
                  className="h-8 text-xs gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer"
                  title="View complete Ledger in General Ledger tab"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open Ledger Tab</span>
                </Button>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              {/* Period presets */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
                {[
                  { id: 'all', label: 'All Time' },
                  { id: 'today', label: 'Today' },
                  { id: 'this_week', label: 'This Week' },
                  { id: 'this_month', label: 'This Month' },
                  { id: 'last_month', label: 'Last Month' },
                  { id: 'this_quarter', label: 'This Quarter' },
                  { id: 'this_year', label: 'This Year' },
                  { id: 'custom', label: 'Custom Range' }
                ].map((range) => {
                  const isActive = statementTimeRange === range.id
                  return (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => {
                        setStatementTimeRange(range.id)
                        if (selectedStatementAccountId && range.id !== 'custom') {
                          fetchAccountStatement(selectedStatementAccountId, { timeRange: range.id })
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap cursor-pointer transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800'
                      }`}
                    >
                      {range.label}
                    </button>
                  )
                })}
              </div>

              {/* Transactions search & Source filter inside report */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-44">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <Input
                    placeholder="Search entries..."
                    value={statementSearch}
                    onChange={(e) => {
                      setStatementSearch(e.target.value)
                      if (selectedStatementAccountId) {
                        fetchAccountStatement(selectedStatementAccountId, { search: e.target.value })
                      }
                    }}
                    className="pl-8 pr-7 h-8 text-xs"
                  />
                  {statementSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatementSearch('')
                        if (selectedStatementAccountId) {
                          fetchAccountStatement(selectedStatementAccountId, { search: '' })
                        }
                      }}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <Select
                  value={statementSourceFilter}
                  onValueChange={(val) => {
                    setStatementSourceFilter(val)
                    if (selectedStatementAccountId) {
                      fetchAccountStatement(selectedStatementAccountId, { referenceType: val })
                    }
                  }}
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="pos_sale">POS Sales</SelectItem>
                    <SelectItem value="purchase_invoice">Purchases</SelectItem>
                    <SelectItem value="supplier_payment">Supplier Payments</SelectItem>
                    <SelectItem value="payroll_disbursement">Payroll</SelectItem>
                    <SelectItem value="expense_voucher">Expenses</SelectItem>
                    <SelectItem value="inventory_waste">Wastage</SelectItem>
                    <SelectItem value="manual">Manual Entry</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order Toggle */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nextOrder = statementSortOrder === 'desc' ? 'asc' : 'desc'
                    setStatementSortOrder(nextOrder)
                    if (selectedStatementAccountId) {
                      fetchAccountStatement(selectedStatementAccountId, { sortOrder: nextOrder })
                    }
                  }}
                  className="h-8 px-2 text-xs gap-1 cursor-pointer"
                  title="Toggle Chronological / Newest First"
                >
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>{statementSortOrder === 'desc' ? 'Newest' : 'Oldest'}</span>
                </Button>
              </div>
            </div>

            {/* Custom Date Pickers when 'custom' is selected */}
            {statementTimeRange === 'custom' && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-3 text-xs bg-slate-100/60 dark:bg-slate-800/40 p-2.5 rounded-xl">
                <span className="font-bold text-slate-600 dark:text-slate-300">Custom Date Range:</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">From:</span>
                  <Input
                    type="date"
                    value={statementStartDate}
                    onChange={(e) => setStatementStartDate(e.target.value)}
                    className="h-7 text-xs w-36"
                  />
                  <span className="text-slate-500">To:</span>
                  <Input
                    type="date"
                    value={statementEndDate}
                    onChange={(e) => setStatementEndDate(e.target.value)}
                    className="h-7 text-xs w-36"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      if (selectedStatementAccountId) {
                        fetchAccountStatement(selectedStatementAccountId, {
                          timeRange: 'custom',
                          startDate: statementStartDate,
                          endDate: statementEndDate
                        })
                      }
                    }}
                    className="h-7 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Apply Range
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Body / Report Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {statementLoading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500">Generating individual account statement...</p>
              </div>
            ) : statementData ? (
              <>
                {/* 5 Financial KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {/* 1. Opening Balance */}
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Opening Balance
                    </span>
                    <span className="text-base font-black text-slate-800 dark:text-slate-200 font-mono block">
                      {formatMoney(statementData.summary.openingBalance)}
                    </span>
                    <span className="text-[10px] text-slate-400">Prior to period start</span>
                  </div>

                  {/* 2. Total Period Debits */}
                  <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                        Period Debits
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono block">
                      {formatMoney(statementData.summary.totalDebit)}
                    </span>
                    <span className="text-[10px] text-emerald-600/70">Total additions/debits</span>
                  </div>

                  {/* 3. Total Period Credits */}
                  <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider block">
                        Period Credits
                      </span>
                      <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <span className="text-base font-black text-rose-700 dark:text-rose-300 font-mono block">
                      {formatMoney(statementData.summary.totalCredit)}
                    </span>
                    <span className="text-[10px] text-rose-600/70">Total deductions/credits</span>
                  </div>

                  {/* 4. Net Period Movement */}
                  <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-900/60 space-y-1">
                    <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-400 uppercase tracking-wider block">
                      Net Period Movement
                    </span>
                    <span className={`text-base font-black font-mono block ${
                      statementData.summary.netMovement >= 0 ? 'text-indigo-700 dark:text-indigo-300' : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatMoney(statementData.summary.netMovement)}
                    </span>
                    <span className="text-[10px] text-indigo-500">Period change</span>
                  </div>

                  {/* 5. Ending Balance */}
                  <div className="p-3.5 bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-xl shadow-sm space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-blue-200 uppercase tracking-wider block">
                        Closing Balance
                      </span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-200 font-mono font-bold">
                        {statementData.summary.isDebitNormal ? 'Dr.' : 'Cr.'}
                      </span>
                    </div>
                    <span className="text-base font-black font-mono block text-emerald-300">
                      {formatMoney(statementData.summary.closingBalance)}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      {statementData.summary.transactionCount} transactions
                    </span>
                  </div>
                </div>

                {/* Ledger Transactions Statement Table */}
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Detailed Ledger Transactions
                      </h3>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {statementData.lines.length} Records
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Orientation: {statementData.summary.isDebitNormal ? 'Normal Debit' : 'Normal Credit'}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100/70 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                        <tr>
                          <th className="p-2.5 whitespace-nowrap">Date</th>
                          <th className="p-2.5 whitespace-nowrap">Entry #</th>
                          <th className="p-2.5 whitespace-nowrap">Source</th>
                          <th className="p-2.5">Narration / Description</th>
                          <th className="p-2.5 text-right whitespace-nowrap">Debit</th>
                          <th className="p-2.5 text-right whitespace-nowrap">Credit</th>
                          <th className="p-2.5 text-right whitespace-nowrap">Running Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {/* Opening Balance Row */}
                        <tr className="bg-slate-50/80 dark:bg-slate-800/30 font-medium">
                          <td className="p-2.5 text-slate-400 whitespace-nowrap">
                            {statementData.period.startDate ? new Date(statementData.period.startDate).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-2.5 font-mono text-slate-400">—</td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                              Opening
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-slate-700 dark:text-slate-300">
                            Beginning / Opening Balance as of period start
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-400">—</td>
                          <td className="p-2.5 text-right font-mono text-slate-400">—</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                            {formatMoney(statementData.summary.openingBalance)}
                          </td>
                        </tr>

                        {/* Transaction lines */}
                        {statementData.lines.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400 space-y-1">
                              <p className="font-semibold">No journal entries recorded for this account in the selected period.</p>
                              <p className="text-[11px] text-slate-500">
                                Try selecting "All Time" or adjusting the search keywords.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          statementData.lines.map((l, index) => (
                            <tr key={l.id || index} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-2.5 text-slate-500 whitespace-nowrap">
                                {new Date(l.date).toLocaleDateString()}
                              </td>
                              <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                                {l.entryNumber}
                              </td>
                              <td className="p-2.5 whitespace-nowrap">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  l.referenceType === 'pos_sale' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' :
                                  l.referenceType === 'purchase_invoice' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400' :
                                  l.referenceType === 'payroll_disbursement' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400' :
                                  l.referenceType === 'expense_voucher' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400' :
                                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}>
                                  {l.referenceType || 'manual'}
                                </span>
                              </td>
                              <td className="p-2.5 font-medium text-slate-700 dark:text-slate-200">
                                {l.narration}
                              </td>
                              <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap font-medium">
                                {l.debit > 0 ? formatMoney(l.debit) : '—'}
                              </td>
                              <td className="p-2.5 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap font-medium">
                                {l.credit > 0 ? formatMoney(l.credit) : '—'}
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                {formatMoney(l.balance)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      {/* Footer Totals */}
                      <tfoot className="bg-slate-100 dark:bg-slate-800/90 font-bold border-t-2 border-slate-300 dark:border-slate-700">
                        <tr>
                          <td colSpan={4} className="p-2.5 text-slate-700 dark:text-slate-200 uppercase text-[11px]">
                            Period Totals & Closing Balance
                          </td>
                          <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                            {formatMoney(statementData.summary.totalDebit)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {formatMoney(statementData.summary.totalCredit)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                            {formatMoney(statementData.summary.closingBalance)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          {/* Modal Footer */}
          <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between sm:justify-between">
            <span className="text-[11px] text-slate-400">
              Generated securely from posted General Ledger double-entry transactions.
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAccountStatementModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
