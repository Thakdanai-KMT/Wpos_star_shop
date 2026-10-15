
import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import type { Category, CreateCategoryInput } from '../types/category'

// Custom Hook สำหรับจัดการข้อมูลหมวดหมู่สินค้า
export function useCategories() {
  // เก็บรายการหมวดหมู่สินค้าที่ได้รับจาก Backend
  const [categories, setCategories] = useState<Category[]>([])

  // สถานะการโหลดข้อมูล เริ่มต้นเป็น true เพราะต้องดึงข้อมูลตอนเปิดใช้งาน
  const [isLoading, setIsLoading] = useState(true)

  // เก็บข้อความข้อผิดพลาด หากดึงข้อมูลไม่สำเร็จ
  const [error, setError] = useState<string | null>(null)

  // ฟังก์ชันดึงข้อมูลหมวดหมู่ทั้งหมดจาก Backend
  // useCallback ช่วยรักษาตัวตนของฟังก์ชัน เพราะไม่มี Dependency ที่ต้องติดตาม
  const fetchCategories = useCallback(async () => {
    // เริ่มโหลดข้อมูลและล้างข้อผิดพลาดเดิม
    setIsLoading(true)
    setError(null)

    try {
      // เรียก API เพื่อขอรายการหมวดหมู่สินค้า
      const response = await apiClient.get<{ data: Category[] }>('/categories')

      // นำรายการหมวดหมู่ที่ได้รับมาเก็บใน State
      setCategories(response.data)
    } catch (err) {
      // เก็บข้อความข้อผิดพลาด หากไม่ใช่ Error ให้ใช้ข้อความสำรอง
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      // สิ้นสุดสถานะ Loading ไม่ว่า API จะสำเร็จหรือไม่
      setIsLoading(false)
    }
  }, [])

  // ดึงข้อมูลหมวดหมู่เมื่อ Component ที่ใช้ Hook เริ่มทำงาน
  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  // เพิ่มหมวดหมู่สินค้าใหม่
  async function createCategory(input: CreateCategoryInput) {
    // ส่งข้อมูลหมวดหมู่ไปยัง Backend
    await apiClient.post('/categories', input)

    // ดึงรายการหมวดหมู่ใหม่ เพื่อให้หน้าจอแสดงข้อมูลล่าสุด
    await fetchCategories()
  }

  // แก้ไขหมวดหมู่ตาม ID ที่ระบุ
  async function updateCategory(id: string, input: CreateCategoryInput) {
    // ส่งข้อมูลที่ต้องการแก้ไขไปยัง Endpoint ของหมวดหมู่นั้น
    await apiClient.patch(`/categories/${id}`, input)

    // โหลดรายการหมวดหมู่ใหม่หลังแก้ไขสำเร็จ
    await fetchCategories()
  }

  // ลบหมวดหมู่ตาม ID ที่ระบุ
  async function deleteCategory(id: string) {
    // ส่งคำขอลบหมวดหมู่ไปยัง Backend
    await apiClient.delete(`/categories/${id}`)

    // โหลดรายการหมวดหมู่ใหม่หลังลบสำเร็จ
    await fetchCategories()
  }

  // ส่งข้อมูล สถานะ และฟังก์ชันต่าง ๆ ให้ Component นำไปใช้งาน
  return {
    categories, // รายการหมวดหมู่สินค้า
    isLoading, // สถานะกำลังโหลดข้อมูล
    error, // ข้อความข้อผิดพลาด
    createCategory, // ฟังก์ชันเพิ่มหมวดหมู่
    updateCategory, // ฟังก์ชันแก้ไขหมวดหมู่
    deleteCategory, // ฟังก์ชันลบหมวดหมู่
    refetch: fetchCategories, // ฟังก์ชันโหลดรายการใหม่ด้วยตนเอง
  }
}
