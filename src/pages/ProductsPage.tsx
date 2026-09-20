import { useState } from 'react'
import type { FormEvent } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'

export default function ProductsPage() {
  const { products, isLoading, error, createProduct } = useProducts()
  const { user } = useAuth()
  const canCreate = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [productName, setProductName] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      await createProduct({
        product_name: productName,
        unit_price: Number(unitPrice),
        cost_price: Number(costPrice),
        category_id: categoryId,
      })
      setProductName('')
      setUnitPrice('')
      setCostPrice('')
      setCategoryId('')
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'สร้างสินค้าไม่สำเร็จ')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">จัดการสินค้า</h1>

      {canCreate && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded shadow mb-6 flex gap-3 items-end flex-wrap"
        >
          <div>
            <label className="block text-sm mb-1">ชื่อสินค้า</label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              required
              className="border rounded px-2 py-1"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">ราคาขาย</label>
            <input
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              required
              className="border rounded px-2 py-1 w-28"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">ราคาต้นทุน</label>
            <input
              type="number"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              required
              className="border rounded px-2 py-1 w-28"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Category ID</label>
            <input
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="border rounded px-2 py-1"
              placeholder="uuid"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มสินค้า'}
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
              <th className="p-3">ชื่อสินค้า</th>
              <th className="p-3">ราคาขาย</th>
              <th className="p-3">ต้นทุน</th>
              <th className="p-3">สต็อก</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b text-sm">
                <td className="p-3">{p.product_name}</td>
                <td className="p-3">{p.unit_price.toLocaleString()}</td>
                <td className="p-3">{p.cost_price.toLocaleString()}</td>
                <td className="p-3">{p.stock_quantity}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={4} className="p-3 text-center text-gray-400">
                  ยังไม่มีสินค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}