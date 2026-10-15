
import { useState } from 'react' // Hook สำหรับจัดการ State ภายใน Component
import { Outlet } from 'react-router-dom' // แสดงหน้า Route ลูกภายใน Layout ปัจจุบัน

// นำเข้า Component ที่ใช้ประกอบหน้า Layout
import Sidebar from './Sidebar' // แถบเมนูด้านข้าง
import NotificationBell from './NotificationBell' // ปุ่มแจ้งเตือน
import DemoBanner from './DemoBanner' // แบนเนอร์แจ้งสถานะ Demo

// นำเข้า Hook สำหรับอ่านข้อมูลผู้ใช้ที่เข้าสู่ระบบ
import { useAuth } from '../../contexts/AuthContext'

// นำเข้า Supabase Client สำหรับจัดการ Authentication
import { supabase } from '../../lib/supabase'

// นำเข้าฟังก์ชันตรวจสอบสิทธิ์ในการดูการแจ้งเตือนสต็อก
import { canSeeStockAlerts } from '../../lib/roles'

// แปลง Role ของผู้ใช้เป็นชื่อภาษาไทยสำหรับแสดงบนหน้าจอ
// Record<string, string> คือ Object ที่มี Key และ Value เป็น String
const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  MANAGER: 'ผู้จัดการ',
  CASHIER: 'พนักงานขาย',
  VIEWER: 'ผู้เข้าดูข้อมูล',
}

// กำหนดคลาส Tailwind CSS สำหรับสีพื้นหลังและข้อความของป้าย Role
const ROLE_BADGE_CLASS: Record<string, string> = {
  ADMIN: 'bg-gold-500/15 text-gold-600',
  MANAGER: 'bg-brand-600/10 text-brand-700',
  CASHIER: 'bg-emerald-500/10 text-emerald-700',
  VIEWER: 'bg-gray-200 text-ink-600',
}

