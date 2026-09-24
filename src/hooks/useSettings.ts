import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import type { AppSettings, UpdateSettingsInput } from '../types/settings'

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ data: AppSettings }>('/settings')
      setSettings(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  async function updateSettings(input: UpdateSettingsInput) {
    await apiClient.patch('/settings', input)
    await fetchSettings()
  }

  return { settings, isLoading, error, updateSettings }
}