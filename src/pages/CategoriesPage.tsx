import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCategories } from '../hooks/useCategories'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { Category } from '../types/category'

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
      <h1 className="text-2xl font-bold mb-4">จัดการหมวดหมู่</h1>

      {canManage && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-4 rounded shadow mb-6 flex gap-3 items-end"
        >
          <div>
            <label className="block text-sm mb-1">ชื่อหมวดหมู่</label>
            <input
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              required
              className="border rounded px-2 py-1"
            />
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
                : 'เพิ่มหมวดหมู่'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="px-4 py-2 rounded border">
              ยกเลิก
            </button>
          )}
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
        </form>
      )}

      {isLoading && <p>กำลังโหลด...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="p-3">ชื่อหมวดหมู่</th>
              {canManage && <th className="p-3">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-b text-sm">
                <td className="p-3">{c.category_name}</td>
                {canManage && (
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => startEdit(c)}
                      className="text-blue-600 hover:underline text-sm"
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
                  </td>
                )}
              </tr>
            ))}
            {categories.length === 0 && (
              <tr>
                <td colSpan={canManage ? 2 : 1} className="p-3 text-center text-gray-400">
                  ยังไม่มีหมวดหมู่
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}