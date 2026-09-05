'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthStore } from '@/lib/store'
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
  EyeOff
} from 'lucide-react'

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  joinCode?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function StaffManager() {
  const { user } = useAuthStore()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({})

  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    joinCode: ''
  })
  const [addError, setAddError] = useState<string | null>(null)

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

  const handleOpenAddDialog = () => {
    setNewStaff({
      name: '',
      email: '',
      password: 'password123',
      role: 'cashier',
      joinCode: generateRandomCode()
    })
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
        body: JSON.stringify(newStaff)
      })
      const data = await response.json()
      if (response.ok) {
        setIsAddDialogOpen(false)
        fetchStaff()
      } else {
        setAddError(data.error || 'Failed to add staff member')
      }
    } catch (error: any) {
      setAddError(error.message || 'Failed to add staff member')
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
        fetchStaff()
      }
    } catch (error) {
      console.error('Failed to update staff status:', error)
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
      }
    } catch (err) {
      console.error('Failed to regenerate code:', err)
    }
  }

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleRevealCode = (id: string) => {
    setRevealedCodes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Loading staff...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
            Staff & Employee Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage cafe employees, permission roles, and clock-in security codes</p>
        </div>
        {canManageStaff && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Button onClick={handleOpenAddDialog} className="liquid-btn-primary font-bold gap-2">
              <UserPlus className="w-4 h-4" />
              <span>Add Employee</span>
            </Button>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Employee</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddStaff} className="space-y-4 pt-2">
                {addError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                    {addError}
                  </div>
                )}
                <div>
                  <Label className="text-xs font-semibold">Full Name</Label>
                  <Input
                    required
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    placeholder="e.g. Alex Morgan"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Email</Label>
                  <Input
                    type="email"
                    required
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                    placeholder="alex@cafe.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Password</Label>
                  <Input
                    type="password"
                    required
                    value={newStaff.password}
                    onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Role</Label>
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

                <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 space-y-2">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Employee Clock-In Code (PIN)</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => setNewStaff(prev => ({ ...prev, joinCode: generateRandomCode() }))}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate</span>
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
                    The employee will enter this code or tap an NFC card to clock in to their shift.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 liquid-btn-primary font-bold">
                    Create Employee
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((member) => {
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
                    {member.isActive ? 'Active' : 'Inactive'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                <p className="text-xs text-slate-400">{member.email}</p>
                
                <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/50 dark:border-white/[0.05]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Role</span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">{member.role}</span>
                </div>

                {/* Clock-In Code Card Section */}
                <div className="p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/[0.06] space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-blue-500" />
                      Clock-In Code
                    </span>
                    {canManageStaff && (
                      <button
                        onClick={() => handleRegenerateCode(member.id)}
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        title="Regenerate PIN"
                      >
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Reset</span>
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
                  Joined: {new Date(member.createdAt).toLocaleDateString()}
                </p>

                {canManageStaff && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleStaffStatus(member.id, member.isActive)}
                    className="w-full text-xs font-semibold gap-1.5 mt-1"
                  >
                    {member.isActive ? (
                      <>
                        <UserX className="w-3.5 h-3.5 text-rose-500" />
                        <span>Deactivate Account</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Activate Account</span>
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
