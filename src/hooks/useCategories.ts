import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import type { Category, CreateCategoryInput } from '../types/category'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ data: Category[] }>('/categories')
      setCategories(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  async function createCategory(input: CreateCategoryInput) {
    await apiClient.post('/categories', input)
    await fetchCategories()
  }
    async function updateCategory(id: string, input: CreateCategoryInput) {
    await apiClient.patch(`/categories/${id}`, input)
    await fetchCategories()
  }

  async function deleteCategory(id: string) {
    await apiClient.delete(`/categories/${id}`)
    await fetchCategories()
  }

  return { categories, isLoading, error, createCategory, updateCategory, deleteCategory, refetch: fetchCategories }
}