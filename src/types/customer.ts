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

export type BillPaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'CANCELLED'

export interface CreditBillItem {
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface CreditBill {
  sale_id: string
  created_at: string
  total_amount: number
  due_date: string | null
  credit_note: string | null
  sale_status: 'COMPLETED' | 'CANCELLED'
  payment_status: BillPaymentStatus
  paid_amount: number
  remaining: number
  is_overdue: boolean
  days_overdue: number
  settled_at: string | null
  items: CreditBillItem[]
}

export interface CreditStats {
  credit_bills_total: number
  paid_bills: number
  open_bills: number
  overdue_bills: number
  overdue_amount: number
  max_days_overdue: number
  paid_on_time: number
  paid_late: number
  avg_days_to_settle: number | null
  ever_overdue: boolean
  first_credit_at: string | null
  last_payment_at: string | null
}

export interface CustomerPayment {
  id: string
  paid_at: string
  amount: number
  method: string
  note: string | null
  status: string
  void_reason: string | null
  received_by_name: string | null
}

export interface CreditSummary extends CustomerBalance {
  credit_limit: number | null
  credit_available: number | null
}

export interface CreditOverview {
  customer: Customer
  summary: CreditSummary
  stats: CreditStats
  bills: CreditBill[]
  payments: CustomerPayment[]
}