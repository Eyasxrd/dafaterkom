'use client'

import React, { useState, useEffect } from 'react'
import { syncEngine, SyncStatus } from '@/lib/sync/sync-engine'
import { offlineStore } from '@/lib/sync/offline-store'
import { Wifi, WifiOff, RefreshCw, CheckCircle2, AlertTriangle, Database, Smartphone } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function SyncStatusBadge() {
  const [status, setStatus] = useState<SyncStatus>(syncEngine.getStatus())
  const [showModal, setShowModal] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [devices, setDevices] = useState<any[]>([])

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((newStatus) => {
      setStatus(newStatus)
    })
    return () => unsubscribe()
  }, [])

  const handleManualSync = async () => {
    setIsRetrying(true)
    await syncEngine.processQueue()
    setIsRetrying(false)
  }

  const fetchDevices = async () => {
    try {
      const res = await fetch('/api/sync/devices')
      if (res.ok) {
        const data = await res.json()
        setDevices(data)
      }
    } catch (e) {
      console.error('Failed to load devices:', e)
    }
  }

  const openDiagnostics = () => {
    setShowModal(true)
    fetchDevices()
  }

  const getBadgeContent = () => {
    if (status.state === 'offline') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
          <WifiOff className="w-3.5 h-3.5 animate-pulse" />
          <span>Offline ({status.pendingCount})</span>
        </span>
      )
    }
    if (status.state === 'syncing' || isRetrying) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Syncing ({status.pendingCount})...</span>
        </span>
      )
    }
    if (status.state === 'error') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Sync Error</span>
        </span>
      )
    }
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>LAN Synced</span>
      </span>
    )
  }

  return (
    <>
      <button
        onClick={openDiagnostics}
        className="cursor-pointer hover:opacity-85 transition-opacity"
        title="LAN & Cloud Sync Status"
      >
        {getBadgeContent()}
      </button>

      {/* Diagnostics / Hub Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-lg">LAN Hub & Offline Sync</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                <div>
                  <div className="text-sm font-medium">Connection State</div>
                  <div className="text-xs text-zinc-500">
                    {status.state === 'offline' ? 'Operating in offline local cache' : 'Connected to Shop LAN Hub'}
                  </div>
                </div>
                {getBadgeContent()}
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                <div>
                  <div className="text-sm font-medium">Offline Queued Events</div>
                  <div className="text-xs text-zinc-500">Changes awaiting reconciliation</div>
                </div>
                <span className="text-sm font-bold">{status.pendingCount} events</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50">
                <div>
                  <div className="text-sm font-medium">Last Reconciliation</div>
                  <div className="text-xs text-zinc-500">
                    {status.lastSyncedAt
                      ? new Date(status.lastSyncedAt).toLocaleTimeString()
                      : 'Never'}
                  </div>
                </div>
                <button
                  onClick={handleManualSync}
                  disabled={isRetrying}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>
              </div>

              {/* Connected LAN devices */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Paired Devices on Shop LAN
                  </h4>
                  <span className="text-xs text-zinc-500">{devices.length} active</span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {devices.length === 0 ? (
                    <div className="text-xs text-zinc-500 p-2 text-center">
                      Main Register running as LAN Hub
                    </div>
                  ) : (
                    devices.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/30 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
                          <span className="font-medium">{d.name}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-[10px] uppercase font-bold text-zinc-600 dark:text-zinc-300">
                          {d.role}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
