
import { useEffect, useState, useCallback } from 'react'
import { apiClient } from '../lib/api-client'
import type { AuditLog } from '../types/audit-log'

// Custom Hook สำหรับดึงและจัดการข้อมูลประวัติการทำรายการ (Audit Logs)
// resourceType ใช้กรองประเภทของข้อมูลที่ต้องการดู เช่น product หรือ user
export function useAuditLogs(resourceType: string) {
  // เก็บรายการ Audit Log ที่ได้รับจาก Backend
  // เริ่มต้นเป็น Array ว่าง เพราะยังไม่มีข้อมูล
  const [logs, setLogs] = useState<AuditLog[]>([])

  // เก็บสถานะว่ากำลังโหลดข้อมูลอยู่หรือไม่
  // เริ่มต้นเป็น true เพราะต้องโหลดข้อมูลเมื่อ Hook เริ่มทำงาน
  const [isLoading, setIsLoading] = useState(true)

  // เก็บข้อความแจ้งข้อผิดพลาด หากดึงข้อมูลไม่สำเร็จ
  // null หมายถึงยังไม่มีข้อผิดพลาด
  const [error, setError] = useState<string | null>(null)

  // useCallback ช่วยรักษาตัวตนของฟังก์ชันไว้
  // จนกว่า resourceType ซึ่งเป็น Dependency จะเปลี่ยน
  const fetchLogs = useCallback(async () => {
    // เริ่มต้นการโหลดข้อมูลใหม่ และล้างข้อผิดพลาดเดิม
    setIsLoading(true)
    setError(null)

    try {
      // หากระบุ resourceType ให้สร้าง Query Parameter เพื่อกรองข้อมูล
      // encodeURIComponent ช่วยเข้ารหัสค่าก่อนนำไปใส่ใน URL
      // หากไม่ได้ระบุประเภท จะดึงข้อมูลโดยไม่มีตัวกรองนี้
      const query = resourceType
        ? `?resource_type=${encodeURIComponent(resourceType)}`
        : ''

      // เรียก API ของ Backend เพื่อดึงรายการ Audit Log
      // กำหนด TypeScript ให้คาดหวังว่าคำตอบมี data เป็น Array ของ AuditLog
      const response = await apiClient.get<{ data: AuditLog[] }>(
        `/audit-logs${query}`
      )

      // นำข้อมูลที่ได้รับมาอัปเดต State เพื่อให้หน้าเว็บแสดงผล
      setLogs(response.data)
    } catch (err) {
      // หากเรียก API ไม่สำเร็จ ให้บันทึกข้อความข้อผิดพลาด
      // ถ้า err เป็น Error จะใช้ message จาก Error
      // หากไม่ใช่ จะใช้ข้อความสำรองภาษาไทย
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด')
    } finally {
      // ทำงานเสมอ ไม่ว่า API จะสำเร็จหรือเกิดข้อผิดพลาด
      // เพื่อให้หน้าจอทราบว่าการโหลดครั้งนี้สิ้นสุดแล้ว
      setIsLoading(false)
    }
  }, [resourceType]) // สร้างฟังก์ชันใหม่เมื่อ resourceType เปลี่ยน

  // เรียก fetchLogs เมื่อ Component ที่ใช้ Hook เริ่มทำงาน
  // และเรียกใหม่เมื่อ fetchLogs เปลี่ยน ซึ่งเกิดเมื่อ resourceType เปลี่ยน
  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // ส่งข้อมูล สถานะการโหลด และข้อผิดพลาดกลับไปให้ Component ที่เรียกใช้
  return { logs, isLoading, error }
}
