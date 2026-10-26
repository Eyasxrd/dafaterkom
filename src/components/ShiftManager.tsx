'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/lib/store'
import { useLocale } from 'next-intl'
import { formatCurrency, getCurrencySymbol } from '@/lib/currency'
import { 
  Play, 
  Square, 
  RotateCcw, 
  Clock, 
  Printer, 
  KeyRound, 
  Radio, 
  ShieldCheck, 
  CheckCircle2, 
  Sparkles,
  Delete,
  Timer,
  Coins,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  Users,
  UserCheck,
  AlertTriangle,
  Flame,
  Briefcase,
  DollarSign,
  Coffee,
  ChefHat,
  BadgeAlert,
  CalendarDays,
  Check,
  Search,
  LogOut,
  UserPlus
} from 'lucide-react'

export interface ActiveRosterStaff {
  id: string
  staffId: string
  startTime: string
  endTime?: string | null
  status: string
  startCash: number
  endCash?: number | null
  hasCashDrawer: boolean
  roleInShift?: string | null
  isOvertime: boolean
  overtimeHours?: number
  durationSecs: number
  durationHours: number
  standardHours: number
  notes?: string | null
  staff: {
    id: string
    name: string
    email: string
    role: string
    jobTitle?: string | null
    department?: string | null
    phone?: string | null
    standardDailyHours: number
    hourlyRate: number
    overtimeRate: number
    salaryType: string
    shiftSchedule?: string | null
    totpEnabled: boolean
    requireTotpForShift: boolean
  }
  financials?: {
    totalOrders: number
    cashSales: number
    cardSales: number
    cashInTotal: number
    cashOutTotal: number
    expectedCash: number
  } | null
}

export interface DepartedRosterStaff {
  id: string
  staffId: string
  startTime: string
  endTime: string
  status: string
  startCash: number
  endCash?: number | null
  cashSales: number
  cardSales: number
  totalOrders: number
  hasCashDrawer: boolean
  roleInShift?: string | null
  isOvertime: boolean
  overtimeHours: number
  durationHours: number
  standardHours: number
  notes?: string | null
  staff: {
    id: string
    name: string
    role: string
    jobTitle?: string | null
    department?: string | null
    standardDailyHours: number
    hourlyRate: number
    overtimeRate: number
  }
}

export interface RosterSummary {
  totalActive: number
  activeCashiers: number
  activeFloor: number
  overtimeCount: number
  departedCount: number
}

interface SingleActiveShiftData {
  shift: ActiveRosterStaff | null
  stats: {
    totalOrders: number
    cashSales: number
    cardSales: number
    totalSales: number
    expectedCash: number
    cashInTotal?: number
    cashOutTotal?: number
    pettyCashItems?: Array<{ id: string; type: string; amount: number; reason: string; timestamp: Date }>
  } | null
}

