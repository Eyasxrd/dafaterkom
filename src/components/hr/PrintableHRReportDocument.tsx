'use client'

import React from 'react'
import { StaffMember, AttendanceRecord, TimesheetRow, PayrollSummary } from '@/components/HRManager'

export interface HRReportConfig {
  mode: 'full' | 'payroll' | 'attendance' | 'staff' | 'shifts'
  startDate: string
  endDate: string
  periodLabel: string
  departmentFilter: string
  roleFilter: string
  selectedStaffId: string
  includedSections: {
    overview: boolean
    payroll: boolean
    attendance: boolean
    staff: boolean
    shifts: boolean
  }
}

interface PrintableHRReportDocumentProps {
  businessName?: string
  currency?: string
  config: HRReportConfig
  staffList: StaffMember[]
  attendanceRecords: AttendanceRecord[]
  payrollData: {
    summary: PayrollSummary
    timesheet: TimesheetRow[]
  }
  generatedBy?: string
  locale?: string
}

export default function PrintableHRReportDocument({
  businessName = 'Dafaterkom Restaurant & Cafe POS',
  currency = '$',
  config,
  staffList,
  attendanceRecords,
  payrollData,
  generatedBy = 'HR Administration',
  locale = 'en'
}: PrintableHRReportDocumentProps) {
  const isAr = locale === 'ar'

  // Filtered staff based on config
  const filteredStaff = staffList.filter((s) => {
    const matchesDept = config.departmentFilter === 'all' || s.department === config.departmentFilter
    const matchesRole = config.roleFilter === 'all' || s.role === config.roleFilter
    const matchesStaff = config.selectedStaffId === 'all' || s.id === config.selectedStaffId
    return matchesDept && matchesRole && matchesStaff
  })

  // Filtered attendance records based on config and date range
  const filteredAttendance = attendanceRecords.filter((rec) => {
    const staffMatch = config.selectedStaffId === 'all' || rec.staffId === config.selectedStaffId
    const deptMatch = config.departmentFilter === 'all' || rec.staff?.department === config.departmentFilter
    const roleMatch = config.roleFilter === 'all' || rec.staff?.role === config.roleFilter
    
    // Check date range if present
    const recDate = new Date(rec.clockIn)
    const startDate = config.startDate ? new Date(config.startDate) : null
    const endDate = config.endDate ? new Date(config.endDate + 'T23:59:59.999Z') : null
    
    const dateMatch = (!startDate || recDate >= startDate) && (!endDate || recDate <= endDate)
    return staffMatch && deptMatch && roleMatch && dateMatch
  })

  // Filtered timesheet based on config
  const filteredTimesheet = payrollData.timesheet.filter((row) => {
    const staffMatch = config.selectedStaffId === 'all' || row.staffId === config.selectedStaffId
    const deptMatch = config.departmentFilter === 'all' || row.department === config.departmentFilter
    const roleMatch = config.roleFilter === 'all' || row.role === config.roleFilter
    return staffMatch && deptMatch && roleMatch
  })

  // Computed summary for filtered timesheet
  const totalFilteredPayroll = filteredTimesheet.reduce((sum, r) => sum + r.totalPay, 0)
  const totalFilteredRegularPay = filteredTimesheet.reduce((sum, r) => sum + r.regularPay, 0)
  const totalFilteredOvertimePay = filteredTimesheet.reduce((sum, r) => sum + r.overtimePay, 0)
  const totalFilteredHours = filteredTimesheet.reduce((sum, r) => sum + r.totalHours, 0)
  const totalFilteredOvertimeHours = filteredTimesheet.reduce((sum, r) => sum + r.overtimeHours, 0)
  const activeStaffOnDuty = attendanceRecords.filter(r => !r.clockOut).length

  const shouldShowSection = (sectionKey: keyof HRReportConfig['includedSections']) => {
    if (config.mode === 'full') {
      return config.includedSections[sectionKey]
    }
    if (config.mode === 'payroll') return sectionKey === 'payroll' || sectionKey === 'overview'
    if (config.mode === 'attendance') return sectionKey === 'attendance' || sectionKey === 'overview'
    if (config.mode === 'staff') return sectionKey === 'staff' || sectionKey === 'overview'
    if (config.mode === 'shifts') return sectionKey === 'shifts' || sectionKey === 'overview'
    return true
  }

  const formatMoney = (amount: number) => {
    return `${currency === 'SAR' ? 'SAR ' : '$'}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <div
      id="printable-hr-report-document"
      className="print-only hidden print:block bg-white text-slate-900 font-sans p-4 sm:p-8 max-w-5xl mx-auto text-[11px] leading-normal select-none"
    >
      {/* Official Header Letterhead */}
      <div className="border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-base">
                HR
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">
                  {businessName}
                </h1>
                <p className="text-[11px] text-slate-600 font-bold tracking-wider uppercase">
                  {isAr ? 'تقرير الموارد البشرية وشؤون الموظفين وكشف الرواتب المعتمد' : 'Official HR & Workforce Management Report'}
                </p>
              </div>
            </div>
          </div>

          <div className="text-right text-[10px] space-y-0.5 font-mono text-slate-700">
            <p>
              <span className="text-slate-500 font-sans">{isAr ? 'الفترة:' : 'Period:'}</span>{' '}
              <strong className="font-bold text-slate-900">{config.periodLabel || `${config.startDate} to ${config.endDate}`}</strong>
            </p>
            <p>
              <span className="text-slate-500 font-sans">{isAr ? 'تاريخ التوليد:' : 'Generated At:'}</span>{' '}
              {new Date().toLocaleString()}
            </p>
            <p>
              <span className="text-slate-500 font-sans">{isAr ? 'المسؤول / القسم:' : 'Issued By:'}</span>{' '}
              <strong className="font-bold text-slate-900">{generatedBy}</strong>
            </p>
            {config.departmentFilter !== 'all' && (
              <p>
                <span className="text-slate-500 font-sans">{isAr ? 'القسم المحدد:' : 'Department:'}</span>{' '}
                <strong className="font-bold text-slate-900">{config.departmentFilter}</strong>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: EXECUTIVE WORKFORCE & PAYROLL KPI SUMMARY */}
      {/* ========================================================================= */}
      {shouldShowSection('overview') && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block"></span>
              <span>{isAr ? '1. الملخص التنفيذي ومؤشرات الأداء للموارد البشرية' : '1. Executive HR & Workforce KPI Summary'}</span>
            </h2>
            <span className="text-[9px] text-slate-500 uppercase">{isAr ? 'المؤشرات الرئيسية' : 'Period Metrics'}</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5 mb-3">
            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">
                {isAr ? 'إجمالي كادر الموظفين' : 'Total Headcount'}
              </span>
              <span className="text-base font-black text-slate-900 font-mono block mt-0.5">
                {filteredStaff.length} {isAr ? 'موظف' : 'Staff'}
              </span>
              <span className="text-[8px] text-slate-500">
                {filteredStaff.filter(s => s.isActive).length} {isAr ? 'نشط' : 'Active'} • {activeStaffOnDuty} {isAr ? 'على رأس العمل' : 'On Shift'}
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">
                {isAr ? 'إجمالي ساعات العمل' : 'Total Work Hours'}
              </span>
              <span className="text-base font-black text-slate-900 font-mono block mt-0.5">
                {totalFilteredHours.toFixed(1)} hrs
              </span>
              <span className="text-[8px] text-slate-500">
                {isAr ? 'إضافي:' : 'OT:'} {totalFilteredOvertimeHours.toFixed(1)} hrs
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">
                {isAr ? 'إجمالي الرواتب والمستحقات' : 'Total Gross Payroll'}
              </span>
              <span className="text-base font-black text-slate-900 font-mono block mt-0.5">
                {formatMoney(totalFilteredPayroll)}
              </span>
              <span className="text-[8px] text-slate-500">
                {isAr ? 'أساسي:' : 'Base:'} {formatMoney(totalFilteredRegularPay)} | {isAr ? 'إضافي:' : 'OT:'} {formatMoney(totalFilteredOvertimePay)}
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg p-2.5 bg-slate-50/50">
              <span className="text-[9px] uppercase font-bold text-slate-500 block">
                {isAr ? 'توثيق Google 2FA' : '2FA Compliance Rate'}
              </span>
              <span className="text-base font-black text-slate-900 font-mono block mt-0.5">
                {filteredStaff.length > 0
                  ? `${Math.round((filteredStaff.filter(s => s.totpEnabled).length / filteredStaff.length) * 100)}%`
                  : '100%'}
              </span>
              <span className="text-[8px] text-slate-500">
                {filteredStaff.filter(s => s.totpEnabled).length} / {filteredStaff.length} {isAr ? 'موثق' : 'enrolled'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PAYROLL & TIMESHEET BREAKDOWN */}
      {/* ========================================================================= */}
      {shouldShowSection('payroll') && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2.5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block"></span>
              <span>{isAr ? '2. كشف رواتب الموظفين والساعات والأجور الإضافية' : '2. Staff Payroll, Hours & Overtime Compensation'}</span>
            </h2>
            <span className="text-[9px] font-mono text-slate-600">
              {filteredTimesheet.length} {isAr ? 'سجل موظف' : 'employees'}
            </span>
          </div>

          <table className="w-full text-[10px] border-collapse border border-slate-300 mb-2">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'الموظف' : 'Staff Name'}</th>
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'القسم / المسمى' : 'Dept / Job Title'}</th>
                <th className="p-1.5 text-center border-r border-slate-300">{isAr ? 'النوع' : 'Plan'}</th>
                <th className="p-1.5 text-center border-r border-slate-300">{isAr ? 'الأيام' : 'Days'}</th>
                <th className="p-1.5 text-center border-r border-slate-300">{isAr ? 'الساعات' : 'Total Hrs'}</th>
                <th className="p-1.5 text-center border-r border-slate-300">{isAr ? 'الرسمية' : 'Reg Hrs'}</th>
                <th className="p-1.5 text-center border-r border-slate-300">{isAr ? 'الإضافية' : 'OT Hrs'}</th>
                <th className="p-1.5 text-right border-r border-slate-300">{isAr ? 'الأساسي' : 'Base Pay'}</th>
                <th className="p-1.5 text-right border-r border-slate-300">{isAr ? 'الإضافي' : 'OT Pay'}</th>
                <th className="p-1.5 text-right font-black">{isAr ? 'صافي المستحق' : 'Gross Total'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTimesheet.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-3 text-center text-slate-500 italic">
                    {isAr ? 'لا توجد بيانات رواتب خلال هذه الفترة.' : 'No payroll data recorded for this period.'}
                  </td>
                </tr>
              ) : (
                filteredTimesheet.map((row) => (
                  <tr key={row.staffId} className="border-b border-slate-200">
                    <td className="p-1.5 font-bold border-r border-slate-200 text-slate-900">{row.name}</td>
                    <td className="p-1.5 border-r border-slate-200 text-slate-700">{row.jobTitle} ({row.department})</td>
                    <td className="p-1.5 text-center border-r border-slate-200 uppercase font-mono text-[9px]">
                      {row.salaryType}
                    </td>
                    <td className="p-1.5 text-center font-mono border-r border-slate-200">{row.daysWorked}</td>
                    <td className="p-1.5 text-center font-mono font-bold border-r border-slate-200">{row.totalHours}</td>
                    <td className="p-1.5 text-center font-mono border-r border-slate-200">{row.regularHours}</td>
                    <td className="p-1.5 text-center font-mono border-r border-slate-200 font-bold">
                      {row.overtimeHours > 0 ? `+${row.overtimeHours}` : '0'}
                    </td>
                    <td className="p-1.5 text-right font-mono border-r border-slate-200">{formatMoney(row.regularPay)}</td>
                    <td className="p-1.5 text-right font-mono border-r border-slate-200">
                      {row.overtimePay > 0 ? formatMoney(row.overtimePay) : '-'}
                    </td>
                    <td className="p-1.5 text-right font-mono font-black text-slate-900 bg-slate-50">
                      {formatMoney(row.totalPay)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredTimesheet.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 font-black border-t-2 border-slate-400">
                  <td colSpan={3} className="p-1.5 text-left border-r border-slate-300 uppercase">
                    {isAr ? 'الإجمالي العام للفترة' : 'Grand Totals'}
                  </td>
                  <td className="p-1.5 text-center border-r border-slate-300 font-mono">
                    {filteredTimesheet.reduce((sum, r) => sum + r.daysWorked, 0)}
                  </td>
                  <td className="p-1.5 text-center border-r border-slate-300 font-mono">
                    {totalFilteredHours.toFixed(1)}
                  </td>
                  <td className="p-1.5 text-center border-r border-slate-300 font-mono">
                    {filteredTimesheet.reduce((sum, r) => sum + r.regularHours, 0).toFixed(1)}
                  </td>
                  <td className="p-1.5 text-center border-r border-slate-300 font-mono">
                    +{totalFilteredOvertimeHours.toFixed(1)}
                  </td>
                  <td className="p-1.5 text-right border-r border-slate-300 font-mono">
                    {formatMoney(totalFilteredRegularPay)}
                  </td>
                  <td className="p-1.5 text-right border-r border-slate-300 font-mono">
                    {formatMoney(totalFilteredOvertimePay)}
                  </td>
                  <td className="p-1.5 text-right font-mono font-black text-slate-900 bg-slate-200/80">
                    {formatMoney(totalFilteredPayroll)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: ATTENDANCE & TIME TRACKING LOGS */}
      {/* ========================================================================= */}
      {shouldShowSection('attendance') && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2.5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block"></span>
              <span>{isAr ? '3. سجل الحضور والانصراف وتتبع الورديات' : '3. Attendance & Shift Clock-In / Out Logs'}</span>
            </h2>
            <span className="text-[9px] font-mono text-slate-600">
              {filteredAttendance.length} {isAr ? 'سجل حضور' : 'records'}
            </span>
          </div>

          <table className="w-full text-[10px] border-collapse border border-slate-300 mb-2">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'الموظف' : 'Staff Member'}</th>
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'القسم' : 'Dept'}</th>
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'الوردية / المصدر' : 'Shift / Source'}</th>
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'وقت الدخول' : 'Clock In'}</th>
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'وقت الخروج' : 'Clock Out'}</th>
                <th className="p-1.5 text-center border-r border-slate-300">{isAr ? 'إجمالي الساعات' : 'Duration'}</th>
                <th className="p-1.5 text-center border-r border-slate-300">{isAr ? 'الإضافي' : 'Overtime'}</th>
                <th className="p-1.5 text-center border-r border-slate-300">{isAr ? 'طريقة التوثيق' : 'Verification'}</th>
                <th className="p-1.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-3 text-center text-slate-500 italic">
                    {isAr ? 'لا توجد سجلات حضور خلال هذه الفترة.' : 'No attendance logs found for this period.'}
                  </td>
                </tr>
              ) : (
                filteredAttendance.slice(0, 100).map((rec) => (
                  <tr key={rec.id} className="border-b border-slate-200">
                    <td className="p-1.5 font-bold border-r border-slate-200 text-slate-900">{rec.staff?.name}</td>
                    <td className="p-1.5 border-r border-slate-200 text-slate-700">{rec.staff?.department || 'Service'}</td>
                    <td className="p-1.5 border-r border-slate-200 text-slate-700 font-mono text-[9px]">{rec.source}</td>
                    <td className="p-1.5 border-r border-slate-200 font-mono text-[9px]">
                      {new Date(rec.clockIn).toLocaleDateString()} {new Date(rec.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-1.5 border-r border-slate-200 font-mono text-[9px]">
                      {rec.clockOut ? (
                        `${new Date(rec.clockOut).toLocaleDateString()} ${new Date(rec.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                      ) : (
                        <span className="font-bold text-emerald-700">{isAr ? 'على رأس العمل' : 'Active'}</span>
                      )}
                    </td>
                    <td className="p-1.5 text-center font-mono font-bold border-r border-slate-200">
                      {rec.totalHours ? `${rec.totalHours}h` : '-'}
                    </td>
                    <td className="p-1.5 text-center font-mono border-r border-slate-200">
                      {rec.overtimeHours && rec.overtimeHours > 0 ? `+${rec.overtimeHours}h` : '-'}
                    </td>
                    <td className="p-1.5 text-center border-r border-slate-200 font-mono text-[9px]">
                      {rec.source === 'google_auth_totp' ? 'Google 2FA' : rec.source}
                    </td>
                    <td className="p-1.5 text-center font-mono text-[9px]">
                      {rec.clockOut ? 'Completed' : 'Active'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {filteredAttendance.length > 100 && (
            <p className="text-[9px] text-slate-500 italic text-right">
              {isAr ? `* تم عرض أول 100 سجل من أصل ${filteredAttendance.length}.` : `* Showing first 100 logs out of ${filteredAttendance.length}.`}
            </p>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: EMPLOYEE DIRECTORY & SHIFT ROSTER */}
      {/* ========================================================================= */}
      {shouldShowSection('staff') && (
        <div className="mb-6 print-avoid-break">
          <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 mb-2.5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 inline-block"></span>
              <span>{isAr ? '4. دليل الموظفين، الورديات وبيانات الاتصال' : '4. Staff Directory, Shift Rosters & Contact Profiles'}</span>
            </h2>
            <span className="text-[9px] font-mono text-slate-600">
              {filteredStaff.length} {isAr ? 'موظف' : 'members'}
            </span>
          </div>

          <table className="w-full text-[10px] border-collapse border border-slate-300 mb-2">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'الاسم' : 'Name'}</th>
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'المسمى / القسم' : 'Title / Dept'}</th>
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'الدور' : 'Role'}</th>
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'الوردية' : 'Assigned Shift'}</th>
                <th className="p-1.5 text-center border-r border-slate-300">{isAr ? 'الخطة المالية' : 'Rate / Plan'}</th>
                <th className="p-1.5 text-left border-r border-slate-300">{isAr ? 'الهاتف والإيميل' : 'Contact'}</th>
                <th className="p-1.5 text-center border-r border-slate-300">{isAr ? 'تاريخ التعيين' : 'Hire Date'}</th>
                <th className="p-1.5 text-center">{isAr ? 'حماية 2FA' : '2FA Status'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => (
                <tr key={staff.id} className="border-b border-slate-200">
                  <td className="p-1.5 font-bold border-r border-slate-200 text-slate-900">{staff.name}</td>
                  <td className="p-1.5 border-r border-slate-200 text-slate-700">{staff.jobTitle || '-'} ({staff.department || 'Service'})</td>
                  <td className="p-1.5 border-r border-slate-200 uppercase font-mono text-[9px]">{staff.role}</td>
                  <td className="p-1.5 border-r border-slate-200 text-slate-700">{staff.shiftSchedule || `${staff.standardDailyHours}h/day`}</td>
                  <td className="p-1.5 text-center border-r border-slate-200 font-mono text-[9px]">
                    {staff.salaryType === 'monthly' ? `$${(staff.monthlySalary || 0).toFixed(0)}/mo` : `$${(staff.hourlyRate || 0).toFixed(2)}/hr`}
                  </td>
                  <td className="p-1.5 border-r border-slate-200 font-mono text-[9px]">
                    {staff.phone || staff.email || '-'}
                  </td>
                  <td className="p-1.5 text-center border-r border-slate-200 font-mono text-[9px]">
                    {staff.hireDate ? new Date(staff.hireDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-1.5 text-center font-mono text-[9px]">
                    {staff.totpEnabled ? 'Active' : 'Unlinked'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: OFFICIAL VERIFICATION & SIGNATURES BLOCK */}
      {/* ========================================================================= */}
      <div className="pt-6 border-t-2 border-slate-900 print-avoid-break">
        <div className="grid grid-cols-3 gap-6 text-center text-[10px]">
          {/* HR Specialist Signature */}
          <div className="border border-slate-300 rounded-xl p-4 flex flex-col justify-between h-32 bg-slate-50/50">
            <div>
              <span className="font-bold text-slate-900 block">{isAr ? 'إعداد مسؤول الموارد البشرية' : 'Prepared By: HR Officer'}</span>
              <span className="text-[9px] text-slate-500">{isAr ? 'مطابقة الحضور والرواتب' : 'Workforce & Attendance Verification'}</span>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-slate-400 text-[9px] font-mono">
              {isAr ? 'التوقيع والتاريخ' : 'Signature & Date'}
            </div>
          </div>

          {/* General Manager Approval */}
          <div className="border border-slate-300 rounded-xl p-4 flex flex-col justify-between h-32 bg-slate-50/50">
            <div>
              <span className="font-bold text-slate-900 block">{isAr ? 'اعتماد الإدارة العامة / المالية' : 'Approved By: Director / Finance'}</span>
              <span className="text-[9px] text-slate-500">{isAr ? 'الموافقة على صرف مستحقات الكشف' : 'Payroll Disbursement Approval'}</span>
            </div>
            <div className="border-t border-dashed border-slate-400 pt-1 text-slate-400 text-[9px] font-mono">
              {isAr ? 'التوقيع والتاريخ' : 'Signature & Date'}
            </div>
          </div>

          {/* Official Company Stamp Box */}
          <div className="border border-slate-300 rounded-xl p-4 flex flex-col justify-between h-32 bg-slate-50/50">
            <div>
              <span className="font-bold text-slate-900 block">{isAr ? 'الختم الرسمي للمنشأة' : 'Official Seal / Stamp'}</span>
              <span className="text-[9px] text-slate-500">{businessName}</span>
            </div>
            <div className="border border-dashed border-slate-300 rounded h-12 flex items-center justify-center text-slate-300 text-[8px] uppercase tracking-wider">
              {isAr ? 'ختم المنشأة المعتمد' : 'Affix Official Stamp Here'}
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[9px] text-slate-400 mt-4 font-mono">
          <span>{isAr ? 'تم استخراج هذا التقرير آلياً عبر نظام دفاتركم السحابي (Dafaterkom Cloud POS)' : 'System Generated via Dafaterkom Cloud POS & Workforce System'}</span>
          <span>Doc ID: HR-REP-{new Date().getFullYear()}-{Math.floor(1000 + Math.random() * 9000)}</span>
        </div>
      </div>
    </div>
  )
}
