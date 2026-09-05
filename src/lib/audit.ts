import { prisma } from '@/lib/db'
import { DEFAULT_TENANT_ID } from '@/lib/tenant-context'

export interface LogAuditOptions {
  tenantId?: string
  staffId?: string | null
  action: 'price_override' | 'discount_applied' | 'refund' | 'void' | 'drawer_open' | 'plan_change' | 'license_update' | 'staff_update'
  entityType: string
  entityId?: string | null
  beforeValue?: any
  afterValue?: any
  notes?: string | null
}

export async function logAuditEvent(options: LogAuditOptions) {
  try {
    return await prisma.auditLog.create({
      data: {
        tenantId: options.tenantId || DEFAULT_TENANT_ID,
        staffId: options.staffId || null,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId || null,
        beforeValue: options.beforeValue ? (typeof options.beforeValue === 'string' ? options.beforeValue : JSON.stringify(options.beforeValue)) : null,
        afterValue: options.afterValue ? (typeof options.afterValue === 'string' ? options.afterValue : JSON.stringify(options.afterValue)) : null,
        notes: options.notes || null,
      }
    })
  } catch (error) {
    console.error('Failed to write audit log:', error)
    return null
  }
}
