export interface Promotion {
  id: string
  product_id: string
  sale_price: number
  is_below_cost: boolean
  created_at: string
}

export interface CreatePromotionInput {
  product_id: string
  sale_price: number
  confirm_below_cost?: boolean
}