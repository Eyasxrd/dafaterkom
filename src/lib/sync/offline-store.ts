export interface OfflineSyncEvent {
  id: string
  deviceId: string
  entityType: 'order' | 'inventory' | 'customer' | 'shift'
  action: 'create' | 'update' | 'delete'
  payload: any
  timestamp: number
  retryCount: number
}

const SYNC_QUEUE_KEY = 'dafaterkom_offline_sync_queue'
const CACHED_MENU_KEY = 'dafaterkom_cached_menu_items'
const CACHED_CATEGORIES_KEY = 'dafaterkom_cached_categories'
const CACHED_TENANT_KEY = 'dafaterkom_cached_tenant'
const LAST_SYNC_KEY = 'dafaterkom_last_synced_at'

export const offlineStore = {
  // Queue operations
  getQueue(): OfflineSyncEvent[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(SYNC_QUEUE_KEY) || localStorage.getItem('cashir_offline_sync_queue')
      return raw ? JSON.parse(raw) : []
    } catch (e) {
      console.error('Failed to read offline sync queue:', e)
      return []
    }
  },

  enqueue(event: Omit<OfflineSyncEvent, 'id' | 'timestamp' | 'retryCount'>): OfflineSyncEvent {
    const queue = this.getQueue()
    const newEvent: OfflineSyncEvent = {
      ...event,
      id: 'local_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
      timestamp: Date.now(),
      retryCount: 0
    }
    queue.push(newEvent)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
      window.dispatchEvent(new CustomEvent('dafaterkom:sync_queue_changed', { detail: { count: queue.length } }))
    }
    return newEvent
  },

  dequeue(id: string): void {
    const queue = this.getQueue().filter(e => e.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
      window.dispatchEvent(new CustomEvent('dafaterkom:sync_queue_changed', { detail: { count: queue.length } }))
    }
  },

  clearQueue(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SYNC_QUEUE_KEY)
      window.dispatchEvent(new CustomEvent('dafaterkom:sync_queue_changed', { detail: { count: 0 } }))
    }
  },

  // Cache operations for offline POS operation
  cacheCatalog(categories: any[], menuItems: any[]): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(CACHED_CATEGORIES_KEY, JSON.stringify(categories))
      localStorage.setItem(CACHED_MENU_KEY, JSON.stringify(menuItems))
    } catch (e) {
      console.error('Failed to cache catalog:', e)
    }
  },

  getCachedCatalog(): { categories: any[]; menuItems: any[] } {
    if (typeof window === 'undefined') return { categories: [], menuItems: [] }
    try {
      const cats = localStorage.getItem(CACHED_CATEGORIES_KEY)
      const items = localStorage.getItem(CACHED_MENU_KEY)
      return {
        categories: cats ? JSON.parse(cats) : [],
        menuItems: items ? JSON.parse(items) : []
      }
    } catch (e) {
      return { categories: [], menuItems: [] }
    }
  },

  cacheTenant(tenant: any): void {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(CACHED_TENANT_KEY, JSON.stringify(tenant))
    } catch (e) {
      console.error('Failed to cache tenant:', e)
    }
  },

  getCachedTenant(): any | null {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(CACHED_TENANT_KEY)
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      return null
    }
  },

  setLastSynced(date: Date = new Date()): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(LAST_SYNC_KEY, date.toISOString())
  },

  getLastSynced(): Date | null {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(LAST_SYNC_KEY)
    return raw ? new Date(raw) : null
  }
}
