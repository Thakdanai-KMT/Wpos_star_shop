import { useState } from 'react'
import { useDailySalesReport } from '../hooks/useDailySalesReport'
import { ApiError } from '../lib/api-client'

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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">รายงานยอดขาย</h1>

      <div className="flex gap-3 items-end mb-6">
        <div>
          <label className="block text-sm mb-1">เลือกวันที่</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-2 py-1"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={isSending || !report}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isSending ? 'กำลังส่ง...' : 'ส่งรายงานเข้าอีเมล'}
        </button>
      </div>

      {sendError && <p className="text-red-600 text-sm mb-4">{sendError}</p>}
      {sendSuccess && (
        <p className="text-green-600 text-sm mb-4">ส่งรายงานสำเร็จ! ✓</p>
      )}

      {isLoading && <p>กำลังโหลด...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && report && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded shadow p-4">
              <p className="text-sm text-gray-500">ยอดขายรวม</p>
              <p className="text-2xl font-bold">
                {report.total_sales.toLocaleString()} บาท
              </p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <p className="text-sm text-gray-500">จำนวนบิล</p>
              <p className="text-2xl font-bold">{report.total_bills} บิล</p>
            </div>
          </div>

          <h2 className="font-bold mb-2">สินค้าขายดี</h2>
          <table className="w-full bg-white rounded shadow">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="p-3">สินค้า</th>
                <th className="p-3">จำนวนที่ขาย</th>
                <th className="p-3">รายได้</th>
              </tr>
            </thead>
            <tbody>
              {report.top_products.map((p, i) => (
                <tr key={i} className="border-b text-sm">
                  <td className="p-3">{p.product_name}</td>
                  <td className="p-3">{p.quantity_sold}</td>
                  <td className="p-3">{p.revenue.toLocaleString()} บาท</td>
                </tr>
              ))}
              {report.top_products.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-3 text-center text-gray-400">
                    ไม่มีข้อมูลการขายวันนี้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}