import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import type { Customer, CreateCustomerInput } from '../types/customer'

export function useCustomers(searchTerm: string) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCustomers = useCallback(async (term: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const query = term ? `?search=${encodeURIComponent(term)}` : ''
      const response = await apiClient.get<{ data: Customer[] }>(
        `/customers${query}`
      )
      setCustomers(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // debounce 400ms — รอให้ผู้ใช้หยุดพิมพ์ก่อนค่อยยิง API
    const timer = setTimeout(() => {
      fetchCustomers(searchTerm)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchTerm, fetchCustomers])

  async function createCustomer(input: CreateCustomerInput) {
    await apiClient.post('/customers', input)
    await fetchCustomers(searchTerm)
  }

  async function updateCustomer(id: string, input: CreateCustomerInput) {
    await apiClient.patch(`/customers/${id}`, input)
    await fetchCustomers(searchTerm)
  }

  async function deleteCustomer(id: string) {
    await apiClient.delete(`/customers/${id}`)
    await fetchCustomers(searchTerm)
  }

  return {
    customers,
    isLoading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  }
}