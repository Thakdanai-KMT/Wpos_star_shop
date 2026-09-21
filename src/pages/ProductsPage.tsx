import { useState } from 'react'
import type { FormEvent } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { Product } from '../types/product'

export default function ProductsPage() {
  const { products, isLoading, error, createProduct, updateProduct, deleteProduct } =
    useProducts()
  const { categories } = useCategories()
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  // editingId = null คือโหมด "เพิ่มใหม่", ถ้ามีค่าคือโหมด "กำลังแก้ไข" สินค้า id นี้อยู่
  const [editingId, setEditingId] = useState<string | null>(null)
  const [productName, setProductName] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function resetForm() {
    setEditingId(null)
    setProductName('')
    setUnitPrice('')
    setCostPrice('')
    setCategoryId('')
  }

  function startEdit(p: Product) {
    setEditingId(p.id)
    setProductName(p.product_name)
    setUnitPrice(String(p.unit_price))
    setCostPrice(String(p.cost_price))
    setCategoryId(p.category_id)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      const input = {
        product_name: productName,
        unit_price: Number(unitPrice),
        cost_price: Number(costPrice),
        category_id: categoryId,
      }
      if (editingId) {
        await updateProduct(editingId, input)
      } else {
        await createProduct(input)
      }
      resetForm()
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'บันทึกข้อมูลไม่สำเร็จ'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('ยืนยันลบสินค้านี้หรือไม่?')
    if (!confirmed) return

    setDeletingId(id)
    try {
      await deleteProduct(id)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'ลบไม่สำเร็จ')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">จัดการสินค้า</h1>

      {canManage && (
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
            <label className="block text-sm mb-1">หมวดหมู่</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="border rounded px-2 py-1"
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isSubmitting
              ? 'กำลังบันทึก...'
              : editingId
                ? 'บันทึกการแก้ไข'
                : 'เพิ่มสินค้า'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded border"
            >
              ยกเลิก
            </button>
          )}
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
              {canManage && <th className="p-3">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b text-sm">
                <td className="p-3">{p.product_name}</td>
                <td className="p-3">{p.unit_price.toLocaleString()}</td>
                <td className="p-3">{p.cost_price.toLocaleString()}</td>
                <td className="p-3">{p.stock_quantity}</td>
                {canManage && (
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={deletingId === p.id}
                      className="text-red-600 hover:underline text-sm disabled:opacity-50"
                    >
                      {deletingId === p.id ? 'กำลังลบ...' : 'ลบ'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={canManage ? 5 : 4} className="p-3 text-center text-gray-400">
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