import { useState } from 'react'
import type { FormEvent } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { Customer } from '../types/customer'
import { canManageData } from '../lib/roles'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const { customers, isLoading, error, createCustomer, updateCustomer, deleteCustomer } =
    useCustomers(searchTerm)
  const { user } = useAuth()
  const canManage = canManageData(user?.role)

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
    setFormError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
      <h1 className="text-2xl font-semibold text-brand-900 mb-1">
        จัดการลูกค้า
      </h1>
      <p className="text-sm text-ink-600 mb-6">
        เก็บรายชื่อลูกค้าและเลือกผูกกับบิลขายได้ที่หน้าขายสินค้า
      </p>

      <Card className={`p-5 mb-6 ${editingId ? 'ring-2 ring-gold-400' : ''}`}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-brand-900">
            {editingId ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}
          </h2>
          {editingId && (
            <span className="text-xs text-gold-600 bg-gold-500/15 px-2.5 py-1 rounded-full font-medium">
              กำลังแก้ไข
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              id="customer_full_name"
              label="ชื่อ-นามสกุล"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              id="customer_phone"
              label="เบอร์โทร"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08XXXXXXXX"
              inputMode="tel"
            />
            <Input
              id="customer_email"
              label="อีเมล"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'กำลังบันทึก...'
                : editingId
                  ? 'บันทึกการแก้ไข'
                  : 'เพิ่มลูกค้า'}
            </Button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-lg border border-brand-100 text-sm text-ink-600 hover:border-gold-400 hover:text-brand-900 transition-colors"
              >
                ยกเลิกการแก้ไข
              </button>
            )}
          </div>

          {formError && (
            <p className="text-red-600 text-sm mt-3" role="alert">
              {formError}
            </p>
          )}
        </form>
      </Card>

      <div className="flex items-end justify-between gap-3 flex-wrap mb-3">
        <div className="w-full sm:max-w-sm">
          <Input
            id="customer_search"
            type="text"
            placeholder="ค้นหาชื่อหรือเบอร์โทร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<SearchIcon />}
            aria-label="ค้นหาลูกค้า"
          />
        </div>
        {!isLoading && !error && (
          <p className="text-sm text-ink-600">
            พบ <span className="font-semibold text-brand-900">{customers.length}</span> ราย
          </p>
        )}
      </div>

      {isLoading && <p className="text-ink-600 text-sm">กำลังโหลด...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!isLoading && !error && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-ink-600 bg-surface">
                <th className="p-3 font-medium">ชื่อ-นามสกุล</th>
                <th className="p-3 font-medium">เบอร์โทร</th>
                <th className="p-3 font-medium">อีเมล</th>
                {canManage && <th className="p-3 font-medium text-right">จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.id}
                  className={`border-t border-black/5 transition-colors ${
                    editingId === c.id ? 'bg-gold-500/10' : 'hover:bg-surface/60'
                  }`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-900 text-gold-500 text-[11px] font-semibold flex items-center justify-center shrink-0">
                        {getInitials(c.full_name)}
                      </div>
                      <span className="text-ink-900 font-medium">{c.full_name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-ink-900">
                    {c.phone ?? <span className="text-ink-600/50">-</span>}
                  </td>
                  <td className="p-3 text-ink-900">
                    {c.email ?? <span className="text-ink-600/50">-</span>}
                  </td>
                  {canManage && (
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => startEdit(c)}
                          className="px-2.5 py-1 rounded-md text-sm text-brand-700 hover:bg-brand-600/10 transition-colors"
                        >
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="px-2.5 py-1 rounded-md text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {deletingId === c.id ? 'กำลังลบ...' : 'ลบ'}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td
                    colSpan={canManage ? 4 : 3}
                    className="p-8 text-center text-ink-600/60"
                  >
                    {searchTerm ? 'ไม่พบลูกค้าที่ตรงกับคำค้นหา' : 'ยังไม่มีลูกค้าในระบบ'}
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