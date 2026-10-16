export interface Customer {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  credit_limit: number | null
  created_at: string
}

export interface CreateCustomerInput {
  full_name: string
  phone?: string
  email?: string
}

export interface CustomerBalance {
  customer_id: string
  credit_total: number
  paid_total: number
  balance: number
  overdue_amount: number
  oldest_due_date: string | null
}