'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useLocale } from 'next-intl'
import { 
  Printer, 
  Download, 
  Building, 
  Calendar, 
  DollarSign, 
  User, 
  Clock, 
  CheckCircle2, 
  ShieldCheck, 
  CreditCard,
  FileText,
  Sparkles
} from 'lucide-react'

interface PayslipData {
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
  overtimeRate: number
  shiftSchedule?: string | null
  bankName?: string | null
  bankAccount?: string | null
  nationalId?: string | null
  daysWorked: number
  totalHours: number
  regularHours: number
  overtimeHours: number
  regularPay: number
  overtimePay: number
  totalPay: number
  periodStartDate: string
  periodEndDate: string
}

interface PayslipModalProps {
  isOpen: boolean
  onClose: () => void
  data: PayslipData | null
  businessName?: string
  currency?: string
}

export default function PayslipModal({
  isOpen,
  onClose,
  data,
  businessName = 'Dafaterkom Restaurant & Cafe POS',
  currency = '$'
}: PayslipModalProps) {
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'

  if (!data) return null

  const handlePrint = () => {
    window.print()
  }

  const isMonthly = data.salaryType === 'monthly'
  const formattedHireDate = data.hireDate 
    ? new Date(data.hireDate).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : (isAr ? 'غير محدد' : 'Not Specified')

  const formattedPeriod = `${new Date(data.periodStartDate).toLocaleDateString()} - ${new Date(data.periodEndDate).toLocaleDateString()}`

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden glass-panel rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-2xl">
        <DialogHeader className="p-6 bg-slate-900 text-white flex flex-row items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight text-white">
                {isAr ? 'قسيمة راتب الموظف (Payslip)' : 'Official Employee Payslip'}
              </DialogTitle>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {isAr ? `الفترة: ${formattedPeriod}` : `Period: ${formattedPeriod}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold gap-1.5 shadow-md cursor-pointer print:hidden"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة القسيمة' : 'Print Slip'}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Payslip Body */}
        <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100 max-h-[75vh] overflow-y-auto">
          {/* Header Info Banner */}
          <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-white/10">
            <div>
              <div className="text-xl font-black text-slate-900 dark:text-white">
                {businessName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr ? 'قسم الموارد البشرية والرواتب' : 'HR & Payroll Department'}
              </div>
            </div>

            <div className="text-right">
              <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isMonthly ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
              }`}>
                {isMonthly ? (isAr ? 'راتب شهري ثابت' : 'Monthly Salaried') : (isAr ? 'أجر بالساعة' : 'Hourly Wage')}
              </span>
              <div className="text-[11px] text-slate-400 font-mono mt-1">
                Ref #{data.staffId.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Employee Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-white/5 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'اسم الموظف' : 'Employee Name'}</span>
              <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">{data.name}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'القسم والمسمى' : 'Department & Title'}</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {data.jobTitle} <span className="text-slate-400">({data.department})</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'تاريخ التعيين والبدء' : 'Start / Hire Date'}</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{formattedHireDate}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'البريد الإلكتروني' : 'Email Address'}</span>
              <div className="font-mono text-slate-700 dark:text-slate-300 mt-0.5 truncate">{data.email}</div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'ساعات الوردية اليومية' : 'Shift Schedule'}</span>
              <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {data.shiftSchedule || `${data.standardDailyHours} hrs/day`}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{isAr ? 'الحساب البنكي' : 'Bank Account'}</span>
              <div className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                {data.bankAccount ? `${data.bankName || 'Bank'}: ${data.bankAccount}` : (isAr ? 'دفع نقدي' : 'Cash Payout')}
              </div>
            </div>
          </div>

          {/* Attendance & Work Summary Table */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              {isAr ? 'ملخص ساعات العمل والإضافي' : 'Work Hours & Attendance Summary'}
            </h4>
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{isAr ? 'أيام العمل' : 'Days Worked'}</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{data.daysWorked} {isAr ? 'يوم' : 'days'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{isAr ? 'إجمالي الساعات' : 'Total Hours'}</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{data.totalHours} {isAr ? 'س' : 'hrs'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold">{isAr ? 'الساعات الرسمية' : 'Regular Hours'}</span>
                <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{data.regularHours} {isAr ? 'س' : 'hrs'}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold">{isAr ? 'الساعات الإضافية' : 'Overtime'}</span>
                <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">+{data.overtimeHours} {isAr ? 'س' : 'hrs'}</div>
              </div>
            </div>
          </div>

          {/* Earnings Breakdown Table */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              {isAr ? 'تفاصيل مستحقات الراتب' : 'Earnings Breakdown'}
            </h4>
            <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-white/10">
                  <tr>
                    <th className="py-2.5 px-3">{isAr ? 'البند' : 'Description'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'السعر / المعدل' : 'Rate / Base'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'الكمية' : 'Units'}</th>
                    <th className="py-2.5 px-3 text-right">{isAr ? 'المبلغ' : 'Amount'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  <tr>
                    <td className="py-3 px-3 font-bold">
                      {isMonthly ? (isAr ? 'الراتب الشهري الأساسي' : 'Base Monthly Salary') : (isAr ? 'أجر الساعات الرسمية' : 'Regular Hours Wages')}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {isMonthly ? `${currency}${data.monthlySalary.toFixed(2)}/mo` : `${currency}${data.hourlyRate.toFixed(2)}/hr`}
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      {isMonthly ? (isAr ? 'شهر كامل' : '1 Month') : `${data.regularHours} hrs`}
                    </td>
                    <td className="py-3 px-3 text-right font-black font-mono">
                      {currency}{data.regularPay.toFixed(2)}
                    </td>
                  </tr>

                  {data.overtimeHours > 0 && (
                    <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                      <td className="py-3 px-3 font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAr ? 'مستحقات الساعات الإضافية (Overtime)' : 'Overtime Additional Pay'}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-700 dark:text-amber-300">
                        {currency}{data.overtimeRate.toFixed(2)}/hr
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-700 dark:text-amber-300">
                        +{data.overtimeHours} hrs
                      </td>
                      <td className="py-3 px-3 text-right font-black font-mono text-amber-700 dark:text-amber-300">
                        +{currency}{data.overtimePay.toFixed(2)}
                      </td>
                    </tr>
                  )}

                  {/* Net Pay Highlight */}
                  <tr className="bg-indigo-50/80 dark:bg-indigo-950/40 text-sm font-black border-t-2 border-indigo-200 dark:border-indigo-800">
                    <td colSpan={3} className="py-3.5 px-3 text-indigo-950 dark:text-indigo-200 uppercase tracking-wider">
                      {isAr ? 'صافي الراتب المستحق للصرف (Net Payable Salary)' : 'Net Payable Salary'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-indigo-600 dark:text-indigo-400 text-base">
                      {currency}{data.totalPay.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Authorization & Signatures Area */}
          <div className="pt-4 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <div className="font-bold text-slate-700 dark:text-slate-300">{isAr ? 'توقيع الموظف المستلم:' : 'Employee Signature:'}</div>
              <div className="mt-8 border-b border-dashed border-slate-300 dark:border-slate-700 w-48" />
              <div className="text-[10px] text-slate-400 mt-1">{isAr ? 'أقر باستلام المستحقات الموضحة أعلاه' : 'Acknowledged & Received'}</div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="font-bold text-slate-700 dark:text-slate-300">{isAr ? 'اعتماد الموارد البشرية / الإدارة:' : 'HR / Management Approval:'}</div>
              <div className="mt-8 border-b border-dashed border-slate-300 dark:border-slate-700 w-48" />
              <div className="text-[10px] text-slate-400 mt-1">{isAr ? 'ختم وتوقيع الإدارة المعتمد' : 'Authorized Signature & Stamp'}</div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs font-bold cursor-pointer"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