// สร้างอักษรย่อจากชื่อผู้ใช้ เช่น "John Smith" ได้ "JS"
function getInitials(name: string) {
  // trim() ตัดช่องว่างด้านหน้าและด้านหลังชื่อ
  // split(/\s+/) แยกชื่อด้วยช่องว่างตั้งแต่หนึ่งตัวขึ้นไป
  const parts = name.trim().split(/\s+/)

  // หากมีชื่อเพียงคำเดียว ให้ใช้ 2 ตัวอักษรแรกและแปลงเป็นตัวพิมพ์ใหญ่
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  // หากมีหลายคำ ให้นำตัวอักษรแรกของสองคำแรกมาต่อกัน
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Component ไอคอนออกจากระบบ โดยใช้ SVG วาดรูปภาพ
function LogoutIcon() {
  return (
    <svg
      width="16" // ความกว้างไอคอน 16 พิกเซล
      height="16" // ความสูงไอคอน 16 พิกเซล
      viewBox="0 0 24 24" // กำหนดพื้นที่พิกัดสำหรับวาด SVG
      fill="none" // ไม่เติมสีภายในรูปทรง
      stroke="currentColor" // ใช้สีเดียวกับข้อความรอบข้าง
      strokeWidth="1.8" // กำหนดความหนาของเส้น
    >
      {/* วาดกรอบประตู */}
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />

      {/* วาดลูกศรที่สื่อถึงการออกจากระบบ */}
      <path d="M16 17l5-5-5-5" />

      {/* วาดเส้นแนวนอนของลูกศร */}
      <path d="M21 12H9" />
    </svg>
  )
}

// Component ไอคอนเมนูสามขีด สำหรับเปิด Sidebar บนมือถือ
function MenuIcon() {
  return (
    <svg
      width="22" // ความกว้าง 22 พิกเซล
      height="22" // ความสูง 22 พิกเซล
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      {/* วาดเส้นแนวนอน 3 เส้น เป็นสัญลักษณ์เมนู */}
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

// Component หลักที่กำหนดโครงสร้างร่วมกันของหน้าเว็บ
export default function AppLayout() {
  // อ่านข้อมูลผู้ใช้จาก AuthContext
  // user อาจไม่มีค่า หากยังไม่ได้โหลดข้อมูลหรือไม่มีผู้ใช้เข้าสู่ระบบ
  const { user } = useAuth()

  // State สำหรับควบคุมการเปิดและปิด Sidebar บนมือถือ
  // false = ปิดเมนู, true = เปิดเมนู
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // เลือกชื่อที่จะแสดง โดยให้ความสำคัญกับ full_name ก่อน email
  // หากทั้งสองค่าเป็น null หรือ undefined ให้ใช้ข้อความว่าง
  const displayName = user?.full_name ?? user?.email ?? ''

  return (
    // Container หลัก ใช้ Flexbox จัด Sidebar และพื้นที่เนื้อหาให้อยู่ข้างกัน
    // min-h-screen ทำให้ความสูงอย่างน้อยเท่ากับความสูงหน้าจอ
    <div className="flex min-h-screen">

      {/* Sidebar สำหรับหน้าจอขนาด md ขึ้นไป */}
      <div className="hidden md:block sticky top-0 h-screen shrink-0">
        <Sidebar />
      </div>

      {/* แสดง Overlay เมื่อ isMenuOpen เป็น true */}
      {isMenuOpen && (
        <div
          // fixed inset-0 ครอบคลุมพื้นที่หน้าจอ
          // z-40 กำหนดลำดับการซ้อน และ md:hidden ซ่อนตั้งแต่ขนาด md
          className="fixed inset-0 z-40 bg-black/40 md:hidden"

          // คลิกพื้นที่มืดด้านนอกเพื่อปิดเมนู
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            // หยุดการส่งต่อเหตุการณ์คลิกไปยัง Overlay ด้านนอก
            onClick={(e) => e.stopPropagation()}

            // กำหนด Sidebar กว้าง 16rem และสูงเต็มพื้นที่
            className="h-full w-64"
          >
            {/* เมื่อเลือกเมนู ให้เรียก Callback เพื่อปิด Sidebar */}
            <Sidebar onNavigate={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* พื้นที่เนื้อหาหลัก กินพื้นที่ที่เหลือจาก Sidebar */}
      <div className="flex-1 min-w-0 min-h-screen bg-surface">

        {/* Header หรือแถบด้านบนของระบบ */}
        <header className="flex justify-between items-center gap-3 px-4 md:px-6 h-16 border-b border-black/5 bg-white sticky top-0 z-30">

          {/* ส่วนซ้ายของ Header: ปุ่มเมนูและข้อมูลผู้ใช้ */}
          <div className="flex items-center gap-3 min-w-0">

            {/* ปุ่มเปิด Sidebar แสดงเฉพาะหน้าจอเล็ก */}
            <button
              onClick={() => setIsMenuOpen(true)} // เปลี่ยน State เพื่อเปิดเมนู
              className="md:hidden text-brand-900 shrink-0"
              aria-label="เปิดเมนู" // ชื่อสำหรับโปรแกรมอ่านหน้าจอ
            >
              <MenuIcon />
            </button>

            {/* แสดงข้อมูลผู้ใช้เฉพาะเมื่อมี user */}
            {user && (
              <>
                {/* วงกลมแสดงอักษรย่อของผู้ใช้ */}
                <div className="w-9 h-9 rounded-full bg-brand-900 text-gold-500 text-xs font-semibold flex items-center justify-center shrink-0">
                  {getInitials(displayName)}
                </div>

                {/* ชื่อและ Role จะซ่อนบนหน้าจอที่เล็กกว่า sm */}
                <div className="min-w-0 hidden sm:block">

                  {/* แสดงชื่อผู้ใช้ และตัดข้อความหากยาวเกินพื้นที่ */}
                  <p className="text-sm text-ink-900 font-medium truncate">
                    {displayName}
                  </p>

                  {/* แสดงป้าย Role พร้อมสีตามประเภทผู้ใช้ */}
                  <span
                    className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE_CLASS[user.role]}`}
                  >
                    {/* แสดงชื่อ Role ภาษาไทย หรือใช้ค่า Role เดิมหากไม่มีคำแปล */}
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* ส่วนขวาของ Header: แจ้งเตือนและออกจากระบบ */}
          <div className="flex items-center gap-4 shrink-0">

            {/* แสดงกระดิ่งเฉพาะเมื่อ Role ผ่านเงื่อนไขที่กำหนด */}
            {canSeeStockAlerts(user?.role) && <NotificationBell />}

            {/* ปุ่มออกจากระบบผ่าน Supabase Authentication */}
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-red-600 transition-colors"
            >
              <LogoutIcon />

              {/* ซ่อนข้อความบนหน้าจอเล็ก แต่ยังคงแสดงไอคอน */}
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </header>

        {/* แสดงแบนเนอร์ Demo ตามเงื่อนไขที่กำหนดใน Component */}
        <DemoBanner />

        {/* พื้นที่แสดงเนื้อหาของ Route ปัจจุบัน */}
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
