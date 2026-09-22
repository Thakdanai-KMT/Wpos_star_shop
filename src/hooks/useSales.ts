import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import type { Sale, SaleDetail } from '../types/sale'

export function useSales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSales = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ data: Sale[] }>('/sales')
      setSales(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  async function getSaleDetail(id: string) {
    const response = await apiClient.get<{ data: SaleDetail }>(`/sales/${id}`)
    return response.data
  }

  async function cancelSale(id: string) {
    await apiClient.post(`/sales/${id}/cancel`, {})
    await fetchSales()
  }

  return { sales, isLoading, error, getSaleDetail, cancelSale }
}