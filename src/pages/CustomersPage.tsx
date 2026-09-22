import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { Customer } from '../types/customer'

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { customers, isLoading, error, createCustomer, updateCustomer, deleteCustomer } =
    useCustomers(searchTerm)
  const { user } = useAuth()
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER'

  const [editingId, setEditingId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function resetForm() {
    setEditingId(null)
    setFullName('')
    setPhone('')
    setEmail('')
  }

  function startEdit(c: Customer) {
    setEditingId(c.id)
    setFullName(c.full_name)
    setPhone(c.phone ?? '')
    setEmail(c.email ?? '')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      const input = {
        full_name: fullName,
        phone: phone || undefined,
        email: email || undefined,
      }
      if (editingId) {
        await updateCustomer(editingId, input)
      } else {
        await createCustomer(input)
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
    const confirmed = window.confirm('ยืนยันลบลูกค้านี้หรือไม่?')
    if (!confirmed) return

    setDeletingId(id)
    try {
      await deleteCustomer(id)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'ลบไม่สำเร็จ')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">จัดการลูกค้า</h1>

      <input
        type="text"
        placeholder="ค้นหาชื่อหรือเบอร์โทร..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border rounded px-3 py-2 mb-4 w-full max-w-sm"
      />

      <form
        onSubmit={handleSubmit}
        className="bg-white p-4 rounded shadow mb-6 flex gap-3 items-end flex-wrap"
      >
        <div>
          <label className="block text-sm mb-1">ชื่อ-นามสกุล</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">เบอร์โทร</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08XXXXXXXX"
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">อีเมล</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
              : 'เพิ่มลูกค้า'}
        </button>
        {editingId && (
          <button type="button" onClick={resetForm} className="px-4 py-2 rounded border">
            ยกเลิก
          </button>
        )}
        {formError && <p className="text-red-600 text-sm w-full">{formError}</p>}
      </form>

      {isLoading && <p>กำลังโหลด...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="p-3">ชื่อ-นามสกุล</th>
              <th className="p-3">เบอร์โทร</th>
              <th className="p-3">อีเมล</th>
              {canManage && <th className="p-3">จัดการ</th>}
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b text-sm">
                <td className="p-3">{c.full_name}</td>
                <td className="p-3">{c.phone ?? '-'}</td>
                <td className="p-3">{c.email ?? '-'}</td>
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
            {customers.length === 0 && (
              <tr>
                <td colSpan={canManage ? 4 : 3} className="p-3 text-center text-gray-400">
                  ไม่พบลูกค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}