export interface SalesSummary {
  from: string
  to: string
  total_sales: number
  total_bills: number
  cancelled_bills: number
  cancelled_amount: number
  daily: { day: string; bills: number; sales: number }[]
  payments: { payment_method: string; bills: number; amount: number }[]
  top_products: { product_name: string; quantity_sold: number; revenue: number }[]
}

export interface ShopInfo {
  name: string
  address: string
  phone: string
  taxId: string
}