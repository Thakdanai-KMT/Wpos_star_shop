
import type {
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

// Props สำหรับช่องกรอกข้อมูลทั่วไป (input)
// สืบทอดคุณสมบัติมาตรฐานของ HTML input เช่น value, onChange, placeholder และ disabled
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string // ข้อความชื่อช่องกรอกข้อมูล
  icon?: ReactNode // ไอคอนที่แสดงภายในช่องกรอกข้อมูล
  error?: boolean // ระบุว่าช่องกรอกข้อมูลมีข้อผิดพลาดหรือไม่
}

// Props สำหรับรายการตัวเลือก (select)
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string // ข้อความชื่อรายการตัวเลือก
  error?: boolean // ระบุว่ามีข้อผิดพลาดหรือไม่
}

// Props สำหรับช่องกรอกข้อความหลายบรรทัด (textarea)
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string // ข้อความชื่อช่องกรอกข้อมูล
  error?: boolean // ระบุว่ามีข้อผิดพลาดหรือไม่
}

// กำหนดรูปแบบลูกศรของ select ด้วย CSS
// ใช้ SVG แบบฝังใน data URL จึงไม่ต้องสร้างไฟล์รูปภาพแยก
const SELECT_ARROW: CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat', // ไม่ให้รูปภาพลูกศรแสดงซ้ำ
  backgroundPosition: 'right 0.75rem center', // วางลูกศรทางขวาและจัดให้อยู่กึ่งกลางแนวตั้ง
  backgroundSize: '1rem', // กำหนดขนาดลูกศร
}

// Component สำหรับสร้างช่องกรอกข้อมูลทั่วไป
export function Input({
  label,
  className = '', // เปิดให้เพิ่มคลาส CSS จากภายนอก
  id,
  icon,
  error = false, // ค่าเริ่มต้นคือไม่มีข้อผิดพลาด
  ...props // รับ Props มาตรฐานอื่น ๆ ของ input
}: InputProps) {
  // สร้าง id สำหรับข้อความแจ้งเตือน โดยอ้างอิงจาก id ของช่องกรอกข้อมูล
  const errorId = id ? `${id}-error` : undefined

  return (
    <div className="w-full">
      {/* แสดง label เฉพาะเมื่อมีการส่งข้อความเข้ามา */}
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm text-ink-600">
          {label}
        </label>
      )}

      <div className="relative">
        {/* แสดงไอคอนทางซ้ายภายในช่องกรอกข้อมูล หากมีการส่ง icon เข้ามา */}
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/50">
            {icon}
          </span>
        )}

        <input
          {...props} // ส่ง Props เช่น value, onChange, type และ placeholder ให้ input
          id={id}
          // แจ้งเทคโนโลยีช่วยเหลือว่าช่องนี้มีข้อผิดพลาดหรือไม่
          aria-invalid={error || undefined}
          // เชื่อมช่องกรอกข้อมูลกับข้อความแจ้งเตือนเมื่อมีข้อผิดพลาด
          // ถ้าไม่มี error จะใช้ aria-describedby ที่ผู้เรียกกำหนดไว้ (ถ้ามี)
          aria-describedby={error ? errorId : props['aria-describedby']}
          className={`w-full rounded-lg border bg-surface py-2.5 text-sm text-ink-900 transition-colors duration-150 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gold-400 disabled:bg-gray-50 disabled:text-ink-600 ${
            // เปลี่ยนสีเส้นขอบตามสถานะข้อผิดพลาด
            error ? 'border-red-400' : 'border-brand-100'
          } ${
            // เว้นพื้นที่ด้านซ้ายสำหรับไอคอน หรือใช้ระยะห่างปกติเมื่อไม่มีไอคอน
            icon ? 'pl-10 pr-3' : 'px-3'
          } ${className}`}
        />

        {/* แสดงข้อความแจ้งเตือนใต้ช่องกรอกข้อมูลเมื่อ error เป็น true */}
        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-600">
            กรุณาตรวจสอบข้อมูลนี้
          </p>
        )}
      </div>
    </div>
  )
}

// Component สำหรับสร้างรายการตัวเลือก เช่น หมวดหมู่สินค้า หรือบทบาทผู้ใช้งาน
export function Select({
  label,
  className = '',
  id,
  children, // ตัวเลือกภายใน select เช่น <option>
  error = false,
  ...props // รับ Props มาตรฐานอื่น ๆ ของ select
}: SelectProps) {
  // สร้าง id สำหรับเชื่อมข้อความแจ้งเตือนกับ select
  const errorId = id ? `${id}-error` : undefined

  return (
    <div className="w-full">
      {/* แสดงชื่อรายการตัวเลือก หากมีการกำหนด label */}
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm text-ink-600">
          {label}
        </label>
      )}

      <select
        {...props} // ส่ง Props เช่น value, onChange และ disabled
        id={id}
        // ใช้ลูกศรแบบกำหนดเอง และยังคงรองรับ style ที่ผู้เรียกส่งเข้ามา
        // หาก style มี property ซ้ำกับ SELECT_ARROW ค่าจาก props.style จะมีลำดับความสำคัญกว่า
        style={{ ...SELECT_ARROW, ...props.style }}
        aria-invalid={error || undefined}
        aria-describedby={error ? errorId : props['aria-describedby']}
        className={`w-full appearance-none rounded-lg border bg-surface px-3 py-2.5 pr-10 text-sm text-ink-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gold-400 disabled:bg-gray-50 disabled:text-ink-600 ${
          // แสดงเส้นขอบสีแดงเมื่อมีข้อผิดพลาด
          error ? 'border-red-400' : 'border-brand-100'
        } ${className}`}
      >
        {/* แสดงตัวเลือกที่ส่งเข้ามาผ่าน children */}
        {children}
      </select>

      {/* แสดงข้อความแจ้งเตือนเมื่อเลือกข้อมูลไม่ถูกต้องหรือยังไม่ครบ */}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          กรุณาเลือกข้อมูล
        </p>
      )}
    </div>
  )
}

// Component สำหรับกรอกข้อความหลายบรรทัด เช่น รายละเอียดสินค้า หรือที่อยู่
export function Textarea({
  label,
  className = '',
  id,
  error = false,
  ...props // รับ Props มาตรฐานอื่น ๆ ของ textarea
}: TextareaProps) {
  // สร้าง id สำหรับข้อความแจ้งเตือน
  const errorId = id ? `${id}-error` : undefined

  return (
    <div className="w-full">
      {/* แสดงชื่อช่องกรอกข้อความ หากมีการกำหนด label */}
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm text-ink-600">
          {label}
        </label>
      )}

      <textarea
        {...props} // ส่ง Props เช่น value, onChange, rows และ placeholder
        id={id}
        aria-invalid={error || undefined}
        aria-describedby={error ? errorId : props['aria-describedby']}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gold-400 disabled:bg-gray-50 disabled:text-ink-600 ${
          // เปลี่ยนสีเส้นขอบตามสถานะข้อผิดพลาด
          error ? 'border-red-400' : 'border-brand-100'
        } ${className}`}
      />

      {/* แสดงข้อความแจ้งเตือนใต้ช่องกรอกข้อความเมื่อ error เป็น true */}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          กรุณาตรวจสอบข้อมูลนี้
        </p>
      )}
    </div>
  )
}
