
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

import { supabase } from '../lib/supabase'
import { apiClient } from '../lib/api-client'
import type { AuthUser } from '../types/auth'

// กำหนดโครงสร้างข้อมูลที่ AuthContext จะเปิดให้ Component อื่นใช้งาน
interface AuthContextValue {
  user: AuthUser | null // ข้อมูลผู้ใช้ที่เข้าสู่ระบบ หรือ null หากไม่มีผู้ใช้
  isLoading: boolean // สถานะกำลังตรวจสอบ Session หรือโหลดข้อมูลผู้ใช้
  refreshUser: () => Promise<void> // ฟังก์ชันสำหรับโหลดข้อมูลผู้ใช้ใหม่
}

// สร้าง Context สำหรับแชร์ข้อมูลการเข้าสู่ระบบทั่วทั้งแอป
// undefined หมายถึงยังไม่มี AuthProvider ครอบ Component ที่เรียกใช้
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Provider ทำหน้าที่จัดการสถานะผู้ใช้และส่งข้อมูลให้ Component ลูก
export function AuthProvider({ children }: { children: ReactNode }) {
  // เก็บข้อมูลผู้ใช้ปัจจุบัน หากยังไม่ได้เข้าสู่ระบบจะเป็น null
  const [user, setUser] = useState<AuthUser | null>(null)

  // เริ่มต้นเป็น true เพื่อรอการตรวจสอบ Session ตอนเปิดแอป
  const [isLoading, setIsLoading] = useState(true)

  // เก็บ ID ของผู้ใช้ที่โหลดข้อมูลสำเร็จล่าสุด
  // useRef เปลี่ยนค่าได้โดยไม่ทำให้ Component render ใหม่
  const loadedUserId = useRef<string | null>(null)

  // ตรวจสอบ Session จาก Supabase และโหลดข้อมูลผู้ใช้จาก Backend
  async function loadUser() {
    const { data } = await supabase.auth.getSession()

    // หากไม่มี Session แสดงว่าขณะนี้ไม่มีการเข้าสู่ระบบ
    if (!data.session) {
      loadedUserId.current = null
      setUser(null)
      setIsLoading(false)
      return // จบการทำงาน ไม่ต้องเรียก Backend
    }

    // ตรวจสอบว่าเป็นผู้ใช้คนเดิมที่เคยโหลดข้อมูลสำเร็จแล้วหรือไม่
    // เช่น ผู้ใช้กลับมาที่แท็บเดิม ไม่จำเป็นต้องแสดง Loading ทับหน้า
    const isSameUserAsBefore = loadedUserId.current === data.session.user.id

    // แสดง Loading เมื่อยังไม่เคยโหลดผู้ใช้คนนี้สำเร็จ
    if (!isSameUserAsBefore) {
      setIsLoading(true)
    }

    try {
      // เรียก API ของ Backend เพื่อดึงข้อมูลผู้ใช้ที่ยืนยันตัวตนแล้ว
      // response.data คือข้อมูลที่ API ส่งกลับมาตามรูปแบบที่กำหนด
      const response = await apiClient.get<{ data: AuthUser }>('/auth/me')

      // บันทึกข้อมูลผู้ใช้ลง State เพื่อให้ Component ต่าง ๆ นำไปใช้
      setUser(response.data)


      // หากเรียก API ไม่สำเร็จ ให้ล้างข้อมูลผู้ใช้ออกจาก State
      // สาเหตุอาจเป็น Token หมดอายุ เครือข่ายขัดข้อง หรือ Backend มีปัญหา
      setUser(null)
      loadedUserId.current = null
    } finally {
      // ไม่ว่าจะสำเร็จหรือเกิดข้อผิดพลาด ให้สิ้นสุดสถานะ Loading
      setIsLoading(false)
    }
  }

  // ตั้งค่าการตรวจสอบผู้ใช้เมื่อ AuthProvider ถูกสร้างขึ้น
  useEffect(() => {
    // โหลดข้อมูลผู้ใช้ครั้งแรกเมื่อเปิดแอป
    loadUser()

    // ฟังเหตุการณ์การเข้าสู่ระบบและออกจากระบบจาก Supabase
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      // เมื่อสถานะ Auth เปลี่ยน ให้ตรวจสอบ Session และโหลดข้อมูลใหม่
      loadUser()
    })

    // ยกเลิกการฟังเหตุการณ์เมื่อ AuthProvider ถูกถอดออก
    return () => listener.subscription.unsubscribe()
  }, [])

  // ส่งข้อมูลและฟังก์ชันให้ Component ลูกทุกตัวที่อยู่ภายใน Provider
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// Hook สำหรับให้ Component อื่นเรียกใช้ข้อมูล AuthContext ได้ง่ายขึ้น
export function useAuth() {
  const context = useContext(AuthContext)

  // ป้องกันการเรียก useAuth จาก Component ที่ไม่ได้อยู่ภายใน AuthProvider
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  // ส่งคืน user, isLoading และ refreshUser ให้ผู้เรียกใช้งาน
  return context
}
