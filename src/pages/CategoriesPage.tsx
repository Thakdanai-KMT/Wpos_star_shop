import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { Category } from '../types/category'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function CategoriesPage() {
  const { categories, isLoading, error, createCategory, updateCategory, deleteCategory } =
    useCategories()
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [editingId, setEditingId] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function resetForm() {
    setEditingId(null)
    setCategoryName('')
  }

  function startEdit(c: Category) {
    setEditingId(c.id)
    setCategoryName(c.category_name)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      const input = { category_name: categoryName }
      if (editingId) {
        await updateCategory(editingId, input)
      } else {
        await createCategory(input)
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
    const confirmed = window.confirm('ยืนยันลบหมวดหมู่นี้หรือไม่?')
    if (!confirmed) return

    setDeletingId(id)
    try {
      await deleteCategory(id)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'ลบไม่สำเร็จ')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-900 mb-1">
        จัดการหมวดหมู่
      </h1>
      <p className="text-sm text-ink-600 mb-6">
        เพิ่ม แก้ไข และลบหมวดหมู่สินค้าในร้าน
      </p>

      {canManage && (
        <Card className="p-5 mb-6">
          <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
            <div className="w-56">
              <Input
                id="category_name"
                label="ชื่อหมวดหมู่"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'กำลังบันทึก...'
                : editingId
                  ? 'บันทึกการแก้ไข'
                  : 'เพิ่มหมวดหมู่'}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                ยกเลิก
              </Button>
            )}
            {formError && (
              <p className="text-red-600 text-sm w-full">{formError}</p>
            )}
          </form>
        </Card>
      )}

      {isLoading && <p className="text-ink-600 text-sm">กำลังโหลด...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!isLoading && !error && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-600 bg-surface">
                <th className="p-3 font-medium">ชื่อหมวดหมู่</th>
                {canManage && (
                  <th className="p-3 font-medium w-32">จัดการ</th>
                )}
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t border-black/5">
                  <td className="p-3 text-ink-900">{c.category_name}</td>
                  {canManage && (
                    <td className="p-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEdit(c)}
                          className="text-gold-600 hover:underline text-sm"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="text-red-600 hover:underline text-sm disabled:opacity-50"
                        >
                          {deletingId === c.id ? 'กำลังลบ...' : 'ลบ'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 2 : 1}
                    className="p-6 text-center text-ink-600/60"
                  >
                    ยังไม่มีหมวดหมู่
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