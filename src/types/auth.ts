export type UserRole = 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER'

export interface AuthUser {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
}