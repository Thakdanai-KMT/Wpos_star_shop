export interface AppSettings {
  id: number
  low_stock_threshold: number
  vat_rate: number
  extra: Record<string, unknown>
  updated_at: string
  updated_by: string | null
}

export interface UpdateSettingsInput {
  low_stock_threshold?: number
  vat_rate?: number
  extra?: Record<string, unknown>
}