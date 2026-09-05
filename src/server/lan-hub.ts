/**
 * Dafaterkom Shop LAN Hub Sync Server
 * 
 * Lightweight HTTP service embeddable in the Electron main app or run
 * as a standalone daemon on the shop counter PC / mini-PC.
 * Provides zero-internet synchronization across registers, KDS, and waiter tablets.
 */

import http from 'http'

export interface HubConfig {
  port: number
  shopName: string
  tenantId: string
}

export class DafaterkomLANHub {
  private server: http.Server | null = null
  private pairedDevices: Map<string, { id: string; name: string; role: string; lastSeen: number }> = new Map()
  private eventLog: Array<{ id: string; type: string; payload: any; timestamp: number }> = []

  constructor(private config: HubConfig = { port: 8080, shopName: 'Dafaterkom LAN Hub', tenantId: 'default-shop' }) {}

  public start(): Promise<number> {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => {
        // Enable CORS for LAN devices
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-tenant-id')

        if (req.method === 'OPTIONS') {
          res.writeHead(204)
          res.end()
          return
        }

        const url = new URL(req.url || '/', `http://localhost:${this.config.port}`)

        // 1. Hub Discovery & Heartbeat endpoint
        if (url.pathname === '/hub/status') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(
            JSON.stringify({
              status: 'online',
              hubName: this.config.shopName,
              tenantId: this.config.tenantId,
              pairedDevicesCount: this.pairedDevices.size,
              queuedEventsCount: this.eventLog.length,
              timestamp: Date.now()
            })
          )
          return
        }

        // 2. Device Pairing endpoint
        if (url.pathname === '/hub/pair' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            try {
              const device = JSON.parse(body)
              this.pairedDevices.set(device.id, {
                id: device.id,
                name: device.name || 'Terminal',
                role: device.role || 'terminal',
                lastSeen: Date.now()
              })
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: true, paired: true }))
            } catch (e) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Invalid pairing request' }))
            }
          })
          return
        }

        // 3. Reconcile Sync Events endpoint
        if (url.pathname === '/hub/sync' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body)
              if (Array.isArray(incoming.events)) {
                this.eventLog.push(...incoming.events)
              }
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ success: true, appliedCount: incoming.events?.length || 0 }))
            } catch (e) {
              res.writeHead(400, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: 'Sync failed' }))
            }
          })
          return
        }

        res.writeHead(404)
        res.end(JSON.stringify({ error: 'Not found' }))
      })

      this.server.listen(this.config.port, () => {
        console.log(`[Dafaterkom LAN Hub] Running on port ${this.config.port}`)
        resolve(this.config.port)
      })
    })
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve())
      } else {
        resolve()
      }
    })
  }
}

export const lanHub = new DafaterkomLANHub()
