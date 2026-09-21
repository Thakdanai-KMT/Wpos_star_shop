import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import type { Product, CreateProductInput } from '../types/product'

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<{ data: Product[] }>('/products')
      setProducts(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  async function createProduct(input: CreateProductInput) {
    await apiClient.post('/products', input)
    await fetchProducts()
  }
    async function updateProduct(id: string, input: CreateProductInput) {
    await apiClient.patch(`/products/${id}`, input)
    await fetchProducts()
  }

  async function deleteProduct(id: string) {
    await apiClient.delete(`/products/${id}`)
    await fetchProducts()
  }

  return { products, isLoading, error, createProduct, updateProduct, deleteProduct, refetch: fetchProducts }
}