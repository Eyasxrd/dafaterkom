'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/lib/store'
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
  Timer
} from 'lucide-react'

interface Shift {
  id: string
  staffId: string
  startTime: string
  endTime?: string | null
  status: string
  startCash: number
  endCash?: number | null
  cashSales: number
  cardSales: number
  totalOrders: number
  notes?: string | null
  staff: {
    name: string
    role: string
  }
}

interface ActiveShiftData {
  shift: Shift | null
  stats: {
    totalOrders: number
    cashSales: number
    cardSales: number
    totalSales: number
    expectedCash: number
  } | null
}

export default function ShiftManager() {
  const { user } = useAuthStore()
  const [activeData, setActiveData] = useState<ActiveShiftData>({ shift: null, stats: null })
  const [shiftsHistory, setShiftsHistory] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)

  // Start shift state
  const [isStartShiftOpen, setIsStartShiftOpen] = useState(false)
  const [startMethod, setStartMethod] = useState<'code' | 'nfc'>('code')
  const [employeeCode, setEmployeeCode] = useState('')
  const [openingFloat, setOpeningFloat] = useState('100.00')
  const [startNotes, setStartNotes] = useState('')
  const [startError, setStartError] = useState<string | null>(null)
  const [nfcScanning, setNfcScanning] = useState(false)
  const [nfcSuccess, setNfcSuccess] = useState<string | null>(null)

  // Live Elapsed Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  // Close shift dialog
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false)
  const [closingCash, setClosingCash] = useState('')
  const [closeNotes, setCloseNotes] = useState('')
  const [zReportData, setZReportData] = useState<any | null>(null)

  useEffect(() => {
    fetchActiveShift()
    fetchShiftsHistory()
  }, [user])

  // Timer interval for active shift
  useEffect(() => {
    if (!activeData.shift) {
      setElapsedSeconds(0)
      return
    }

    const startTimestamp = new Date(activeData.shift.startTime).getTime()
    const updateTimer = () => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - startTimestamp) / 1000))
      setElapsedSeconds(diffSecs)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [activeData.shift])

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const fetchActiveShift = async () => {
    if (!user?.id) return
    try {
      const res = await fetch(`/api/shifts?staffId=${user.id}&activeOnly=true`)
      const data = await res.json()
      setActiveData(data)
    } catch (e) {
      console.error('Failed to fetch active shift:', e)
    } finally {
      setLoading(false)
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

  const handleStartShift = async (codeToUse?: string) => {
    const code = (codeToUse || employeeCode).trim()
    if (!code) {
      setStartError('Please enter or scan your employee clock-in code')
      return
    }

    setStartError(null)

    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: user?.id,
          employeeCode: code,
          startCash: openingFloat,
          notes: startNotes
        })
      })

      const data = await res.json()
      if (res.ok) {
        setIsStartShiftOpen(false)
        setEmployeeCode('')
        setStartNotes('')
        setNfcSuccess(null)
        fetchActiveShift()
        fetchShiftsHistory()
      } else {
        setStartError(data.error || 'Failed to start shift')
      }
    } catch (e: any) {
      setStartError(e.message || 'Failed to start shift')
    }
  }

  const handleCloseShift = async () => {
    if (!activeData.shift) return
    try {
      const res = await fetch('/api/shifts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: activeData.shift.id,
          endCash: closingCash,
          notes: closeNotes
        })
      })

      if (res.ok) {
        const data = await res.json()
        setZReportData(data.zReport)
        setIsCloseShiftOpen(false)
        setClosingCash('')
        setCloseNotes('')
        fetchActiveShift()
        fetchShiftsHistory()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to close shift')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Simulate NFC Scan or trigger Web NFC
  const handleTriggerNFCScan = async () => {
    setNfcScanning(true)
    setStartError(null)
    setNfcSuccess(null)

    // Check if Web NFC is supported by the device browser
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      try {
        const ndef = new (window as any).NDEFReader()
        await ndef.scan()
        ndef.onreading = (event: any) => {
          const serialNumber = event.serialNumber || '100002'
          setNfcSuccess(`NFC Tag Detected (${serialNumber})`)
          setEmployeeCode(serialNumber)
          setNfcScanning(false)
          handleStartShift(serialNumber)
        }
        return
      } catch (err: any) {
        console.log('Web NFC error or not permitted:', err)
      }
    }

    // Fallback/Simulation for testing: simulates wall-mounted scanner reading NFC card
    setTimeout(() => {
      // Use standard cafe staff code for simulation
      const simulatedBadgeCode = '100002'
      setNfcScanning(false)
      setNfcSuccess(`NFC Badge Scanned: ID #${simulatedBadgeCode}`)
      setEmployeeCode(simulatedBadgeCode)
    }, 1200)
  }

  const handleKeypadPress = (val: string) => {
    if (employeeCode.length < 10) {
      setEmployeeCode(prev => prev + val)
    }
  }

  const handleKeypadBackspace = () => {
    setEmployeeCode(prev => prev.slice(0, -1))
  }

  const handleKeypadClear = () => {
    setEmployeeCode('')
  }

  const shift = activeData.shift
  const stats = activeData.stats

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 dark:from-white dark:via-blue-100 dark:to-slate-300 bg-clip-text text-transparent">
            Shift & Cash Register Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track employee work shifts, live duration timers, opening floats & Z-Reports</p>
        </div>
        {!shift ? (
          <Button
            onClick={() => {
              setStartError(null)
              setEmployeeCode('')
              setNfcSuccess(null)
              setIsStartShiftOpen(true)
            }}
            className="liquid-btn-primary font-bold gap-2 text-sm h-10 px-5 shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Clock In / Start Shift</span>
          </Button>
        ) : (
          <Button
            onClick={() => {
              setClosingCash(stats?.expectedCash.toFixed(2) || '0.00')
              setIsCloseShiftOpen(true)
            }}
            variant="destructive"
            className="font-bold gap-2 text-sm h-10 px-5 shadow-lg"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Clock Out / End Shift</span>
          </Button>
        )}
      </div>

      {/* Active Shift Dashboard Banner */}
      {shift && stats ? (
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
                      Active Shift: {shift.staff.name}
                    </CardTitle>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                      Clocked In
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Started at {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              {/* Real-time Ticking Elapsed Timer */}
              <div className="flex items-center gap-4 bg-white/60 dark:bg-slate-900/60 px-4 py-2 rounded-2xl border border-slate-200/60 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin-slow" />
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block">Shift Duration</span>
                    <span className="text-lg font-mono font-black text-blue-600 dark:text-blue-400">
                      {formatTimer(elapsedSeconds)}
                    </span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchActiveShift}
                  className="text-xs gap-1.5 font-semibold h-8"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Refresh</span>
                </Button>
              </div>
            </div>
          </div>

          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Opening Float</p>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">${shift.startCash.toFixed(2)}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Cash Sales</p>
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">${stats.cashSales.toFixed(2)}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
                <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Card / Mobile</p>
                <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">${stats.cardSales.toFixed(2)}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.08]">
                <p className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Orders Served</p>
                <p className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{stats.totalOrders}</p>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/30 dark:border-blue-400/20">
                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-300 uppercase tracking-wider">Expected Cash</p>
                <p className="text-2xl font-black text-blue-700 dark:text-blue-200 mt-1">
                  ${stats.expectedCash.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card border border-dashed border-slate-300 dark:border-white/10 p-8 text-center rounded-3xl">
          <div className="max-w-sm mx-auto space-y-3">
            <div className="w-16 h-16 rounded-3xl glass-pill flex items-center justify-center mx-auto mb-2 text-slate-400">
              <Clock className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Active Shift</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              You are currently clocked out. Enter your employee code or scan your NFC badge to start a shift and begin tracking duration & orders.
            </p>
            <Button onClick={() => setIsStartShiftOpen(true)} className="liquid-btn-primary font-bold gap-2">
              <Play className="w-4 h-4 fill-current" />
              <span>Clock In Now</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Shifts History Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Recent Shift Records & Z-Reports</CardTitle>
        </CardHeader>
        <CardContent>
          {shiftsHistory.length === 0 ? (
            <p className="text-slate-400 text-center py-6 text-sm">No recorded shifts found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/50 dark:bg-white/[0.04] border-b border-slate-200/60 dark:border-white/[0.08] uppercase font-semibold text-slate-500">
                  <tr>
                    <th className="p-3">Staff</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Start Time</th>
                    <th className="p-3">End Time</th>
                    <th className="p-3 text-right">Start Float</th>
                    <th className="p-3 text-right">Cash Sales</th>
                    <th className="p-3 text-right">Card Sales</th>
                    <th className="p-3 text-right">End Cash Counted</th>
                    <th className="p-3 text-right">Variance</th>
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
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.status === 'active' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                            {s.status}
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
                        <td className="p-3 text-right font-medium text-blue-600">${s.cardSales.toFixed(2)}</td>
                        <td className="p-3 text-right font-semibold">
                          {s.endCash !== null && s.endCash !== undefined ? `$${s.endCash.toFixed(2)}` : '—'}
                        </td>
                        <td className="p-3 text-right font-bold">
                          {diff !== null ? (
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

      {/* Clock In / Start Shift Modal with Code & NFC Integration */}
      <Dialog open={isStartShiftOpen} onOpenChange={setIsStartShiftOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Clock In / Open Shift</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {startError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
                {startError}
              </div>
            )}

            {/* Auth Method Toggle: Keypad Code vs NFC Wall Scan */}
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
                <span>Employee PIN</span>
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
                <span>NFC Wall Scanner</span>
              </button>
            </div>

            {startMethod === 'code' ? (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold">Employee Clock-In Code</Label>
                  <Input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    placeholder="Enter 6-digit employee PIN"
                    className="font-mono text-center tracking-widest text-xl font-black mt-1"
                    maxLength={10}
                  />
                </div>

                {/* On-screen PIN Pad */}
                <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-500 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-sm text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    className="h-10 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 cursor-pointer"
                  >
                    <Delete className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* NFC Wall Scanner Interface / Simulation */
              <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-500/10 to-indigo-500/10 border border-blue-500/20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center mx-auto relative">
                  <Radio className={`w-8 h-8 text-blue-600 dark:text-blue-400 ${nfcScanning ? 'animate-pulse' : ''}`} />
                  {nfcScanning && (
                    <span className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Wall Device Reader Ready
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Hold employee NFC card, wristband, or badge against the wall sensor
                  </p>
                </div>

                {nfcSuccess && (
                  <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{nfcSuccess}</span>
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTriggerNFCScan}
                  disabled={nfcScanning}
                  className="w-full text-xs font-semibold gap-1.5"
                >
                  <Radio className="w-3.5 h-3.5 text-blue-500" />
                  <span>{nfcScanning ? 'Scanning for Card...' : 'Simulate Wall Device NFC Tap (Badge #100002)'}</span>
                </Button>
              </div>
            )}

            {/* Opening Float & Notes */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.08] space-y-3">
              <div>
                <Label className="text-xs font-semibold">Opening Cash Drawer Float ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  placeholder="100.00"
                  className="mt-1 font-bold"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Shift Notes (Optional)</Label>
                <Input
                  value={startNotes}
                  onChange={(e) => setStartNotes(e.target.value)}
                  placeholder="e.g. Morning counter shift"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsStartShiftOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => handleStartShift()}
                className="flex-1 liquid-btn-primary font-bold gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Confirm & Clock In</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* End Shift (Clock Out) Modal */}
      <Dialog open={isCloseShiftOpen} onOpenChange={setIsCloseShiftOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>End Shift & Z-Report Reconciliation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-xs space-y-1">
              <div className="flex justify-between">
                <span>Opening Cash:</span>
                <span className="font-semibold">${shift?.startCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shift Cash Sales:</span>
                <span className="font-semibold text-emerald-600">+${stats?.cashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 font-bold">
                <span>Expected Drawer Total:</span>
                <span className="text-blue-600 dark:text-blue-400">${stats?.expectedCash.toFixed(2)}</span>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Actual Cash Drawer Counted ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={closingCash}
                onChange={(e) => setClosingCash(e.target.value)}
                placeholder={stats?.expectedCash.toFixed(2) || '0.00'}
                className="mt-1 font-bold text-lg"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Closing Notes (Optional)</Label>
              <Input
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
                placeholder="Discrepancies, payouts, drawer notes"
                className="mt-1"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsCloseShiftOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCloseShift} variant="destructive" className="flex-1 font-bold">
                Confirm & Clock Out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
