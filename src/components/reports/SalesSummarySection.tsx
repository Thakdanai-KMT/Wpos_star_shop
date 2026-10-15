
import { useMemo, useState } from 'react'

// นำเข้า Component สำหรับแสดงการ์ด ปุ่ม และช่องกรอกข้อมูล
import Card from '../ui/Card'
import Button from '../ui/Button'
import { Input } from '../ui/Input'

// Hook สำหรับเข้าถึงข้อมูลผู้ใช้ที่เข้าสู่ระบบ
import { useAuth } from '../../contexts/AuthContext'

// Hook สำหรับอ่านข้อมูลการตั้งค่าร้านค้า
import { useSettings } from '../../hooks/useSettings'

// Hook สำหรับดึงข้อมูลสรุปยอดขายตามช่วงวันที่
import { useSalesSummary } from '../../hooks/useSalesSummary'

// ฟังก์ชันจัดการช่วงวันที่ โดยอ้างอิงวันที่ในประเทศไทย
import { monthRange, todayInThailand } from '../../lib/thai-date'

// ฟังก์ชันจัดรูปแบบจำนวนเต็มและจำนวนเงิน
import { formatInt, formatMoney } from '../../lib/report-format'

// ฟังก์ชันส่งออกข้อมูลยอดขายเป็น Excel และพิมพ์รายงาน
import { exportSalesExcel } from '../../lib/export-sales-excel'
import { printSalesReport } from '../../lib/print-sales-report'

// Type สำหรับกำหนดโครงสร้างข้อมูลร้านค้าที่ใช้ในรายงาน
import type { ShopInfo } from '../../types/sales-summary'

// ฟังก์ชันส่งออกข้อมูลยอดขายเป็น PDF
import { exportSalesPdf } from '../../lib/export-sales-pdf'

// แปลงค่าที่รับเข้ามาเป็นข้อความ
// - ถ้าเป็น string จะตัดช่องว่างด้านหน้าและด้านหลัง
// - ถ้าไม่ใช่ string เช่น null, undefined หรือ number จะคืนค่าเป็นข้อความว่าง
// unknown ใช้เพราะยังไม่ทราบชนิดข้อมูลที่รับเข้ามาแน่นอน
function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

