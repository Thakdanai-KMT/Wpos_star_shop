import { useState } from 'react'
import { useDailySalesReport } from '../hooks/useDailySalesReport'
import { ApiError } from '../lib/api-client'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'

function todayString() {
  return new Date().toISOString().split('T')[0]
}

export default function ReportsPage() {
  const [date, setDate] = useState(todayString())
  const { report, isLoading, error, sendReport } = useDailySalesReport(date)

  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendSuccess, setSendSuccess] = useState(false)

  async function handleSend() {
    setSendError(null)
    setSendSuccess(false)
    setIsSending(true)
    try {
      await sendReport()
      setSendSuccess(true)
      setTimeout(() => setSendSuccess(false), 3000)
    } catch (err) {
      setSendError(err instanceof ApiError ? err.message : 'ส่งรายงานไม่สำเร็จ')
    } finally {
      setIsSending(false)
    }
  }

  const maxRevenue = report
    ? Math.max(...report.top_products.map((p) => p.revenue), 1)
    : 1

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-900 mb-1">
        รายงานยอดขาย
      </h1>
      <p className="text-sm text-ink-600 mb-6">
        สรุปยอดขายรายวัน พร้อมสินค้าขายดี
      </p>

      <Card className="p-5 mb-6">
        <div className="flex gap-3 items-end flex-wrap">
          <div className="w-full sm:w-48">
            <Input
              id="report_date"
              label="เลือกวันที่"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <Button onClick={handleSend} disabled={isSending || !report}>
            {isSending ? 'กำลังส่ง...' : 'ส่งรายงานเข้าอีเมล'}
          </Button>
        </div>

        {sendError && <p className="text-red-600 text-sm mt-3">{sendError}</p>}
        {sendSuccess && (
          <p className="text-emerald-600 text-sm mt-3">ส่งรายงานสำเร็จ ✓</p>
        )}
      </Card>

      {isLoading && <p className="text-ink-600 text-sm">กำลังโหลด...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!isLoading && !error && report && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card className="p-5">
              <p className="text-sm text-ink-600 mb-1">ยอดขายรวม</p>
              <p className="text-3xl font-semibold text-brand-900">
                {report.total_sales.toLocaleString()}
                <span className="text-base font-normal text-ink-600 ml-1.5">
                  บาท
                </span>
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-sm text-ink-600 mb-1">จำนวนบิล</p>
              <p className="text-3xl font-semibold text-brand-900">
                {report.total_bills}
                <span className="text-base font-normal text-ink-600 ml-1.5">
                  บิล
                </span>
              </p>
            </Card>
          </div>

          <h2 className="text-sm font-semibold text-brand-900 mb-3">
            สินค้าขายดี
          </h2>

          <Card className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="text-left text-ink-600 bg-surface">
                  <th className="p-3 font-medium w-10">#</th>
                  <th className="p-3 font-medium">สินค้า</th>
                  <th className="p-3 font-medium">จำนวนที่ขาย</th>
                  <th className="p-3 font-medium">รายได้</th>
                </tr>
              </thead>
              <tbody>
                {report.top_products.map((p, i) => (
                  <tr key={i} className="border-t border-black/5">
                    <td className="p-3 text-ink-600">{i + 1}</td>
                    <td className="p-3 text-ink-900">{p.product_name}</td>
                    <td className="p-3 text-ink-900">{p.quantity_sold}</td>
                    <td className="p-3">
                      <p className="text-ink-900 font-medium">
                        {p.revenue.toLocaleString()} บาท
                      </p>
                      <div className="h-1 bg-surface rounded-full mt-1.5 w-full max-w-[140px]">
                        <div
                          className="h-1 bg-gold-500 rounded-full"
                          style={{ width: `${(p.revenue / maxRevenue) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {report.top_products.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-ink-600/60">
                      ไม่มีข้อมูลการขายในวันนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}