export type MovementType = 'RECEIVE' | 'ADJUSTMENT'

export interface InventoryMovement {
  id: string
  product_id: string
  movement_type: MovementType
  quantity_change: number
  reason: string | null
  created_by: string
  created_at: string
}

export interface CreateMovementInput {
  product_id: string
  movement_type: MovementType
  quantity_change: number
  reason?: string
}