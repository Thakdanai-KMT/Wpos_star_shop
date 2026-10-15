
export default function LoadingScreen() {
  return (
    // สร้างพื้นที่หน้าจอโหลดให้เต็มความสูงของหน้าจอ
    // min-h-[100dvh] ช่วยให้ความสูงสัมพันธ์กับพื้นที่แสดงผลจริงของเบราว์เซอร์
    // flex flex-col จัดองค์ประกอบเรียงจากบนลงล่าง
    // items-center justify-center จัดองค์ประกอบให้อยู่ตรงกลาง
    // bg-brand-900 กำหนดพื้นหลังเป็นสีหลักของระบบ
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-brand-900">

      {/* กล่องไอคอนดาวและวงแหวนหมุน */}
      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-5 relative">

        {/* แสดงสัญลักษณ์ดาวของ WPOS STAR SHOP */}
        <span className="text-gold-500 text-2xl font-bold">★</span>

        {/* วงแหวนแสดงสถานะกำลังโหลด */}
        {/* absolute inset-0 ทำให้วงแหวนครอบคลุมพื้นที่กล่อง */}
        {/* border-t-gold-500 เน้นสีขอบด้านบนให้เห็นการหมุน */}
        {/* animate-spin ใช้แอนิเมชันหมุนที่ Tailwind CSS กำหนดไว้ */}
        <span className="absolute inset-0 rounded-2xl border-2 border-gold-500/30 border-t-gold-500 animate-spin" />
      </div>

      {/* แสดงชื่อระบบ */}
      <p className="text-white/90 text-sm font-medium tracking-wide">
        WPOS STAR SHOP
      </p>

      {/* แจ้งผู้ใช้ว่าระบบกำลังโหลด */}
      <p className="text-white/40 text-xs mt-1">กำลังโหลดระบบ...</p>
    </div>
  )
}
