import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import type { InventoryMovement, CreateMovementInput } from '../types/inventory'

export function useInventoryMovements(productId: string | null) {
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMovements = useCallback(async () => {
    if (!productId) {
      setMovements([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ data: InventoryMovement[] }>(
        `/products/${productId}/movements`
      )
      setMovements(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  async function createMovement(input: CreateMovementInput) {
    await apiClient.post('/inventory/movements', input)
    await fetchMovements()
  }

  return { movements, isLoading, error, createMovement }
}