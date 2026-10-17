import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '../lib/api-client'
import type { CreditOverview } from '../types/customer'

// ภาพรวมเครดิตของลูกค้าหนึ่งคน (รายบิล ประวัติรับชำระ พฤติกรรมการชำระ)
export function useCustomerCredit(customerId: string | null) {
  const [data, setData] = useState<CreditOverview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const refresh = useCallback(async () => {
    if (!customerId) {
      setData(null)
      setError(null)
      return
    }

    // กันคำตอบเก่ามาทับคำตอบใหม่ เมื่อสลับลูกค้าเร็วๆ
    const current = ++requestId.current
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ data: CreditOverview }>(
        `/customers/${customerId}/credit`
      )
      if (current === requestId.current) setData(response.data)
    } catch (err) {
      if (current === requestId.current) {
        setData(null)
        setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
      }
    } finally {
      if (current === requestId.current) setIsLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, isLoading, error, refresh }
}