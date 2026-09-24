export interface TopProduct {
  product_name: string
  quantity_sold: number
  revenue: number
}

export interface DailySalesReport {
  total_sales: number
  total_bills: number
  top_products: TopProduct[]
}