import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import type { AuditLog } from '../types/audit-log'

export function useAuditLogs(resourceType: string) {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const query = resourceType
        ? `?resource_type=${encodeURIComponent(resourceType)}`
        : ''
      const response = await apiClient.get<{ data: AuditLog[] }>(
        `/audit-logs${query}`
      )
      setLogs(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }, [resourceType])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  return { logs, isLoading, error }
}