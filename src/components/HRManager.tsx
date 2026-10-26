'use client'

import React, { useState, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import GoogleAuthModal from '@/components/hr/GoogleAuthModal'
import PayslipModal from '@/components/hr/PayslipModal'
import HRReportModal from '@/components/hr/HRReportModal'
import PrintableHRReportDocument, { HRReportConfig } from '@/components/hr/PrintableHRReportDocument'
import { 
  Users, 
  Fingerprint, 
  Clock, 
  DollarSign, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileSpreadsheet, 
  UserCheck, 
  ArrowRight, 
  Briefcase,
  Sliders,
  Sparkles,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  Lock,
  Smartphone,
  CreditCard,
  UserPlus,
  RefreshCw,
  FileText,
  Check,
  ShieldAlert,
  CalendarDays,
  BadgeCheck,
  Flame,
  Download,
  BarChart3,
  PieChart,
  Filter,
  Layers
} from 'lucide-react'

import { Switch } from '@/components/ui/switch'

export interface StaffMember {
  id: string
  name: string
  email?: string | null
  role: string
  canLogin?: boolean
  joinCode?: string | null
  jobTitle?: string | null
  phone?: string | null
  department?: string | null
  hireDate?: string | null
  salaryType: 'monthly' | 'hourly'
  monthlySalary: number
  standardDailyHours: number
  hourlyRate: number
  overtimeRate: number
  shiftSchedule?: string | null
  bankName?: string | null
  bankAccount?: string | null
  nationalId?: string | null
  emergencyContact?: string | null
  totpEnabled: boolean
  totpVerifiedAt?: string | null
  requireTotpForShift: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AttendanceRecord {
  id: string
  staffId: string
  staff: {
    id: string
    name: string
    role: string
    jobTitle?: string | null
    department?: string | null
    standardDailyHours: number
    hourlyRate: number
    overtimeRate: number
    salaryType?: string
    monthlySalary?: number
    totpEnabled?: boolean
  }
  clockIn: string
  clockOut?: string | null
  totalHours?: number | null
  regularHours?: number | null
  overtimeHours?: number | null
  source: string
  status: string
  notes?: string | null
}

export interface TimesheetRow {
  staffId: string
  name: string
  email: string
  phone?: string | null
  role: string
  department: string
  jobTitle: string
  hireDate?: string | null
  salaryType: 'monthly' | 'hourly'
  monthlySalary: number
  standardDailyHours: number
  hourlyRate: number
  effectiveHourlyRate: number
  overtimeRate: number
  shiftSchedule?: string | null
  bankName?: string | null
  bankAccount?: string | null
  nationalId?: string | null
  totpEnabled: boolean
  daysWorked: number
  totalHours: number
  regularHours: number
  overtimeHours: number
  regularPay: number
  overtimePay: number
  totalPay: number
}

export interface PayrollSummary {
  totalStaff: number
  grandTotalHours: number
  grandRegularHours: number
  grandOvertimeHours: number
  grandBasePay: number
  grandOvertimePay: number
  grandTotalPayroll: number
}

export default function HRManager() {
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'

  // Main navigation tabs
  const [activeTab, setActiveTab] = useState<'employees' | 'kiosk' | 'attendance' | 'shifts' | 'payroll' | 'reports'>('employees')
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [payrollData, setPayrollData] = useState<{
    summary: PayrollSummary
    timesheet: TimesheetRow[]
  }>({
    summary: {
      totalStaff: 0,
      grandTotalHours: 0,
      grandRegularHours: 0,
      grandOvertimeHours: 0,
      grandBasePay: 0,
      grandOvertimePay: 0,
      grandTotalPayroll: 0
    },
    timesheet: []
  })
  const [loading, setLoading] = useState(true)
  const [businessName, setBusinessName] = useState('Dafaterkom Restaurant & Cafe POS')

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')

  // HR Reporting Modal & Config State
  const [isHRReportModalOpen, setIsHRReportModalOpen] = useState(false)
  const [reportDatePreset, setReportDatePreset] = useState<string>('month')
  const [reportDepartmentFilter, setReportDepartmentFilter] = useState('all')
  const [reportRoleFilter, setReportRoleFilter] = useState('all')
  const [reportStaffFilter, setReportStaffFilter] = useState('all')
  const [reportTypeFilter, setReportTypeFilter] = useState<'all' | 'payroll' | 'attendance' | 'staff' | 'shifts'>('all')

  // Kiosk Dynamic TOTP Clock-In State
  const [kioskPin, setKioskPin] = useState('')
  const [kioskTotpCode, setKioskTotpCode] = useState('')
  const [kioskTargetStaff, setKioskTargetStaff] = useState<StaffMember | null>(null)
  const [kioskStep, setKioskStep] = useState<'pin' | 'totp'>('pin')
  const [kioskFeedback, setKioskFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isBiometricScanning, setIsBiometricScanning] = useState(false)
  const [totpRemainingSeconds, setTotpRemainingSeconds] = useState(30)

  // Google Authenticator Modal
  const [isGoogleAuthModalOpen, setIsGoogleAuthModalOpen] = useState(false)
  const [selectedStaffFor2FA, setSelectedStaffFor2FA] = useState<StaffMember | null>(null)

  // Payslip Modal
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false)
  const [selectedPayslipRow, setSelectedPayslipRow] = useState<any | null>(null)

  // Add / Edit Staff Modal
  const [isStaffFormModalOpen, setIsStaffFormModalOpen] = useState(false)
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null)
  const [isDeletingStaff, setIsDeletingStaff] = useState(false)
  const [staffFormData, setStaffFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'kitchen',
    canLogin: false,
    jobTitle: '',
    department: 'Service',
    phone: '',
    hireDate: new Date().toISOString().split('T')[0],
    salaryType: 'hourly',
    monthlySalary: '1500',
    standardDailyHours: '8',
    hourlyRate: '15',
    overtimeRate: '22.5',
    shiftSchedule: '09:00 - 17:00 (Day Shift)',
    bankName: '',
    bankAccount: '',
    nationalId: '',
    emergencyContact: '',
    joinCode: '',
    requireTotpForShift: true
  })

  // Manual Attendance Modal
  const [isManualClockModalOpen, setIsManualClockModalOpen] = useState(false)
  const [manualClockForm, setManualClockForm] = useState({
    staffId: '',
    clockInTime: new Date().toISOString().slice(0, 16),
    clockOutTime: '',
    notes: ''
  })

  // Edit Attendance Record Modal
  const [isEditAttendanceOpen, setIsEditAttendanceOpen] = useState(false)
  const [selectedAttendanceForEdit, setSelectedAttendanceForEdit] = useState<AttendanceRecord | null>(null)
  const [editAttendanceForm, setEditAttendanceForm] = useState({
    clockInTime: '',
    clockOutTime: '',
    notes: ''
  })

  // Payroll Date Range Filter
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  const [payrollStartDate, setPayrollStartDate] = useState(firstDay)
  const [payrollEndDate, setPayrollEndDate] = useState(lastDay)

  // Printable HR Report Config
  const [hrReportConfig, setHrReportConfig] = useState<HRReportConfig>({
    mode: 'full',
    startDate: firstDay,
    endDate: lastDay,
    periodLabel: isAr ? 'هذا الشهر' : 'This Month',
    departmentFilter: 'all',
    roleFilter: 'all',
    selectedStaffId: 'all',
    includedSections: {
      overview: true,
      payroll: true,
      attendance: true,
      staff: true,
      shifts: true
    }
  })

  // Rotating TOTP window timer for UI
  useEffect(() => {
    const updateCountdown = () => {
      const currentSec = Math.floor(Date.now() / 1000) % 30
      setTotpRemainingSeconds(30 - currentSec)
    }
    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === 'payroll' || activeTab === 'reports') {
      fetchPayroll()
    }
  }, [activeTab, payrollStartDate, payrollEndDate])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([fetchStaff(), fetchAttendance(), fetchPayroll(), fetchSettings()])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.businessName) setBusinessName(data.businessName)
      }
    } catch (e) {
      // ignore
    }
  }

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff')
      if (res.ok) {
        const data = await res.json()
        setStaffList(data)
      }
    } catch (e) {
      console.error('Failed to fetch staff:', e)
    }
  }

  const fetchAttendance = async () => {
    try {
      const res = await fetch('/api/hr/attendance')
      if (res.ok) {
        const data = await res.json()
        setAttendanceRecords(data)
      }
    } catch (e) {
      console.error('Failed to fetch attendance:', e)
    }
  }

  const fetchPayroll = async () => {
    try {
      const url = `/api/hr/payroll?startDate=${payrollStartDate}&endDate=${payrollEndDate}`
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setPayrollData({
          summary: data.summary,
          timesheet: data.timesheet
        })
      }
    } catch (e) {
      console.error('Failed to fetch payroll:', e)
    }
  }

  // ==========================================
  // CSV Export & Reporting Helpers
  // ==========================================
  const exportToCsv = (filename: string, rows: (string | number)[][]) => {
    const csvContent = '\uFEFF' + rows.map(e => e.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPayrollCSV = (rows = payrollData.timesheet, period = `${payrollStartDate}_to_${payrollEndDate}`) => {
    const csvRows: (string | number)[][] = [
      ['Dafaterkom Cloud POS - Staff Payroll Timesheet Report'],
      ['Business', businessName],
      ['Period', period],
      ['Generated At', new Date().toLocaleString()],
      ['Total Staff', rows.length],
      ['Total Payroll Amount ($)', rows.reduce((s, r) => s + r.totalPay, 0).toFixed(2)],
      [],
      ['Staff ID', 'Name', 'Email', 'Phone', 'Role', 'Department', 'Job Title', 'Plan Type', 'Monthly Salary ($)', 'Standard Daily Hours', 'Hourly Rate ($)', 'Overtime Rate ($)', 'Days Worked', 'Total Hours', 'Regular Hours', 'Overtime Hours', 'Regular Base Pay ($)', 'Overtime Pay ($)', 'Total Gross Pay ($)', 'Bank Name', 'Bank Account', 'National ID']
    ]

    rows.forEach(r => {
      csvRows.push([
        r.staffId,
        r.name,
        r.email || '',
        r.phone || '',
        r.role,
        r.department,
        r.jobTitle,
        r.salaryType,
        r.monthlySalary || 0,
        r.standardDailyHours,
        r.hourlyRate,
        r.overtimeRate,
        r.daysWorked,
        r.totalHours,
        r.regularHours,
        r.overtimeHours,
        r.regularPay.toFixed(2),
        r.overtimePay.toFixed(2),
        r.totalPay.toFixed(2),
        r.bankName || '',
        r.bankAccount || '',
        r.nationalId || ''
      ])
    })

    exportToCsv(`dafaterkom-payroll-report-${period}.csv`, csvRows)
  }

  const handleExportAttendanceCSV = (records = attendanceRecords, period = `${payrollStartDate}_to_${payrollEndDate}`) => {
    const csvRows: (string | number)[][] = [
      ['Dafaterkom Cloud POS - Attendance & Shift Tracking Log'],
      ['Business', businessName],
      ['Period', period],
      ['Generated At', new Date().toLocaleString()],
      ['Total Logs', records.length],
      [],
      ['Record ID', 'Staff Name', 'Department', 'Job Title', 'Shift / Source', 'Clock In Time', 'Clock Out Time', 'Total Hours', 'Regular Hours', 'Overtime Hours', 'Verification Method', 'Status', 'Notes']
    ]

    records.forEach(rec => {
      csvRows.push([
        rec.id,
        rec.staff?.name || 'Unknown',
        rec.staff?.department || 'Service',
        rec.staff?.jobTitle || rec.staff?.role || '',
        rec.source,
        new Date(rec.clockIn).toLocaleString(),
        rec.clockOut ? new Date(rec.clockOut).toLocaleString() : 'Active On Shift',
        rec.totalHours || 0,
        rec.regularHours || 0,
        rec.overtimeHours || 0,
        rec.source === 'google_auth_totp' ? 'Google Authenticator 2FA' : rec.source,
        rec.clockOut ? 'Completed' : 'Active',
        rec.notes || ''
      ])
    })

    exportToCsv(`dafaterkom-attendance-report-${period}.csv`, csvRows)
  }

  const handleExportStaffDirectoryCSV = (staff = staffList) => {
    const csvRows: (string | number)[][] = [
      ['Dafaterkom Cloud POS - Employee Master Directory'],
      ['Business', businessName],
      ['Generated At', new Date().toLocaleString()],
      ['Total Employees', staff.length],
      ['Active Count', staff.filter(s => s.isActive).length],
      [],
      ['Staff ID', 'Full Name', 'Email', 'Phone', 'System Role', 'Department', 'Job Title', 'Hire Date', 'Salary Type', 'Monthly Salary ($)', 'Hourly Rate ($)', 'Overtime Rate ($)', 'Daily Hours', 'Shift Schedule', 'PIN Code', 'Google 2FA Active', 'Bank Name', 'Bank Account', 'National ID', 'Emergency Contact', 'Status']
    ]

    staff.forEach(s => {
      csvRows.push([
        s.id,
        s.name,
        s.email || '',
        s.phone || '',
        s.role,
        s.department || '',
        s.jobTitle || '',
        s.hireDate || '',
        s.salaryType,
        s.monthlySalary || 0,
        s.hourlyRate || 0,
        s.overtimeRate || 0,
        s.standardDailyHours || 8,
        s.shiftSchedule || '',
        s.joinCode || '',
        s.totpEnabled ? 'Yes' : 'No',
        s.bankName || '',
        s.bankAccount || '',
        s.nationalId || '',
        s.emergencyContact || '',
        s.isActive ? 'Active' : 'Inactive'
      ])
    })

    exportToCsv(`dafaterkom-staff-directory.csv`, csvRows)
  }

  const handleExportConfiguredCSV = (config: HRReportConfig) => {
    if (config.mode === 'payroll') {
      const filtered = payrollData.timesheet.filter(r => {
        const deptMatch = config.departmentFilter === 'all' || r.department === config.departmentFilter
        const roleMatch = config.roleFilter === 'all' || r.role === config.roleFilter
        const staffMatch = config.selectedStaffId === 'all' || r.staffId === config.selectedStaffId
        return deptMatch && roleMatch && staffMatch
      })
      handleExportPayrollCSV(filtered, `${config.startDate}_to_${config.endDate}`)
    } else if (config.mode === 'attendance') {
      const filtered = attendanceRecords.filter(rec => {
        const staffMatch = config.selectedStaffId === 'all' || rec.staffId === config.selectedStaffId
        const deptMatch = config.departmentFilter === 'all' || rec.staff?.department === config.departmentFilter
        const roleMatch = config.roleFilter === 'all' || rec.staff?.role === config.roleFilter
        const recDate = new Date(rec.clockIn)
        const sDate = config.startDate ? new Date(config.startDate) : null
        const eDate = config.endDate ? new Date(config.endDate + 'T23:59:59.999Z') : null
        return staffMatch && deptMatch && roleMatch && (!sDate || recDate >= sDate) && (!eDate || recDate <= eDate)
      })
      handleExportAttendanceCSV(filtered, `${config.startDate}_to_${config.endDate}`)
    } else if (config.mode === 'staff') {
      const filtered = staffList.filter(s => {
        const deptMatch = config.departmentFilter === 'all' || s.department === config.departmentFilter
        const roleMatch = config.roleFilter === 'all' || s.role === config.roleFilter
        const staffMatch = config.selectedStaffId === 'all' || s.id === config.selectedStaffId
        return deptMatch && roleMatch && staffMatch
      })
      handleExportStaffDirectoryCSV(filtered)
    } else {
      // Full master export
      handleExportPayrollCSV(payrollData.timesheet, `${config.startDate}_to_${config.endDate}`)
    }
  }

  const handleConfirmPrintReport = (config: HRReportConfig) => {
    setHrReportConfig(config)
    setTimeout(() => {
      window.print()
    }, 150)
  }

  // Handle Opening Add / Edit Staff Modal
  const handleOpenAddStaff = () => {
    setEditingStaffId(null)
    setStaffFormData({
      name: '',
      email: '',
      password: '',
      role: 'kitchen',
      canLogin: false,
      jobTitle: '',
      department: 'Service',
      phone: '',
      hireDate: new Date().toISOString().split('T')[0],
      salaryType: 'hourly',
      monthlySalary: '1500',
      standardDailyHours: '8',
      hourlyRate: '15',
      overtimeRate: '22.5',
      shiftSchedule: '09:00 - 17:00 (Day Shift)',
      bankName: '',
      bankAccount: '',
      nationalId: '',
      emergencyContact: '',
      joinCode: Math.floor(100000 + Math.random() * 900000).toString(),
      requireTotpForShift: false
    })
    setIsStaffFormModalOpen(true)
  }

  const handleOpenEditStaff = (staff: StaffMember) => {
    setEditingStaffId(staff.id)
    setStaffFormData({
      name: staff.name,
      email: staff.email || '',
      password: '',
      role: staff.role,
      canLogin: staff.canLogin !== undefined ? Boolean(staff.canLogin) : true,
      jobTitle: staff.jobTitle || '',
      department: staff.department || 'Service',
      phone: staff.phone || '',
      hireDate: staff.hireDate ? new Date(staff.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      salaryType: staff.salaryType || 'hourly',
      monthlySalary: (staff.monthlySalary || 1500).toString(),
      standardDailyHours: (staff.standardDailyHours || 8).toString(),
      hourlyRate: (staff.hourlyRate || 15).toString(),
      overtimeRate: (staff.overtimeRate || 22.5).toString(),
      shiftSchedule: staff.shiftSchedule || '09:00 - 17:00 (Day Shift)',
      bankName: staff.bankName || '',
      bankAccount: staff.bankAccount || '',
      nationalId: staff.nationalId || '',
      emergencyContact: staff.emergencyContact || '',
      joinCode: staff.joinCode || '',
      requireTotpForShift: Boolean(staff.requireTotpForShift)
    })
    setIsStaffFormModalOpen(true)
  }

  const handleSaveStaffForm = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = {
        name: staffFormData.name,
        email: staffFormData.email || null,
        role: staffFormData.role,
        canLogin: staffFormData.canLogin,
        jobTitle: staffFormData.jobTitle,
        department: staffFormData.department,
        phone: staffFormData.phone,
        hireDate: staffFormData.hireDate,
        salaryType: staffFormData.salaryType,
        monthlySalary: staffFormData.monthlySalary,
        standardDailyHours: staffFormData.standardDailyHours,
        hourlyRate: staffFormData.hourlyRate,
        overtimeRate: staffFormData.overtimeRate,
        shiftSchedule: staffFormData.shiftSchedule,
        bankName: staffFormData.bankName,
        bankAccount: staffFormData.bankAccount,
        nationalId: staffFormData.nationalId,
        emergencyContact: staffFormData.emergencyContact,
        joinCode: staffFormData.joinCode,
        requireTotpForShift: staffFormData.requireTotpForShift
      }

      if (staffFormData.password) {
        payload.password = staffFormData.password
      }

      let res
      if (editingStaffId) {
        res = await fetch(`/api/staff/${editingStaffId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save staff record')
      }

      setIsStaffFormModalOpen(false)
      await fetchStaff()
      await fetchPayroll()
    } catch (err: any) {
      alert(err.message || 'Error saving staff member')
    }
  }

  const handleDeleteStaff = async () => {
    if (!memberToDelete) return
    setIsDeletingStaff(true)
    try {
      const res = await fetch(`/api/staff/${memberToDelete.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to delete staff member')
      }
      setMemberToDelete(null)
      await fetchStaff()
      await fetchPayroll()
    } catch (err: any) {
      alert(err.message || 'Error deleting staff member')
    } finally {
      setIsDeletingStaff(false)
    }
  }

  // Toggle Staff Active Status
  const handleToggleStaffActive = async (staff: StaffMember) => {
    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !staff.isActive })
      })
      if (res.ok) {
        await fetchStaff()
      }
    } catch (e) {
      console.error('Failed to toggle status:', e)
    }
  }

  // Handle Kiosk Clock-In / Out Flow with Google Authenticator
  const handleKioskStartWithPin = async (pinOverride?: string) => {
    const pinToSubmit = pinOverride || kioskPin
    if (!pinToSubmit.trim()) {
      setKioskFeedback({ type: 'error', message: isAr ? 'يرجى إدخال كود الموظف' : 'Please enter employee PIN code' })
      return
    }

    setKioskFeedback(null)
    const matchedStaff = staffList.find(s => s.joinCode === pinToSubmit.trim())
    if (!matchedStaff) {
      setKioskFeedback({ type: 'error', message: isAr ? 'كود الموظف غير صحيح.' : 'Employee PIN code not found.' })
      return
    }

    // Check if staff member already has an active clock-in
    const activeRecord = attendanceRecords.find(r => r.staffId === matchedStaff.id && !r.clockOut)

    if (activeRecord) {
      // Clock out immediately without 2FA
      try {
        const res = await fetch(`/api/hr/attendance/${activeRecord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clockOutTime: new Date().toISOString(),
            notes: 'Clocked out via HR Kiosk'
          })
        })
        if (!res.ok) throw new Error('Failed to clock out')
        const updated = await res.json()
        setKioskFeedback({
          type: 'success',
          message: `👋 Goodbye ${matchedStaff.name}! Shift ended (${updated.totalHours} hrs).`
        })
        setKioskPin('')
        setKioskStep('pin')
        setKioskTargetStaff(null)
        await fetchAttendance()
        await fetchPayroll()
      } catch (e: any) {
        setKioskFeedback({ type: 'error', message: e.message || 'Clock-out failed' })
      }
      return
    }

    // Clock In: If employee has Google Authenticator linked, prompt for dynamic code!
    if (matchedStaff.totpEnabled) {
      setKioskTargetStaff(matchedStaff)
      setKioskStep('totp')
      setKioskTotpCode('')
      setKioskFeedback({
        type: 'success',
        message: isAr ? `مرحباً ${matchedStaff.name}! افتح تطبيق Google Authenticator وأدخل الرمز المتغير المكون من 6 أرقام.` : `Hello ${matchedStaff.name}! Open Google Authenticator and enter your dynamic 6-digit code.`
      })
      return
    }

    // Normal Clock In without 2FA
    await executeClockIn(matchedStaff.id, undefined, isBiometricScanning ? 'biometric' : 'pin')
  }

  const executeClockIn = async (staffId: string, totpCode?: string, source = 'pin') => {
    try {
      const res = await fetch('/api/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          totpCode,
          source,
          notes: 'Clocked in via HR Kiosk'
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to clock in')
      }

      setKioskFeedback({
        type: 'success',
        message: `✨ Welcome ${data.staff?.name}! Clocked in successfully at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      })

      setKioskPin('')
      setKioskTotpCode('')
      setKioskStep('pin')
      setKioskTargetStaff(null)
      await fetchAttendance()
      await fetchPayroll()
    } catch (err: any) {
      setKioskFeedback({ type: 'error', message: err.message || 'Operation failed' })
    }
  }

  // Handle Dynamic TOTP verification submit at Kiosk
  const handleKioskTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!kioskTargetStaff) return
    if (kioskTotpCode.trim().length !== 6) {
      setKioskFeedback({ type: 'error', message: isAr ? 'يرجى إدخال 6 أرقام من Google Authenticator' : 'Enter the 6-digit code from Google Authenticator' })
      return
    }

    await executeClockIn(kioskTargetStaff.id, kioskTotpCode.trim(), 'google_auth_totp')
  }

  // Manual Attendance Record Creation
  const handleManualClockSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/hr/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: manualClockForm.staffId,
          clockInTime: manualClockForm.clockInTime,
          source: 'manual',
          notes: manualClockForm.notes
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to record clock-in')
      }

      const created = await res.json()

      if (manualClockForm.clockOutTime) {
        await fetch(`/api/hr/attendance/${created.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clockOutTime: manualClockForm.clockOutTime,
            notes: manualClockForm.notes
          })
        })
      }

      setIsManualClockModalOpen(false)
      setManualClockForm({
        staffId: '',
        clockInTime: new Date().toISOString().slice(0, 16),
        clockOutTime: '',
        notes: ''
      })
      await fetchAttendance()
      await fetchPayroll()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Update Attendance Record
  const handleUpdateAttendance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAttendanceForEdit) return

    try {
      const res = await fetch(`/api/hr/attendance/${selectedAttendanceForEdit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clockInTime: editAttendanceForm.clockInTime,
          clockOutTime: editAttendanceForm.clockOutTime || null,
          notes: editAttendanceForm.notes
        })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed to update record')
      }

      setIsEditAttendanceOpen(false)
      setSelectedAttendanceForEdit(null)
      await fetchAttendance()
      await fetchPayroll()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Filtered employees list
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.email ? s.email.toLowerCase().includes(searchTerm.toLowerCase()) : false) ||
      (s.jobTitle && s.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.phone && s.phone.includes(searchTerm))

    const matchesDept = departmentFilter === 'all' || s.department === departmentFilter
    const matchesRole = roleFilter === 'all' || s.role === roleFilter

    return matchesSearch && matchesDept && matchesRole
  })

  // Currently Active staff on shift
  const currentlyActiveStaff = attendanceRecords.filter(r => !r.clockOut)
  const totpLinkedCount = staffList.filter(s => s.totpEnabled).length

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. Header & Quick Actions */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white shadow-lg">
              <Fingerprint className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {isAr ? 'نظام الموارد البشرية وشؤون الموظفين' : 'HR & Workforce Management'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {isAr ? 'إدارة متكاملة + 2FA' : 'Full Suite + TOTP 2FA'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr 
                  ? 'إدارة الموظفين، الرواتب الشهرية واليومية، مواعيد وبدء العمل، وتوثيق بصمة Google Authenticator المتغيرة لمنع التسجيل بالنيابة' 
                  : 'Manage employee profiles, hire dates, salaries, shift hours, and dynamic Google Authenticator 2FA clock-in'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            onClick={() => setIsHRReportModalOpen(true)}
            className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span>{isAr ? 'إنشاء وطباعة تقرير' : 'Generate HR Report'}</span>
          </Button>

          <Button
            onClick={handleOpenAddStaff}
            className="liquid-btn-primary text-xs font-bold gap-1.5 cursor-pointer shadow-md"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isAr ? '+ إضافة موظف جديد' : '+ Add Employee'}</span>
          </Button>

          <Button
            onClick={() => setIsManualClockModalOpen(true)}
            variant="outline"
            className="glass-panel text-xs font-bold gap-1.5 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            <span>{isAr ? '+ تسجيل يدوي' : '+ Manual Clock-In'}</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Top Summary KPI Cards */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="glass-panel p-4 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'إجمالي الموظفين' : 'Total Employees'}
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {staffList.length}
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? `${staffList.filter(s => s.isActive).length} موظف نشط حالياً` : `${staffList.filter(s => s.isActive).length} active accounts`}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'على رأس العمل الآن' : 'On Shift Right Now'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span>{currentlyActiveStaff.length}</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              {isAr ? 'مسجل حضور' : 'Active'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'الموظفون في الوردية حالياً' : 'Currently clocked in'}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'حماية Google Auth' : 'Google Auth 2FA'}
            </span>
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-violet-600 dark:text-violet-400 flex items-center gap-2">
            <span>{totpLinkedCount}</span>
            <span className="text-xs font-bold text-slate-400">/ {staffList.length}</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'موظف مربوط برمز الحماية الديناميكي' : 'Linked with dynamic anti-buddy code'}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'إجمالي رواتب الفترة' : 'Period Payroll'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            ${payrollData.summary.grandTotalPayroll.toFixed(2)}
          </div>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'الأساسي + الإضافي المحسوب' : 'Base salaries + Overtime pay'}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. Primary Navigation Tabs */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/10 w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveTab('employees')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'employees'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{isAr ? 'دليل الموظفين والملفات' : 'Employees & Profiles'}</span>
          <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 text-[10px] font-black rounded-full">
            {staffList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kiosk')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'kiosk'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>{isAr ? 'جهاز البصمة وتوثيق Google 2FA' : 'Biometric & TOTP Kiosk'}</span>
          {currentlyActiveStaff.length > 0 && (
            <span className="px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] font-black rounded-full">
              {currentlyActiveStaff.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'attendance'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{isAr ? 'سجلات الحضور والانصراف' : 'Attendance Logs'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'shifts'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>{isAr ? 'مواعيد وورديات العمل' : 'Shift Schedules'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'payroll'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isAr ? 'كشف الرواتب وقسائم الصرف' : 'Payroll & Payslips'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'reports'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/30'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>{isAr ? 'تقارير الموارد البشرية' : 'HR Reports & Analytics'}</span>
          <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[9px] font-black rounded-full uppercase">
            {isAr ? 'معتمد' : 'Reports'}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EMPLOYEES & PROFILES */}
      {/* ========================================================================= */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder={isAr ? 'بحث بالاسم، الإيميل، الهاتف أو المسمى...' : 'Search by name, email, phone or title...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs glass-panel h-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-36 text-xs h-9 glass-panel">
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'كل الأقسام' : 'All Departments'}</SelectItem>
                  <SelectItem value="Kitchen">{isAr ? 'المطبخ' : 'Kitchen'}</SelectItem>
                  <SelectItem value="Service">{isAr ? 'الخدمة / الباريستا' : 'Service / Barista'}</SelectItem>
                  <SelectItem value="Cashier">{isAr ? 'الكاشير' : 'Cashier'}</SelectItem>
                  <SelectItem value="Management">{isAr ? 'الإدارة' : 'Management'}</SelectItem>
                  <SelectItem value="Operations">{isAr ? 'العمليات' : 'Operations'}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32 text-xs h-9 glass-panel">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'كل الأدوار' : 'All Roles'}</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportStaffDirectoryCSV(filteredStaff)}
                className="text-xs h-9 font-bold glass-panel gap-1.5 cursor-pointer"
                title={isAr ? 'تصدير دليل الموظفين إكسل' : 'Export Staff Directory CSV'}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'تصدير Excel' : 'Export CSV'}</span>
              </Button>
            </div>
          </div>

          {/* Employee Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map((staff) => {
              const formattedHireDate = staff.hireDate 
                ? new Date(staff.hireDate).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : (isAr ? 'غير محدد' : 'Not set')

              const isMonthly = staff.salaryType === 'monthly'

              return (
                <div
                  key={staff.id}
                  className={`glass-panel p-5 rounded-3xl border transition-all duration-200 flex flex-col justify-between ${
                    staff.isActive 
                      ? 'border-slate-200/80 dark:border-white/10 hover:border-indigo-400/50' 
                      : 'border-slate-200/40 opacity-60 bg-slate-100/50 dark:bg-slate-900/30'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Top row: Name, Role & 2FA Status */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-base text-slate-900 dark:text-white">
                            {staff.name}
                          </h3>
                          {!staff.isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              {isAr ? 'معطل' : 'Inactive'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {staff.jobTitle || staff.role} • <span className="font-medium text-indigo-600 dark:text-indigo-400">{staff.department || 'Service'}</span>
                        </p>
                      </div>

                      {/* Google Auth Status Badge */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedStaffFor2FA(staff)
                          setIsGoogleAuthModalOpen(true)
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                          staff.totpEnabled
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 hover:bg-amber-100'
                        }`}
                        title="Configure Google Authenticator"
                      >
                        <ShieldCheck className={`w-3.5 h-3.5 ${staff.totpEnabled ? 'text-emerald-600' : 'text-amber-600'}`} />
                        <span>{staff.totpEnabled ? '2FA Active' : (isAr ? 'ربط Google 2FA' : 'Link 2FA')}</span>
                      </button>
                    </div>

                    {/* Meta Information */}
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-1">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate font-mono">{staff.email}</span>
                      </div>

                      {staff.phone && (
                        <div className="flex items-center gap-2 text-slate-500">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-mono">{staff.phone}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isAr ? 'تاريخ البدء والتعيين:' : 'Start Date:'}{' '}
                          <strong className="text-slate-800 dark:text-slate-200">{formattedHireDate}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isAr ? 'الوردية:' : 'Shift:'}{' '}
                          <strong className="text-slate-800 dark:text-slate-200">{staff.shiftSchedule || `${staff.standardDailyHours} hrs/day`}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Salary & Compensation Pill */}
                    <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {isMonthly ? (isAr ? 'الراتب الشهري' : 'Monthly Salary') : (isAr ? 'سعر الساعة' : 'Hourly Rate')}
                        </span>
                        <div className="font-black text-sm text-slate-900 dark:text-white font-mono">
                          {isMonthly ? `$${(staff.monthlySalary || 0).toFixed(2)}/mo` : `$${(staff.hourlyRate || 0).toFixed(2)}/hr`}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-bold">
                          {isAr ? 'سعر الإضافي' : 'Overtime Rate'}
                        </span>
                        <div className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                          ${(staff.overtimeRate || (staff.hourlyRate * 1.5)).toFixed(2)}/hr
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="flex items-center justify-between gap-2 pt-4 mt-2 border-t border-slate-200/60 dark:border-white/10">
                    <div className="text-[11px] font-mono text-slate-400">
                      PIN: <span className="font-black text-slate-700 dark:text-slate-300">{staff.joinCode || '------'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStaffActive(staff)}
                        className="text-xs h-8 px-2 text-slate-500 hover:text-slate-800 cursor-pointer"
                        title={staff.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {staff.isActive ? (isAr ? 'تعطيل' : 'Disable') : (isAr ? 'تفعيل' : 'Enable')}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditStaff(staff)}
                        className="text-xs h-8 px-2.5 font-bold glass-panel gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تعديل' : 'Edit'}</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setMemberToDelete(staff)}
                        className="text-xs h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                        title={isAr ? 'حذف الموظف' : 'Remove Employee'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BIOMETRIC & DYNAMIC TOTP KIOSK */}
      {/* ========================================================================= */}
      {activeTab === 'kiosk' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Biometric & Google Authenticator Terminal */}
          <div className="lg:col-span-6 glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-white/10 flex flex-col justify-between items-center text-center">
            <div className="w-full space-y-4">
              <div className="inline-flex p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 mb-1">
                <Fingerprint className={`w-14 h-14 ${isBiometricScanning ? 'animate-bounce text-indigo-500' : ''}`} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {kioskStep === 'totp' ? (isAr ? 'أدخل رمز Google Authenticator' : 'Google Authenticator 2FA') : (isAr ? 'تسجيل الحضور بالبصمة أو الرمز' : 'Biometric Clock-In / Clock-Out')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {kioskStep === 'totp'
                    ? (isAr ? `الموظف: ${kioskTargetStaff?.name} - الرمز يتغير كل 30 ثانية على هاتفك` : `Employee: ${kioskTargetStaff?.name} - Code rotates every 30s on your phone`)
                    : (isAr ? 'أدخل رمز الموظف أو اضغط على اسمك للتسجيل' : 'Enter 6-digit PIN code or tap an employee to clock in')}
                </p>
              </div>

              {kioskFeedback && (
                <div className={`p-3 rounded-2xl text-xs font-bold border ${
                  kioskFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300'
                }`}>
                  {kioskFeedback.message}
                </div>
              )}

              {/* Step 1: Normal PIN keypad */}
              {kioskStep === 'pin' && (
                <>
                  <div className="max-w-xs mx-auto">
                    <Input
                      type="password"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={kioskPin}
                      onChange={(e) => setKioskPin(e.target.value)}
                      className="text-center font-mono text-2xl tracking-[0.5em] h-12 glass-panel"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-2">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (key === 'C') setKioskPin('')
                          else if (key === 'OK') handleKioskStartWithPin()
                          else if (kioskPin.length < 6) setKioskPin(prev => prev + key)
                        }}
                        className={`h-12 rounded-xl font-black text-sm transition-all cursor-pointer flex items-center justify-center ${
                          key === 'OK'
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                            : key === 'C'
                            ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40'
                            : 'bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 text-slate-800 dark:text-white'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Step 2: Dynamic Google Authenticator Prompt */}
              {kioskStep === 'totp' && (
                <form onSubmit={handleKioskTotpSubmit} className="space-y-4 max-w-xs mx-auto">
                  <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold">{isAr ? 'رمز الحماية المباشر' : 'Live OTP Security'}</span>
                    </div>
                    <div className="flex items-center gap-1 font-mono text-indigo-600 font-bold">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>{totpRemainingSeconds}s</span>
                    </div>
                  </div>

                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    value={kioskTotpCode}
                    onChange={(e) => setKioskTotpCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center font-mono text-3xl tracking-[0.4em] font-black h-14 glass-panel"
                    autoFocus
                  />

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setKioskStep('pin')
                        setKioskPin('')
                        setKioskTargetStaff(null)
                      }}
                      className="w-1/2 text-xs font-bold cursor-pointer"
                    >
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                      type="submit"
                      disabled={kioskTotpCode.trim().length !== 6}
                      className="w-1/2 liquid-btn-primary text-xs font-bold cursor-pointer shadow-md"
                    >
                      {isAr ? 'تحقق ودخول' : 'Verify & Clock In'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Live Clocked-in Staff & Quick Fingerprint Tap */}
          <div className="lg:col-span-6 space-y-4">
            <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-white/10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'على رأس العمل حالياً' : 'Currently Clocked In'} ({currentlyActiveStaff.length})</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">Live Roster</span>
              </div>

              {currentlyActiveStaff.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  {isAr ? 'لا يوجد موظفون مسجل حضورهم حالياً.' : 'No staff members currently clocked in.'}
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {currentlyActiveStaff.map((rec) => {
                    const elapsedMin = Math.floor((new Date().getTime() - new Date(rec.clockIn).getTime()) / (1000 * 60))
                    const elapsedHours = (elapsedMin / 60).toFixed(1)
                    return (
                      <div
                        key={rec.id}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                            <span>{rec.staff?.name}</span>
                            {rec.source === 'google_auth_totp' && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300">
                                2FA Verified
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>In: {new Date(rec.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span className="text-emerald-600 font-bold">{elapsedHours} hrs</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => {
                            if (rec.staff.id) {
                              const staff = staffList.find(s => s.id === rec.staffId)
                              if (staff?.joinCode) handleKioskStartWithPin(staff.joinCode)
                            }
                          }}
                          className="text-[11px] h-7 px-3 bg-rose-500 hover:bg-rose-600 text-white cursor-pointer"
                        >
                          {isAr ? 'تسجيل انصراف' : 'Clock Out'}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Quick Staff Tap */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-white/10">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                {isAr ? 'تسجيل الموظفين السريع' : 'Quick Staff Tap Clock-In'}
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                {isAr 
                  ? 'اضغط على أي موظف للبدء. إذا كان مفعل Google Auth فسيطلب الرمز المباشر من هاتفه.'
                  : 'Tap any employee. If Google Authenticator is enabled, it prompts for their live 2FA code.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {staffList.filter(s => s.isActive).map((s) => {
                  const isActive = currentlyActiveStaff.some(r => r.staffId === s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        if (s.joinCode) handleKioskStartWithPin(s.joinCode)
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-slate-200/80 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <Fingerprint className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <div className="flex items-center gap-1">
                          {s.totpEnabled && <ShieldCheck className="w-3 h-3 text-violet-600" />}
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                        </div>
                      </div>
                      <div className="mt-2 font-bold text-xs truncate text-slate-900 dark:text-white">
                        {s.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {s.jobTitle || s.role}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ATTENDANCE LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'attendance' && (
        <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 border-b border-slate-200/60 dark:border-white/10">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'سجل الحضور والانصراف المفصل والورديات' : 'Detailed Attendance & Shift Logs'}</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr ? 'مربوط مباشرة مع ورديات الكاشير وطاقم الصالة مع احتساب الساعات الإضافية تلقائياً' : 'Synced in real-time with POS shifts, floor presence, and overtime tracking'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportAttendanceCSV()}
                className="text-xs font-bold glass-panel gap-1.5 cursor-pointer h-8"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isAr ? 'تصدير Excel' : 'Export CSV'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHrReportConfig({
                    mode: 'attendance',
                    startDate: payrollStartDate,
                    endDate: payrollEndDate,
                    periodLabel: `${payrollStartDate} to ${payrollEndDate}`,
                    departmentFilter: 'all',
                    roleFilter: 'all',
                    selectedStaffId: 'all',
                    includedSections: {
                      overview: true,
                      payroll: false,
                      attendance: true,
                      staff: false,
                      shifts: false
                    }
                  })
                  setTimeout(() => window.print(), 100)
                }}
                className="text-xs font-bold glass-panel gap-1.5 cursor-pointer h-8"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة السجل' : 'Print Logs'}</span>
              </Button>

              <span className="text-xs text-slate-400 font-mono px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold">
                {attendanceRecords.length} {isAr ? 'سجل' : 'records'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">{isAr ? 'الموظف' : 'Employee'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'نوع التسجيل' : 'Shift / Type'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'وقت الدخول' : 'Clock In'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'وقت الخروج' : 'Clock Out'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'إجمالي الساعات' : 'Total Hours'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'الرسمية' : 'Regular'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'الإضافية' : 'Overtime'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'طريقة التوثيق' : 'Verification'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? 'إجراء' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400">
                      No attendance logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((rec) => {
                    const isDrawerShift = rec.source === 'pos_shift' || rec.source === 'cashier_shift' || rec.notes?.includes('Cash Drawer')
                    const isFloorShift = rec.source === 'floor_shift' || rec.notes?.includes('Floor Duty')
                    const isOvertime = rec.overtimeHours && rec.overtimeHours > 0

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900 dark:text-white">{rec.staff?.name}</div>
                          <div className="text-[10px] text-slate-400">{rec.staff?.jobTitle || rec.staff?.role} • {rec.staff?.department || 'Service'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isDrawerShift 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                              : isFloorShift 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' 
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {isDrawerShift ? (isAr ? '💵 وردية كاشير' : '💵 Cashier Shift') : isFloorShift ? (isAr ? '👨‍🍳 طاقم صالة' : '👨‍🍳 Floor Duty') : rec.source}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {new Date(rec.clockIn).toLocaleDateString()} {new Date(rec.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {rec.clockOut ? (
                            <span>
                              {new Date(rec.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Active On Shift
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-mono">
                          {rec.totalHours ? `${rec.totalHours} hrs` : '-'}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300 font-mono">
                          {rec.regularHours ? `${rec.regularHours} hrs` : '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {isOvertime ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center gap-1 w-fit mx-auto">
                              <Flame className="w-3 h-3 fill-current text-amber-500" />
                              <span>+{rec.overtimeHours} hrs OT</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {rec.source === 'google_auth_totp' ? '🔐 Google 2FA' : rec.source}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            rec.clockOut ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}>
                            {rec.clockOut ? 'Completed' : 'On Shift'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedAttendanceForEdit(rec)
                              setEditAttendanceForm({
                                clockInTime: new Date(rec.clockIn).toISOString().slice(0, 16),
                                clockOutTime: rec.clockOut ? new Date(rec.clockOut).toISOString().slice(0, 16) : '',
                                notes: rec.notes || ''
                              })
                              setIsEditAttendanceOpen(true)
                            }}
                            className="h-7 w-7 p-0 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SHIFT SCHEDULES & WORKING HOURS */}
      {/* ========================================================================= */}
      {activeTab === 'shifts' && (
        <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              {isAr ? 'جدول مواعيد وورديات الموظفين' : 'Staff Shift Schedules & Hours Roster'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isAr 
                ? 'توزيع مواعيد الورديات، ساعات العمل الرسمية اليومية وأسعار الإضافي' 
                : 'Configure standard daily working hours, assigned shift schedules, and overtime rules'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">{isAr ? 'الموظف' : 'Staff Member'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'القسم' : 'Department'}</th>
                  <th className="py-2.5 px-3">{isAr ? 'مواعيد الوردية' : 'Assigned Shift'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'الساعات الرسمية' : 'Daily Hours'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'نوع الراتب' : 'Salary Plan'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'سعر الساعة' : 'Hourly Rate'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'سعر الإضافي' : 'Overtime Rate'}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? 'إجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                      {staff.name}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {staff.department || 'Service'}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                      {staff.shiftSchedule || '09:00 - 17:00'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {staff.standardDailyHours} {isAr ? 'س/يوم' : 'hrs/day'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        staff.salaryType === 'monthly' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {staff.salaryType === 'monthly' ? 'Monthly' : 'Hourly'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                      ${staff.hourlyRate.toFixed(2)}/hr
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-amber-600">
                      ${staff.overtimeRate.toFixed(2)}/hr
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditStaff(staff)}
                        className="text-xs font-bold glass-panel cursor-pointer gap-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تعديل' : 'Edit'}</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PAYROLL & SALARY SLIPS */}
      {/* ========================================================================= */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* Period Selector & Print Whole Sheet */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200/60 dark:border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Label className="text-xs font-bold">{isAr ? 'فترة حساب الرواتب:' : 'Payroll Period:'}</Label>
              <Input
                type="date"
                value={payrollStartDate}
                onChange={(e) => setPayrollStartDate(e.target.value)}
                className="w-36 text-xs h-8 glass-panel"
              />
              <span className="text-xs text-slate-400">to</span>
              <Input
                type="date"
                value={payrollEndDate}
                onChange={(e) => setPayrollEndDate(e.target.value)}
                className="w-36 text-xs h-8 glass-panel"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportPayrollCSV()}
                className="text-xs font-bold glass-panel gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'تصدير Excel' : 'Export CSV'}</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHrReportConfig({
                    mode: 'payroll',
                    startDate: payrollStartDate,
                    endDate: payrollEndDate,
                    periodLabel: `${payrollStartDate} to ${payrollEndDate}`,
                    departmentFilter: 'all',
                    roleFilter: 'all',
                    selectedStaffId: 'all',
                    includedSections: {
                      overview: true,
                      payroll: true,
                      attendance: false,
                      staff: false,
                      shifts: false
                    }
                  })
                  setTimeout(() => window.print(), 100)
                }}
                className="text-xs font-bold glass-panel gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة كامل الكشف' : 'Print Sheet'}</span>
              </Button>
            </div>
          </div>

          {/* Payroll Timesheet Table */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-white/10 space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200/60 dark:border-white/10">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {isAr ? 'كشف رواتب ومستحقات الموظفين' : 'Staff Salary & Payroll Timesheet'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAr 
                    ? 'حساب الرواتب الشهرية والأجور بالساعة مع الساعات الإضافية وقسائم الصرف الفردية' 
                    : 'Calculated from monthly base salary or hourly rates + overtime multiplier'}
                </p>
              </div>

              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  {isAr ? 'إجمالي رواتب الفترة' : 'Total Period Payroll'}
                </div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  ${payrollData.summary.grandTotalPayroll.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">{isAr ? 'اسم الموظف' : 'Staff Name'}</th>
                    <th className="py-2.5 px-3">{isAr ? 'القسم والمسمى' : 'Department'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'النوع' : 'Type'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'أيام العمل' : 'Days'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'إجمالي الساعات' : 'Total Hours'}</th>
                    <th className="py-2.5 px-3 text-right">{isAr ? 'الأساسي ($)' : 'Base Pay'}</th>
                    <th className="py-2.5 px-3 text-right">{isAr ? 'الإضافي ($)' : 'Overtime'}</th>
                    <th className="py-2.5 px-3 text-right font-black">{isAr ? 'صافي الراتب' : 'Net Gross'}</th>
                    <th className="py-2.5 px-3 text-right">{isAr ? 'قسيمة الراتب' : 'Payslip'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {payrollData.timesheet.map((row) => (
                    <tr key={row.staffId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {row.name}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {row.jobTitle} • {row.department}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          row.salaryType === 'monthly' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {row.salaryType === 'monthly' ? 'Monthly' : 'Hourly'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {row.daysWorked} {isAr ? 'يوم' : 'days'}
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {row.totalHours}h{' '}
                        {row.overtimeHours > 0 && (
                          <span className="text-[10px] text-amber-500 font-normal">
                            (+{row.overtimeHours}h OT)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300 font-mono">
                        ${row.regularPay.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-600 font-bold font-mono">
                        {row.overtimePay > 0 ? `+$${row.overtimePay.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-sm text-indigo-600 dark:text-indigo-400 font-mono">
                        ${row.totalPay.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPayslipRow({
                              ...row,
                              periodStartDate: payrollStartDate,
                              periodEndDate: payrollEndDate
                            })
                            setIsPayslipModalOpen(true)
                          }}
                          className="h-7 px-2.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1 cursor-pointer shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{isAr ? 'قسيمة الراتب' : 'Payslip'}</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* TAB 6: HR REPORTS & WORKFORCE ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* Report Controls & Filters Bar */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-3 border-b border-slate-200/60 dark:border-white/10">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {isAr ? 'تقارير الموارد البشرية والرواتب المعتمدة' : 'HR Workforce & Payroll Reports'}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr 
                        ? 'استخراج وطباعة كشوف الرواتب، سجلات الحضور والانصراف، وأداء كادر العمل مباشرة من صفحة الموارد البشرية' 
                        : 'Generate, preview and export official payroll, attendance, and staffing reports directly from HR'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  onClick={() => setIsHRReportModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'معالج التقارير المخصص' : 'Custom Report Wizard'}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    handleExportConfiguredCSV({
                      mode: reportTypeFilter === 'all' ? 'full' : reportTypeFilter,
                      startDate: payrollStartDate,
                      endDate: payrollEndDate,
                      periodLabel: `${payrollStartDate} to ${payrollEndDate}`,
                      departmentFilter: reportDepartmentFilter,
                      roleFilter: reportRoleFilter,
                      selectedStaffId: reportStaffFilter,
                      includedSections: {
                        overview: true,
                        payroll: true,
                        attendance: true,
                        staff: true,
                        shifts: true
                      }
                    })
                  }}
                  className="text-xs font-bold glass-panel gap-1.5 cursor-pointer bg-white dark:bg-zinc-900"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'تصدير إكسل (CSV)' : 'Export to Excel'}</span>
                </Button>

                <Button
                  onClick={() => {
                    handleConfirmPrintReport({
                      mode: reportTypeFilter === 'all' ? 'full' : reportTypeFilter,
                      startDate: payrollStartDate,
                      endDate: payrollEndDate,
                      periodLabel: `${payrollStartDate} to ${payrollEndDate}`,
                      departmentFilter: reportDepartmentFilter,
                      roleFilter: reportRoleFilter,
                      selectedStaffId: reportStaffFilter,
                      includedSections: {
                        overview: true,
                        payroll: true,
                        attendance: true,
                        staff: true,
                        shifts: true
                      }
                    })
                  }}
                  className="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold gap-1.5 cursor-pointer shadow-md"
                >
                  <Printer className="w-4 h-4" />
                  <span>{isAr ? 'طباعة التقرير المعتمد' : 'Print Official Report'}</span>
                </Button>
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {/* Date Presets */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'الفترة الزمنية' : 'Time Period'}
                </Label>
                <div className="flex items-center gap-1 mt-1">
                  <Input
                    type="date"
                    value={payrollStartDate}
                    onChange={(e) => setPayrollStartDate(e.target.value)}
                    className="text-xs h-9 glass-panel font-mono"
                  />
                  <span className="text-xs text-slate-400">-</span>
                  <Input
                    type="date"
                    value={payrollEndDate}
                    onChange={(e) => setPayrollEndDate(e.target.value)}
                    className="text-xs h-9 glass-panel font-mono"
                  />
                </div>
              </div>

              {/* Department Filter */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'القسم' : 'Department'}
                </Label>
                <Select value={reportDepartmentFilter} onValueChange={setReportDepartmentFilter}>
                  <SelectTrigger className="text-xs h-9 mt-1 glass-panel">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? 'كل الأقسام' : 'All Departments'}</SelectItem>
                    <SelectItem value="Kitchen">{isAr ? 'المطبخ' : 'Kitchen'}</SelectItem>
                    <SelectItem value="Service">{isAr ? 'الخدمة / الباريستا' : 'Service / Barista'}</SelectItem>
                    <SelectItem value="Cashier">{isAr ? 'الكاشير' : 'Cashier'}</SelectItem>
                    <SelectItem value="Management">{isAr ? 'الإدارة' : 'Management'}</SelectItem>
                    <SelectItem value="Operations">{isAr ? 'العمليات' : 'Operations'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role Filter */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'الدور الوظيفي' : 'System Role'}
                </Label>
                <Select value={reportRoleFilter} onValueChange={setReportRoleFilter}>
                  <SelectTrigger className="text-xs h-9 mt-1 glass-panel">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? 'كل الأدوار' : 'All Roles'}</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="kitchen">Kitchen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Individual Staff Member */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'الموظف' : 'Specific Employee'}
                </Label>
                <Select value={reportStaffFilter} onValueChange={setReportStaffFilter}>
                  <SelectTrigger className="text-xs h-9 mt-1 glass-panel">
                    <SelectValue placeholder="All Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? 'كافة الموظفين' : 'All Staff'}</SelectItem>
                    {staffList.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} ({s.department || s.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Report Category */}
              <div>
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {isAr ? 'نوع التقرير المعروض' : 'Report View Mode'}
                </Label>
                <Select value={reportTypeFilter} onValueChange={(val: any) => setReportTypeFilter(val)}>
                  <SelectTrigger className="text-xs h-9 mt-1 glass-panel font-bold text-indigo-600 dark:text-indigo-400">
                    <SelectValue placeholder="Report Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? '📑 تقرير شامل مجمع' : '📑 Full Comprehensive'}</SelectItem>
                    <SelectItem value="payroll">{isAr ? '💵 كشف الرواتب والأجور' : '💵 Payroll & Earnings'}</SelectItem>
                    <SelectItem value="attendance">{isAr ? '⏰ سجل الحضور والانصراف' : '⏰ Attendance Logs'}</SelectItem>
                    <SelectItem value="staff">{isAr ? '👥 دليل الموظفين والورديات' : '👥 Staff & Rosters'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Quick KPI Overview Cards */}
          {(() => {
            const filteredTimesheet = payrollData.timesheet.filter((row) => {
              const deptMatch = reportDepartmentFilter === 'all' || row.department === reportDepartmentFilter
              const roleMatch = reportRoleFilter === 'all' || row.role === reportRoleFilter
              const staffMatch = reportStaffFilter === 'all' || row.staffId === reportStaffFilter
              return deptMatch && roleMatch && staffMatch
            })

            const filteredStaffMembers = staffList.filter((s) => {
              const deptMatch = reportDepartmentFilter === 'all' || s.department === reportDepartmentFilter
              const roleMatch = reportRoleFilter === 'all' || s.role === reportRoleFilter
              const staffMatch = reportStaffFilter === 'all' || s.id === reportStaffFilter
              return deptMatch && roleMatch && staffMatch
            })

            const totalPayroll = filteredTimesheet.reduce((sum, r) => sum + r.totalPay, 0)
            const totalRegularPay = filteredTimesheet.reduce((sum, r) => sum + r.regularPay, 0)
            const totalOvertimePay = filteredTimesheet.reduce((sum, r) => sum + r.overtimePay, 0)
            const totalHours = filteredTimesheet.reduce((sum, r) => sum + r.totalHours, 0)
            const totalOvertimeHours = filteredTimesheet.reduce((sum, r) => sum + r.overtimeHours, 0)
            const totpLinked = filteredStaffMembers.filter(s => s.totpEnabled).length

            return (
              <div className="space-y-6">
                {/* 4 Big KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {isAr ? 'إجمالي كادر التقرير' : 'Workforce in Report'}
                      </span>
                      <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600">
                        <Users className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                      {filteredStaffMembers.length} <span className="text-sm font-normal text-slate-400">{isAr ? 'موظف' : 'staff'}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {filteredStaffMembers.filter(s => s.isActive).length} {isAr ? 'نشط' : 'active accounts'}
                    </span>
                  </div>

                  <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {isAr ? 'ساعات العمل المنجزة' : 'Total Tracked Hours'}
                      </span>
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {totalHours.toFixed(1)} <span className="text-sm font-normal">hrs</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {totalOvertimeHours > 0 ? (
                        <span className="text-amber-600 font-bold">+{totalOvertimeHours.toFixed(1)} hrs OT</span>
                      ) : (
                        isAr ? 'لا يوجد ساعات إضافية' : '0 hrs overtime'
                      )}
                    </span>
                  </div>

                  <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {isAr ? 'إجمالي مستحقات الرواتب' : 'Gross Period Payroll'}
                      </span>
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                        <DollarSign className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                      ${totalPayroll.toFixed(2)}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {isAr ? `الأساسي: $${totalRegularPay.toFixed(0)} | الإضافي: $${totalOvertimePay.toFixed(0)}` : `Base: $${totalRegularPay.toFixed(0)} | OT: $${totalOvertimePay.toFixed(0)}`}
                    </span>
                  </div>

                  <div className="glass-panel p-5 rounded-3xl border border-slate-200/60 dark:border-white/10 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {isAr ? 'حماية Google Auth 2FA' : '2FA Compliance'}
                      </span>
                      <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/50 text-violet-600">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-2 text-2xl font-black text-violet-600 dark:text-violet-400">
                      {filteredStaffMembers.length > 0 ? Math.round((totpLinked / filteredStaffMembers.length) * 100) : 100}%
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1">
                      {totpLinked} / {filteredStaffMembers.length} {isAr ? 'موظف مربوط بالتطبيق' : 'members verified'}
                    </span>
                  </div>
                </div>

                {/* Section 1: Detailed Payroll Timesheet Table */}
                {(reportTypeFilter === 'all' || reportTypeFilter === 'payroll') && (
                  <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-white/10 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/60 dark:border-white/10">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-indigo-600" />
                          <span>{isAr ? 'كشف رواتب ومستحقات الفترة المحددة' : 'Period Staff Payroll & Earnings Timesheet'}</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isAr ? `فترة الكشف: ${payrollStartDate} إلى ${payrollEndDate}` : `Calculated period: ${payrollStartDate} to ${payrollEndDate}`}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportPayrollCSV(filteredTimesheet, `${payrollStartDate}_to_${payrollEndDate}`)}
                        className="text-xs font-bold glass-panel gap-1.5 cursor-pointer h-8"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isAr ? 'تصدير إكسل' : 'Export Sheet'}</span>
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">{isAr ? 'اسم الموظف' : 'Staff Name'}</th>
                            <th className="py-2.5 px-3">{isAr ? 'القسم' : 'Department'}</th>
                            <th className="py-2.5 px-3 text-center">{isAr ? 'النوع' : 'Plan'}</th>
                            <th className="py-2.5 px-3 text-center">{isAr ? 'أيام العمل' : 'Days'}</th>
                            <th className="py-2.5 px-3 text-center">{isAr ? 'الساعات' : 'Hours'}</th>
                            <th className="py-2.5 px-3 text-right">{isAr ? 'الأساسي ($)' : 'Base Pay'}</th>
                            <th className="py-2.5 px-3 text-right">{isAr ? 'الإضافي ($)' : 'Overtime'}</th>
                            <th className="py-2.5 px-3 text-right font-black">{isAr ? 'صافي الراتب' : 'Net Total'}</th>
                            <th className="py-2.5 px-3 text-right">{isAr ? 'قسيمة الراتب' : 'Action'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {filteredTimesheet.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="text-center py-6 text-slate-400">
                                {isAr ? 'لا توجد بيانات رواتب مطابقة للتصفية.' : 'No payroll records matching selected filters.'}
                              </td>
                            </tr>
                          ) : (
                            filteredTimesheet.map((row) => (
                              <tr key={row.staffId} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                                <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                                  {row.name}
                                </td>
                                <td className="py-3 px-3 text-slate-500">
                                  {row.jobTitle} • {row.department}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    row.salaryType === 'monthly' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {row.salaryType === 'monthly' ? 'Monthly' : 'Hourly'}
                                  </span>
                                </td>
                                <td className="py-3 px-3 text-center font-mono">
                                  {row.daysWorked} {isAr ? 'يوم' : 'days'}
                                </td>
                                <td className="py-3 px-3 text-center font-bold">
                                  {row.totalHours}h{' '}
                                  {row.overtimeHours > 0 && (
                                    <span className="text-[10px] text-amber-500 font-normal">
                                      (+{row.overtimeHours}h)
                                    </span>
                                  )}
                                </td>
                                <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-300 font-mono">
                                  ${row.regularPay.toFixed(2)}
                                </td>
                                <td className="py-3 px-3 text-right text-amber-600 font-bold font-mono">
                                  {row.overtimePay > 0 ? `+$${row.overtimePay.toFixed(2)}` : '-'}
                                </td>
                                <td className="py-3 px-3 text-right font-black text-sm text-indigo-600 dark:text-indigo-400 font-mono">
                                  ${row.totalPay.toFixed(2)}
                                </td>
                                <td className="py-3 px-3 text-right">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedPayslipRow({
                                        ...row,
                                        periodStartDate: payrollStartDate,
                                        periodEndDate: payrollEndDate
                                      })
                                      setIsPayslipModalOpen(true)
                                    }}
                                    className="h-7 px-2.5 text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1 cursor-pointer shadow-sm"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{isAr ? 'قسيمة' : 'Payslip'}</span>
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                        {filteredTimesheet.length > 0 && (
                          <tfoot>
                            <tr className="border-t-2 border-slate-300 dark:border-white/20 font-black bg-slate-50 dark:bg-white/[0.02]">
                              <td colSpan={3} className="py-3 px-3 uppercase text-slate-900 dark:text-white">
                                {isAr ? 'الإجمالي الكلي' : 'Total'}
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                {filteredTimesheet.reduce((sum, r) => sum + r.daysWorked, 0)}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-bold">
                                {totalHours.toFixed(1)}h
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                                ${totalRegularPay.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-amber-600">
                                ${totalOvertimePay.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-base text-indigo-600 dark:text-indigo-400">
                                ${totalPayroll.toFixed(2)}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        )}
                      </table>
                    </div>
                  </div>
                )}

                {/* Section 2: Attendance Audit Logs */}
                {(reportTypeFilter === 'all' || reportTypeFilter === 'attendance') && (
                  <div className="glass-panel p-6 rounded-3xl border border-slate-200/60 dark:border-white/10 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200/60 dark:border-white/10">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-600" />
                          <span>{isAr ? 'سجل الحضور والانصراف وتوثيق البصمة' : 'Attendance & Time Audit Logs'}</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isAr ? 'بيانات البصمة وتوثيق Google 2FA المعتمدة' : 'Verified clock-ins, duration and overtime splits'}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportAttendanceCSV(attendanceRecords, `${payrollStartDate}_to_${payrollEndDate}`)}
                        className="text-xs font-bold glass-panel gap-1.5 cursor-pointer h-8"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isAr ? 'تصدير إكسل' : 'Export Logs'}</span>
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-white/10 text-slate-500 font-bold uppercase tracking-wider">
                            <th className="py-2.5 px-3">{isAr ? 'الموظف' : 'Staff Member'}</th>
                            <th className="py-2.5 px-3">{isAr ? 'القسم' : 'Dept'}</th>
                            <th className="py-2.5 px-3">{isAr ? 'وقت الدخول' : 'Clock In'}</th>
                            <th className="py-2.5 px-3">{isAr ? 'وقت الخروج' : 'Clock Out'}</th>
                            <th className="py-2.5 px-3 text-center">{isAr ? 'المدة' : 'Duration'}</th>
                            <th className="py-2.5 px-3 text-center">{isAr ? 'الإضافي' : 'Overtime'}</th>
                            <th className="py-2.5 px-3">{isAr ? 'طريقة التوثيق' : 'Verification'}</th>
                            <th className="py-2.5 px-3">{isAr ? 'الحالة' : 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {attendanceRecords.slice(0, 20).map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                              <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{rec.staff?.name}</td>
                              <td className="py-3 px-3 text-slate-500">{rec.staff?.department || 'Service'}</td>
                              <td className="py-3 px-3 font-mono text-[11px]">
                                {new Date(rec.clockIn).toLocaleDateString()} {new Date(rec.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px]">
                                {rec.clockOut ? (
                                  `${new Date(rec.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                ) : (
                                  <span className="text-emerald-600 font-bold">{isAr ? 'على رأس العمل' : 'Active'}</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-center font-mono font-bold">
                                {rec.totalHours ? `${rec.totalHours}h` : '-'}
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                {rec.overtimeHours && rec.overtimeHours > 0 ? (
                                  <span className="text-amber-600 font-bold">+{rec.overtimeHours}h</span>
                                ) : '-'}
                              </td>
                              <td className="py-3 px-3 font-mono text-[10px]">
                                {rec.source === 'google_auth_totp' ? '🔐 Google 2FA' : rec.source}
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  rec.clockOut ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}>
                                  {rec.clockOut ? 'Completed' : 'On Shift'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {/* ========================================================================= */}
      <Dialog open={isStaffFormModalOpen} onOpenChange={setIsStaffFormModalOpen}>
        <DialogContent className="max-w-2xl p-6 glass-panel rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-white">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <span>{editingStaffId ? (isAr ? 'تعديل ملف الموظف' : 'Edit Employee Profile') : (isAr ? 'إضافة موظف جديد' : 'Add New Employee')}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveStaffForm} className="space-y-4 pt-2">
            {/* Row 0: System Login User Account Switch */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/50">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                  {isAr ? 'حساب مستخدم للنظام (دخول الكاشير ولوحة التحكم)' : 'System Login User Account'}
                </Label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'تفعيل فقط إذا كان الموظف يحتاج تسجيل دخول للنظام. للعمال العامين يمكن تركه معطلاً.' : 'Enable only if employee requires login credentials. Leave off for general workers.'}
                </p>
              </div>
              <Switch
                checked={staffFormData.canLogin}
                onCheckedChange={(c: boolean) => setStaffFormData({ ...staffFormData, canLogin: c })}
              />
            </div>

            {/* Row 1: Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? 'اسم الموظف الكامل *' : 'Full Name *'}</Label>
                <Input
                  required
                  placeholder="e.g. Ahmed Ali"
                  value={staffFormData.name}
                  onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">
                  {isAr ? (staffFormData.canLogin ? 'البريد الإلكتروني' : 'البريد الإلكتروني (اختياري)') : (staffFormData.canLogin ? 'Email Address' : 'Email Address (Optional)')}
                </Label>
                <Input
                  type="email"
                  placeholder={staffFormData.canLogin ? "employee@dafaterkom.com (Optional if PIN is set)" : "Optional for non-login workers"}
                  value={staffFormData.email}
                  onChange={(e) => setStaffFormData({ ...staffFormData, email: e.target.value })}
                  className="mt-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Row 2: Role, Department, Job Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{isAr ? 'صلاحية النظام' : 'System Role'}</Label>
                <Select
                  value={staffFormData.role}
                  onValueChange={(val) => setStaffFormData({ ...staffFormData, role: val })}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">{isAr ? 'القسم' : 'Department'}</Label>
                <Select
                  value={staffFormData.department}
                  onValueChange={(val) => setStaffFormData({ ...staffFormData, department: val })}
                >
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Kitchen">Kitchen</SelectItem>
                    <SelectItem value="Service">Service / Barista</SelectItem>
                    <SelectItem value="Cashier">Cashier</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">{isAr ? 'المسمى الوظيفي' : 'Official Job Title'}</Label>
                <Input
                  placeholder="e.g. Head Barista"
                  value={staffFormData.jobTitle}
                  onChange={(e) => setStaffFormData({ ...staffFormData, jobTitle: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            {/* Row 3: Phone, Start Date & PIN */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">{isAr ? 'رقم الهاتف' : 'Phone Number'}</Label>
                <Input
                  placeholder="+966 50 123 4567"
                  value={staffFormData.phone}
                  onChange={(e) => setStaffFormData({ ...staffFormData, phone: e.target.value })}
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs">{isAr ? 'تاريخ التعيين والبدء' : 'Start / Hire Date'}</Label>
                <Input
                  type="date"
                  value={staffFormData.hireDate}
                  onChange={(e) => setStaffFormData({ ...staffFormData, hireDate: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label className="text-xs">{isAr ? 'كود الموظف / تسجيل الحضور (PIN)' : 'Employee Code / PIN'}</Label>
                  <button
                    type="button"
                    onClick={() => setStaffFormData(prev => ({ ...prev, joinCode: Math.floor(100000 + Math.random() * 900000).toString() }))}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {isAr ? 'توليد كود جديد' : 'Generate'}
                  </button>
                </div>
                <Input
                  maxLength={10}
                  value={staffFormData.joinCode}
                  onChange={(e) => setStaffFormData({ ...staffFormData, joinCode: e.target.value })}
                  className="mt-1 text-xs font-mono font-bold"
                  placeholder="6-digit code"
                />
              </div>
            </div>

            {/* Row 4: Salary Type & Rates */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'إعدادات الراتب والبدلات' : 'Compensation & Wage Plan'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-[11px]">{isAr ? 'نوع الراتب' : 'Salary Type'}</Label>
                  <Select
                    value={staffFormData.salaryType}
                    onValueChange={(val) => setStaffFormData({ ...staffFormData, salaryType: val })}
                  >
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">{isAr ? 'أجر بالساعة' : 'Hourly Wage'}</SelectItem>
                      <SelectItem value="monthly">{isAr ? 'راتب شهري ثابت' : 'Monthly Fixed'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {staffFormData.salaryType === 'monthly' ? (
                  <div>
                    <Label className="text-[11px]">{isAr ? 'الراتب الشهري ($)' : 'Monthly Salary ($)'}</Label>
                    <Input
                      type="number"
                      step="1"
                      value={staffFormData.monthlySalary}
                      onChange={(e) => setStaffFormData({ ...staffFormData, monthlySalary: e.target.value })}
                      className="mt-1 text-xs font-bold"
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-[11px]">{isAr ? 'سعر الساعة ($/س)' : 'Base Hourly Rate ($)'}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={staffFormData.hourlyRate}
                      onChange={(e) => setStaffFormData({ ...staffFormData, hourlyRate: e.target.value })}
                      className="mt-1 text-xs font-bold"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-[11px]">{isAr ? 'سعر الساعة الإضافية ($)' : 'Overtime Rate ($)'}</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={staffFormData.overtimeRate}
                    onChange={(e) => setStaffFormData({ ...staffFormData, overtimeRate: e.target.value })}
                    className="mt-1 text-xs font-bold text-amber-600"
                  />
                </div>

                <div>
                  <Label className="text-[11px]">{isAr ? 'ساعات العمل اليومية' : 'Daily Hours'}</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={staffFormData.standardDailyHours}
                    onChange={(e) => setStaffFormData({ ...staffFormData, standardDailyHours: e.target.value })}
                    className="mt-1 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[11px]">{isAr ? 'مواعيد الوردية الرسمية' : 'Assigned Shift Schedule'}</Label>
                <Input
                  placeholder="e.g. 08:00 - 16:00 (Morning Shift)"
                  value={staffFormData.shiftSchedule}
                  onChange={(e) => setStaffFormData({ ...staffFormData, shiftSchedule: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            {/* Row 5: Bank Details & Emergency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? 'اسم البنك ورقم الحساب / IBAN' : 'Bank Account / IBAN'}</Label>
                <Input
                  placeholder="e.g. AlRajhi - SA1280000..."
                  value={staffFormData.bankAccount}
                  onChange={(e) => setStaffFormData({ ...staffFormData, bankAccount: e.target.value })}
                  className="mt-1 text-xs font-mono"
                />
              </div>

              <div>
                <Label className="text-xs">{isAr ? 'رقم الهوية الوطنية / الإقامة' : 'National ID / Residency'}</Label>
                <Input
                  placeholder="e.g. 1029384756"
                  value={staffFormData.nationalId}
                  onChange={(e) => setStaffFormData({ ...staffFormData, nationalId: e.target.value })}
                  className="mt-1 text-xs font-mono"
                />
              </div>
            </div>

            {/* Row 6: Password Configuration (Creation & Admin Reset) */}
            {staffFormData.canLogin && (
              <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                editingStaffId 
                  ? 'bg-amber-500/10 border-amber-500/20' 
                  : 'bg-blue-500/10 border-blue-500/20'
              }`}>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {editingStaffId 
                      ? (isAr ? 'تغيير كلمة المرور للموظف (اختياري)' : 'Change Employee Password (Optional)')
                      : (isAr ? 'تعيين كلمة المرور لتسجيل الدخول *' : 'Set Initial Login Password *')}
                  </span>
                </div>
                <Input
                  type="password"
                  required={!editingStaffId && staffFormData.canLogin}
                  placeholder={
                    editingStaffId
                      ? (isAr ? 'اتركه فارغاً للإبقاء على الحالية أو أدخل كلمة سر جديدة' : 'Leave blank to keep unchanged, or enter new password')
                      : (isAr ? 'أدخل كلمة المرور الأولية' : 'Enter initial password')
                  }
                  value={staffFormData.password}
                  onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                  className="mt-1 text-xs bg-white dark:bg-slate-900"
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {editingStaffId 
                    ? (isAr ? 'يمكن للمدير تعيين كلمة مرور جديدة للموظف مباشرة في أي وقت.' : 'Admin can directly change or reset the password for this staff member.')
                    : (isAr ? 'يمكن للموظف تسجيل الدخول مباشرة باستخدام كود الموظف وكلمة المرور هذه.' : 'Employee can sign in directly using their Employee Code and this password.')}
                </p>
              </div>
            )}

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStaffFormModalOpen(false)}
                className="text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" className="liquid-btn-primary text-xs font-bold shadow-md">
                {editingStaffId ? (isAr ? 'حفظ التعديلات' : 'Save Changes') : (isAr ? 'إضافة الموظف' : 'Create Employee')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: MANUAL ATTENDANCE ENTRY */}
      {/* ========================================================================= */}
      <Dialog open={isManualClockModalOpen} onOpenChange={setIsManualClockModalOpen}>
        <DialogContent className="max-w-md p-6 glass-panel rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span>{isAr ? 'تسجيل حضور يدوي للموظف' : 'Manual Attendance Entry'}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleManualClockSubmit} className="space-y-3.5 pt-2">
            <div>
              <Label className="text-xs">{isAr ? 'الموظف *' : 'Employee *'}</Label>
              <Select
                value={manualClockForm.staffId}
                onValueChange={(val) => setManualClockForm({ ...manualClockForm, staffId: val })}
              >
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue placeholder="Select staff..." />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.department || s.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isAr ? 'وقت الدخول *' : 'Clock In Time *'}</Label>
                <Input
                  type="datetime-local"
                  required
                  value={manualClockForm.clockInTime}
                  onChange={(e) => setManualClockForm({ ...manualClockForm, clockInTime: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">{isAr ? 'وقت الخروج (اختياري)' : 'Clock Out Time'}</Label>
                <Input
                  type="datetime-local"
                  value={manualClockForm.clockOutTime}
                  onChange={(e) => setManualClockForm({ ...manualClockForm, clockOutTime: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">{isAr ? 'ملاحظات الإدارة' : 'Manager Notes'}</Label>
              <Input
                placeholder="e.g. Approved adjustment"
                value={manualClockForm.notes}
                onChange={(e) => setManualClockForm({ ...manualClockForm, notes: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsManualClockModalOpen(false)}
                className="text-xs"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" className="liquid-btn-primary text-xs font-bold">
                {isAr ? 'تسجيل الحضور' : 'Record Entry'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: EDIT ATTENDANCE RECORD */}
      {/* ========================================================================= */}
      <Dialog open={isEditAttendanceOpen} onOpenChange={setIsEditAttendanceOpen}>
        <DialogContent className="max-w-md p-6 glass-panel rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black text-slate-900 dark:text-white">
              <Edit className="w-5 h-5 text-indigo-600" />
              <span>Edit Attendance: {selectedAttendanceForEdit?.staff.name}</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleUpdateAttendance} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Clock In Time</Label>
                <Input
                  type="datetime-local"
                  required
                  value={editAttendanceForm.clockInTime}
                  onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, clockInTime: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Clock Out Time</Label>
                <Input
                  type="datetime-local"
                  value={editAttendanceForm.clockOutTime}
                  onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, clockOutTime: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Input
                placeholder="Correction notes"
                value={editAttendanceForm.notes}
                onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, notes: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditAttendanceOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" className="liquid-btn-primary text-xs font-bold">
                Update Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: GOOGLE AUTHENTICATOR SETUP */}
      {/* ========================================================================= */}
      {selectedStaffFor2FA && (
        <GoogleAuthModal
          isOpen={isGoogleAuthModalOpen}
          onClose={() => {
            setIsGoogleAuthModalOpen(false)
            setSelectedStaffFor2FA(null)
          }}
          staffId={selectedStaffFor2FA.id}
          staffName={selectedStaffFor2FA.name}
          staffEmail={selectedStaffFor2FA.email || undefined}
          isAlreadyLinked={selectedStaffFor2FA.totpEnabled}
          onSuccess={() => {
            fetchStaff()
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: PAYSLIP SALARY SLIP */}
      {/* ========================================================================= */}
      {selectedPayslipRow && (
        <PayslipModal
          isOpen={isPayslipModalOpen}
          onClose={() => {
            setIsPayslipModalOpen(false)
            setSelectedPayslipRow(null)
          }}
          data={selectedPayslipRow}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE / REMOVE STAFF CONFIRMATION */}
      {/* ========================================================================= */}
      <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              <span>{isAr ? 'تأكيد حذف الموظف نهائياً' : 'Remove Staff Member'}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <p>
              {isAr
                ? `هل أنت متأكد من حذف الموظف "${memberToDelete?.name}" (${memberToDelete?.jobTitle || memberToDelete?.role}) نهائياً؟`
                : `Are you sure you want to delete "${memberToDelete?.name}" (${memberToDelete?.jobTitle || memberToDelete?.role})?`}
            </p>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? 'سيتم حذف حساب وبيانات الموظف من النظام.'
                : 'This action will permanently delete this employee record and credentials.'}
            </p>
          </div>
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMemberToDelete(null)}
              disabled={isDeletingStaff}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeleteStaff}
              disabled={isDeletingStaff}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isDeletingStaff ? (isAr ? 'جاري الحذف...' : 'Deleting...') : (isAr ? 'نعم، احذف الموظف' : 'Yes, Delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: HR REPORT BUILDER & EXPORTER */}
      {/* ========================================================================= */}
      <HRReportModal
        isOpen={isHRReportModalOpen}
        onClose={() => setIsHRReportModalOpen(false)}
        staffList={staffList}
        attendanceRecords={attendanceRecords}
        payrollData={payrollData}
        businessName={businessName}
        locale={locale}
        onConfirmPrint={handleConfirmPrintReport}
        onExportCSV={handleExportConfiguredCSV}
      />

      {/* ========================================================================= */}
      {/* PRINTABLE DOCUMENT: OFFICIAL HR REPORT (Hidden on screen, active on print) */}
      {/* ========================================================================= */}
      <PrintableHRReportDocument
        businessName={businessName}
        config={hrReportConfig}
        staffList={staffList}
        attendanceRecords={attendanceRecords}
        payrollData={payrollData}
        locale={locale}
        generatedBy={isAr ? 'إدارة الموارد البشرية' : 'HR Department'}
      />
    </div>
  )
}
