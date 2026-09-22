export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD'

export interface CartItem {
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
}

export interface CreateSaleInput {
  payment_method: PaymentMethod
  items: { product_id: string; quantity: number }[]
}
export type SaleStatus = 'COMPLETED' | 'CANCELLED'

export interface Sale {
  id: string
  cashier_id: string
  customer_id: string | null
  total_amount: number
  payment_method: PaymentMethod
  status: SaleStatus
  cancelled_at: string | null
  cancelled_by: string | null
  created_at: string
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  quantity: number
  unit_price: number
}

export interface SaleDetail extends Sale {
  items: SaleItem[]
}