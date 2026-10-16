import { useCallback, useEffect, useState } from 'react'
import { apiClient } from '../lib/api-client'
import type { CustomerBalance } from '../types/customer'

// ยอดค้างของลูกค้า (เรียกเฉพาะเมื่อ enabled เพราะ endpoint จำกัดสิทธิ์)
export function useCustomerBalances(enabled: boolean) {
  const [balances, setBalances] = useState<CustomerBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setBalances([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ data: CustomerBalance[] }>(
        '/customers/balances'
      )
      setBalances(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { balances, isLoading, error, refresh }
}