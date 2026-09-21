export interface Category {
  id: string
  category_name: string
  created_at: string
  updated_at: string
}

export interface CreateCategoryInput {
  category_name: string
}