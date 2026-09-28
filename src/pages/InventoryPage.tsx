import { useState } from 'react'
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
  const { movements, isLoading, error, createMovement } =
    useInventoryMovements(selectedProductId || null)

  const [movementType, setMovementType] = useState<MovementType>('RECEIVE')
  const [quantityChange, setQuantityChange] = useState('')
  const [reason, setReason] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedProduct = products.find((p) => p.id === selectedProductId)

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
        <Select
          id="product"
          label="เลือกสินค้า"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-full sm:w-72"
        >
          <option value="">-- เลือกสินค้า --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.product_name}
            </option>
          ))}
        </Select>

        {selectedProduct && (
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-sm text-ink-600">สต็อกคงเหลือ</span>
            <span className="text-3xl font-semibold text-brand-900">
              {selectedProduct.stock_quantity}
            </span>
            <span className="text-sm text-ink-600">ชิ้น</span>
          </div>
        )}
      </Card>

      {selectedProduct && (
        <>
          {canManage && (
            <Card className="p-5 mb-6">
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