
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLowStockAlerts } from '../../hooks/useLowStockAlerts'

// นำเข้า useEffect สำหรับจัดการ Side Effects
// useRef สำหรับอ้างอิง Element บนหน้าเว็บ
// useState สำหรับเก็บสถานะเปิด/ปิดกล่องแจ้งเตือน
// Link ใช้เปลี่ยนหน้าโดยไม่โหลดเว็บใหม่ทั้งหน้า
// useLowStockAlerts เป็น Custom Hook สำหรับดึงข้อมูลแจ้งเตือนสต็อก

// Component สำหรับวาดไอคอนกระดิ่งด้วย SVG
function BellIcon() {
  return (
    <svg
      width="22" // ความกว้างของไอคอน 22 พิกเซล
      height="22" // ความสูงของไอคอน 22 พิกเซล
      viewBox="0 0 24 24" // กำหนดพื้นที่พิกัดสำหรับวาด SVG
      fill="none" // ไม่เติมสีภายในรูปทรง
      stroke="currentColor" // ใช้สีตามข้อความหรือ Element รอบข้าง
      strokeWidth="1.8" // ความหนาของเส้น
      strokeLinecap="round" // ทำให้ปลายเส้นโค้งมน
      strokeLinejoin="round" // ทำให้มุมที่เส้นเชื่อมกันโค้งมน
    >
      {/* วาดส่วนตัวกระดิ่ง */}
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />

      {/* วาดส่วนลูกตุ้มด้านล่างของกระดิ่ง */}
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

// Component หลักสำหรับแสดงการแจ้งเตือนสต็อกสินค้า
export default function NotificationBell() {
  // เรียก Custom Hook เพื่อรับข้อมูลแจ้งเตือนและจำนวนสินค้าหมด
  // alerts = รายการสินค้าที่ต้องแจ้งเตือน
  // outCount = จำนวนรายการที่มีสถานะสินค้าหมด ตามนิยามของ Hook
  const { alerts, outCount } = useLowStockAlerts()

  // เก็บสถานะของกล่องแจ้งเตือน
  // false = ปิดกล่อง, true = เปิดกล่อง
  const [isOpen, setIsOpen] = useState(false)

  // สร้าง Ref เพื่ออ้างอิง div หลักที่ครอบปุ่มและกล่องแจ้งเตือน
  // เริ่มต้นเป็น null เพราะ Element ยังไม่ได้ถูกเชื่อมกับ Ref
  const wrapperRef = useRef<HTMLDivElement>(null)

  // จัดการเหตุการณ์ภายนอก Component เมื่อกล่องแจ้งเตือนเปิดอยู่
  useEffect(() => {
    // หากกล่องปิดอยู่ ไม่จำเป็นต้องติดตั้ง Event Listener
    if (!isOpen) return

    // ทำงานเมื่อมีการกดหรือสัมผัส Pointer บนหน้าเว็บ
    function onPointerDown(e: Event) {
      // ตรวจสอบว่ามี Element อ้างอิงอยู่หรือไม่
      // และตำแหน่งที่คลิกอยู่นอกพื้นที่ของ Component หรือไม่
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        // หากคลิกนอกพื้นที่ ให้ปิดกล่องแจ้งเตือน
        setIsOpen(false)
      }
    }

    // ทำงานเมื่อมีการกดปุ่มบนคีย์บอร์ด
    function onKeyDown(e: KeyboardEvent) {
      // หากกด Escape ให้ปิดกล่องแจ้งเตือน
      if (e.key === 'Escape') setIsOpen(false)
    }

    // ลงทะเบียน Event Listener เพื่อรอฟังการคลิกและการกดคีย์บอร์ด
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)

    // Cleanup Function:
    // เมื่อกล่องปิดหรือ Component ถูกถอดออกจากหน้าเว็บ
    // ให้ลบ Event Listener เพื่อป้องกันการทำงานค้าง
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen]) // ทำ Effect ใหม่เมื่อสถานะ isOpen เปลี่ยน

  // นับจำนวนรายการแจ้งเตือนทั้งหมด
  const count = alerts.length

  // จำกัดตัวเลขบนป้ายแจ้งเตือนไม่ให้ยาวเกินไป
  // หากมากกว่า 9 รายการ ให้แสดง "9+"
  // หากไม่เกิน 9 ให้แสดงจำนวนจริงเป็นข้อความ
  const badgeText = count > 9 ? '9+' : String(count)

  return (
    // Element หลักที่ใช้เป็นขอบเขตสำหรับตรวจสอบการคลิกภายนอก
    <div ref={wrapperRef} className="relative">

      {/* ปุ่มกระดิ่งสำหรับเปิดและปิดกล่องแจ้งเตือน */}
      <button
        type="button" // ป้องกันไม่ให้ปุ่มทำหน้าที่ Submit Form โดยไม่ตั้งใจ
        onClick={() => setIsOpen((v) => !v)}
        // สลับสถานะจากเปิดเป็นปิด หรือจากปิดเป็นเปิด
        className="relative text-ink-600 hover:text-brand-900 transition-colors"
        // ชื่อสำหรับโปรแกรมอ่านหน้าจอ
        aria-label={
          count > 0 ? `การแจ้งเตือน ${count} รายการ` : 'การแจ้งเตือน'
        }
        // แจ้งเทคโนโลยีช่วยการเข้าถึงว่ากล่องเปิดอยู่หรือไม่
        aria-expanded={isOpen}
      >
        {/* แสดงรูปกระดิ่ง */}
        <BellIcon />

        {/* แสดงป้ายจำนวนเฉพาะเมื่อมีรายการแจ้งเตือน */}
        {count > 0 && (
          <span
            // หากมีสินค้าหมด ให้ใช้สีแดง
            // หากไม่มีสินค้าหมด แต่มีสต็อกต่ำ ให้ใช้สีทอง
            className={`absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center ${
              outCount > 0
                ? 'bg-red-500 text-white'
                : 'bg-gold-500 text-brand-900'
            }`}
          >
            {/* แสดงจำนวนแจ้งเตือน เช่น 3 หรือ 9+ */}
            {badgeText}
          </span>
        )}
      </button>

      {/* แสดงกล่องแจ้งเตือนเฉพาะเมื่อ isOpen เป็น true */}
      {isOpen && (
        <div
          // บนมือถือใช้ตำแหน่ง fixed
          // ตั้งแต่หน้าจอ sm ขึ้นไป เปลี่ยนเป็น absolute ใต้ปุ่มกระดิ่ง
          className="fixed right-3 top-16 w-[calc(100vw-1.5rem)] sm:absolute sm:right-0 sm:top-auto sm:mt-3 sm:w-80 rounded-xl bg-white shadow-xl border border-black/5 overflow-hidden z-50"
        >
          {/* ส่วนหัวของกล่องแจ้งเตือน */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
            <p className="text-sm font-semibold text-brand-900">
              การแจ้งเตือน
            </p>

            {/* แสดงจำนวนรายการข้างหัวข้อเมื่อมีแจ้งเตือน */}
            {count > 0 && (
              <span className="text-xs text-ink-600">
                {count} รายการ
              </span>
            )}
          </div>

          {/* หากไม่มีรายการ ให้แสดงข้อความสถานะปกติ */}
          {count === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-600/70">
              ไม่มีการแจ้งเตือน สต็อกสินค้าปกติ
            </p>
          ) : (
            // หากมีรายการ ให้สร้างรายการแจ้งเตือนด้วยข้อมูลจาก alerts
            <ul className="max-h-80 overflow-y-auto">
              {alerts.map((a) => (
                // ใช้ a.id เป็น Key เพื่อให้ React ระบุรายการแต่ละรายการได้
                <li
                  key={a.id}
                  className="border-t border-black/5 first:border-t-0"
                >
                  {/* คลิกเพื่อไปยังหน้าจัดการสินค้าคงคลัง */}
                  <Link
                    to="/inventory"
                    // ปิดกล่องแจ้งเตือนเมื่อเลือกดูรายการ
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface transition-colors"
                  >
                    {/* ด้านซ้าย: ชื่อสินค้าและรายละเอียดแจ้งเตือน */}
                    <div className="min-w-0">

                      {/* แสดงชื่อสินค้า และตัดข้อความหากยาวเกินไป */}
                      <p className="text-sm text-ink-900 truncate">
                        {a.name}
                      </p>

                      {/* แสดงรายละเอียดตามระดับสต็อก */}
                      <p className="text-xs text-ink-600">
                        {a.level === 'OUT'
                          ? 'สินค้าหมด ควรเติมสต็อก'
                          : 'สต็อกใกล้หมด'}
                      </p>
                    </div>

                    {/* ด้านขวา: ป้ายแสดงระดับสต็อก */}
                    <span
                      className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                        a.level === 'OUT'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gold-500/15 text-gold-600'
                      }`}
                    >
                      {/* หากสินค้าหมดให้แสดง "หมด"
                          มิฉะนั้นให้แสดงจำนวนคงเหลือ */}
                      {a.level === 'OUT' ? 'หมด' : `เหลือ ${a.stock}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
