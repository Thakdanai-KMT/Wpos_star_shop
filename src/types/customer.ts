export interface Customer {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  created_at: string
}

export interface CreateCustomerInput {
  full_name: string
  phone?: string
  email?: string
}