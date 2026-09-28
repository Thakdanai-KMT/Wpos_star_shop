import { useState } from 'react'
import type { FormEvent } from 'react'
import { usePromotions } from '../hooks/usePromotions'
import { useProducts } from '../hooks/useProducts'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'

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
      <h1 className="text-2xl font-semibold text-brand-900 mb-1">โปรโมชั่น</h1>
      <p className="text-sm text-ink-600 mb-6">
        ตั้งราคาโปรโมชั่นให้สินค้า ระบบจะเตือนหากราคาต่ำกว่าต้นทุน
      </p>

      {canManage && (
        <Card className="p-5 mb-6">
          <form
            onSubmit={handleSubmit}
            className="flex gap-3 items-end flex-wrap"
          >
            <Select
              id="product"
              label="สินค้า"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              required
              className="w-full sm:w-64"
            >
              <option value="">-- เลือกสินค้า --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name}
                </option>
              ))}
            </Select>

            <div className="w-40">
              <Input
                id="sale_price"
                label="ราคาโปรโมชั่น"
                type="number"
                step="0.01"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มโปรโมชั่น'}
            </Button>

            {formError && (
              <p className="text-red-600 text-sm w-full">{formError}</p>
            )}
          </form>
        </Card>
      )}

      {isLoading && <p className="text-ink-600 text-sm">กำลังโหลด...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!isLoading && !error && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-left text-ink-600 bg-surface">
                <th className="p-3 font-medium">สินค้า</th>
                <th className="p-3 font-medium">ราคาโปรโมชั่น</th>
                <th className="p-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id} className="border-t border-black/5">
                  <td className="p-3 text-ink-900">
                    {getProductName(promo.product_id)}
                  </td>
                  <td className="p-3 text-ink-900 font-medium">
                    {promo.sale_price.toLocaleString()} บาท
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${
                        promo.is_below_cost
                          ? 'bg-red-50 text-red-600'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {promo.is_below_cost ? 'ต่ำกว่าทุน' : 'ปกติ'}
                    </span>
                  </td>
                </tr>
              ))}
              {promotions.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-ink-600/60">
                    ยังไม่มีโปรโมชั่น
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Popup ยืนยันราคาต่ำกว่าทุน */}
      {confirmData && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setConfirmData(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-sm font-bold">
                !
              </span>
              <h2 className="text-lg font-semibold text-brand-900">
                ราคาต่ำกว่าต้นทุน
              </h2>
            </div>

            <div className="bg-surface rounded-lg p-3 mb-4 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-ink-600">สินค้า</span>
                <span className="text-ink-900 font-medium">
                  {confirmData.productName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">ต้นทุน</span>
                <span className="text-ink-900">
                  {confirmData.costPrice.toLocaleString()} บาท
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-600">ราคาที่ตั้ง</span>
                <span className="text-red-600 font-medium">
                  {confirmData.requestedSalePrice.toLocaleString()} บาท
                </span>
              </div>
            </div>

            <p className="text-sm text-ink-600 mb-5">
              การขายที่ราคานี้จะขาดทุน ยืนยันที่จะตั้งราคาต่ำกว่าต้นทุนหรือไม่?
            </p>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmData(null)}
                className="flex-1"
              >
                ยกเลิก
              </Button>
              <button
                onClick={() => submitPromotion(true)}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 text-white rounded-lg text-sm py-2 hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}