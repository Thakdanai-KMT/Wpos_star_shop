import { useState } from 'react'
import type { FormEvent } from 'react'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { Product } from '../types/product'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'

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
      <h1 className="mb-4 text-2xl font-semibold text-ink-900">จัดการสินค้า</h1>

      {canManage && (
        <Card className="mb-6 p-4">
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="w-full sm:w-auto sm:min-w-[200px] sm:flex-1">
              <Input
                label="ชื่อสินค้า"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>

            <div className="w-28">
              <Input
                label="ราคาขาย"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                required
              />
            </div>

            <div className="w-28">
              <Input
                label="ราคาต้นทุน"
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                required
              />
            </div>

            <div className="w-full sm:w-auto sm:min-w-[180px]">
              <Select
                label="หมวดหมู่"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
              </Select>
            </div>

            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting
                ? 'กำลังบันทึก...'
                : editingId
                  ? 'บันทึกการแก้ไข'
                  : 'เพิ่มสินค้า'}
            </Button>

            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                ยกเลิก
              </Button>
            )}

            {formError && (
              <p className="w-full text-sm text-red-600">{formError}</p>
            )}
          </form>
        </Card>
      )}

      {isLoading && <p className="text-sm text-ink-600">กำลังโหลด...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isLoading && !error && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-brand-100 text-left text-sm text-ink-600">
                <th className="p-3 font-medium">ชื่อสินค้า</th>
                <th className="p-3 font-medium">ราคาขาย</th>
                <th className="p-3 font-medium">ต้นทุน</th>
                <th className="p-3 font-medium">สต็อก</th>
                {canManage && <th className="p-3 font-medium">จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-brand-100 text-sm">
                  <td className="p-3 text-ink-900">{p.product_name}</td>
                  <td className="p-3 text-ink-900">{p.unit_price.toLocaleString()}</td>
                  <td className="p-3 text-ink-900">{p.cost_price.toLocaleString()}</td>
                  <td className="p-3 text-ink-900">{p.stock_quantity}</td>
                  {canManage && (
                    <td className="p-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(p)}
                          className="text-sm text-brand-700 hover:underline"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="text-sm text-red-600 hover:underline disabled:opacity-50"
                        >
                          {deletingId === p.id ? 'กำลังลบ...' : 'ลบ'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 5 : 4}
                    className="p-3 text-center text-ink-600/70"
                  >
                    ยังไม่มีสินค้า
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}