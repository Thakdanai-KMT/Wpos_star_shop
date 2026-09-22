import { useState } from 'react'
import { useSales } from '../hooks/useSales'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { SaleDetail } from '../types/sale'
import { useProducts } from '../hooks/useProducts'

const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'เงินสด',
  TRANSFER: 'โอนเงิน',
  CARD: 'บัตร',
}

export default function SalesHistoryPage() {
  const { sales, isLoading, error, getSaleDetail, cancelSale } = useSales()
    const { products } = useProducts()

  function getProductName(productId: string) {
    return products.find((p) => p.id === productId)?.product_name ?? '(ไม่พบสินค้า)'
  }
  const { user } = useAuth()
  const canCancel = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  async function handleViewDetail(id: string) {
    setDetailError(null)
    try {
      const detail = await getSaleDetail(id)
      setSelectedSale(detail)
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : 'โหลดรายละเอียดไม่สำเร็จ')
    }
  }

  async function handleCancel(id: string) {
    const confirmed = window.confirm('ยืนยันยกเลิกบิลนี้หรือไม่?')
    if (!confirmed) return

    setCancellingId(id)
    try {
      await cancelSale(id)
      if (selectedSale?.id === id) setSelectedSale(null)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'ยกเลิกไม่สำเร็จ')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">ประวัติการขาย</h1>

      {isLoading && <p>กำลังโหลด...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="p-3">วันที่</th>
              <th className="p-3">ยอดรวม</th>
              <th className="p-3">ชำระโดย</th>
              <th className="p-3">สถานะ</th>
              <th className="p-3">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-b text-sm">
                <td className="p-3">
                  {new Date(s.created_at).toLocaleString('th-TH')}
                </td>
                <td className="p-3">{s.total_amount.toLocaleString()} บาท</td>
                <td className="p-3">{PAYMENT_LABEL[s.payment_method]}</td>
                <td className="p-3">
                  <span
                    className={
                      s.status === 'CANCELLED'
                        ? 'text-red-600'
                        : 'text-green-600'
                    }
                  >
                    {s.status === 'CANCELLED' ? 'ยกเลิกแล้ว' : 'สำเร็จ'}
                  </span>
                </td>
                <td className="p-3 flex gap-2">
                  <button
                    onClick={() => handleViewDetail(s.id)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    ดูรายละเอียด
                  </button>
                  {canCancel && s.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleCancel(s.id)}
                      disabled={cancellingId === s.id}
                      className="text-red-600 hover:underline text-sm disabled:opacity-50"
                    >
                      {cancellingId === s.id ? 'กำลังยกเลิก...' : 'ยกเลิกบิล'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {sales.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-gray-400">
                  ยังไม่มีรายการขาย
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Modal รายละเอียดบิล */}
      {selectedSale && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center"
          onClick={() => setSelectedSale(null)}
        >
          <div
            className="bg-white rounded shadow p-6 w-96 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg mb-3">รายละเอียดบิล</h2>
            <p className="text-sm text-gray-500 mb-1">
              วันที่: {new Date(selectedSale.created_at).toLocaleString('th-TH')}
            </p>
            <p className="text-sm text-gray-500 mb-3">
              ชำระโดย: {PAYMENT_LABEL[selectedSale.payment_method]}
            </p>

            <table className="w-full text-sm mb-3">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-1">สินค้า (ID)</th>
                  <th className="py-1">จำนวน</th>
                  <th className="py-1">ราคา/หน่วย</th>
                </tr>
              </thead>
              <tbody>
                               {selectedSale.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-1">{getProductName(item.product_id)}</td>
                    <td className="py-1">{item.quantity}</td>
                    <td className="py-1">{item.unit_price.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between font-bold border-t pt-2">
              <span>ยอดรวม</span>
              <span>{selectedSale.total_amount.toLocaleString()} บาท</span>
            </div>

            <button
              onClick={() => setSelectedSale(null)}
              className="mt-4 w-full border rounded py-2 text-sm"
            >
              ปิด
            </button>
          </div>
        </div>
      )}

      {detailError && (
        <p className="text-red-600 text-sm mt-2">{detailError}</p>
      )}
    </div>
  )
}