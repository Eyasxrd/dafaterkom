'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Printer, 
  FileSpreadsheet, 
  FileText, 
  Layers, 
  DollarSign, 
  Clock, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Filter,
  Download,
  CalendarDays,
  Sparkles
} from 'lucide-react'
import { StaffMember, AttendanceRecord, TimesheetRow, PayrollSummary } from '@/components/HRManager'
import { HRReportConfig } from './PrintableHRReportDocument'

interface HRReportModalProps {
  isOpen: boolean
  onClose: () => void
  staffList: StaffMember[]
  attendanceRecords: AttendanceRecord[]
  payrollData: {
    summary: PayrollSummary
    timesheet: TimesheetRow[]
  }
  businessName?: string
  currency?: string
  locale?: string
  onConfirmPrint: (config: HRReportConfig) => void
  onExportCSV: (config: HRReportConfig) => void
}

export default function HRReportModal({
  isOpen,
  onClose,
  staffList,
  attendanceRecords,
  payrollData,
  businessName = 'Dafaterkom Restaurant & Cafe',
  currency = '$',
  locale = 'en',
  onConfirmPrint,
  onExportCSV
}: HRReportModalProps) {
  const isAr = locale === 'ar'

  // Default dates
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [mode, setMode] = useState<'full' | 'payroll' | 'attendance' | 'staff' | 'shifts'>('full')
  const [datePreset, setDatePreset] = useState<string>('month')
  const [startDate, setStartDate] = useState(firstDay)
  const [endDate, setEndDate] = useState(lastDay)
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedStaffId, setSelectedStaffId] = useState('all')

  const [sections, setSections] = useState({
    overview: true,
    payroll: true,
    attendance: true,
    staff: true,
    shifts: true
  })

  // Preset Date Handlers
  const handlePresetChange = (preset: string) => {
    setDatePreset(preset)
    const today = new Date()

    if (preset === 'today') {
      const d = today.toISOString().split('T')[0]
      setStartDate(d)
      setEndDate(d)
    } else if (preset === 'yesterday') {
      const y = new Date(today)
      y.setDate(y.getDate() - 1)
      const d = y.toISOString().split('T')[0]
      setStartDate(d)
      setEndDate(d)
    } else if (preset === 'week') {
      const w = new Date(today)
      w.setDate(w.getDate() - 7)
      setStartDate(w.toISOString().split('T')[0])
      setEndDate(today.toISOString().split('T')[0])
    } else if (preset === 'month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
      setStartDate(start)
      setEndDate(end)
    } else if (preset === 'last_month') {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
      const end = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]
      setStartDate(start)
      setEndDate(end)
    }
  }

  const getPeriodLabel = () => {
    if (datePreset === 'today') return isAr ? 'اليوم' : 'Today'
    if (datePreset === 'yesterday') return isAr ? 'أمس' : 'Yesterday'
    if (datePreset === 'week') return isAr ? 'آخر 7 أيام' : 'Last 7 Days'
    if (datePreset === 'month') return isAr ? 'هذا الشهر' : 'This Month'
    if (datePreset === 'last_month') return isAr ? 'الشهر الماضي' : 'Last Month'
    return `${startDate} - ${endDate}`
  }

  const buildConfig = (): HRReportConfig => ({
    mode,
    startDate,
    endDate,
    periodLabel: getPeriodLabel(),
    departmentFilter,
    roleFilter,
    selectedStaffId,
    includedSections: sections
  })

  // Quick Filtered Preview Metrics
  const filteredStaffCount = staffList.filter((s) => {
    const deptMatch = departmentFilter === 'all' || s.department === departmentFilter
    const roleMatch = roleFilter === 'all' || s.role === roleFilter
    const staffMatch = selectedStaffId === 'all' || s.id === selectedStaffId
    return deptMatch && roleMatch && staffMatch
  }).length

  const filteredTimesheet = payrollData.timesheet.filter((row) => {
    const deptMatch = departmentFilter === 'all' || row.department === departmentFilter
    const roleMatch = roleFilter === 'all' || row.role === roleFilter
    const staffMatch = selectedStaffId === 'all' || row.staffId === selectedStaffId
    return deptMatch && roleMatch && staffMatch
  })

  const previewPayrollTotal = filteredTimesheet.reduce((sum, r) => sum + r.totalPay, 0)
  const previewHoursTotal = filteredTimesheet.reduce((sum, r) => sum + r.totalHours, 0)

  const handlePrintClick = () => {
    onConfirmPrint(buildConfig())
    onClose()
  }

  const handleExportClick = () => {
    onExportCSV(buildConfig())
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 p-6 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <DialogTitle className="flex items-center gap-3 text-lg font-black tracking-tight text-slate-900 dark:text-white">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span>{isAr ? 'إنشاء وطباعة تقرير الموارد البشرية والرواتب' : 'Generate & Print HR & Payroll Report'}</span>
              <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr 
                  ? 'استخراج تقارير الحضور والرواتب والورديات مباشرة مع كشوف معتمدة للطباعة والتصدير' 
                  : 'Generate comprehensive workforce, attendance, and payroll reports with print & CSV exports'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-3">
          {/* 1. Report Scope / Mode Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              {isAr ? 'نوع ونطاق التقرير:' : 'Select Report Scope:'}
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMode('full')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  mode === 'full'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? 'تقرير شامل معتمد' : 'Full HR Master'}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'الملخص + الرواتب + الحضور + الكادر' : 'Summary, Payroll, Attendance & Staff'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('payroll')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  mode === 'payroll'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <DollarSign className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? 'كشف الرواتب والأجور' : 'Payroll & Earnings'}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'الأساسي والإضافي ومستحقات الفترة' : 'Base salary, OT & net payout'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('attendance')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  mode === 'attendance'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? 'سجل الحضور والورديات' : 'Attendance Logs'}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'ساعات الحضور وتوثيق 2FA' : 'Clock in/out & 2FA stamps'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('staff')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  mode === 'staff'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? 'دليل الموظفين' : 'Staff Directory'}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'الملفات الشخصية والمسميات' : 'Employee records & titles'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode('shifts')}
                className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  mode === 'shifts'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 shadow-sm ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <CalendarDays className="w-4 h-4 text-indigo-600" />
                  <span>{isAr ? 'مواعيد الورديات' : 'Shift Schedules'}</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'توزيع الورديات والساعات الرسمية' : 'Scheduled hours & rosters'}
                </span>
              </button>
            </div>
          </div>

          {/* 2. Date Range Filters */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>{isAr ? 'الفترة الزمنية:' : 'Time Period:'}</span>
              </Label>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'today', label: isAr ? 'اليوم' : 'Today' },
                  { id: 'yesterday', label: isAr ? 'أمس' : 'Yesterday' },
                  { id: 'week', label: isAr ? 'أسبوع' : '7 Days' },
                  { id: 'month', label: isAr ? 'هذا الشهر' : 'This Month' },
                  { id: 'last_month', label: isAr ? 'الشهر الماضي' : 'Last Month' },
                  { id: 'custom', label: isAr ? 'مخصص' : 'Custom' }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePresetChange(p.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      datePreset === p.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-zinc-700 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-[11px] text-slate-500">{isAr ? 'من تاريخ:' : 'From Date:'}</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setDatePreset('custom')
                  }}
                  className="text-xs h-9 mt-1 bg-white dark:bg-zinc-900"
                />
              </div>
              <div>
                <Label className="text-[11px] text-slate-500">{isAr ? 'إلى تاريخ:' : 'To Date:'}</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    setDatePreset('custom')
                  }}
                  className="text-xs h-9 mt-1 bg-white dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>

          {/* 3. Department, Role, Staff Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'تصفية حسب القسم' : 'Department'}
              </Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="text-xs h-9 mt-1 bg-white dark:bg-zinc-900">
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
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'الدور الوظيفي' : 'System Role'}
              </Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="text-xs h-9 mt-1 bg-white dark:bg-zinc-900">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'كل الأدوار' : 'All Roles'}</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="kitchen">Kitchen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'موظف محدد' : 'Individual Staff'}
              </Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="text-xs h-9 mt-1 bg-white dark:bg-zinc-900">
                  <SelectValue placeholder="Select Staff" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? 'كافة الموظفين' : 'All Staff Members'}</SelectItem>
                  {staffList.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.department || s.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 4. Section Inclusions (if Master Report mode) */}
          {mode === 'full' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? 'تضمين الأقسام التالية في المستند المطبوع:' : 'Include sections in official printout:'}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-700/50">
                  <Checkbox
                    checked={sections.overview}
                    onCheckedChange={(c) => setSections({ ...sections, overview: Boolean(c) })}
                  />
                  <span>{isAr ? '1. الملخص التنفيذي ومؤشرات الأداء' : '1. Executive KPI Summary'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-700/50">
                  <Checkbox
                    checked={sections.payroll}
                    onCheckedChange={(c) => setSections({ ...sections, payroll: Boolean(c) })}
                  />
                  <span>{isAr ? '2. كشف الرواتب والأجور وساعات الإضافي' : '2. Payroll & Overtime Sheet'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-700/50">
                  <Checkbox
                    checked={sections.attendance}
                    onCheckedChange={(c) => setSections({ ...sections, attendance: Boolean(c) })}
                  />
                  <span>{isAr ? '3. سجل الحضور وتوثيق 2FA' : '3. Attendance & 2FA Logs'}</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer p-1.5 rounded-xl hover:bg-slate-200/50 dark:hover:bg-zinc-700/50">
                  <Checkbox
                    checked={sections.staff}
                    onCheckedChange={(c) => setSections({ ...sections, staff: Boolean(c) })}
                  />
                  <span>{isAr ? '4. دليل الموظفين والملفات الشخصية' : '4. Staff Directory & Contacts'}</span>
                </label>
              </div>
            </div>
          )}

          {/* 5. Live Summary Preview Card */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 flex justify-between items-center text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600 text-white font-black text-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  {isAr ? 'ملخص التقرير المختار' : 'Selected Report Snapshot'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {filteredStaffCount} {isAr ? 'موظف مطابق' : 'matching staff'} • {previewHoursTotal.toFixed(1)} {isAr ? 'ساعة مسجلة' : 'total hours'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                {isAr ? 'إجمالي الرواتب المستحقة' : 'Gross Payroll'}
              </span>
              <span className="font-mono font-black text-base text-indigo-600 dark:text-indigo-400">
                ${previewPayrollTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 mt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto text-xs font-bold cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportClick}
              className="text-xs font-bold gap-1.5 cursor-pointer bg-white dark:bg-zinc-900 hover:bg-slate-100"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? 'تصدير Excel / CSV' : 'Export CSV'}</span>
            </Button>

            <Button
              type="button"
              onClick={handlePrintClick}
              className="liquid-btn-primary text-xs font-bold gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة التقرير المعتمد' : 'Print Official Report'}</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
