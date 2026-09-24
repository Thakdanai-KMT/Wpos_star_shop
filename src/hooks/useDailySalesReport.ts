import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import type { DailySalesReport } from '../types/report'

export function useDailySalesReport(date: string) {
  const [report, setReport] = useState<DailySalesReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReport = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ data: DailySalesReport }>(
        `/reports/daily-sales?date=${date}`
      )
      setReport(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }, [date])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  async function sendReport() {
    await apiClient.post(`/reports/daily-sales/send?date=${date}`, {})
  }

  return { report, isLoading, error, sendReport, refetch: fetchReport }
}