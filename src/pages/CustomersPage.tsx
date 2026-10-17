import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useCustomers } from '../hooks/useCustomers'
import { useCustomerBalances } from '../hooks/useCustomerBalances'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import type { Customer } from '../types/customer'
import { canManageData, canUseCredit } from '../lib/roles'
import { formatMoney } from '../lib/report-format'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import CustomerCreditDrawer from '../components/customers/CustomerCreditDrawer'

type CreditFilter = 'ALL' | 'OWING' | 'OVERDUE' | 'HISTORY'

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
  const creditAllowed = canUseCredit(user?.role)
  const { balances } = useCustomerBalances(creditAllowed)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [creditFilter, setCreditFilter] = useState<CreditFilter>('ALL')
  const [detailId, setDetailId] = useState<string | null>(null)

  const balanceById = useMemo(
    () => new Map(balances.map((b) => [b.customer_id, b])),
    [balances]
  )

  const creditCounts = useMemo(
    () => ({
      OWING: balances.filter((b) => b.balance > 0).length,
      OVERDUE: balances.filter((b) => b.overdue_amount > 0).length,
      HISTORY: balances.length,
    }),
    [balances]
  )

  const totalOutstanding = useMemo(
    () => balances.reduce((sum, b) => sum + Math.max(0, b.balance), 0),
    [balances]
  )

  const visibleCustomers = customers.filter((c) => {
    if (!creditAllowed || creditFilter === 'ALL') return true
    const b = balanceById.get(c.id)
    if (creditFilter === 'OWING') return (b?.balance ?? 0) > 0
    if (creditFilter === 'OVERDUE') return (b?.overdue_amount ?? 0) > 0
    return Boolean(b)
  })

  const colCount = 3 + (creditAllowed ? 2 : 0) + (canManage ? 1 : 0)

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

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      active
        ? 'bg-gold-500 text-brand-900'
        : 'bg-brand-50 text-ink-600 hover:bg-brand-100'
    }`

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-900 mb-1">
        จัดการลูกค้า
      </h1>
      <p className="text-sm text-ink-600 mb-6">
        เก็บรายชื่อลูกค้า ดูยอดค้างชำระ และประวัติการขายเชื่อของแต่ละราย
      </p>

      {creditAllowed && totalOutstanding > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gold-500/15 px-4 py-3 text-sm">
          <span className="text-gold-600">ยอดค้างชำระรวมทั้งร้าน</span>
          <span className="font-semibold text-brand-900">
            {formatMoney(totalOutstanding)} บาท จาก {creditCounts.OWING} ราย
          </span>
        </div>
      )}

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
            พบ <span className="font-semibold text-brand-900">{visibleCustomers.length}</span> ราย
          </p>
        )}
      </div>

      {creditAllowed && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCreditFilter('ALL')}
            aria-pressed={creditFilter === 'ALL'}
            className={chip(creditFilter === 'ALL')}
          >
            ลูกค้าทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => setCreditFilter('OWING')}
            aria-pressed={creditFilter === 'OWING'}
            className={chip(creditFilter === 'OWING')}
          >
            มียอดค้าง ({creditCounts.OWING})
          </button>
          <button
            type="button"
            onClick={() => setCreditFilter('OVERDUE')}
            aria-pressed={creditFilter === 'OVERDUE'}
            className={chip(creditFilter === 'OVERDUE')}
          >
            เลยกำหนด ({creditCounts.OVERDUE})
          </button>
          <button
            type="button"
            onClick={() => setCreditFilter('HISTORY')}
            aria-pressed={creditFilter === 'HISTORY'}
            className={chip(creditFilter === 'HISTORY')}
          >
            เคยขายเชื่อ ({creditCounts.HISTORY})
          </button>
        </div>
      )}

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
                {creditAllowed && (
                  <>
                    <th className="p-3 font-medium text-right">ยอดค้างชำระ</th>
                    <th className="p-3 font-medium">สถานะเครดิต</th>
                  </>
                )}
                {canManage && <th className="p-3 font-medium text-right">จัดการ</th>}
              </tr>
            </thead>
            <tbody>
              {visibleCustomers.map((c) => {
                const b = balanceById.get(c.id)
                const balance = b?.balance ?? 0

                return (
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
                        {creditAllowed ? (
                          <button
                            type="button"
                            onClick={() => setDetailId(c.id)}
                            className="text-left font-medium text-ink-900 hover:text-brand-700 hover:underline"
                          >
                            {c.full_name}
                          </button>
                        ) : (
                          <span className="text-ink-900 font-medium">{c.full_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-ink-900">
                      {c.phone ?? <span className="text-ink-600/50">-</span>}
                    </td>
                    <td className="p-3 text-ink-900">
                      {c.email ?? <span className="text-ink-600/50">-</span>}
                    </td>
                    {creditAllowed && (
                      <>
                        <td
                          className={`p-3 text-right ${
                            balance > 0 ? 'font-medium text-ink-900' : 'text-ink-600/60'
                          }`}
                        >
                          {balance === 0 ? '-' : formatMoney(Math.abs(balance))}
                        </td>
                        <td className="p-3">
                          {b && b.overdue_amount > 0 ? (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                              เลยกำหนด
                            </span>
                          ) : balance > 0 ? (
                            <span className="rounded-full bg-gold-500/15 px-2 py-0.5 text-xs font-medium text-gold-600">
                              มียอดค้าง
                            </span>
                          ) : balance < 0 ? (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              มีเครดิต
                            </span>
                          ) : b ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-ink-600">
                              เคยขายเชื่อ
                            </span>
                          ) : (
                            <span className="text-ink-600/50">-</span>
                          )}
                        </td>
                      </>
                    )}
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
                )
              })}
              {visibleCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan={colCount}
                    className="p-8 text-center text-ink-600/60"
                  >
                    {searchTerm
                      ? 'ไม่พบลูกค้าที่ตรงกับคำค้นหา'
                      : creditFilter !== 'ALL'
                        ? 'ไม่มีลูกค้าในหมวดนี้'
                        : 'ยังไม่มีลูกค้าในระบบ'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {detailId && (
        <CustomerCreditDrawer
          customerId={detailId}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  )
} 