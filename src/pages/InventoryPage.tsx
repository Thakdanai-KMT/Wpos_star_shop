import { useState } from 'react'
import type { FormEvent } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useInventoryMovements } from '../hooks/useInventoryMovements'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { MovementType } from '../types/inventory'

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
      await refetchProducts() // อัปเดตสต็อกล่าสุดในหน้า Products ด้วย
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">จัดการสต็อก</h1>

      <div className="mb-6">
        <label className="block text-sm mb-1">เลือกสินค้า</label>
        <select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="border rounded px-2 py-1 w-64"
        >
          <option value="">-- เลือกสินค้า --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.product_name}
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <>
          <p className="mb-4">
            สต็อกปัจจุบัน:{' '}
            <span className="font-bold">{selectedProduct.stock_quantity}</span>
          </p>

          {canManage && (
            <form
              onSubmit={handleSubmit}
              className="bg-white p-4 rounded shadow mb-6 flex gap-3 items-end flex-wrap"
            >
              <div>
                <label className="block text-sm mb-1">ประเภท</label>
                <select
                  value={movementType}
                  onChange={(e) =>
                    setMovementType(e.target.value as MovementType)
                  }
                  className="border rounded px-2 py-1"
                >
                  <option value="RECEIVE">รับเข้า (RECEIVE)</option>
                  <option value="ADJUSTMENT">ปรับสต็อก (ADJUSTMENT)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">
                  จำนวน (ใส่ติดลบถ้าจะลด)
                </label>
                <input
                  type="number"
                  value={quantityChange}
                  onChange={(e) => setQuantityChange(e.target.value)}
                  required
                  className="border rounded px-2 py-1 w-32"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">เหตุผล (ถ้ามี)</label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              {formError && (
                <p className="text-red-600 text-sm w-full">{formError}</p>
              )}
            </form>
          )}

          <h2 className="font-bold mb-2">ประวัติการเคลื่อนไหว</h2>
          {isLoading && <p>กำลังโหลด...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!isLoading && !error && (
            <table className="w-full bg-white rounded shadow">
              <thead>
                <tr className="border-b text-left text-sm text-gray-500">
                  <th className="p-3">วันที่</th>
                  <th className="p-3">ประเภท</th>
                  <th className="p-3">จำนวนที่เปลี่ยน</th>
                  <th className="p-3">เหตุผล</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b text-sm">
                    <td className="p-3">
                      {new Date(m.created_at).toLocaleString('th-TH')}
                    </td>
                    <td className="p-3">{m.movement_type}</td>
                    <td
                      className={`p-3 font-medium ${
                        m.quantity_change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {m.quantity_change >= 0 ? '+' : ''}
                      {m.quantity_change}
                    </td>
                    <td className="p-3">{m.reason ?? '-'}</td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-3 text-center text-gray-400">
                      ยังไม่มีประวัติ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  )
}