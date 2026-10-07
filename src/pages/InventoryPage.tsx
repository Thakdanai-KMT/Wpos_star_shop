import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useInventoryMovements } from '../hooks/useInventoryMovements'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { MovementType } from '../types/inventory'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'

const MOVEMENT_LABEL: Record<string, string> = {
  RECEIVE: 'รับเข้า',
  ADJUSTMENT: 'ปรับสต็อก',
  SALE: 'ขายสินค้า',
}

export default function InventoryPage() {
  const { products, refetch: refetchProducts } = useProducts()
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [selectedProductId, setSelectedProductId] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const { movements, isLoading, error, createMovement } =
    useInventoryMovements(selectedProductId || null)

  const [movementType, setMovementType] = useState<MovementType>('RECEIVE')
  const [quantityChange, setQuantityChange] = useState('')
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const isBundle = Boolean(selectedProduct?.bundle_of_product_id)

  const filteredPickerProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase()
    return products.filter((p) => {
      if (!p.is_active) {
        return false
      }
      if (!q) {
        return true
      }
      return p.product_name.toLowerCase().includes(q)
    })
  }, [products, productSearch])
  const baseProduct = selectedProduct?.bundle_of_product_id
    ? products.find((p) => p.id === selectedProduct.bundle_of_product_id)
    : undefined

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      await createMovement({
        product_id: selectedProductId,
        movement_type: movementType,
        quantity_change: Number(quantityChange),
        reason: reason || undefined,
      })
      setQuantityChange('')
      setReason('')
      await refetchProducts()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-900 mb-1">
        จัดการสต็อก
      </h1>
      <p className="text-sm text-ink-600 mb-6">
        ดูสต็อกคงเหลือ บันทึกรับสินค้าเข้า และปรับยอดสต็อก
      </p>

      <Card className="p-5 mb-6">
        <div className="mb-3 max-w-md">
          <Input
            type="text"
            placeholder="ค้นหาแล้วคลิกเลือกสินค้า..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="h-4 w-4"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            }
          />
        </div>

        <div className="max-h-64 overflow-y-auto rounded-lg border border-brand-100">
          {filteredPickerProducts.map((p) => {
            const selected = p.id === selectedProductId
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedProductId(p.id)}
                className={`flex w-full items-center justify-between gap-3 border-b border-brand-100 px-3 py-2.5 text-left last:border-b-0 ${
                  selected
                    ? 'bg-gold-500/15'
                    : 'bg-white hover:bg-brand-50'
                }`}
              >
                <span>
                  <span className="text-sm font-medium text-ink-900">
                    {p.product_name}
                  </span>
                  {p.bundle_of_product_id && (
                    <span className="ml-2 inline-block rounded-full bg-gold-500/15 px-2 py-0.5 text-[11px] font-medium text-gold-600">
                      แพ็ก
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-ink-600">
                  สต็อก {p.stock_quantity} {p.bundle_of_product_id ? 'แพ็ก' : 'ชิ้น'}
                </span>
              </button>
            )
          })}
          {filteredPickerProducts.length === 0 && (
            <p className="p-4 text-center text-sm text-ink-600/70">
              ไม่พบสินค้า
            </p>
          )}
        </div>

        {selectedProduct && (
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-sm text-ink-600">สต็อกคงเหลือ</span>
            <span className="text-3xl font-semibold text-brand-900">
              {selectedProduct.stock_quantity}
            </span>
            <span className="text-sm text-ink-600">
              {isBundle ? 'แพ็ก' : 'ชิ้น'}
            </span>
          </div>
        )}
      </Card>

      {selectedProduct && (
        <>
          {canManage && (
            <Card className="p-5 mb-6">
              {isBundle ? (
                <div className="rounded-lg bg-gold-500/10 p-4 text-sm text-gold-600">
                  <p className="font-medium mb-1">
                    "{selectedProduct.product_name}" เป็นสินค้าแพ็ก ไม่มีสต็อกของตัวเอง
                  </p>
                  <p className="text-ink-600">
                    สต็อกคำนวณอัตโนมัติจากสินค้าฐาน "
                    {baseProduct?.product_name ?? '-'}" (แพ็กละ{' '}
                    {selectedProduct.bundle_quantity} ชิ้น) — หากต้องการรับเข้า
                    หรือปรับสต็อก กรุณาเลือกสินค้าฐานจาก dropdown ด้านบนแทน
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-sm font-semibold text-brand-900 mb-4">
                    บันทึกการเคลื่อนไหวสต็อก
                  </h2>
                  <form
                    onSubmit={handleSubmit}
                    className="flex gap-3 items-end flex-wrap"
                  >
                    <Select
                      id="movement_type"
                      label="ประเภท"
                      value={movementType}
                      onChange={(e) =>
                        setMovementType(e.target.value as MovementType)
                      }
                    >
                      <option value="RECEIVE">รับเข้า</option>
                      <option value="ADJUSTMENT">ปรับสต็อก</option>
                    </Select>

                    <div className="w-40">
                      <Input
                        id="quantity_change"
                        label="จำนวน (ติดลบ = ลด)"
                        type="number"
                        value={quantityChange}
                        onChange={(e) => setQuantityChange(e.target.value)}
                        required
                      />
                    </div>

                    <div className="w-56">
                      <Input
                        id="reason"
                        label="เหตุผล (ถ้ามี)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>

                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
                    </Button>

                    {formError && (
                      <p className="text-red-600 text-sm w-full">{formError}</p>
                    )}
                  </form>
                </>
              )}
            </Card>
          )}

          <h2 className="text-sm font-semibold text-brand-900 mb-3">
            ประวัติการเคลื่อนไหว
          </h2>

          {isLoading && <p className="text-ink-600 text-sm">กำลังโหลด...</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {!isLoading && !error && (
            <Card className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead>
                  <tr className="text-left text-ink-600 bg-surface">
                    <th className="p-3 font-medium">วันที่</th>
                    <th className="p-3 font-medium">ประเภท</th>
                    <th className="p-3 font-medium">จำนวนที่เปลี่ยน</th>
                    <th className="p-3 font-medium">เหตุผล</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-t border-black/5">
                      <td className="p-3 text-ink-900">
                        {new Date(m.created_at).toLocaleString('th-TH')}
                      </td>
                      <td className="p-3 text-ink-900">
                        {MOVEMENT_LABEL[m.movement_type] ?? m.movement_type}
                      </td>
                      <td
                        className={`p-3 font-medium ${
                          m.quantity_change >= 0
                            ? 'text-emerald-600'
                            : 'text-red-600'
                        }`}
                      >
                        {m.quantity_change >= 0 ? '+' : ''}
                        {m.quantity_change}
                      </td>
                      <td className="p-3 text-ink-600">{m.reason ?? '-'}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-6 text-center text-ink-600/60"
                      >
                        ยังไม่มีประวัติ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>
          )}
        </>
      )}
    </div>
  )
}