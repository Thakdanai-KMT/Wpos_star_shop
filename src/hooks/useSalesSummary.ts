import { useEffect, useState } from 'react'
import { apiClient, ApiError } from '../lib/api-client'
import type { SalesSummary } from '../types/sales-summary'

export function useSalesSummary(from: string, to: string) {
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!from || !to || from > to) {
      setSummary(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    apiClient
      .get<{ data: SalesSummary }>(
        `/reports/sales-summary?from=${from}&to=${to}`
      )
      .then((res) => {
        if (!cancelled) setSummary(res.data)
      })
      .catch((err) => {
        if (cancelled) return
        setSummary(null)
        setError(err instanceof ApiError ? err.message : 'โหลดรายงานไม่สำเร็จ')
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [from, to])

  return { summary, isLoading, error }
}