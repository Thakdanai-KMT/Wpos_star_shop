
import { NavLink } from 'react-router-dom'
// NavLink ใช้สร้างลิงก์เปลี่ยนหน้า และตรวจสอบได้ว่าลิงก์ใดกำลังเปิดใช้งานอยู่

import { useAuth } from '../../contexts/AuthContext'
// useAuth เป็น Custom Hook สำหรับเข้าถึงข้อมูลผู้ใช้ที่เข้าสู่ระบบ

import type { UserRole } from '../../types/auth'
// นำเข้า Type ของ Role เพื่อให้ TypeScript ตรวจสอบค่าที่ใช้ในโค้ดได้

// กำหนดโครงสร้างข้อมูลของเมนูแต่ละรายการ
interface NavItem {
  label: string     // ชื่อเมนูที่แสดงบนหน้าจอ
  path: string      // URL ของหน้าที่ต้องการเปิด
  roles: UserRole[] // รายชื่อ Role ที่มีสิทธิ์เห็นเมนูนี้
}

// กำหนดรายการเมนูทั้งหมดของระบบ
// roles ระบุว่าผู้ใช้ประเภทใดสามารถเห็นเมนูนั้นได้
const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'ขายสินค้า', path: '/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'สินค้า', path: '/products', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'หมวดหมู่', path: '/categories', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'สต็อก', path: '/inventory', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'ประวัติการขาย', path: '/sales', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'ลูกค้า', path: '/customers', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'โปรโมชั่น', path: '/promotions', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'รายงาน', path: '/reports', roles: ['ADMIN', 'MANAGER', 'VIEWER'] },
  { label: 'Audit Logs', path: '/audit-logs', roles: ['ADMIN', 'VIEWER'] },
  { label: 'ตั้งค่า', path: '/settings', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
]

// กำหนด Props ของ Sidebar
interface SidebarProps {
  onNavigate?: () => void
  // Callback ที่เลือกส่งเข้ามาได้
  // ใช้แจ้ง Component แม่ว่าเลือกเมนูแล้ว เช่น เพื่อปิด Sidebar บนมือถือ
}

// Component สำหรับแสดงแถบเมนูด้านข้าง
export default function Sidebar({ onNavigate }: SidebarProps) {
  // อ่านข้อมูลผู้ใช้จาก AuthContext
  const { user } = useAuth()

  // กรองรายการเมนูให้เหลือเฉพาะเมนูที่ผู้ใช้มีสิทธิ์เห็น
  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    // กรอบหลักของ Sidebar
    // w-64 = ความกว้าง 16rem
    // bg-brand-900 = พื้นหลังสีหลักของระบบ
    // h-full = สูงเต็มพื้นที่ของ Element แม่
    // flex flex-col = จัดองค์ประกอบจากบนลงล่าง
    // overflow-y-auto = ให้เลื่อนในแนวตั้งได้เมื่อเนื้อหายาว
    <aside className="w-64 bg-brand-900 text-white/90 h-full flex flex-col overflow-y-auto">

      {/* ส่วนหัวของ Sidebar แสดงชื่อระบบ */}
      <div className="px-5 py-6 border-b border-white/10">
        <p className="text-gold-500 text-xs font-semibold tracking-wide">
          WPOS STAR SHOP
        </p>

        <p className="text-white text-sm mt-0.5">
          ระบบจัดการร้านค้า
        </p>
      </div>

      {/* พื้นที่แสดงรายการเมนู */}
      <nav className="flex-1 flex flex-col gap-0.5 p-3">

        {/* วนสร้างลิงก์จากรายการเมนูที่ผ่านการกรองแล้ว */}
        {visibleItems.map((item) => (
          <NavLink
            key={item.path} // ใช้ path เป็น Key ประจำรายการสำหรับ React
            to={item.path} // URL ปลายทางเมื่อคลิกเมนู
            onClick={onNavigate} // เรียก Callback เมื่อเลือกเมนู

            // NavLink ส่งค่า isActive มาให้ตรวจสอบว่าเมนูนี้กำลังใช้งานอยู่หรือไม่
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  // ถ้าเป็นหน้าปัจจุบัน ให้ใช้พื้นหลังสีทองและข้อความสีเข้ม
                  ? 'bg-gold-500 text-brand-900 font-medium'

                  // ถ้าไม่ใช่หน้าปัจจุบัน ให้ใช้ข้อความสีอ่อน
                  // และเปลี่ยนพื้นหลังเมื่อเลื่อนเมาส์ไปวาง
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {/* แสดงชื่อเมนู */}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
