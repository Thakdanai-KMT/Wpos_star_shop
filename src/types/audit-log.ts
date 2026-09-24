export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE'

export interface AuditLog {
  id: string
  actor_id: string
  action: AuditAction
  resource_type: string
  resource_id: string | null
  old_value: unknown
  new_value: unknown
  created_at: string
}