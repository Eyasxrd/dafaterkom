'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/lib/store'
import { useLocale } from 'next-intl'
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  UserX, 
  UserCheck, 
  KeyRound, 
  Copy, 
  Check, 
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  UserMinus,
  Edit,
  Lock,
  Sparkles,
  Shield
} from 'lucide-react'
import { Switch } from '@/components/ui/switch'

interface StaffMember {
  id: string
  name: string
  email?: string | null
  role: string
  canLogin?: boolean
  joinCode?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function StaffManager() {
  const locale = useLocale() || 'en'
  const isAr = locale === 'ar'
  const { user } = useAuthStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isAddCashierDialogOpen, setIsAddCashierDialogOpen] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState<StaffMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [roleFilter, setRoleFilter] = useState<'all' | 'cashier'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({})

  // Add Cashier Form State
  const [newCashier, setNewCashier] = useState({
    name: '',
    email: '',
    password: '',
    joinCode: ''
  })
  const [showCashierPassword, setShowCashierPassword] = useState(false)

  // Add General Staff Form State
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    canLogin: true,
    joinCode: ''
  })
  const [showNewStaffPassword, setShowNewStaffPassword] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Edit Staff Form State
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'cashier',
    joinCode: '',
    canLogin: true,
    password: ''
  })
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Quick Change Password Dialog State
  const [passwordStaff, setPasswordStaff] = useState<StaffMember | null>(null)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [newPasswordInput, setNewPasswordInput] = useState('')
  const [showPasswordOnly, setShowPasswordOnly] = useState(false)
  const [passwordDialogError, setPasswordDialogError] = useState<string | null>(null)
  const [isSavingPasswordOnly, setIsSavingPasswordOnly] = useState(false)

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const isAdmin = user?.role === 'admin'
  const isManager = user?.role === 'manager'
  const canManageStaff = isAdmin || isManager

  const generateRandomCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const response = await fetch('/api/staff')
      const data = await response.json()
      if (Array.isArray(data)) {
        setStaff(data)
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAddCashier = () => {
    setNewCashier({
      name: '',
      email: '',
      password: '',
      joinCode: generateRandomCode()
    })
    setShowCashierPassword(false)
    setAddError(null)
    setIsAddCashierDialogOpen(true)
  }

  const handleAddCashier = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageStaff) return
    setAddError(null)
    
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCashier.name.trim(),
          email: newCashier.email.trim() || null,
          password: newCashier.password.trim() || '123456',
          joinCode: newCashier.joinCode.trim(),
          role: 'cashier',
          canLogin: true
        })
      })
      const data = await response.json()
      if (response.ok) {
        setIsAddCashierDialogOpen(false)
        setFeedback({ 
          type: 'success', 
          message: isAr 
            ? `تم إنشاء حساب الكاشير "${newCashier.name}" بنجاح بكود الموظف (${newCashier.joinCode})!` 
            : `Cashier account for "${newCashier.name}" created with Employee Code (${newCashier.joinCode})!` 
        })
        fetchStaff()
      } else {
        setAddError(data.error || 'Failed to add cashier')
      }
    } catch (error: any) {
      setAddError(error.message || 'Failed to add cashier')
    }
  }

  const handleOpenAddDialog = () => {
    setNewStaff({
      name: '',
      email: '',
      password: '',
      role: 'cashier',
      canLogin: true,
      joinCode: generateRandomCode()
    })
    setShowNewStaffPassword(false)
    setAddError(null)
    setIsAddDialogOpen(true)
  }

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canManageStaff) return
    setAddError(null)
    
    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newStaff,
          email: newStaff.email.trim() || null,
          password: newStaff.password.trim() || (newStaff.canLogin ? 'password123' : undefined)
        })
      })
      const data = await response.json()
      if (response.ok) {
        setIsAddDialogOpen(false)
        setFeedback({ 
          type: 'success', 
          message: isAr 
            ? `تم إنشاء حساب الموظف "${newStaff.name}" بنجاح!` 
            : `Staff member "${newStaff.name}" created successfully!` 
        })
        fetchStaff()
      } else {
        setAddError(data.error || 'Failed to add staff member')
      }
    } catch (error: any) {
      setAddError(error.message || 'Failed to add staff member')
    }
  }

  const handleOpenEditStaff = (member: StaffMember) => {
    setEditingStaff(member)
    setEditFormData({
      name: member.name,
      email: member.email || '',
      role: member.role || 'cashier',
      joinCode: member.joinCode || '',
      canLogin: member.canLogin !== undefined ? Boolean(member.canLogin) : true,
      password: ''
    })
    setShowEditPassword(false)
    setEditError(null)
    setIsEditDialogOpen(true)
  }

  const handleSaveEditStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingStaff || !canManageStaff) return
    setEditError(null)
    setIsSavingEdit(true)

    try {
      const payload: any = {
        name: editFormData.name.trim(),
        email: editFormData.email.trim() || null,
        role: editFormData.role,
        joinCode: editFormData.joinCode.trim(),
        canLogin: editFormData.canLogin
      }

      if (editFormData.password && editFormData.password.trim()) {
        payload.password = editFormData.password.trim()
      }

      const response = await fetch(`/api/staff/${editingStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()
      if (response.ok) {
        setIsEditDialogOpen(false)
        setEditingStaff(null)
        setFeedback({ 
          type: 'success', 
          message: isAr 
            ? `تم تحديث بيانات الموظف "${editFormData.name}" بنجاح!` 
            : `Staff member "${editFormData.name}" updated successfully!` 
        })
        fetchStaff()
      } else {
        setEditError(data.error || 'Failed to update employee')
      }
    } catch (err: any) {
      setEditError(err.message || 'Network error updating employee')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const handleOpenChangePassword = (member: StaffMember) => {
    setPasswordStaff(member)
    setNewPasswordInput('')
    setShowPasswordOnly(false)
    setPasswordDialogError(null)
    setIsPasswordDialogOpen(true)
  }

  const handleSaveQuickPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordStaff || !canManageStaff) return

    if (!newPasswordInput || newPasswordInput.trim().length < 4) {
      setPasswordDialogError(isAr ? 'يجب أن تتكون كلمة المرور من 4 أحرف أو أرقام على الأقل' : 'Password must be at least 4 characters long')
      return
    }

    setIsSavingPasswordOnly(true)
    setPasswordDialogError(null)

    try {
      const response = await fetch(`/api/staff/${passwordStaff.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: newPasswordInput.trim()
        })
      })

      const data = await response.json()
      if (response.ok) {
        setIsPasswordDialogOpen(false)
        setPasswordStaff(null)
        setFeedback({ 
          type: 'success', 
          message: isAr 
            ? `تم تغيير كلمة المرور للموظف "${passwordStaff.name}" بنجاح!` 
            : `Password for "${passwordStaff.name}" changed successfully!` 
        })
        fetchStaff()
      } else {
        setPasswordDialogError(data.error || 'Failed to update password')
      }
    } catch (err: any) {
      setPasswordDialogError(err.message || 'Network error updating password')
    } finally {
      setIsSavingPasswordOnly(false)
    }
  }

  const handleDeleteStaff = async () => {
    if (!memberToDelete || !canManageStaff) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/staff/${memberToDelete.id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setFeedback({ 
          type: 'success', 
          message: isAr 
            ? `تم حذف الموظف "${memberToDelete.name}" بنجاح!` 
            : `Employee "${memberToDelete.name}" removed successfully!` 
        })
        setMemberToDelete(null)
        fetchStaff()
      } else {
        const errData = await res.json()
        setFeedback({ type: 'error', message: errData.error || 'Failed to remove staff member.' })
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Network error removing staff.' })
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleStaffStatus = async (id: string, currentStatus: boolean) => {
    if (!canManageStaff) return
    
    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })
      if (response.ok) {
        setFeedback({ 
          type: 'success', 
          message: isAr 
            ? `تم تغيير حالة الموظف إلى ${!currentStatus ? 'نشط' : 'غير نشط'}.` 
            : `Staff status successfully changed to ${!currentStatus ? 'Active' : 'Inactive'}.` 
        })
        fetchStaff()
      } else {
        setFeedback({ type: 'error', message: 'Failed to update employee status.' })
      }
    } catch (error) {
      console.error('Failed to update staff status:', error)
      setFeedback({ type: 'error', message: 'Network error updating employee status.' })
    }
  }

  const handleRegenerateCode = async (memberId: string) => {
    if (!canManageStaff) return
    const newCode = generateRandomCode()
    try {
      const res = await fetch(`/api/staff/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: newCode })
      })
      if (res.ok) {
        fetchStaff()
        setRevealedCodes(prev => ({ ...prev, [memberId]: true }))
        setFeedback({ 
          type: 'success', 
          message: isAr 
            ? `تم توليد كود موظف جديد: ${newCode}` 
            : `New employee clock-in PIN generated: ${newCode}` 
        })
      } else {
        setFeedback({ type: 'error', message: 'Failed to regenerate code.' })
      }
    } catch (err) {
      console.error('Failed to regenerate code:', err)
      setFeedback({ type: 'error', message: 'Network error regenerating code.' })
    }
  }

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setFeedback({ 
      type: 'success', 
      message: isAr ? `تم نسخ كود الموظف ${code} للحافظة!` : `Clock-in code ${code} copied to clipboard!` 
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleRevealCode = (id: string) => {
    setRevealedCodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">{isAr ? 'جاري تحميل الموظفين...' : 'Loading staff...'}</div>
  }

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-sm animate-in fade-in ${
          feedback.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-950 dark:text-emerald-200'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-950 dark:text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
            {isAr ? 'إدارة الموظفين والمستخدمين' : 'Staff & Employee Management'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr 
              ? 'إدارة حسابات الموظفين، أكواد تسجيل الدخول، الصلاحيات وكلمات المرور' 
              : 'Manage cafe employees, permission roles, passwords, and clock-in security codes'}
          </p>
        </div>
        {canManageStaff && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Add Cashier Dialog Button */}
            <Dialog open={isAddCashierDialogOpen} onOpenChange={setIsAddCashierDialogOpen}>
              <Button onClick={handleOpenAddCashier} className="liquid-btn-primary font-bold gap-2 text-xs h-10 px-4 shadow-md">
                <UserCheck className="w-4 h-4" />
                <span>{isAr ? '+ إضافة كاشير سريع' : '+ Add Cashier User'}</span>
              </Button>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>{isAr ? 'إنشاء حساب كاشير جديد' : 'Create Cashier Account'}</span>
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddCashier} className="space-y-4 pt-2">
                  {addError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                      {addError}
                    </div>
                  )}
                  <div>
                    <Label className="text-xs font-semibold">{isAr ? 'اسم الكاشير *' : 'Cashier Name *'}</Label>
                    <Input
                      required
                      value={newCashier.name}
                      onChange={(e) => setNewCashier({ ...newCashier, name: e.target.value })}
                      placeholder={isAr ? 'مثال: أحمد الكاشير' : 'e.g. Ahmed Cashier'}
                      className="mt-1"
                      autoFocus
                    />
                  </div>

                  {/* Employee Code / PIN */}
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{isAr ? 'كود الموظف / تسجيل الحضور *' : 'Employee Code / Clock-In PIN *'}</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => setNewCashier(prev => ({ ...prev, joinCode: generateRandomCode() }))}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{isAr ? 'توليد جديد' : 'Regenerate'}</span>
                      </button>
                    </div>
                    <Input
                      required
                      value={newCashier.joinCode}
                      onChange={(e) => setNewCashier({ ...newCashier, joinCode: e.target.value })}
                      placeholder="6-digit PIN / Code"
                      className="font-mono text-center tracking-widest text-lg font-bold bg-white dark:bg-slate-900"
                      maxLength={10}
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isAr 
                        ? 'يمكن للكاشير تسجيل الدخول مباشرة برقم الكود هذا وكلمة المرور أدناه.' 
                        : 'Cashier can sign in directly using this Employee Code and the password below.'}
                    </p>
                  </div>

                  {/* Password Input */}
                  <div>
                    <Label className="text-xs font-semibold">{isAr ? 'كلمة المرور لتسجيل الدخول *' : 'Login Password *'}</Label>
                    <div className="relative mt-1">
                      <Input
                        type={showCashierPassword ? 'text' : 'password'}
                        required
                        value={newCashier.password}
                        onChange={(e) => setNewCashier({ ...newCashier, password: e.target.value })}
                        placeholder={isAr ? 'أدخل كلمة مرور الكاشير (مثال: 123456)' : 'Enter cashier password'}
                        className="pe-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCashierPassword(!showCashierPassword)}
                        className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showCashierPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Optional Email */}
                  <div>
                    <Label className="text-xs font-semibold">
                      {isAr ? 'البريد الإلكتروني (اختياري)' : 'Login Email / Username (Optional)'}
                    </Label>
                    <Input
                      type="email"
                      value={newCashier.email}
                      onChange={(e) => setNewCashier({ ...newCashier, email: e.target.value })}
                      placeholder="cashier@store.com"
                      className="mt-1"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isAr ? 'إذا ترك فارغاً، يتم تسجيل الدخول بكود الموظف وكلمة المرور.' : 'If left empty, the cashier logs in with Employee Code + Password.'}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddCashierDialogOpen(false)} className="flex-1">
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button type="submit" className="flex-1 liquid-btn-primary font-bold">
                      {isAr ? 'حفظ وإنشاء الكاشير' : 'Save Cashier User'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* General Add Employee Dialog Button */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <Button onClick={handleOpenAddDialog} variant="outline" className="font-bold gap-2 text-xs h-10 px-3 border-slate-300 dark:border-white/10">
                <UserPlus className="w-4 h-4" />
                <span>{isAr ? '+ إضافة موظف / منصب آخر' : '+ Add Other Role'}</span>
              </Button>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{isAr ? 'إضافة موظف جديد' : 'Add New Employee'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddStaff} className="space-y-4 pt-2">
                  {addError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                      {addError}
                    </div>
                  )}
                  <div>
                    <Label className="text-xs font-semibold">{isAr ? 'الاسم الكامل *' : 'Full Name *'}</Label>
                    <Input
                      required
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                      placeholder={isAr ? 'اسم الموظف' : 'Employee full name'}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-semibold">{isAr ? 'المنصب / الصلاحية' : 'Role / Permission'}</Label>
                    <Select value={newStaff.role} onValueChange={(value) => setNewStaff({ ...newStaff, role: value })}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Employee Code / PIN */}
                  <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{isAr ? 'كود الموظف (PIN)' : 'Employee Code (PIN)'}</span>
                      </Label>
                      <button
                        type="button"
                        onClick={() => setNewStaff(prev => ({ ...prev, joinCode: generateRandomCode() }))}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>{isAr ? 'توليد جديد' : 'Regenerate'}</span>
                      </button>
                    </div>
                    <Input
                      required
                      value={newStaff.joinCode}
                      onChange={(e) => setNewStaff({ ...newStaff, joinCode: e.target.value })}
                      placeholder="6-digit PIN"
                      className="font-mono text-center tracking-widest text-lg font-bold bg-white dark:bg-slate-900"
                      maxLength={10}
                    />
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {isAr 
                        ? 'كود الموظف للتعريف وتسجيل الدخول وبدء الورديات.' 
                        : 'Unique code for employee login and shift management.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                        {isAr ? 'تمكين تسجيل الدخول للنظام' : 'Enable System Login'}
                      </Label>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'تفعيل ليتمكن الموظف من تسجيل الدخول بكلمة مرور' : 'Allow this employee to log into the POS system'}
                      </p>
                    </div>
                    <Switch
                      checked={newStaff.canLogin}
                      onCheckedChange={(c: boolean) => setNewStaff({ ...newStaff, canLogin: c })}
                    />
                  </div>

                  {newStaff.canLogin && (
                    <div className="space-y-3 p-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                      <div>
                        <Label className="text-xs font-semibold">{isAr ? 'تعيين كلمة المرور الأولية *' : 'Set Initial Password *'}</Label>
                        <div className="relative mt-1">
                          <Input
                            type={showNewStaffPassword ? 'text' : 'password'}
                            required={newStaff.canLogin}
                            value={newStaff.password}
                            onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                            placeholder={isAr ? 'أدخل كلمة مرور للموظف' : 'Enter login password'}
                            className="pe-10 bg-white dark:bg-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewStaffPassword(!showNewStaffPassword)}
                            className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewStaffPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isAr ? 'يمكن للموظف الدخول بكود الموظف وهذه الكلمة مباشرة.' : 'Employee can sign in using their Employee Code and this password.'}
                        </p>
                      </div>

                      <div>
                        <Label className="text-xs font-semibold">{isAr ? 'البريد الإلكتروني (اختياري)' : 'Email Address (Optional)'}</Label>
                        <Input
                          type="email"
                          value={newStaff.email}
                          onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                          placeholder="staff@company.com"
                          className="mt-1 bg-white dark:bg-slate-900"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button type="submit" className="flex-1 liquid-btn-primary font-bold">
                      {isAr ? 'إنشاء الموظف' : 'Create Employee'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Role Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 dark:border-white/[0.08] pb-3">
        <button
          type="button"
          onClick={() => setRoleFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            roleFilter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white/60 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
        >
          {isAr ? `جميع الموظفين (${staff.length})` : `All Staff (${staff.length})`}
        </button>
        <button
          type="button"
          onClick={() => setRoleFilter('cashier')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            roleFilter === 'cashier'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white/60 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>{isAr ? `الكاشير فقط (${staff.filter(s => s.role === 'cashier').length})` : `Cashiers Only (${staff.filter(s => s.role === 'cashier').length})`}</span>
        </button>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {(roleFilter === 'all' ? staff : staff.filter(s => s.role === 'cashier')).map((member) => {
          const isRevealed = !!revealedCodes[member.id]
          const code = member.joinCode || '------'

          return (
            <Card key={member.id} className={`glass-card ${!member.isActive ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-400/20 dark:text-blue-300 flex items-center justify-center">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{member.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    member.isActive
                      ? 'bg-emerald-500/15 text-emerald-600 dark:bg-emerald-400/20 dark:text-emerald-300'
                      : 'bg-rose-500/15 text-rose-600 dark:bg-rose-400/20 dark:text-rose-300'
                  }`}>
                    {member.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline block truncate font-medium"
                    title="Email employee"
                  >
                    {member.email}
                  </a>
                ) : (
                  <div className="text-[11px] text-slate-400 italic">
                    {isAr ? 'تسجيل دخول بكود الموظف' : 'Login via Employee Code'}
                  </div>
                )}
                
                <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.05]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{isAr ? 'الصلاحية' : 'Role'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">{member.role}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${member.canLogin !== false ? 'bg-indigo-500/15 text-indigo-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                      {member.canLogin !== false ? (isAr ? 'دخول مفعل' : 'Login ON') : (isAr ? 'بدون دخول' : 'No Login')}
                    </span>
                  </div>
                </div>

                {/* Clock-In / Employee Code Card Section */}
                <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-blue-500" />
                      <span>{isAr ? 'كود الموظف / الدخول' : 'Employee Code'}</span>
                    </span>
                    {canManageStaff && (
                      <button
                        onClick={() => handleRegenerateCode(member.id)}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="Regenerate PIN"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>{isAr ? 'إعادة توليد' : 'Reset'}</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="font-mono font-bold text-sm tracking-widest text-slate-900 dark:text-white px-2 py-1 bg-white/80 dark:bg-slate-900/80 rounded border border-slate-200/60 dark:border-slate-700/60 flex-1">
                      {isRevealed ? code : '••••••'}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleRevealCode(member.id)}
                      className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title={isRevealed ? "Hide Code" : "Reveal Code"}
                    >
                      {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(code, member.id)}
                      className="p-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      title="Copy Clock-in Code"
                    >
                      {copiedId === member.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  {isAr ? 'تاريخ الانضمام:' : 'Joined:'} {new Date(member.createdAt).toLocaleDateString()}
                </p>

                {canManageStaff && (
                  <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="grid grid-cols-2 gap-1.5">
                      {/* Edit Profile & Role Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditStaff(member)}
                        className="text-xs font-semibold gap-1 hover:border-blue-500 hover:text-blue-600 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-500" />
                        <span>{isAr ? 'تعديل البيانات' : 'Edit Staff'}</span>
                      </Button>

                      {/* Quick Change Password Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenChangePassword(member)}
                        className="text-xs font-semibold gap-1 hover:border-amber-500 hover:text-amber-600 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{isAr ? 'كلمة المرور' : 'Password'}</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStaffStatus(member.id, member.isActive)}
                        className="text-xs font-semibold gap-1"
                      >
                        {member.isActive ? (
                          <>
                            <UserX className="w-3.5 h-3.5 text-amber-500" />
                            <span>{isAr ? 'تعطيل' : 'Deactivate'}</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{isAr ? 'تفعيل' : 'Activate'}</span>
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMemberToDelete(member)}
                        className="text-xs font-semibold gap-1 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        <span>{isAr ? 'حذف' : 'Remove'}</span>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: EDIT STAFF & CHANGE PASSWORD */}
      {/* ========================================================================= */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>{isAr ? `تعديل الموظف: ${editingStaff?.name}` : `Edit Staff: ${editingStaff?.name}`}</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditStaff} className="space-y-4 pt-2">
            {editError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {editError}
              </div>
            )}
            <div>
              <Label className="text-xs font-semibold">{isAr ? 'الاسم الكامل *' : 'Full Name *'}</Label>
              <Input
                required
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">{isAr ? 'المنصب / الصلاحية' : 'Role / Permission'}</Label>
              <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })}>
                <SelectTrigger className="mt-1 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="admin">Admin</SelectItem>}
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employee Code / PIN */}
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isAr ? 'كود الموظف / تسجيل الحضور (PIN)' : 'Employee Code / PIN'}</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setEditFormData(prev => ({ ...prev, joinCode: generateRandomCode() }))}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  {isAr ? 'توليد جديد' : 'Regenerate'}
                </button>
              </div>
              <Input
                required
                value={editFormData.joinCode}
                onChange={(e) => setEditFormData({ ...editFormData, joinCode: e.target.value })}
                className="font-mono text-center tracking-widest text-sm font-bold bg-white dark:bg-slate-900"
                maxLength={10}
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">{isAr ? 'البريد الإلكتروني (اختياري)' : 'Email Address (Optional)'}</Label>
              <Input
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="staff@company.com"
                className="mt-1 text-xs"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer">
                  {isAr ? 'تمكين تسجيل الدخول للنظام' : 'Enable System Login'}
                </Label>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'السماح للموظف بالدخول للوحة التحكم ونقاط البيع' : 'Allow this staff member to log in'}
                </p>
              </div>
              <Switch
                checked={editFormData.canLogin}
                onCheckedChange={(c: boolean) => setEditFormData({ ...editFormData, canLogin: c })}
              />
            </div>

            {/* Admin Password Change Section */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{isAr ? 'تغيير كلمة المرور للموظف' : 'Change Employee Password'}</span>
                </Label>
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="text-[11px] text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showEditPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showEditPassword ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}</span>
                </button>
              </div>
              <Input
                type={showEditPassword ? 'text' : 'password'}
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                placeholder={isAr ? 'اتركه فارغاً للإبقاء على الحالية أو أدخل كلمة سر جديدة' : 'Leave blank to keep current, or enter new password'}
                className="mt-1 text-xs bg-white dark:bg-slate-900"
              />
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                {isAr ? 'يمكن للمدير تعيين كلمة مرور جديدة للموظف مباشرة.' : 'Admin can directly set or reset the password for this staff member.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" size="sm" disabled={isSavingEdit} className="liquid-btn-primary font-bold">
                {isSavingEdit ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: DIRECT CHANGE PASSWORD DIALOG */}
      {/* ========================================================================= */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-500" />
              <span>{isAr ? `تغيير كلمة المرور: ${passwordStaff?.name}` : `Reset Password: ${passwordStaff?.name}`}</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveQuickPassword} className="space-y-4 pt-2">
            {passwordDialogError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {passwordDialogError}
              </div>
            )}

            <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'الموظف:' : 'Employee:'}</span>
                <span className="font-bold">{passwordStaff?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isAr ? 'كود الموظف:' : 'Employee Code:'}</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{passwordStaff?.joinCode || '------'}</span>
              </div>
              {passwordStaff?.email && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'البريد:' : 'Email:'}</span>
                  <span>{passwordStaff.email}</span>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs font-semibold">{isAr ? 'كلمة المرور الجديدة *' : 'New Password *'}</Label>
              <div className="relative mt-1">
                <Input
                  type={showPasswordOnly ? 'text' : 'password'}
                  required
                  autoFocus
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder={isAr ? 'أدخل كلمة المرور الجديدة للموظف' : 'Enter new password'}
                  className="pe-10 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordOnly(!showPasswordOnly)}
                  className="absolute inset-y-0 end-0 flex items-center px-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPasswordOnly ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                {isAr 
                  ? 'سيتم تحديث كلمة المرور فوراً وسيتمكن الموظف من تسجيل الدخول بها مع كود الموظف.' 
                  : 'The password will be updated immediately for sign in with employee code.'}
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsPasswordDialogOpen(false)}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" size="sm" disabled={isSavingPasswordOnly} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
                {isSavingPasswordOnly ? (isAr ? 'جاري التحديث...' : 'Updating...') : (isAr ? 'تحديث كلمة المرور' : 'Update Password')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* MODAL: REMOVE STAFF CONFIRMATION */}
      {/* ========================================================================= */}
      <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <UserMinus className="w-5 h-5" />
              <span>{isAr ? 'تأكيد حذف الموظف' : 'Confirm Remove Staff'}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <p>
              {isAr
                ? `هل أنت متأكد من حذف الموظف "${memberToDelete?.name}" نهائياً من النظام؟`
                : `Are you sure you want to permanently remove employee "${memberToDelete?.name}"?`}
            </p>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? 'سيتم حذف الملف الشخصي وسجل الدخول الخاص بالموظف.'
                : 'This will remove their profile and credentials from the system.'}
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMemberToDelete(null)}
              disabled={isDeleting}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeleteStaff}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isDeleting ? (isAr ? 'جاري الحذف...' : 'Removing...') : (isAr ? 'حذف الموظف' : 'Yes, Remove')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
