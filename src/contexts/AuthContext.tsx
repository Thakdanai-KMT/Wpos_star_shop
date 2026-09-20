import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { apiClient } from '../lib/api-client'
import type { AuthUser } from '../types/auth'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const loadedUserId = useRef<string | null>(null)

  async function loadUser() {
    const { data } = await supabase.auth.getSession()

    if (!data.session) {
      loadedUserId.current = null
      setUser(null)
      setIsLoading(false)
      return
    }

    // ถ้าเป็น user คนเดิมที่เคยโหลดสำเร็จแล้ว (เช่น แค่สลับ tab กลับมา)
    // ไม่ต้องโชว์ Loading ทับหน้า แค่ไปดึงข้อมูลใหม่เงียบๆ พอ
    const isSameUserAsBefore = loadedUserId.current === data.session.user.id
    if (!isSameUserAsBefore) {
      setIsLoading(true)
    }

    try {
      const response = await apiClient.get<{ data: AuthUser }>('/auth/me')
      setUser(response.data)
      loadedUserId.current = response.data.id
    } catch {
      setUser(null)
      loadedUserId.current = null
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}