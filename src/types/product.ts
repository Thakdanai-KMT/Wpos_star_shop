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
  bundle_of_product_id: string | null
  bundle_quantity: number | null
}

export interface CreateProductInput {
  product_name: string
  unit_price: number
  cost_price: number
  category_id: string
  bundle_of_product_id?: string
  bundle_quantity?: number
}