import { offlineStore, OfflineSyncEvent } from './offline-store'

export type SyncState = 'synced' | 'syncing' | 'offline' | 'error'

export interface SyncStatus {
  state: SyncState
  pendingCount: number
  lastSyncedAt: Date | null
  lastError: string | null
}

class SyncEngine {
  private isProcessing = false
  private statusListeners: Array<(status: SyncStatus) => void> = []
  private currentStatus: SyncStatus = {
    state: 'synced',
    pendingCount: 0,
    lastSyncedAt: null,
    lastError: null
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.currentStatus.pendingCount = offlineStore.getQueue().length
      this.currentStatus.lastSyncedAt = offlineStore.getLastSynced()
      this.currentStatus.state = navigator.onLine ? (this.currentStatus.pendingCount > 0 ? 'syncing' : 'synced') : 'offline'

      window.addEventListener('online', () => {
        this.updateStatus({ state: 'syncing', lastError: null })
        this.processQueue()
      })

      window.addEventListener('offline', () => {
        this.updateStatus({ state: 'offline' })
      })

      const handleQueueChange = (e: any) => {
        const count = e.detail?.count ?? offlineStore.getQueue().length
        this.updateStatus({
          pendingCount: count,
          state: !navigator.onLine ? 'offline' : (count > 0 ? 'syncing' : 'synced')
        })
      }
      window.addEventListener('dafaterkom:sync_queue_changed', handleQueueChange)
      window.addEventListener('cashir:sync_queue_changed', handleQueueChange)

      // Background sync heartbeat every 15 seconds
      setInterval(() => {
        if (navigator.onLine && offlineStore.getQueue().length > 0) {
          this.processQueue()
        }
      }, 15000)
    }
  }

  public getStatus(): SyncStatus {
    return { ...this.currentStatus }
  }

  public subscribe(listener: (status: SyncStatus) => void): () => void {
    this.statusListeners.push(listener)
    listener(this.currentStatus)
    return () => {
      this.statusListeners = this.statusListeners.filter(l => l !== listener)
    }
  }

  private updateStatus(partial: Partial<SyncStatus>) {
    this.currentStatus = { ...this.currentStatus, ...partial }
    this.statusListeners.forEach(listener => listener(this.currentStatus))
  }

  /**
   * Process all queued events against the Hub / Cloud API
   */
  public async processQueue(): Promise<void> {
    if (this.isProcessing) return
    const queue = offlineStore.getQueue()
    if (queue.length === 0) {
      this.updateStatus({ state: 'synced', pendingCount: 0 })
      return
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.updateStatus({ state: 'offline' })
      return
    }

    this.isProcessing = true
    this.updateStatus({ state: 'syncing', lastError: null })

    for (const event of queue) {
      try {
        let success = false
        if (event.entityType === 'order' && event.action === 'create') {
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event.payload)
          })
          if (res.ok) {
            success = true
          } else {
            const err = await res.json()
            console.warn('Sync failed for order:', err)
          }
        } else {
          // Send generic sync event to batch reconciliation endpoint
          const res = await fetch('/api/sync/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(event)
          })
          if (res.ok) {
            success = true
          }
        }

        if (success) {
          offlineStore.dequeue(event.id)
        }
      } catch (err: any) {
        console.error('Error syncing event:', event.id, err)
        this.updateStatus({
          state: 'error',
          lastError: err.message || 'Network sync error'
        })
        this.isProcessing = false
        return
      }
    }

    const remaining = offlineStore.getQueue().length
    offlineStore.setLastSynced(new Date())
    this.isProcessing = false
    this.updateStatus({
      state: remaining > 0 ? 'syncing' : 'synced',
      pendingCount: remaining,
      lastSyncedAt: new Date(),
      lastError: null
    })
  }
}

export const syncEngine = new SyncEngine()