export default function ShiftManager() {
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'
  const { user } = useAuthStore()

  // Primary Tab: 'roster' (Live Floor Board) vs 'cashier' (Cash Registers & Z-Reports)
  const [mainTab, setMainTab] = useState<'roster' | 'cashier'>('roster')

  // Floor Roster Data
  const [rosterStaff, setRosterStaff] = useState<ActiveRosterStaff[]>([])
  const [departedStaff, setDepartedStaff] = useState<DepartedRosterStaff[]>([])
  const [rosterSummary, setRosterSummary] = useState<RosterSummary>({
    totalActive: 0,
    activeCashiers: 0,
    activeFloor: 0,
    overtimeCount: 0,
    departedCount: 0
  })
  const [allTenantStaff, setAllTenantStaff] = useState<any[]>([])

  // Single User Cash Register Shift Data
  const [activeData, setActiveData] = useState<SingleActiveShiftData>({ shift: null, stats: null })
  const [shiftsHistory, setShiftsHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [searchFilter, setSearchFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  // Start Shift / Check-In Modal
  const [isStartShiftOpen, setIsStartShiftOpen] = useState(false)
  const [selectedStaffIdForStart, setSelectedStaffIdForStart] = useState<string>('')
  const [startMethod, setStartMethod] = useState<'code' | 'nfc'>('code')
  const [employeeCode, setEmployeeCode] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [requiresTotp, setRequiresTotp] = useState(false)
  const [hasCashDrawer, setHasCashDrawer] = useState(false)
  const [roleInShift, setRoleInShift] = useState('')
  const [openingFloat, setOpeningFloat] = useState('100.00')
  const [startNotes, setStartNotes] = useState('')
  const [startError, setStartError] = useState<string | null>(null)
  const [nfcScanning, setNfcScanning] = useState(false)
  const [nfcSuccess, setNfcSuccess] = useState<string | null>(null)
  const [totpCountdown, setTotpCountdown] = useState(30)

  // End Shift / Clock Out Modal
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false)
  const [targetShiftToClose, setTargetShiftToClose] = useState<ActiveRosterStaff | null>(null)
  const [closingCash, setClosingCash] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [overtimeReason, setOvertimeReason] = useState('')
  const [zReportData, setZReportData] = useState<any | null>(null)

  // Petty Cash Modal
  const [isPettyCashOpen, setIsPettyCashOpen] = useState(false)
  const [pettyCashType, setPettyCashType] = useState<'cash_in' | 'cash_out'>('cash_out')
  const [pettyCashAmount, setPettyCashAmount] = useState('')
  const [pettyCashReason, setPettyCashReason] = useState('')
  const [pettyCashPaymentMethod, setPettyCashPaymentMethod] = useState<'drawer_cash' | 'card' | 'petty_cash_box'>('drawer_cash')
  const [pettyCashCategory, setPettyCashCategory] = useState('Store Supplies')
  const [pettyCashSubmitting, setPettyCashSubmitting] = useState(false)
  const [pettyCashError, setPettyCashError] = useState<string | null>(null)
  const [targetShiftForPettyCash, setTargetShiftForPettyCash] = useState<ActiveRosterStaff | null>(null)

  // Toast / Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [tenantInfo, setTenantInfo] = useState<any>(null)
  const currencyCode = tenantInfo?.currency || 'USD'
  const currencySymbol = getCurrencySymbol(currencyCode, isAr)
  const formatMoney = (val: number | string | undefined | null) => formatCurrency(val, currencyCode, isAr)

  // 30s rotating timer for TOTP display
  useEffect(() => {
    const updateCountdown = () => {
      const currentSec = Math.floor(Date.now() / 1000) % 30
      setTotpCountdown(30 - currentSec)
    }
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  // Master Data Fetching
  useEffect(() => {
    fetchFloorRoster()
    fetchActiveShift()
    fetchShiftsHistory()
    fetchAllStaff()
    fetch('/api/tenant').then(res => res.json()).then(setTenantInfo).catch(() => {})
  }, [user])

  // Live Timer Ticking: Update active staff durations every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRosterStaff(prevStaff =>
        prevStaff.map(staff => {
          const startMs = new Date(staff.startTime).getTime()
          const durationSecs = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
          const durationHours = Math.round((durationSecs / 3600) * 100) / 100
          const standardHours = staff.staff.standardDailyHours || 8.0
          const isOvertime = durationHours > standardHours
          const overtimeHours = isOvertime ? Math.round((durationHours - standardHours) * 100) / 100 : 0

          return {
            ...staff,
            durationSecs,
            durationHours,
            isOvertime,
            overtimeHours
          }
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchFloorRoster = async () => {
    try {
      const res = await fetch('/api/shifts?mode=roster')
      const data = await res.json()
      if (res.ok) {
        setRosterStaff(data.activeStaff || [])
        setDepartedStaff(data.departedStaff || [])
        setRosterSummary(data.summary || {
          totalActive: 0,
          activeCashiers: 0,
          activeFloor: 0,
          overtimeCount: 0,
          departedCount: 0
        })
      }
    } catch (e) {
      console.error('Failed to fetch roster:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveShift = async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/shifts?staffId=${user.id}&activeOnly=true`)
      const data = await res.json()
      setActiveData(data)
    } catch (e) {
      console.error('Failed to fetch active shift:', e)
    }
  }

  const fetchShiftsHistory = async () => {
    try {
      const res = await fetch('/api/shifts')
      const data = await res.json()
      if (Array.isArray(data)) {
        setShiftsHistory(data)
      }
    } catch (e) {
      console.error('Failed to fetch shifts history:', e)
    }
  }

  const fetchAllStaff = async () => {
    try {
      const res = await fetch('/api/staff')
      const data = await res.json()
      if (Array.isArray(data)) {
        setAllTenantStaff(data.filter((s: any) => s.isActive))
      }
    } catch (e) {
      console.error('Failed to fetch staff:', e)
    }
  }

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleOpenStartShiftModal = (presetStaff?: any) => {
    setStartError(null)
    setNfcSuccess(null)
    setEmployeeCode('')
    setTotpCode('')
    setRequiresTotp(false)
    setStartNotes('')

    const target = presetStaff || user
    if (target) {
      setSelectedStaffIdForStart(target.id)
      const isCashierRole = target.role === 'cashier' || target.jobTitle?.toLowerCase().includes('cashier')
      setHasCashDrawer(isCashierRole)
      setRoleInShift(target.jobTitle || (isCashierRole ? 'Cashier' : target.role === 'kitchen' ? 'Kitchen Chef' : 'Barista / Service'))
    } else {
      setSelectedStaffIdForStart('')
      setHasCashDrawer(false)
      setRoleInShift('Service Staff')
    }

    setIsStartShiftOpen(true)
  }

  const handleStaffSelectChange = (staffId: string) => {
    setSelectedStaffIdForStart(staffId)
    const matched = allTenantStaff.find(s => s.id === staffId)
    if (matched) {
      const isCashier = matched.role === 'cashier' || matched.jobTitle?.toLowerCase().includes('cashier')
      setHasCashDrawer(isCashier)
      setRoleInShift(matched.jobTitle || (isCashier ? 'Cashier' : matched.role === 'kitchen' ? 'Kitchen Chef' : 'Barista / Service'))
    }
  }

  const handleStartShiftSubmit = async (codeToUse?: string) => {
    const code = (codeToUse || employeeCode).trim()
    let staffIdToSubmit = selectedStaffIdForStart || user?.id

    // If no employee code is typed, attempt lookup using selected staff's join code
    if (!code && staffIdToSubmit) {
      const target = allTenantStaff.find(s => s.id === staffIdToSubmit)
      if (target?.joinCode) {
        // Proceed with staff's existing joinCode
      } else {
        setStartError(isAr ? 'يرجى إدخال رمز الموظف (PIN) أو استخدام المسح' : 'Please enter or scan employee PIN code')
        return
      }
    }

    setStartError(null)

    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: staffIdToSubmit,
          employeeCode: code || undefined,
          totpCode: totpCode.trim() || undefined,
          hasCashDrawer,
          roleInShift: roleInShift || 'Staff',
          startCash: hasCashDrawer ? openingFloat : 0,
          notes: startNotes
        })
      })

      const data = await res.json()
      if (res.ok) {
        setIsStartShiftOpen(false)
        setEmployeeCode('')
        setTotpCode('')
        setRequiresTotp(false)
        setStartNotes('')
        setFeedback({ 
          type: 'success', 
          message: isAr 
            ? `تم بدء وردية (${data.staff?.name || 'الموظف'}) بنجاح!` 
            : `Shift started for ${data.staff?.name || 'employee'} successfully!` 
        })
        fetchFloorRoster()
        fetchActiveShift()
        fetchShiftsHistory()
      } else {
        if (data.requiresTotp) {
          setRequiresTotp(true)
        }
        setStartError(data.error || 'Failed to start shift')
      }
    } catch (e: any) {
      setStartError(e.message || 'Failed to start shift')
    }
  }

  const handleOpenCloseShiftModal = (shiftToClose: ActiveRosterStaff) => {
    setTargetShiftToClose(shiftToClose)
    setCloseNotes('')
    setOvertimeReason('')
    if (shiftToClose.hasCashDrawer) {
      const exp = shiftToClose.financials?.expectedCash ?? shiftToClose.startCash
      setClosingCash(exp.toFixed(2))
    } else {
      setClosingCash('0.00')
    }
    setIsCloseShiftOpen(true)
  }

  const handleCloseShiftSubmit = async () => {
    if (!targetShiftToClose) return
    try {
      const res = await fetch('/api/shifts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: targetShiftToClose.id,
          endCash: targetShiftToClose.hasCashDrawer ? closingCash : 0,
          notes: closeNotes,
          overtimeReason: overtimeReason.trim() || undefined
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.zReport) {
          setZReportData(data.zReport)
        }
        setIsCloseShiftOpen(false)
        setTargetShiftToClose(null)
        setClosingCash('')
        setCloseNotes('')
        setOvertimeReason('')
        setFeedback({ 
          type: 'success', 
          message: isAr 
            ? 'تم إنهاء الوردية بنجاح وتسجيل ساعات الحضور والإضافي!' 
            : 'Shift closed successfully! Hours and overtime logged to HR.' 
        })
        fetchFloorRoster()
        fetchActiveShift()
        fetchShiftsHistory()
      } else {
        const err = await res.json()
        setFeedback({ type: 'error', message: err.error || 'Failed to close shift' })
      }
    } catch (e: any) {
      console.error(e)
      setFeedback({ type: 'error', message: e.message || 'Error closing shift' })
    }
  }

  const handlePettyCashSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const shiftTarget = targetShiftForPettyCash || activeData.shift
    if (!shiftTarget) return

    const amountNum = parseFloat(pettyCashAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      setPettyCashError(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر' : 'Please enter a valid amount greater than zero')
      return
    }
    if (!pettyCashReason.trim()) {
      setPettyCashError(isAr ? 'يرجى ذكر سبب الصرف / الإيداع' : 'Please provide a reason or category')
      return
    }

    setPettyCashSubmitting(true)
    setPettyCashError(null)

    try {
      const res = await fetch('/api/shifts/petty-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: shiftTarget.id,
          staffId: shiftTarget.staffId || user?.id,
          type: pettyCashType,
          amount: amountNum,
          reason: pettyCashReason.trim(),
          paymentMethod: pettyCashPaymentMethod,
          category: pettyCashCategory
        })
      })

      const data = await res.json()
      if (res.ok) {
        setIsPettyCashOpen(false)
        setPettyCashAmount('')
        setPettyCashReason('')
        setTargetShiftForPettyCash(null)
        setFeedback({ 
          type: 'success', 
          message: isAr 
            ? `تم تسجيل حركة نقدية بقيمة $${amountNum.toFixed(2)} بنجاح` 
            : `Petty cash movement of $${amountNum.toFixed(2)} recorded.` 
        })
        fetchFloorRoster()
        fetchActiveShift()
      } else {
        setPettyCashError(data.error || 'Failed to record cash movement')
      }
    } catch (err: any) {
      setPettyCashError(err.message || 'Failed to record cash movement')
    } finally {
      setPettyCashSubmitting(false)
    }
  }

  const handleTriggerNFCScan = async () => {
    setNfcScanning(true)
    setStartError(null)
    setNfcSuccess(null)

    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      try {
        const ndef = new (window as any).NDEFReader()
        await ndef.scan()
        ndef.onreading = (event: any) => {
          const serialNumber = event.serialNumber || '100002'
          setNfcSuccess(`NFC Tag Detected (${serialNumber})`)
          setEmployeeCode(serialNumber)
          setNfcScanning(false)
          handleStartShiftSubmit(serialNumber)
        }
        return
      } catch (err: any) {
        console.log('Web NFC error:', err)
      }
    }

    // Simulation fallback
    setTimeout(() => {
      const simulatedBadgeCode = '100002'
      setNfcScanning(false)
      setNfcSuccess(`NFC Badge Scanned: #${simulatedBadgeCode}`)
      setEmployeeCode(simulatedBadgeCode)
    }, 1000)
  }

  // Filter roster staff
  const filteredActiveStaff = rosterStaff.filter(s => {
    const matchesSearch = 
      s.staff.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.staff.jobTitle && s.staff.jobTitle.toLowerCase().includes(searchFilter.toLowerCase())) ||
      (s.roleInShift && s.roleInShift.toLowerCase().includes(searchFilter.toLowerCase()))
    const matchesDept = departmentFilter === 'all' || s.staff.department === departmentFilter
    return matchesSearch && matchesDept
  })

  return (
    <div className="p-3 sm:p-6 space-y-5">
      {/* ========================================================================= */}
      {/* 1. Header & Quick Actions */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-lg">
              <Timer className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {isAr ? 'إدارة الورديات وتواجد فريق العمل' : 'Shift & Live Floor Management'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  {isAr ? 'محدث لحظياً' : 'Live Floor Roster'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr 
                  ? 'متابعة المتواجدين على رأس العمل، ساعات العمل والإضافي، وإدارة عهدة الكاشير وصناديق النقد' 
                  : 'Track who is currently on shift, overtime alerts, cash drawers, and departure times'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => handleOpenStartShiftModal()}
            className="liquid-btn-primary text-xs font-bold gap-1.5 cursor-pointer shadow-md h-10 px-4"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAr ? '+ تسجيل دخول موظف للوردية' : '+ Clock In / Add to Shift'}</span>
          </Button>

          <Button
            onClick={() => {
              fetchFloorRoster()
              fetchActiveShift()
            }}
            variant="outline"
            className="glass-panel text-xs font-bold gap-1.5 cursor-pointer h-10 px-3"
            title="Refresh Live Floor"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isAr ? 'تحديث' : 'Refresh'}</span>
          </Button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-sm ${
          feedback.type === 'success' 
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300' 
            : 'bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
            <span>{feedback.message}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. Top Summary KPI Cards */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="glass-panel p-4 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'على رأس العمل' : 'On Shift Now'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{rosterSummary.totalActive}</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'إجمالي الموظفين المتواجدين' : 'Active team members'}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'كاشير بعهدة نقدية' : 'Cash Drawers'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {rosterSummary.activeCashiers}
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'أدراج كاشير مفتوحة بعهدة' : 'Active registers with float'}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'طاقم المطبخ والخدمة' : 'Floor & Kitchen'}
            </span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
            {rosterSummary.activeFloor}
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'باريستا، شيفات، وخدمة صالة' : 'Working without cash drawer'}
          </span>
        </div>

        <div className={`glass-panel p-4 rounded-3xl border shadow-sm transition-all ${
          rosterSummary.overtimeCount > 0 
            ? 'border-amber-400/60 bg-amber-50/40 dark:bg-amber-950/20' 
            : 'border-slate-200/60 dark:border-white/10'
        }`}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-current text-amber-500 animate-pulse" />
              <span>{isAr ? 'ساعات إضافية' : 'Overtime Alert'}</span>
            </span>
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600">
              <BadgeAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <span>{rosterSummary.overtimeCount}</span>
            {rosterSummary.overtimeCount > 0 && (
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                {isAr ? 'تجاوز الدوام' : 'Exceeded'}
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'تجاوزوا ساعات العمل اليومية' : 'Staff past daily standard hours'}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'انصرفوا اليوم' : 'Left Today'}
            </span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-700 dark:text-slate-300">
            {rosterSummary.departedCount}
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'أنهوا وردياتهم اليوم' : 'Completed shifts today'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Navigation Tabs: Floor Roster vs Cash Registers */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 w-fit">
        <button
          type="button"
          onClick={() => setMainTab('roster')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            mainTab === 'roster'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isAr ? 'لوحة فريق العمل والورديات الحالية' : 'Live Floor & Team Presence'}</span>
          <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 text-[10px] font-black rounded-full">
            {rosterSummary.totalActive}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('cashier')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            mainTab === 'cashier'
              ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>{isAr ? 'درج الكاشير وتقارير Z' : 'Cash Registers & Z-Reports'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE FLOOR & TEAM PRESENCE BOARD */}
      {/* ========================================================================= */}
      {mainTab === 'roster' && (
        <div className="space-y-6">
          {/* Search & Department Filters */}
          <div className="glass-panel p-3.5 rounded-2xl border border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={isAr ? 'بحث بالاسم، المسمى الوظيفي أو الدور...' : 'Search by name, role or job title...'}
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="pl-9 text-xs glass-panel h-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-40 text-xs h-9 glass-panel">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'كل الأقسام' : 'All Departments'}</SelectItem>
                  <SelectItem value="Kitchen">{isAr ? '👨‍🍳 المطبخ' : '👨‍🍳 Kitchen'}</SelectItem>
                  <SelectItem value="Service">{isAr ? '☕ الخدمة / الباريستا' : '☕ Service / Barista'}</SelectItem>
                  <SelectItem value="Cashier">{isAr ? '💵 الكاشير' : '💵 Cashier'}</SelectItem>
                  <SelectItem value="Management">{isAr ? '👔 الإدارة' : '👔 Management'}</SelectItem>
                  <SelectItem value="Operations">{isAr ? '⚙️ العمليات' : '⚙️ Operations'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Shift Cards Grid */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>{isAr ? 'الموظفون على رأس العمل الآن' : 'Active Team Members On Floor'} ({filteredActiveStaff.length})</span>
              </h3>
            </div>

            {filteredActiveStaff.length === 0 ? (
              <Card className="glass-card border border-dashed border-slate-300 dark:border-white/10 p-8 text-center rounded-3xl">
                <div className="max-w-sm mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-2xl glass-pill flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <Clock className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    {isAr ? 'لا يوجد موظفون في الوردية حالياً' : 'No Active Staff On Shift'}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {isAr 
                      ? 'يمكنك تسجيل دخول موظف جديد لبدء تتبع ساعات العمل أو فتح درج الكاشير' 
                      : 'Clock in an employee to start tracking floor presence, duration timers, and cash registers'}
                  </p>
                  <Button onClick={() => handleOpenStartShiftModal()} className="liquid-btn-primary font-bold gap-2 text-xs">
                    <UserPlus className="w-4 h-4" />
                    <span>{isAr ? 'تسجيل دخول موظف الآن' : 'Clock In Employee Now'}</span>
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredActiveStaff.map((item) => {
                  const staff = item.staff
                  const initials = staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

                  return (
                    <div
                      key={item.id}
                      className={`glass-panel p-5 rounded-3xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                        item.isOvertime
                          ? 'border-amber-400/80 bg-gradient-to-b from-amber-50/30 to-transparent dark:from-amber-950/20 shadow-md shadow-amber-500/5'
                          : 'border-slate-200/80 dark:border-white/10 hover:border-blue-400/50 shadow-sm'
                      }`}
                    >
                      {/* Top Row: Avatar, Name, Role & Overtime Badge */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-sm ${
                              item.hasCashDrawer
                                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                                : staff.department === 'Kitchen'
                                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                                : 'bg-gradient-to-tr from-blue-600 to-cyan-500'
                            }`}>
                              {initials}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {staff.name}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {item.roleInShift || staff.jobTitle || staff.role} • <span className="font-semibold text-blue-600 dark:text-blue-400">{staff.department || 'Service'}</span>
                              </p>
                            </div>
                          </div>

                          {/* Overtime Alert Badge */}
                          {item.isOvertime ? (
                            <div className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1 shadow-sm animate-pulse">
                              <Flame className="w-3.5 h-3.5 fill-current" />
                              <span>OT +{item.overtimeHours}h</span>
                            </div>
                          ) : (
                            <div className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                              {isAr ? 'في الدوام' : 'Active'}
                            </div>
                          )}
                        </div>

                        {/* Shift Details & Drawer Status */}
                        <div className="p-3 rounded-2xl bg-white/50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/[0.06] space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">{isAr ? 'نوع الوردية:' : 'Shift Type:'}</span>
                            {item.hasCashDrawer ? (
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>{isAr ? `عهدة درج ($${item.startCash.toFixed(2)})` : `Cash Drawer ($${item.startCash.toFixed(2)})`}</span>
                              </span>
                            ) : (
                              <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                <ChefHat className="w-3.5 h-3.5" />
                                <span>{isAr ? 'طاقم صالة / مطبخ (بدون عهدة)' : 'Floor Duty (No Cash Drawer)'}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">{isAr ? 'وقت الحضور:' : 'Clock In Time:'}</span>
                            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                              {new Date(item.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-medium">{isAr ? 'الدوام اليومي:' : 'Daily Schedule:'}</span>
                            <span className="font-mono text-slate-500">
                              {item.standardHours} {isAr ? 'ساعات قياسية' : 'hrs standard'}
                            </span>
                          </div>

                          {item.financials && (
                            <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 grid grid-cols-2 gap-2 text-center">
                              <div className="p-1.5 rounded-xl bg-slate-100/60 dark:bg-slate-800/40">
                                <span className="text-[10px] text-slate-400 block">{isAr ? 'مبيعات الكاش' : 'Cash Sales'}</span>
                                <span className="font-bold text-emerald-600">+${item.financials.cashSales.toFixed(2)}</span>
                              </div>
                              <div className="p-1.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/40">
                                <span className="text-[10px] text-blue-500 block">{isAr ? 'المتوقع بالدرج' : 'Expected Drawer'}</span>
                                <span className="font-black text-blue-700 dark:text-blue-300">${item.financials.expectedCash.toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Live Duration Ticker */}
                        <div className={`p-2.5 rounded-2xl border flex items-center justify-between ${
                          item.isOvertime
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                            : 'bg-blue-500/5 border-blue-500/15 text-blue-700 dark:text-blue-300'
                        }`}>
                          <div className="flex items-center gap-1.5">
                            <Timer className="w-4 h-4 animate-spin-slow" />
                            <span className="text-[11px] font-bold">
                              {item.isOvertime ? (isAr ? 'تجاوز ساعات العمل (+إضافي)' : 'Overtime Active') : (isAr ? 'مدة الوردية' : 'Shift Duration')}
                            </span>
                          </div>
                          <span className="font-mono font-black text-sm">
                            {formatTimer(item.durationSecs)}
                          </span>
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="pt-4 mt-3 border-t border-slate-200/60 dark:border-white/[0.08] flex items-center gap-2">
                        {item.hasCashDrawer && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTargetShiftForPettyCash(item)
                              setPettyCashType('cash_out')
                              setPettyCashAmount('')
                              setPettyCashReason('')
                              setIsPettyCashOpen(true)
                            }}
                            className="text-xs font-bold glass-panel border-amber-500/30 text-amber-600 dark:text-amber-400 gap-1 h-9 px-3"
                            title="Petty cash in/out"
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>{isAr ? 'نثريات' : 'Petty Cash'}</span>
                          </Button>
                        )}

                        <Button
                          size="sm"
                          onClick={() => handleOpenCloseShiftModal(item)}
                          variant={item.hasCashDrawer ? 'destructive' : 'outline'}
                          className={`flex-1 text-xs font-bold gap-1.5 h-9 ${
                            !item.hasCashDrawer ? 'border-rose-500/40 text-rose-600 hover:bg-rose-500/10' : ''
                          }`}
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                          <span>{isAr ? 'إنهاء الوردية / انصراف' : 'End Shift / Clock Out'}</span>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Departed Today / Shift Completion Roster */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <LogOut className="w-4 h-4 text-slate-500" />
                  <span>{isAr ? 'الموظفون المنصرفون اليوم (سجلات الوردية المكتملة)' : 'Departed Staff Today & Completed Shifts'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAr 
                    ? 'سجل الورديات المنتهية اليوم مع تفاصيل ساعات العمل الفعلية والإضافي' 
                    : 'History of employees who clocked out today with calculated regular and overtime hours'}
                </p>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl">
                {departedStaff.length} {isAr ? 'سجل' : 'completed'}
              </span>
            </div>

            {departedStaff.length === 0 ? (
              <p className="text-slate-400 text-center py-6 text-xs">{isAr ? 'لم ينصرف أي موظف حتى الآن اليوم.' : 'No staff members have clocked out yet today.'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-3">{isAr ? 'الموظف' : 'Staff Member'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'القسم / الدور' : 'Role / Dept'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'نوع الوردية' : 'Type'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'وقت الحضور' : 'Clock In'}</th>
                      <th className="py-2.5 px-3">{isAr ? 'وقت الانصراف' : 'Clock Out'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'إجمالي الساعات' : 'Total Hours'}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? 'الساعات الإضافية' : 'Overtime'}</th>
                      <th className="py-2.5 px-3 text-right">{isAr ? 'المبيعات / الدرج' : 'Cash / Sales'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {departedStaff.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          {row.staff.name}
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {row.roleInShift || row.staff.jobTitle || row.staff.role} • {row.staff.department || 'Service'}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            row.hasCashDrawer ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                          }`}>
                            {row.hasCashDrawer ? (isAr ? 'درج كاشير' : 'Cash Drawer') : (isAr ? 'طاقم صالة' : 'Floor Duty')}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {new Date(row.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {new Date(row.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-mono">
                          {row.durationHours}h
                        </td>
                        <td className="py-3 px-3 text-center">
                          {row.overtimeHours > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              +{row.overtimeHours}h OT
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-medium">
                          {row.hasCashDrawer ? (
                            <span className="text-emerald-600 font-bold">${(row.cashSales + row.cardSales).toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-400">{isAr ? 'بدون عهدة' : 'No drawer'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CASH REGISTERS & Z-REPORTS */}
      {/* ========================================================================= */}
      {mainTab === 'cashier' && (
        <div className="space-y-6">
          {/* Active Cashier Shift Banner for current user */}
          {activeData.shift && activeData.stats ? (
            <Card className="glass-card border border-blue-500/30 dark:border-blue-400/20 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent p-4 border-b border-slate-200/60 dark:border-white/[0.08]">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                          {isAr ? `وردية الكاشير: ${activeData.shift.staff.name}` : `Active Drawer: ${activeData.shift.staff.name}`}
                        </CardTitle>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                          {isAr ? 'درج نشط' : 'Drawer Active'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {isAr ? 'بدأت في ' : 'Started at '}
                        {new Date(activeData.shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        setTargetShiftForPettyCash(activeData.shift)
                        setPettyCashType('cash_out')
                        setPettyCashAmount('')
                        setPettyCashReason('')
                        setIsPettyCashOpen(true)
                      }}
                      variant="outline"
                      className="font-bold gap-1.5 text-xs h-9 px-3 border-amber-500/40 text-amber-600 dark:text-amber-400"
                    >
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>{isAr ? 'نثريات الدرج (+/-)' : 'Petty Cash (+/-)'}</span>
                    </Button>
                    <Button
                      onClick={() => handleOpenCloseShiftModal(activeData.shift!)}
                      variant="destructive"
                      className="font-bold gap-1.5 text-xs h-9 px-4 shadow-md"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>{isAr ? 'إغلاق الوردية وتقرير Z' : 'Close Shift & Z-Report'}</span>
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                  <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{isAr ? 'العهدة الافتتاحية' : 'Opening Float'}</p>
                    <p className="text-lg font-extrabold text-slate-900 dark:text-white mt-1">${activeData.shift.startCash.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">{isAr ? 'مبيعات الكاش' : 'Cash Sales'}</p>
                    <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">+${activeData.stats.cashSales.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
                    <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{isAr ? 'إيداع عهدة' : 'Petty Cash In'}</p>
                    <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400 mt-1">+${(activeData.stats.cashInTotal || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
                    <p className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">{isAr ? 'سحب مصاريف' : 'Petty Cash Out'}</p>
                    <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400 mt-1">-${(activeData.stats.cashOutTotal || 0).toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
                    <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">{isAr ? 'مدفوعات البطاقة' : 'Card / Mobile'}</p>
                    <p className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">${activeData.stats.cardSales.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 dark:border-blue-400/20">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider">{isAr ? 'المتوقع بالدرج' : 'Expected Drawer'}</p>
                    <p className="text-xl font-black text-blue-700 dark:text-blue-200 mt-1">
                      ${activeData.stats.expectedCash.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Petty cash items list */}
                {activeData.stats.pettyCashItems && activeData.stats.pettyCashItems.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.08] space-y-2">
                    <span className="font-bold text-slate-500 uppercase text-[10px] tracking-wider">
                      {isAr ? 'سجل حركات النثريات والمصروفات بالوردية' : 'Shift Petty Cash Log'} ({activeData.stats.pettyCashItems.length})
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {activeData.stats.pettyCashItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-white/40 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.06] text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-[10px] px-2 py-0.5 rounded-full ${item.type === 'cash_in' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                              {item.type === 'cash_in' ? (isAr ? 'إيداع' : 'In') : (isAr ? 'صرف' : 'Out')}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.reason}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className={`font-black ${item.type === 'cash_in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.type === 'cash_in' ? '+' : '-'}${item.amount.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card border border-dashed border-slate-300 dark:border-white/10 p-6 text-center rounded-3xl">
              <div className="max-w-sm mx-auto space-y-3">
                <div className="w-12 h-12 rounded-2xl glass-pill flex items-center justify-center mx-auto text-slate-400">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">{isAr ? 'لا يوجد درج كاشير مفتوح لحسابك' : 'No Open Register Under Your Account'}</h4>
                <p className="text-xs text-slate-400">
                  {isAr ? 'قم ببدء وردية جديدة ككاشير لإدخال العهدة الافتتاحية وإجراء المبيعات' : 'Start a cashier shift to assign an opening float and reconcile cash.'}
                </p>
                <Button onClick={() => handleOpenStartShiftModal()} className="liquid-btn-primary font-bold gap-2 text-xs">
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isAr ? 'فتح درج كاشير الآن' : 'Open Cash Drawer Now'}</span>
                </Button>
              </div>
            </Card>
          )}

          {/* Historical Shifts Table */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-base font-bold">{isAr ? 'سجل الورديات السابقة وتقارير Z' : 'Historical Shift Records & Z-Reports'}</CardTitle>
            </CardHeader>
            <CardContent>
              {shiftsHistory.length === 0 ? (
                <p className="text-slate-400 text-center py-6 text-xs">{isAr ? 'لا توجد سجلات ورديات سابقة.' : 'No recorded shifts found.'}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/50 dark:bg-white/[0.04] border-b border-slate-200/60 dark:border-white/[0.08] uppercase font-semibold text-slate-500">
                      <tr>
                        <th className="p-3">{isAr ? 'الموظف' : 'Staff'}</th>
                        <th className="p-3">{isAr ? 'النوع' : 'Type'}</th>
                        <th className="p-3">{isAr ? 'وقت البدء' : 'Start Time'}</th>
                        <th className="p-3">{isAr ? 'وقت الانتهاء' : 'End Time'}</th>
                        <th className="p-3 text-right">{isAr ? 'العهدة الافتتاحية' : 'Start Float'}</th>
                        <th className="p-3 text-right">{isAr ? 'مبيعات الكاش' : 'Cash Sales'}</th>
                        <th className="p-3 text-right">{isAr ? 'الدرج الفعلي' : 'Counted End'}</th>
                        <th className="p-3 text-right">{isAr ? 'الفارق' : 'Variance'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-white/[0.05]">
                      {shiftsHistory.map((s) => {
                        const expected = s.startCash + s.cashSales
                        const diff = s.endCash !== null && s.endCash !== undefined ? s.endCash - expected : null

                        return (
                          <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                            <td className="p-3 font-semibold">{s.staff.name}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                s.hasCashDrawer ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                              }`}>
                                {s.hasCashDrawer ? (isAr ? 'كاشير' : 'Drawer') : (isAr ? 'صالة' : 'Floor')}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500 dark:text-slate-400">
                              {new Date(s.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                            </td>
                            <td className="p-3 text-slate-500 dark:text-slate-400">
                              {s.endTime ? new Date(s.endTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                            </td>
                            <td className="p-3 text-right">${s.startCash.toFixed(2)}</td>
                            <td className="p-3 text-right font-medium text-emerald-600">${s.cashSales.toFixed(2)}</td>
                            <td className="p-3 text-right font-semibold">
                              {s.endCash !== null && s.endCash !== undefined ? `$${s.endCash.toFixed(2)}` : '—'}
                            </td>
                            <td className="p-3 text-right font-bold">
                              {diff !== null && s.hasCashDrawer ? (
                                <span className={diff === 0 ? 'text-slate-500' : diff > 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                  {diff > 0 ? `+$${diff.toFixed(2)}` : diff < 0 ? `-$${Math.abs(diff).toFixed(2)}` : '$0.00'}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: CLOCK IN / START SHIFT */}
      {/* ========================================================================= */}
      <Dialog open={isStartShiftOpen} onOpenChange={setIsStartShiftOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Timer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{isAr ? 'تسجيل حضور وبدء وردية عمل' : 'Clock In / Start Shift Session'}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {startError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {startError}
              </div>
            )}

            {/* Staff Selector */}
            <div>
              <Label className="text-xs font-semibold">{isAr ? 'الموظف القائم بالوردية' : 'Employee'}</Label>
              <Select value={selectedStaffIdForStart} onValueChange={handleStaffSelectChange}>
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {allTenantStaff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.jobTitle || s.role} - {s.department || 'Service'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role / Duty selection */}
            <div>
              <Label className="text-xs font-semibold">{isAr ? 'المهمة / الدور في هذه الوردية' : 'Role / Duty for this Shift'}</Label>
              <Input
                value={roleInShift}
                onChange={(e) => setRoleInShift(e.target.value)}
                placeholder="e.g. Cashier, Barista, Head Chef, Floor Server"
                className="mt-1 text-xs"
              />
            </div>

            {/* Cash Drawer Toggle Switch */}
            <div className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              hasCashDrawer 
                ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800' 
                : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/10'
            }`} onClick={() => setHasCashDrawer(!hasCashDrawer)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${hasCashDrawer ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      {isAr ? 'هل سيتسلم عهدة درج نقدية؟ (كاشير)' : 'Assign Cash Drawer & Opening Float?'}
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      {hasCashDrawer 
                        ? (isAr ? 'نعم - سيتم طلب إدخال عهدة البداية وإجراء مطابقة Z-Report عند الانصراف' : 'Yes - Requires opening float & Z-Report cash reconciliation')
                        : (isAr ? 'لا - طاقم مطبخ / صالة بدون عهدة نقدية (تتبع ساعات العمل فقط)' : 'No - Floor/Kitchen duty (Tracks presence & work hours without cash)')}
                    </p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  hasCashDrawer ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {hasCashDrawer && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
            </div>

            {/* Opening Float (if has cash drawer) */}
            {hasCashDrawer && (
              <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-emerald-500/20 space-y-1.5">
                <Label className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  {isAr ? 'مبلغ العهدة الافتتاحية ($)' : 'Opening Cash Drawer Float ($)'}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  placeholder="100.00"
                  className="font-bold text-base"
                />
              </div>
            )}

            {/* Verification: PIN or NFC */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.08] space-y-3">
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStartMethod('code')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    startMethod === 'code'
                      ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isAr ? 'كود الموظف (PIN)' : 'Employee PIN'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStartMethod('nfc')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    startMethod === 'nfc'
                      ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مسح بطاقة NFC' : 'NFC Badge Reader'}</span>
                </button>
              </div>

              {startMethod === 'code' ? (
                <div>
                  <Input
                    type="password"
                    inputMode="numeric"
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder={isAr ? 'أدخل كود الموظف السري (6 أرقام)' : 'Enter 6-digit PIN code'}
                    className="font-mono text-center tracking-widest text-lg font-black"
                    maxLength={10}
                  />
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTriggerNFCScan}
                    disabled={nfcScanning}
                    className="w-full text-xs font-semibold gap-1.5"
                  >
                    <Radio className="w-3.5 h-3.5 text-blue-500" />
                    <span>{nfcScanning ? 'Scanning Card...' : 'Simulate Wall Device NFC Tap'}</span>
                  </Button>
                  {nfcSuccess && <p className="text-[11px] text-emerald-600 font-semibold">{nfcSuccess}</p>}
                </div>
              )}
            </div>

            {/* Google Authenticator OTP if required */}
            {requiresTotp && (
              <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-950 dark:text-indigo-200">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Google Authenticator (2FA OTP)</span>
                  </div>
                  <span className="font-mono text-indigo-600">{totpCountdown}s</span>
                </div>
                <Input
                  type="text"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="text-center font-mono text-xl tracking-[0.3em] font-black h-10"
                />
              </div>
            )}

            <div>
              <Label className="text-xs font-semibold">{isAr ? 'ملاحظات (اختياري)' : 'Shift Notes (Optional)'}</Label>
              <Input
                value={startNotes}
                onChange={(e) => setStartNotes(e.target.value)}
                placeholder="e.g. Morning rush support"
                className="mt-1 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsStartShiftOpen(false)} className="flex-1">
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="button"
                onClick={() => handleStartShiftSubmit()}
                className="flex-1 liquid-btn-primary font-bold gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isAr ? 'تأكيد وبدء الوردية' : 'Confirm & Clock In'}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 5. MODAL: END SHIFT / CLOCK OUT */}
      {/* ========================================================================= */}
      <Dialog open={isCloseShiftOpen} onOpenChange={setIsCloseShiftOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <LogOut className="w-5 h-5 text-rose-500" />
              <span>
                {isAr 
                  ? `إنهاء وردية: ${targetShiftToClose?.staff.name}` 
                  : `End Shift: ${targetShiftToClose?.staff.name}`}
              </span>
            </DialogTitle>
          </DialogHeader>

          {targetShiftToClose && (
            <div className="space-y-4 pt-2">
              {/* Duration & Overtime Summary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/60 dark:border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'إجمالي وقت العمل:' : 'Total Duration:'}</span>
                  <span className="font-mono font-bold">{targetShiftToClose.durationHours} hrs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{isAr ? 'الساعات القياسية:' : 'Standard Hours:'}</span>
                  <span className="font-mono">{targetShiftToClose.standardHours} hrs</span>
                </div>
                {targetShiftToClose.isOvertime && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold border-t border-slate-200/40 dark:border-white/5 pt-1">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isAr ? 'ساعات إضافية محتسبة:' : 'Overtime Logged:'}</span>
                    </span>
                    <span className="font-mono">+{targetShiftToClose.overtimeHours} hrs OT</span>
                  </div>
                )}
              </div>

              {/* Cash Reconciliation (Only for Cashier Drawer) */}
              {targetShiftToClose.hasCashDrawer ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200/60 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span>{isAr ? 'العهدة الافتتاحية:' : 'Opening Float:'}</span>
                      <span className="font-semibold">${targetShiftToClose.startCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600">
                      <span>{isAr ? 'مبيعات الكاش بالوردية:' : 'Shift Cash Sales:'}</span>
                      <span className="font-semibold">+${(targetShiftToClose.financials?.cashSales || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1.5 font-bold text-sm text-blue-600 dark:text-blue-400">
                      <span>{isAr ? 'المتوقع بالدرج:' : 'Expected Drawer Total:'}</span>
                      <span>${(targetShiftToClose.financials?.expectedCash || targetShiftToClose.startCash).toFixed(2)}</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">{isAr ? 'المبلغ الفعلي المعدود بالدرج ($)' : 'Actual Cash Drawer Counted ($)'}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={closingCash}
                      onChange={(e) => setClosingCash(e.target.value)}
                      placeholder="0.00"
                      className="mt-1 font-bold text-lg"
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 text-xs text-purple-900 dark:text-purple-300">
                  <p className="font-semibold">{isAr ? 'وردية طاقم صالة / مطبخ بدون عهدة نقدية' : 'Floor / Kitchen duty shift without cash drawer'}</p>
                  <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
                    {isAr 
                      ? 'سيتم تسجيل انصراف الموظف فوراً وتحديث كشف الرواتب وساعات الحضور بالموارد البشرية.' 
                      : 'Clocking out will log work duration & overtime directly to HR payroll timesheets.'}
                  </p>
                </div>
              )}

              {/* Overtime reason if applicable */}
              {targetShiftToClose.isOvertime && (
                <div>
                  <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {isAr ? 'سبب العمل الإضافي (اختياري)' : 'Overtime Reason (Optional)'}
                  </Label>
                  <Input
                    value={overtimeReason}
                    onChange={(e) => setOvertimeReason(e.target.value)}
                    placeholder="e.g. Evening peak rush, late inventory check"
                    className="mt-1 text-xs"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold">{isAr ? 'ملاحظات الإغلاق (اختياري)' : 'Closing Notes (Optional)'}</Label>
                <Input
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Discrepancies, floor handover notes"
                  className="mt-1 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsCloseShiftOpen(false)} className="flex-1">
                  {isAr ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleCloseShiftSubmit} variant="destructive" className="flex-1 font-bold">
                  {isAr ? 'تأكيد وتسجيل الانصراف' : 'Confirm & Clock Out'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 6. MODAL: PETTY CASH IN / OUT */}
      {/* ========================================================================= */}
      <Dialog open={isPettyCashOpen} onOpenChange={setIsPettyCashOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Coins className="w-5 h-5 text-amber-500" />
              <span>{isAr ? 'تسجيل حركة نقدية / نثريات' : 'Petty Cash Movement'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePettyCashSubmit} className="space-y-4 pt-2">
            {pettyCashError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {pettyCashError}
              </div>
            )}

            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => setPettyCashType('cash_out')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  pettyCashType === 'cash_out' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{isAr ? 'سحب مصاريف (Cash Out)' : 'Cash Out (Payout)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setPettyCashType('cash_in')}
                className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  pettyCashType === 'cash_in' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>{isAr ? 'إيداع عهدة (Cash In)' : 'Cash In (Deposit)'}</span>
              </button>
            </div>

            <div>
              <Label className="text-xs font-semibold">{isAr ? 'المبلغ ($)' : 'Amount ($)'}</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                required
                autoFocus
                value={pettyCashAmount}
                onChange={(e) => setPettyCashAmount(e.target.value)}
                placeholder="0.00"
                className="font-bold text-lg mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">{isAr ? 'البيان / السبب' : 'Reason / Purpose'}</Label>
              <Input
                required
                value={pettyCashReason}
                onChange={(e) => setPettyCashReason(e.target.value)}
                placeholder="e.g. Emergency milk, lemons, delivery tip"
                className="mt-1 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-200/60 dark:border-white/[0.08]">
              <Button type="button" variant="outline" onClick={() => setIsPettyCashOpen(false)} className="flex-1">
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                disabled={pettyCashSubmitting}
                className={`flex-1 font-bold ${
                  pettyCashType === 'cash_out' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {pettyCashSubmitting ? 'Saving...' : isAr ? 'حفظ الحركة النقدية' : 'Save Cash Movement'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 7. MODAL: OFFICIAL Z-REPORT */}
      {/* ========================================================================= */}
      <Dialog open={!!zReportData} onOpenChange={(open) => !open && setZReportData(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Receipt className="w-5 h-5 text-emerald-500" />
              <span>{isAr ? 'تقرير إغلاق الوردية المالي (Z-Report)' : 'Shift Z-Report & Audit Closure'}</span>
            </DialogTitle>
          </DialogHeader>

          {zReportData && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 font-mono space-y-2 select-none">
                <div className="text-center border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white uppercase">DAFATERKOM POS</h3>
                  <p className="text-[10px] text-zinc-500">OFFICIAL REGISTER Z-REPORT</p>
                  <p className="text-[10px] text-zinc-400">Shift ID: #{zReportData.shiftId.slice(0, 8)}</p>
                </div>

                <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2">
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span className="font-semibold">{zReportData.staffName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Closed At:</span>
                    <span>{new Date(zReportData.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Orders:</span>
                    <span className="font-bold">{zReportData.totalOrders}</span>
                  </div>
                  {zReportData.overtimeHours > 0 && (
                    <div className="flex justify-between text-amber-600 font-bold">
                      <span>Overtime Logged:</span>
                      <span>+{zReportData.overtimeHours}h OT</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 text-[11px] border-b border-dashed border-zinc-300 dark:border-zinc-700 pb-2">
                  <div className="flex justify-between">
                    <span>Opening Float:</span>
                    <span>${zReportData.startCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Cash Sales:</span>
                    <span>+${zReportData.cashSales.toFixed(2)}</span>
                  </div>
                  {(zReportData.cashInTotal ?? 0) > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Petty Cash In:</span>
                      <span>+${zReportData.cashInTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {(zReportData.cashOutTotal ?? 0) > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Petty Cash Out:</span>
                      <span>-${zReportData.cashOutTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-indigo-600">
                    <span>Card Sales:</span>
                    <span>${zReportData.cardSales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <span>Gross Sales:</span>
                    <span>${zReportData.totalSales.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-1 text-[11px] pt-1">
                  <div className="flex justify-between">
                    <span>Expected Drawer:</span>
                    <span className="font-bold">${zReportData.expectedEndCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Counted Cash:</span>
                    <span className="font-bold">${zReportData.countedEndCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <span>Variance:</span>
                    <span className={
                      zReportData.cashDiscrepancy === 0
                        ? 'text-zinc-600'
                        : zReportData.cashDiscrepancy > 0
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }>
                      {zReportData.cashDiscrepancy > 0
                        ? `+$${zReportData.cashDiscrepancy.toFixed(2)} (Over)`
                        : zReportData.cashDiscrepancy < 0
                        ? `-$${Math.abs(zReportData.cashDiscrepancy).toFixed(2)} (Short)`
                        : '$0.00 (Balanced)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.print()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isAr ? 'طباعة تقرير Z' : 'Print Z-Report'}</span>
                </Button>
                <Button variant="outline" onClick={() => setZReportData(null)}>
                  {isAr ? 'إغلاق' : 'Close'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
