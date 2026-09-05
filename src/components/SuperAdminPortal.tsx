'use client'

import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Key,
  Eye,
  RefreshCw,
  Search
} from 'lucide-react'

export default function SuperAdminPortal() {
  const [stats, setStats] = useState<any>(null)
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const loadData = async () => {
    setLoading(true)
    try {
      const [resStats, resTenants] = await Promise.all([
        fetch('/api/super-admin/stats'),
        fetch('/api/super-admin/tenants')
      ])
      if (resStats.ok) setStats(await resStats.json())
      if (resTenants.ok) setTenants(await resTenants.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAction = async (tenantId: string, action: string, extra: any = {}) => {
    setActionLoading(tenantId + action)
    setMessage('')
    try {
      const res = await fetch('/api/super-admin/tenants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, action, ...extra })
      })
      if (res.ok) {
        setMessage(`Action '${action}' completed successfully!`)
        await loadData()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredTenants = tenants.filter(t =>
    t.businessName.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-emerald-500" />
            <h1 className="text-2xl font-extrabold tracking-tight">SaaS Operator Control Plane</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">
            Global management portal for all customer cafes, subscriptions, license keys, and sync health.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-semibold flex items-center gap-2 transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}

      {/* SaaS Business Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase">Est. Monthly Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            ${stats?.mrr || 0}
          </div>
          <div className="text-[11px] text-zinc-400">ARR: ${(stats?.arr || 0).toLocaleString()}</div>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase">Total Cafes</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono">
            {stats?.totalTenants || 0}
          </div>
          <div className="text-[11px] text-emerald-500">{stats?.activeTenants || 0} paying active</div>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase">Connected Devices</span>
            <Smartphone className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono">
            {stats?.totalDevices || 0}
          </div>
          <div className="text-[11px] text-zinc-400">Terminals, KDS & Hubs</div>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-medium uppercase">Total Cloud Orders</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl md:text-3xl font-extrabold font-mono">
            {stats?.totalOrders || 0}
          </div>
          <div className="text-[11px] text-zinc-400">{stats?.totalSyncEvents || 0} sync events logged</div>
        </div>
      </div>

      {/* Tenant Fleet Directory */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Tenant Customer Accounts ({filteredTenants.length})</h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              placeholder="Search cafe name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs w-full sm:w-64 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 uppercase tracking-wider text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="p-4">Cafe / Shop</th>
                  <th className="p-4">Plan Tier</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Devices / Orders</th>
                  <th className="p-4">License Expiry</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredTenants.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-sm">{t.businessName}</div>
                      <div className="text-zinc-400 font-mono text-[10px]">{t.slug} • {t.currency}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {t.plan}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        t.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : t.status === 'trial'
                          ? 'bg-blue-500/10 text-blue-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{t._count?.devices || 0} devices</div>
                      <div className="text-zinc-400">{t._count?.orders || 0} orders</div>
                    </td>
                    <td className="p-4 font-mono text-[11px]">
                      {t.licenses?.[0]?.expiresAt
                        ? new Date(t.licenses[0].expiresAt).toLocaleDateString()
                        : 'No key issued'}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {/* Extend Trial */}
                      <button
                        onClick={() => handleAction(t.id, 'extend_trial', { days: 14 })}
                        disabled={actionLoading === t.id + 'extend_trial'}
                        className="px-2.5 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-semibold transition-colors"
                        title="Extend trial by 14 days"
                      >
                        +14d Trial
                      </button>

                      {/* Issue License */}
                      <button
                        onClick={() => handleAction(t.id, 'issue_license', { plan: 'growth' })}
                        disabled={actionLoading === t.id + 'issue_license'}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors shadow-sm"
                        title="Issue 1-Year Signed License Token"
                      >
                        <Key className="w-3 h-3 inline mr-1" />
                        Issue Key
                      </button>

                      {/* Suspend / Activate */}
                      <button
                        onClick={() => handleAction(t.id, 'update_status', { status: t.status === 'active' ? 'suspended' : 'active' })}
                        disabled={actionLoading === t.id + 'update_status'}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                          t.status === 'active'
                            ? 'text-rose-500 hover:bg-rose-500/10'
                            : 'text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                      >
                        {t.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