// Component สำหรับแสดงรายงานสรุปยอดขายตามช่วงวันที่
export default function SalesSummarySection() {
  // อ่านวันที่ปัจจุบันตามเวลาในประเทศไทย
  const today = todayInThailand()

  // กำหนดวันที่เริ่มต้นเป็นวันแรกของเดือนปัจจุบัน
  const [from, setFrom] = useState(monthRange(0).from)

  // กำหนดวันที่สิ้นสุดเป็นวันที่ปัจจุบัน
  const [to, setTo] = useState(today)

  // ดึงข้อมูลสรุปยอดขายตามวันที่เริ่มต้นและสิ้นสุด
  // summary   = ข้อมูลสรุปยอดขาย
  // isLoading = สถานะกำลังโหลดข้อมูล
  // error     = ข้อผิดพลาดจากการดึงข้อมูล
  const { summary, isLoading, error } = useSalesSummary(from, to)

  // อ่านการตั้งค่าร้านค้า เช่น ชื่อ ที่อยู่ เบอร์โทรศัพท์ และเลขประจำตัวผู้เสียภาษี
  const { settings } = useSettings()

  // อ่านข้อมูลผู้ใช้ที่กำลังเข้าสู่ระบบ
  const { user } = useAuth()

  // สถานะสำหรับตรวจสอบว่ากำลังสร้างไฟล์ Excel อยู่หรือไม่
  const [isExporting, setIsExporting] = useState(false)

  // สถานะสำหรับตรวจสอบว่ากำลังสร้างไฟล์ PDF อยู่หรือไม่
  const [isPdfExporting, setIsPdfExporting] = useState(false)

  // เก็บข้อความแจ้งข้อผิดพลาดจากการส่งออกไฟล์หรือพิมพ์รายงาน
  // null หมายถึงยังไม่มีข้อความผิดพลาด
  const [exportError, setExportError] = useState<string | null>(null)

  // เตรียมข้อมูลร้านค้าให้อยู่ในรูปแบบ ShopInfo
  // useMemo ช่วยเก็บผลลัพธ์ไว้ และคำนวณใหม่เมื่อ settings เปลี่ยน
  const shop: ShopInfo = useMemo(() => {
    // extra อาจไม่มีข้อมูล จึงตรวจสอบด้วย optional chaining
    // Record<string, unknown> หมายถึงออบเจ็กต์ที่มี Key เป็น string
    // และ Value ยังไม่กำหนดชนิดข้อมูลที่แน่นอน
    const extra = settings?.extra as Record<string, unknown> | undefined

    // แปลงชื่อฟิลด์จากการตั้งค่าร้านค้าให้เป็นรูปแบบที่รายงานต้องการ
    return {
      name: text(extra?.shop_name),
      address: text(extra?.shop_address),
      phone: text(extra?.shop_phone),
      taxId: text(extra?.tax_id),
    }
  }, [settings])

  // กำหนดชื่อผู้จัดทำรายงาน
  // ใช้ชื่อเต็มก่อน หากไม่มีจึงใช้ Email และหากไม่มีทั้งสองค่าให้เป็นข้อความว่าง
  const preparedBy = user?.full_name ?? user?.email ?? ''

  // ตรวจสอบว่าวันที่เริ่มต้นอยู่หลังวันที่สิ้นสุดหรือไม่
  // การเปรียบเทียบรูปแบบ YYYY-MM-DD ทำได้เมื่อวันที่ทั้งสองมีรูปแบบเดียวกัน
  const rangeInvalid = from > to

  // ตรวจสอบว่าพร้อมส่งออกไฟล์หรือไม่
  // ต้องมีข้อมูลสรุป โหลดข้อมูลเสร็จ และช่วงวันที่ต้องถูกต้อง
  const canExport = Boolean(summary) && !isLoading && !rangeInvalid

  // ฟังก์ชันจัดการการส่งออก Excel
  async function handleExcel() {
    // หยุดทำงานหากไม่มีข้อมูลสรุปยอดขาย
    if (!summary) return

    // ล้างข้อความผิดพลาดจากการทำงานครั้งก่อน
    setExportError(null)

    // เปลี่ยนสถานะเพื่อแจ้งว่ากำลังสร้างไฟล์ Excel
    setIsExporting(true)

    try {
      // ส่งข้อมูลยอดขาย ข้อมูลร้านค้า และชื่อผู้จัดทำไปสร้างไฟล์ Excel
      await exportSalesExcel(summary, shop, preparedBy)
    } catch {
      // แสดงข้อความเมื่อสร้างไฟล์ Excel ไม่สำเร็จ
      setExportError('สร้างไฟล์ Excel ไม่สำเร็จ')
    } finally {
      // คืนสถานะหลังจากทำงานเสร็จ ไม่ว่าจะสำเร็จหรือเกิดข้อผิดพลาด
      setIsExporting(false)
    }
  }

  // ฟังก์ชันจัดการการส่งออก PDF
  async function handlePdf() {
    // หยุดทำงานหากไม่มีข้อมูลสรุปยอดขาย
    if (!summary) return

    // ล้างข้อความผิดพลาดเดิม
    setExportError(null)

    // เปลี่ยนสถานะเป็นกำลังสร้างไฟล์ PDF
    setIsPdfExporting(true)

    try {
      // ส่งข้อมูลยอดขาย ข้อมูลร้านค้า และชื่อผู้จัดทำไปสร้างไฟล์ PDF
      await exportSalesPdf(summary, shop, preparedBy)
    } catch (err) {
      // ตรวจสอบว่าเป็นข้อผิดพลาดจากการไม่พบไฟล์ฟอนต์หรือไม่
      if (err instanceof Error && err.message === 'FONT_MISSING') {
        // แจ้งตำแหน่งและชื่อไฟล์ฟอนต์ภาษาไทยที่ต้องตรวจสอบ
        setExportError(
          'ไม่พบไฟล์ฟอนต์ใน public/fonts (Sarabun-Regular.ttf และ Sarabun-Bold.ttf)'
        )
      } else {
        // แจ้งข้อผิดพลาดทั่วไปเมื่อสร้าง PDF ไม่สำเร็จ
        setExportError('สร้างไฟล์ PDF ไม่สำเร็จ')
      }
    } finally {
      // คืนสถานะหลังจากจบการสร้าง PDF
      setIsPdfExporting(false)
    }
  }

  // ฟังก์ชันจัดการการพิมพ์รายงาน
  function handlePrint() {
    // หยุดทำงานหากไม่มีข้อมูลสรุปยอดขาย
    if (!summary) return

    // ล้างข้อความผิดพลาดเดิม
    setExportError(null)

    // เรียกฟังก์ชันพิมพ์รายงาน
    // ผลลัพธ์ ok ใช้ตรวจสอบว่าฟังก์ชันเปิดหน้าต่างพิมพ์ได้หรือไม่
    const ok = printSalesReport(summary, shop, preparedBy)

    // หากเปิดหน้าต่างพิมพ์ไม่สำเร็จ ให้แจ้งผู้ใช้
    if (!ok) {
      setExportError(
        'เบราว์เซอร์บล็อกหน้าต่างใหม่ กรุณาอนุญาต pop-up แล้วลองอีกครั้ง'
      )
    }
  }

  // เปลี่ยนช่วงวันที่ตามค่าที่ได้รับจากปุ่มลัด
  // range ต้องมีวันที่เริ่มต้นและวันที่สิ้นสุด
  function applyPreset(range: { from: string; to: string }) {
    setFrom(range.from)
    setTo(range.to)
  }

  // กำหนดคลาส Tailwind ที่ใช้ร่วมกันในปุ่มเลือกช่วงวันที่
  const chip =
    'text-xs px-3 py-1.5 rounded-full border border-brand-100 text-ink-600 hover:border-gold-400 hover:text-brand-900 transition-colors'

  return (
    // Container หลักของส่วนรายงาน
    <div className="mb-8">

      {/* หัวข้อรายงาน */}
      <h2 className="text-lg font-semibold text-brand-900 mb-1">
        รายงานสรุปตามช่วงวันที่
      </h2>

      {/* คำอธิบายความสามารถในการส่งออกรายงาน */}
      <p className="text-sm text-ink-600 mb-4">
        ส่งออกเป็นไฟล์ Excel หรือ PDF สำหรับเก็บเป็นหลักฐานหรือยื่นประกอบเอกสาร
      </p>

      {/* Card สำหรับเลือกวันที่เริ่มต้นและวันที่สิ้นสุด */}
      <Card className="p-5 mb-4">
        {/* จัดช่องกรอกข้อมูลและปุ่มให้อยู่ในแถวเดียวกันเมื่อมีพื้นที่เพียงพอ */}
        <div className="flex gap-3 items-end flex-wrap">

          {/* ช่องเลือกวันที่เริ่มต้น */}
          <div className="w-full sm:w-44">
            <Input
              id="summary_from"
              label="ตั้งแต่วันที่"
              type="date"
              value={from}
              max={to} // จำกัดวันที่เริ่มต้นไม่ให้เกินวันที่สิ้นสุด
              onChange={(e) => setFrom(e.target.value)} // อัปเดตวันที่เริ่มต้นเมื่อผู้ใช้เปลี่ยนค่า
            />
          </div>

          {/* ช่องเลือกวันที่สิ้นสุด */}
          <div className="w-full sm:w-44">
            <Input
              id="summary_to"
              label="ถึงวันที่"
              type="date"
              value={to}
              min={from} // จำกัดวันที่สิ้นสุดไม่ให้ก่อนวันที่เริ่มต้น
              onChange={(e) => setTo(e.target.value)} // อัปเดตวันที่สิ้นสุดเมื่อผู้ใช้เปลี่ยนค่า
            />
          </div>

          {/* ปุ่มลัดสำหรับเลือกช่วงวันที่ที่ใช้บ่อย */}
          <div className="flex gap-2 pb-0.5">

            {/* เลือกตั้งแต่วันแรกของเดือนนี้จนถึงวันนี้ */}
            <button
              type="button"
              className={chip}
              onClick={() =>
                applyPreset({ from: monthRange(0).from, to: today })
              }
            >
              เดือนนี้
            </button>

            {/* เลือกช่วงวันที่ของเดือนที่แล้ว */}
            <button
              type="button"
              className={chip}
              onClick={() => applyPreset(monthRange(-1))}
            >
              เดือนที่แล้ว
            </button>
          </div>
        </div>

        {/* แสดงข้อความเตือนหากช่วงวันที่ไม่ถูกต้อง */}
        {rangeInvalid && (
          <p className="text-red-600 text-sm mt-3">
            วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด
          </p>
        )}
      </Card>

      {/* แสดงข้อความระหว่างรอข้อมูลยอดขาย */}
      {isLoading && (
        <p className="text-ink-600 text-sm mb-3">
          กำลังโหลด...
        </p>
      )}

      {/* แสดงข้อผิดพลาดที่เกิดจากการดึงข้อมูลยอดขาย */}
      {error && (
        <p className="text-red-600 text-sm mb-3">
          {error}
        </p>
      )}

      {/* แสดงข้อมูลสรุปเมื่อมีข้อมูลและการโหลดเสร็จแล้ว */}
      {summary && !isLoading && (
        <>
          {/* Grid สำหรับแสดงการ์ดสรุปยอดขาย 4 รายการ */}
          {/* หน้าจอทั่วไปใช้ 2 คอลัมน์ และหน้าจอขนาดใหญ่ใช้ 4 คอลัมน์ */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">

            {/* การ์ดที่ 1: ยอดขายสุทธิ */}
            <Card className="p-4">
              <p className="text-xs text-ink-600 mb-1">
                ยอดขายสุทธิ
              </p>

              <p className="text-xl font-semibold text-brand-900">
                {/* จัดรูปแบบตัวเลขยอดขายให้อ่านง่าย */}
                {formatMoney(summary.total_sales)}

                <span className="text-xs font-normal text-ink-600 ml-1">
                  บาท
                </span>
              </p>
            </Card>

            {/* การ์ดที่ 2: จำนวนบิล */}
            <Card className="p-4">
              <p className="text-xs text-ink-600 mb-1">
                จำนวนบิล
              </p>

              <p className="text-xl font-semibold text-brand-900">
                {/* จัดรูปแบบจำนวนบิล */}
                {formatInt(summary.total_bills)}
              </p>
            </Card>

            {/* การ์ดที่ 3: ยอดขายเฉลี่ยต่อบิล */}
            <Card className="p-4">
              <p className="text-xs text-ink-600 mb-1">
                เฉลี่ยต่อบิล
              </p>

              <p className="text-xl font-semibold text-brand-900">
                {/* ป้องกันการหารด้วยศูนย์ หากไม่มีบิลให้แสดงค่าเฉลี่ยเป็น 0 */}
                {formatMoney(
                  summary.total_bills > 0
                    ? summary.total_sales / summary.total_bills
                    : 0
                )}

                <span className="text-xs font-normal text-ink-600 ml-1">
                  บาท
                </span>
              </p>
            </Card>

            {/* การ์ดที่ 4: จำนวนบิลที่ถูกยกเลิก */}
            <Card className="p-4">
              <p className="text-xs text-ink-600 mb-1">
                บิลที่ยกเลิก
              </p>

              <p className="text-xl font-semibold text-brand-900">
                {/* จัดรูปแบบจำนวนบิลที่ยกเลิก */}
                {formatInt(summary.cancelled_bills)}
              </p>
            </Card>
          </div>

          {/* กลุ่มปุ่มสำหรับดาวน์โหลดไฟล์และพิมพ์รายงาน */}
          <div className="flex gap-3 flex-wrap items-center">

            {/* ปุ่มดาวน์โหลด Excel */}
            {/* ปิดปุ่มเมื่อข้อมูลไม่พร้อมหรือกำลังสร้าง Excel อยู่ */}
            <Button
              onClick={handleExcel}
              disabled={!canExport || isExporting}
            >
              {/* เปลี่ยนข้อความระหว่างกำลังสร้างไฟล์ */}
              {isExporting ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด Excel'}
            </Button>

            {/* ปุ่มดาวน์โหลด PDF */}
            {/* ปิดปุ่มเมื่อข้อมูลไม่พร้อมหรือกำลังสร้าง PDF อยู่ */}
            <Button
              onClick={handlePdf}
              disabled={!canExport || isPdfExporting}
            >
              {isPdfExporting ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด PDF'}
            </Button>

            {/* ปุ่มเปิดหน้าต่างพิมพ์รายงาน */}
            <button
              type="button"
              onClick={handlePrint}
              disabled={!canExport}
              className="text-xs text-ink-600 underline hover:text-brand-900 disabled:opacity-50"
            >
              หรือพิมพ์รายงาน
            </button>

            {/* ปุ่ม PDF และข้อความด้านล่างถูกปิดใช้งานไว้
                เพราะปัจจุบันมีปุ่มดาวน์โหลด PDF แยกอยู่แล้ว */}
            {/*
            <Button onClick={handlePdf} disabled={!canExport}>
              บันทึกเป็น PDF
            </Button>

            <span className="text-xs text-ink-600/70">
              ปุ่ม PDF จะเปิดหน้าต่างพิมพ์ ให้เลือกปลายทางเป็น "บันทึกเป็น PDF"
            </span>
            */}
          </div>

          {/* แสดงข้อผิดพลาดจากการส่งออกไฟล์หรือพิมพ์รายงาน */}
          {exportError && (
            <p className="text-red-600 text-sm mt-3">
              {exportError}
            </p>
          )}
        </>
      )}
    </div>
  )
}
