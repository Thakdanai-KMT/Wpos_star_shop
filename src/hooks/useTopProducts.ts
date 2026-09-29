import { useEffect, useState } from 'react'
import { apiClient } from '../lib/api-client'
import type { RangeTopProduct } from '../types/report'

export function useTopProducts(from: string, to: string, limit = 5) {
  const [products, setProducts] = useState<RangeTopProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!from || !to || from > to) {
      setProducts([])
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    apiClient
      .get<{ data: RangeTopProduct[] }>(
        `/sales/top-products?from=${from}&to=${to}&limit=${limit}`
      )
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false))
  }, [from, to, limit])

  return { products, isLoading }
}