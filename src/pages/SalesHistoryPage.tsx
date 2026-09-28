import { useState } from 'react'
import { useSales } from '../hooks/useSales'
import { useProducts } from '../hooks/useProducts'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { SaleDetail } from '../types/sale'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'

const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'เงินสด',
  TRANSFER: 'โอนเงิน',
  CARD: 'บัตร',
}

export default function SalesHistoryPage() {
  const { sales, isLoading, error, getSaleDetail, cancelSale } = useSales()
  const { products } = useProducts()
  const { user } = useAuth()
  const canCancel = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [selectedSale, setSelectedSale] = useState<SaleDetail | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  function getProductName(productId: string) {
    return (
      products.find((p) => p.id === productId)?.product_name ?? '(ไม่พบสินค้า)'
    )
  }

  async function handleViewDetail(id: string) {
    setDetailError(null)
    try {
      const detail = await getSaleDetail(id)
      setSelectedSale(detail)
    } catch (err) {
      setDetailError(
        err instanceof ApiError ? err.message : 'โหลดรายละเอียดไม่สำเร็จ'
      )
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
      <h1 className="text-2xl font-semibold text-brand-900 mb-1">
        ประวัติการขาย
      </h1>
      <p className="text-sm text-ink-600 mb-6">
        รายการบิลทั้งหมด เรียงจากล่าสุดไปเก่าสุด
      </p>

      {isLoading && <p className="text-ink-600 text-sm">กำลังโหลด...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {detailError && (
        <p className="text-red-600 text-sm mb-3">{detailError}</p>
      )}

      {!isLoading && !error && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-ink-600 bg-surface">
                <th className="p-3 font-medium">วันที่</th>
                <th className="p-3 font-medium">ยอดรวม</th>
                <th className="p-3 font-medium">ชำระโดย</th>
                <th className="p-3 font-medium">สถานะ</th>
                <th className="p-3 font-medium">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-t border-black/5">
                  <td className="p-3 text-ink-900">
                    {new Date(s.created_at).toLocaleString('th-TH')}
                  </td>
                  <td className="p-3 text-ink-900 font-medium">
                    {s.total_amount.toLocaleString()} บาท
                  </td>
                  <td className="p-3 text-ink-600">
                    {PAYMENT_LABEL[s.payment_method]}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        s.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {s.status === 'CANCELLED' ? 'ยกเลิกแล้ว' : 'สำเร็จ'}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleViewDetail(s.id)}
                        className="text-gold-600 hover:underline"
                      >
                        ดูรายละเอียด
                      </button>
                      {canCancel && s.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleCancel(s.id)}
                          disabled={cancellingId === s.id}
                          className="text-red-600 hover:underline disabled:opacity-50"
                        >
                          {cancellingId === s.id
                            ? 'กำลังยกเลิก...'
                            : 'ยกเลิกบิล'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-600/60">
                    ยังไม่มีรายการขาย
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modal รายละเอียดบิล */}
      {selectedSale && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setSelectedSale(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-brand-900">
                  รายละเอียดบิล
                </h2>
                <p className="text-xs text-ink-600 mt-0.5">
                  {new Date(selectedSale.created_at).toLocaleString('th-TH')}
                </p>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                  selectedSale.status === 'CANCELLED'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {selectedSale.status === 'CANCELLED' ? 'ยกเลิกแล้ว' : 'สำเร็จ'}
              </span>
            </div>

            <p className="text-sm text-ink-600 mb-3">
              ชำระโดย:{' '}
              <span className="text-ink-900">
                {PAYMENT_LABEL[selectedSale.payment_method]}
              </span>
            </p>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left text-ink-600 border-b border-black/5">
                  <th className="py-2 font-medium">สินค้า</th>
                  <th className="py-2 font-medium text-right">จำนวน</th>
                  <th className="py-2 font-medium text-right">ราคา/หน่วย</th>
                </tr>
              </thead>
              <tbody>
                {selectedSale.items.map((item) => (
                  <tr key={item.id} className="border-b border-black/5">
                    <td className="py-2 text-ink-900">
                      {getProductName(item.product_id)}
                    </td>
                    <td className="py-2 text-right">{item.quantity}</td>
                    <td className="py-2 text-right">
                      {item.unit_price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-center pt-1 mb-5">
              <span className="text-sm text-ink-600">ยอดรวม</span>
              <span className="text-xl font-semibold text-brand-900">
                {selectedSale.total_amount.toLocaleString()} บาท
              </span>
            </div>

            <Button
              variant="secondary"
              onClick={() => setSelectedSale(null)}
              className="w-full"
            >
              ปิด
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}