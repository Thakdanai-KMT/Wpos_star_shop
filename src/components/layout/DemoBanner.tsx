
import { useAuth } from '../../contexts/AuthContext'
// นำเข้า Custom Hook สำหรับเข้าถึงข้อมูลผู้ใช้ที่เข้าสู่ระบบ

import { isDemoUser } from '../../lib/roles'
// นำเข้าฟังก์ชันตรวจสอบว่าผู้ใช้มี Role ที่เป็น Demo User หรือไม่

// สร้างและส่งออก Component DemoBanner
export default function DemoBanner() {
  // ดึงข้อมูลผู้ใช้จาก AuthContext
  const { user } = useAuth()

  // ตรวจสอบ Role ของผู้ใช้
  // user?.role หมายถึงอ่าน role เมื่อมี user
  // หากไม่ใช่ผู้ใช้ Demo ให้คืนค่า null และไม่แสดงอะไรบนหน้าจอ
  if (!isDemoUser(user?.role)) return null

  // หากเป็นผู้ใช้ Demo ให้แสดงแถบแจ้งเตือน
  return (
    <div
      // กำหนดรูปแบบด้วย Tailwind CSS
      className="bg-gold-500/15 border-b border-gold-500/30 px-4 py-2 text-center text-sm text-brand-900"
    >
      {/* แจ้งให้ผู้ใช้ทราบถึงข้อจำกัดของโหมด Demo */}
      โหมดดูตัวอย่าง: ดูข้อมูลและลองใช้งานได้ทุกหน้า แต่ระบบจะไม่บันทึกการเปลี่ยนแปลง
    </div>
  )
}
