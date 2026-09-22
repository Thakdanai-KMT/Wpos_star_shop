import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import type { Promotion, CreatePromotionInput } from '../types/promotion'

export function usePromotions() {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPromotions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ data: Promotion[] }>('/promotions')
      setPromotions(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPromotions()
  }, [fetchPromotions])

  async function createPromotion(input: CreatePromotionInput) {
    await apiClient.post('/promotions', input)
    await fetchPromotions()
  }

  return { promotions, isLoading, error, createPromotion }
}