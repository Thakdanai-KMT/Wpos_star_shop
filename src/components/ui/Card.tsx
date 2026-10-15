
import type { HTMLAttributes } from 'react'

// กำหนด Props ให้ Card รองรับคุณสมบัติมาตรฐานของ HTML <div>
// เช่น id, onClick, title, style และ aria-label
export default function Card({
  // className ใช้เพิ่มหรือปรับแต่ง CSS จากภายนอก
  // หากไม่ได้ส่งค่ามา จะใช้สตริงว่าง
  className = '',

  // รับ Props อื่น ๆ ทั้งหมดไว้ส่งต่อให้ <div>
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      // กำหนดรูปแบบพื้นฐานของ Card
      // bg-white          = พื้นหลังสีขาว
      // rounded-lg        = มุมโค้งมน
      // border            = แสดงเส้นขอบ
      // border-black/5    = เส้นขอบสีดำ ความทึบ 5%
      // className         = คลาสเพิ่มเติมที่ผู้เรียกส่งเข้ามา
      className={`bg-white rounded-lg border border-black/5 ${className}`}

      // ส่ง Props ที่เหลือ เช่น id, onClick หรือ style ให้ <div>
      {...props}
    />
  )
}
