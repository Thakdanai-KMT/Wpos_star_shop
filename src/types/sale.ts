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