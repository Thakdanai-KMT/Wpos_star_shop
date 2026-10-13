import { useMemo, useState } from 'react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { Input } from '../ui/Input'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../hooks/useSettings'
import { useSalesSummary } from '../../hooks/useSalesSummary'
import { monthRange, todayInThailand } from '../../lib/thai-date'
import { formatInt, formatMoney } from '../../lib/report-format'
import { exportSalesExcel } from '../../lib/export-sales-excel'
import { printSalesReport } from '../../lib/print-sales-report'
import type { ShopInfo } from '../../types/sales-summary'
import { exportSalesPdf } from '../../lib/export-sales-pdf'
function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

export default function SalesSummarySection() {
  const today = todayInThailand()
  const [from, setFrom] = useState(monthRange(0).from)
  const [to, setTo] = useState(today)
  const { summary, isLoading, error } = useSalesSummary(from, to)
  const { settings } = useSettings()
  const { user } = useAuth()
  const [isExporting, setIsExporting] = useState(false)
    const [isPdfExporting, setIsPdfExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const shop: ShopInfo = useMemo(() => {
    const extra = settings?.extra as Record<string, unknown> | undefined
    return {
      name: text(extra?.shop_name),
      address: text(extra?.shop_address),
      phone: text(extra?.shop_phone),
      taxId: text(extra?.tax_id),
    }
  }, [settings])

  // ถ้า TypeScript ฟ้องว่าไม่มี full_name ให้เปลี่ยนเป็นชื่อฟิลด์ที่ AppLayout ใช้แสดงชื่อผู้ใช้
  const preparedBy = user?.full_name ?? user?.email ?? ''
  const rangeInvalid = from > to
  const canExport = Boolean(summary) && !isLoading && !rangeInvalid

  async function handleExcel() {
    if (!summary) return
    setExportError(null)
    setIsExporting(true)
    try {
      await exportSalesExcel(summary, shop, preparedBy)
    } catch {
      setExportError('สร้างไฟล์ Excel ไม่สำเร็จ')
    } finally {
      setIsExporting(false)
    }
  }

   async function handlePdf() {
    if (!summary) return
    setExportError(null)
    setIsPdfExporting(true)
    try {
      await exportSalesPdf(summary, shop, preparedBy)
    } catch (err) {
      setExportError(
        err instanceof Error && err.message === 'FONT_MISSING'
          ? 'ไม่พบไฟล์ฟอนต์ใน public/fonts (Sarabun-Regular.ttf และ Sarabun-Bold.ttf)'
          : 'สร้างไฟล์ PDF ไม่สำเร็จ'
      )
    } finally {
      setIsPdfExporting(false)
    }
  }

  function handlePrint() {
    if (!summary) return
    setExportError(null)
    const ok = printSalesReport(summary, shop, preparedBy)
    if (!ok) {
      setExportError('เบราว์เซอร์บล็อกหน้าต่างใหม่ กรุณาอนุญาต pop-up แล้วลองอีกครั้ง')
    }
  }
  function applyPreset(range: { from: string; to: string }) {
    setFrom(range.from)
    setTo(range.to)
  }

  const chip =
    'text-xs px-3 py-1.5 rounded-full border border-brand-100 text-ink-600 hover:border-gold-400 hover:text-brand-900 transition-colors'

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-brand-900 mb-1">
        รายงานสรุปตามช่วงวันที่
      </h2>
      <p className="text-sm text-ink-600 mb-4">
        ส่งออกเป็นไฟล์ Excel หรือ PDF สำหรับเก็บเป็นหลักฐานหรือยื่นประกอบเอกสาร
      </p>

      <Card className="p-5 mb-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="w-full sm:w-44">
            <Input
              id="summary_from"
              label="ตั้งแต่วันที่"
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Input
              id="summary_to"
              label="ถึงวันที่"
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pb-0.5">
            <button
              type="button"
              className={chip}
              onClick={() => applyPreset({ from: monthRange(0).from, to: today })}
            >
              เดือนนี้
            </button>
            <button
              type="button"
              className={chip}
              onClick={() => applyPreset(monthRange(-1))}
            >
              เดือนที่แล้ว
            </button>
          </div>
        </div>

        {rangeInvalid && (
          <p className="text-red-600 text-sm mt-3">
            วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด
          </p>
        )}
      </Card>

      {isLoading && <p className="text-ink-600 text-sm mb-3">กำลังโหลด...</p>}
      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

      {summary && !isLoading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <Card className="p-4">
              <p className="text-xs text-ink-600 mb-1">ยอดขายสุทธิ</p>
              <p className="text-xl font-semibold text-brand-900">
                {formatMoney(summary.total_sales)}
                <span className="text-xs font-normal text-ink-600 ml-1">บาท</span>
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-ink-600 mb-1">จำนวนบิล</p>
              <p className="text-xl font-semibold text-brand-900">
                {formatInt(summary.total_bills)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-ink-600 mb-1">เฉลี่ยต่อบิล</p>
              <p className="text-xl font-semibold text-brand-900">
                {formatMoney(
                  summary.total_bills > 0
                    ? summary.total_sales / summary.total_bills
                    : 0
                )}
                <span className="text-xs font-normal text-ink-600 ml-1">บาท</span>
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-ink-600 mb-1">บิลที่ยกเลิก</p>
              <p className="text-xl font-semibold text-brand-900">
                {formatInt(summary.cancelled_bills)}
              </p>
            </Card>
          </div>

          <div className="flex gap-3 flex-wrap items-center">
            <Button onClick={handleExcel} disabled={!canExport || isExporting}>
              {isExporting ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด Excel'}
            </Button>
                        <Button onClick={handlePdf} disabled={!canExport || isPdfExporting}>
              {isPdfExporting ? 'กำลังสร้างไฟล์...' : 'ดาวน์โหลด PDF'}
            </Button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!canExport}
              className="text-xs text-ink-600 underline hover:text-brand-900 disabled:opacity-50"
            >
              หรือพิมพ์รายงาน
            </button>
            {/* <Button onClick={handlePdf} disabled={!canExport}>
              บันทึกเป็น PDF
            </Button>
            <span className="text-xs text-ink-600/70">
              ปุ่ม PDF จะเปิดหน้าต่างพิมพ์ ให้เลือกปลายทางเป็น "บันทึกเป็น PDF"
            </span> */}
          </div>
          {exportError && (
            <p className="text-red-600 text-sm mt-3">{exportError}</p>
          )}
        </>
      )}
    </div>
  )
}