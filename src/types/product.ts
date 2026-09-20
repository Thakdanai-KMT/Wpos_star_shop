export interface Product {
  id: string
  product_name: string
  unit_price: number
  cost_price: number
  stock_quantity: number
  category_id: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateProductInput {
  product_name: string
  unit_price: number
  cost_price: number
  category_id: string
}