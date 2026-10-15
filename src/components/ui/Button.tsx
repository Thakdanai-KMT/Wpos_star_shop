
import type { ButtonHTMLAttributes } from 'react'

// กำหนดรูปแบบปุ่มที่อนุญาตให้ใช้งาน
// ใช้ Union Type เพื่อจำกัดค่าให้เลือกได้เพียง 4 รูปแบบ
type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

// กำหนด Props ของ Component Button
// สืบทอดคุณสมบัติทั้งหมดของ HTML button เช่น
// onClick, type, disabled, title และ aria-label
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // variant เป็นตัวกำหนดรูปแบบและสีของปุ่ม
  // ? หมายถึงไม่จำเป็นต้องส่งค่าเข้ามา
  variant?: Variant
}

// กำหนด Tailwind CSS Class สำหรับแต่ละรูปแบบปุ่ม
// Record<Variant, string> บังคับให้กำหนด Class ครบทุก Variant
const VARIANT_CLASS: Record<Variant, string> = {
  // ปุ่มหลัก เช่น บันทึก ดาวน์โหลด หรือยืนยัน
  primary:
    'bg-gold-500 text-brand-900 hover:bg-gold-400 font-medium',

  // ปุ่มรอง เช่น ย้อนกลับ หรือดำเนินการเพิ่มเติม
  secondary:
    'bg-white text-brand-900 border border-brand-100 hover:bg-brand-50',

  // ปุ่มสำหรับการกระทำที่มีความเสี่ยง เช่น ลบข้อมูล
  danger:
    'bg-white text-red-600 border border-red-200 hover:bg-red-50',

  // ปุ่มแบบเรียบ ไม่มีพื้นหลังเด่น
  // เหมาะกับการกระทำรองที่ไม่ต้องการเน้นสายตา
  ghost: 'text-ink-600 hover:text-brand-900',
}

// สร้าง Component Button ที่สามารถนำไปใช้ซ้ำได้ทั่วทั้งระบบ
export default function Button({
  // หากไม่ได้ระบุ variant ให้ใช้ primary เป็นค่าเริ่มต้น
  variant = 'primary',

  // หากไม่ได้กำหนด className ให้ใช้ข้อความว่าง
  // เพื่อให้สามารถนำไปต่อกับ Class อื่นได้
  className = '',

  // แยก disabled ออกมาเพื่อส่งให้ปุ่ม HTML โดยตรง
  disabled,

  // รวบรวม Props อื่น ๆ ที่เหลือ เช่น onClick, type และ aria-label
  ...props
}: ButtonProps) {
  return (
    <button
      // กำหนดสถานะปิดใช้งานปุ่มตามค่าที่ได้รับ
      // เมื่อ disabled เป็น true ผู้ใช้จะกดปุ่มไม่ได้
      disabled={disabled}

      // รวม Tailwind Class จาก 4 ส่วน:
      // 1. รูปแบบพื้นฐานของปุ่ม
      // 2. เอฟเฟกต์เมื่อกดหรือเลื่อนเมาส์บนปุ่ม primary
      // 3. สีและรูปแบบตาม variant
      // 4. Class เพิ่มเติมจากผู้เรียกใช้ Component
      className={`px-4 py-2 rounded-lg text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0 ${
        variant === 'primary' ? 'hover:-translate-y-0.5 hover:shadow-md' : ''
      } ${VARIANT_CLASS[variant]} ${className}`}

      // ส่ง Props อื่น ๆ เช่น onClick, type และ aria-label
      // ไปยัง HTML button
      {...props}
    />
  )
}
