import { useState } from 'react'
import type { FormEvent } from 'react'
import { usePromotions } from '../hooks/usePromotions'
import { useProducts } from '../hooks/useProducts'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'

export default function PromotionsPage() {
  const { promotions, isLoading, error, createPromotion } = usePromotions()
  const { products } = useProducts()
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [productId, setProductId] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // ข้อมูลสำหรับ popup ยืนยันราคาต่ำกว่าทุน
  const [confirmData, setConfirmData] = useState<{
    productName: string
    costPrice: number
    requestedSalePrice: number
  } | null>(null)

  function getProductName(id: string) {
    return products.find((p) => p.id === id)?.product_name ?? '(ไม่พบสินค้า)'
  }

  async function submitPromotion(confirmBelowCost: boolean) {
    setFormError(null)
    setIsSubmitting(true)
    try {
      await createPromotion({
        product_id: productId,
        sale_price: Number(salePrice),
        confirm_below_cost: confirmBelowCost || undefined,
      })
      setProductId('')
      setSalePrice('')
      setConfirmData(null)
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.statusCode === 409 &&
        err.details.requires_confirmation
      ) {
        // Backend บอกว่าราคาต่ำกว่าทุน — เปิด popup ถามยืนยันแทนการโชว์ error ตรงๆ
        setConfirmData({
          productName: String(err.details.product_name ?? ''),
          costPrice: Number(err.details.cost_price ?? 0),
          requestedSalePrice: Number(err.details.requested_sale_price ?? 0),
        })
      } else {
        setFormError(
          err instanceof ApiError ? err.message : 'สร้างโปรโมชั่นไม่สำเร็จ'
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    submitPromotion(false) // ส่งครั้งแรกแบบปกติ ยังไม่ confirm
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">โปรโมชั่น</h1>

      {canManage && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded shadow mb-6 flex gap-3 items-end flex-wrap"
        >
          <div>
            <label className="block text-sm mb-1">สินค้า</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="border rounded px-2 py-1"
            >
              <option value="">-- เลือกสินค้า --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">ราคาโปรโมชั่น</label>
            <input
              type="number"
              step="0.01"
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
              required
              className="border rounded px-2 py-1 w-32"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มโปรโมชั่น'}
          </button>
          {formError && <p className="text-red-600 text-sm w-full">{formError}</p>}
        </form>
      )}

      {isLoading && <p>กำลังโหลด...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="p-3">สินค้า</th>
              <th className="p-3">ราคาโปรโมชั่น</th>
              <th className="p-3">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((promo) => (
              <tr key={promo.id} className="border-b text-sm">
                <td className="p-3">{getProductName(promo.product_id)}</td>
                <td className="p-3">{promo.sale_price.toLocaleString()} บาท</td>
                <td className="p-3">
                  {promo.is_below_cost ? (
                    <span className="text-red-600">ต่ำกว่าทุน</span>
                  ) : (
                    <span className="text-green-600">ปกติ</span>
                  )}
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr>
                <td colSpan={3} className="p-3 text-center text-gray-400">
                  ยังไม่มีโปรโมชั่น
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* Popup ยืนยันราคาต่ำกว่าทุน */}
      {confirmData && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center"
          onClick={() => setConfirmData(null)}
        >
          <div
            className="bg-white rounded shadow p-6 w-80"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg mb-3 text-red-600">
              ⚠ ราคาต่ำกว่าต้นทุน
            </h2>
            <p className="text-sm mb-1">สินค้า: {confirmData.productName}</p>
            <p className="text-sm mb-1">
              ต้นทุน: {confirmData.costPrice.toLocaleString()} บาท
            </p>
            <p className="text-sm mb-4">
              ราคาที่ตั้ง: {confirmData.requestedSalePrice.toLocaleString()} บาท
            </p>
            <p className="text-sm text-gray-600 mb-4">
              ยืนยันที่จะตั้งราคาต่ำกว่าต้นทุนหรือไม่?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => submitPromotion(true)}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 text-white py-2 rounded disabled:opacity-50"
              >
                ยืนยัน
              </button>
              <button
                onClick={() => setConfirmData(null)}
                className="flex-1 border rounded py-2"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}