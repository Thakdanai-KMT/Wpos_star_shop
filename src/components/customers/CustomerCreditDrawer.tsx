import { useEffect, useMemo, useState } from 'react'
import { useCustomerCredit } from '../../hooks/useCustomerCredit'
import { formatMoney } from '../../lib/report-format'
import { formatThaiDate } from '../../lib/thai-date'
import type {
  BillPaymentStatus,
  CreditBill,
  CreditStats,
} from '../../types/customer'

type BillFilter = 'ALL' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE'

const FILTERS: { key: BillFilter; label: string }[] = [
  { key: 'ALL', label: 'ทั้งหมด' },
  { key: 'UNPAID', label: 'ยังไม่ชำระ' },
  { key: 'PARTIAL', label: 'ชำระบางส่วน' },
  { key: 'PAID', label: 'ชำระแล้ว' },
  { key: 'OVERDUE', label: 'เลยกำหนด' },
]

const METHOD_LABEL: Record<string, string> = {
  CASH: 'เงินสด',
  TRANSFER: 'โอนเงิน',
  CARD: 'บัตร',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function matches(bill: CreditBill, filter: BillFilter) {
  switch (filter) {
    case 'ALL':
      return true
    case 'UNPAID':
      return bill.payment_status === 'UNPAID'
    case 'PARTIAL':
      return bill.payment_status === 'PARTIAL'
    case 'PAID':
      return bill.payment_status === 'PAID'
    case 'OVERDUE':
      return bill.is_overdue
  }
}

const PILL: Record<BillPaymentStatus, { label: string; cls: string }> = {
  PAID: { label: 'ชำระแล้ว', cls: 'bg-emerald-500/10 text-emerald-700' },
  PARTIAL: { label: 'ชำระบางส่วน', cls: 'bg-gold-500/15 text-gold-600' },
  UNPAID: { label: 'ยังไม่ชำระ', cls: 'bg-brand-600/10 text-brand-700' },
  CANCELLED: { label: 'ยกเลิกแล้ว', cls: 'bg-gray-200 text-ink-600' },
}

const TONE = {
  good: 'bg-emerald-500/10 text-emerald-700',
  warn: 'bg-gold-500/15 text-gold-600',
  bad: 'bg-red-50 text-red-600',
  muted: 'bg-gray-100 text-ink-600',
}

// สรุปสั้นๆ ว่าลูกค้าคนนี้ "เคยติดไหม ตอนนี้ติดไหม"
function verdict(stats: CreditStats): { text: string; tone: keyof typeof TONE } {
  if (stats.credit_bills_total === 0) {
    return { text: 'ยังไม่เคยขายเชื่อให้ลูกค้ารายนี้', tone: 'muted' }
  }
  if (stats.overdue_amount > 0) {
    return {
      text: `ตอนนี้มียอดเลยกำหนดชำระ ${formatMoney(stats.overdue_amount)} บาท (นานสุด ${stats.max_days_overdue} วัน)`,
      tone: 'bad',
    }
  }
  if (stats.ever_overdue) {
    return {
      text: 'เคยชำระช้ากว่ากำหนด ตอนนี้ไม่มียอดเลยกำหนด',
      tone: 'warn',
    }
  }
  if (stats.paid_bills > 0 && stats.open_bills === 0) {
    return { text: 'ชำระครบตรงกำหนดทุกบิลที่ผ่านมา', tone: 'good' }
  }
  return { text: 'ยังไม่เคยเลยกำหนดชำระ', tone: 'good' }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-600">{label}</p>
      <p className="text-sm font-medium text-ink-900">{value}</p>
    </div>
  )
}

interface Props {
  customerId: string
  onClose: () => void
}

export default function CustomerCreditDrawer({ customerId, onClose }: Props) {
  const { data, isLoading, error } = useCustomerCredit(customerId)
  const [filter, setFilter] = useState<BillFilter>('ALL')
  const [openId, setOpenId] = useState<string | null>(null)

  // ปิดด้วย Esc และล็อกการเลื่อนของหน้าหลังแผง
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previous
    }
  }, [onClose])

  const bills = useMemo(() => data?.bills ?? [], [data])

  const counts = useMemo(() => {
    const result: Record<BillFilter, number> = {
      ALL: bills.length,
      UNPAID: 0,
      PARTIAL: 0,
      PAID: 0,
      OVERDUE: 0,
    }
    for (const b of bills) {
      if (b.payment_status === 'UNPAID') result.UNPAID += 1
      if (b.payment_status === 'PARTIAL') result.PARTIAL += 1
      if (b.payment_status === 'PAID') result.PAID += 1
      if (b.is_overdue) result.OVERDUE += 1
    }
    return result
  }, [bills])

  const visible = useMemo(
    () => bills.filter((b) => matches(b, filter)),
    [bills, filter]
  )

  // รวมยอดตามตัวกรอง (ไม่นับบิลที่ยกเลิก)
  const totals = useMemo(() => {
    let total = 0
    let paid = 0
    let remaining = 0
    for (const b of visible) {
      if (b.sale_status !== 'COMPLETED') continue
      total += b.total_amount
      paid += b.paid_amount
      remaining += b.remaining
    }
    return { total, paid, remaining }
  }, [visible])

  const withoutDueDate = bills.filter(
    (b) => b.sale_status === 'COMPLETED' && !b.due_date
  ).length

  const summary = data?.summary
  const stats = data?.stats
  const v = stats ? verdict(stats) : null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40"
      onClick={onClose}
      role="presentation"
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="รายละเอียดเครดิตลูกค้า"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-black/5 bg-white px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-brand-900">
              {data?.customer.full_name ?? 'รายละเอียดลูกค้า'}
            </h2>
            {data && (
              <p className="truncate text-sm text-ink-600">
                {[data.customer.phone, data.customer.email]
                  .filter(Boolean)
                  .join(' · ') || 'ไม่มีข้อมูลติดต่อ'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="shrink-0 rounded-md p-1.5 text-ink-600 transition-colors hover:bg-surface hover:text-brand-900"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-6 px-5 py-5">
          {isLoading && <p className="text-sm text-ink-600">กำลังโหลด...</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {data && summary && stats && v && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-black/5 p-3">
                  <p className="text-xs text-ink-600">
                    {summary.balance < 0 ? 'เครดิตคงเหลือของลูกค้า' : 'ยอดค้างชำระ'}
                  </p>
                  <p className="text-xl font-semibold text-brand-900">
                    {formatMoney(Math.abs(summary.balance))}
                    <span className="ml-1 text-xs font-normal text-ink-600">
                      บาท
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-black/5 p-3">
                  <p className="text-xs text-ink-600">เลยกำหนดชำระ</p>
                  <p
                    className={`text-xl font-semibold ${
                      summary.overdue_amount > 0 ? 'text-red-600' : 'text-brand-900'
                    }`}
                  >
                    {formatMoney(summary.overdue_amount)}
                    <span className="ml-1 text-xs font-normal text-ink-600">
                      บาท
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-black/5 p-3">
                  <p className="text-xs text-ink-600">บิลที่ยังจ่ายไม่ครบ</p>
                  <p className="text-xl font-semibold text-brand-900">
                    {stats.open_bills}
                    <span className="ml-1 text-xs font-normal text-ink-600">
                      บิล
                    </span>
                  </p>
                </div>
                <div className="rounded-lg border border-black/5 p-3">
                  <p className="text-xs text-ink-600">วงเงินที่เหลือ</p>
                  <p className="text-xl font-semibold text-brand-900">
                    {summary.credit_available === null
                      ? 'ไม่จำกัด'
                      : formatMoney(Math.max(0, summary.credit_available))}
                  </p>
                  <p className="text-xs text-ink-600/70">
                    {summary.credit_limit === null
                      ? 'ยังไม่ได้กำหนดวงเงิน'
                      : `วงเงิน ${formatMoney(summary.credit_limit)} บาท`}
                  </p>
                </div>
              </div>

              {/* Payment behavior */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-brand-900">
                  ประวัติการชำระ
                </h3>
                <p className={`rounded-lg px-3 py-2 text-sm ${TONE[v.tone]}`}>
                  {v.text}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  <Stat
                    label="ขายเชื่อทั้งหมด"
                    value={`${stats.credit_bills_total} บิล`}
                  />
                  <Stat label="ชำระครบแล้ว" value={`${stats.paid_bills} บิล`} />
                  <Stat label="ยังค้างอยู่" value={`${stats.open_bills} บิล`} />
                  <Stat
                    label="จ่ายตรงกำหนด / ช้า"
                    value={`${stats.paid_on_time} / ${stats.paid_late} บิล`}
                  />
                  <Stat
                    label="จ่ายเฉลี่ยภายใน"
                    value={
                      stats.avg_days_to_settle === null
                        ? '-'
                        : `${stats.avg_days_to_settle} วัน`
                    }
                  />
                  <Stat
                    label="เลยกำหนดนานสุด (ตอนนี้)"
                    value={`${stats.max_days_overdue} วัน`}
                  />
                  <Stat
                    label="ขายเชื่อครั้งแรก"
                    value={stats.first_credit_at ? fmtDate(stats.first_credit_at) : '-'}
                  />
                  <Stat
                    label="ชำระล่าสุด"
                    value={stats.last_payment_at ? fmtDate(stats.last_payment_at) : '-'}
                  />
                </div>
                {withoutDueDate > 0 && (
                  <p className="mt-3 text-xs text-ink-600/80">
                    มี {withoutDueDate} บิลที่ไม่ได้ตั้งกำหนดชำระ จึงประเมินเรื่อง
                    "เลยกำหนด" ของบิลเหล่านั้นไม่ได้
                  </p>
                )}
              </section>

              {/* Bills */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-brand-900">
                  บิลขายเชื่อ
                </h3>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFilter(f.key)}
                      aria-pressed={filter === f.key}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        filter === f.key
                          ? 'bg-gold-500 text-brand-900'
                          : 'bg-brand-50 text-ink-600 hover:bg-brand-100'
                      }`}
                    >
                      {f.label} ({counts[f.key]})
                    </button>
                  ))}
                </div>

                {visible.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-black/10 py-8 text-center text-sm text-ink-600/70">
                    ไม่มีบิลในหมวดนี้
                  </p>
                ) : (
                  <ul className="divide-y divide-black/5 rounded-lg border border-black/5">
                    {visible.map((b) => {
                      const pill = PILL[b.payment_status]
                      const isOpen = openId === b.sale_id
                      const cancelled = b.sale_status === 'CANCELLED'

                      return (
                        <li key={b.sale_id} className={cancelled ? 'opacity-60' : ''}>
                          <button
                            type="button"
                            onClick={() => setOpenId(isOpen ? null : b.sale_id)}
                            aria-expanded={isOpen}
                            className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-surface/60"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-ink-900">
                                {fmtDate(b.created_at)}
                              </p>
                              <p className="text-xs text-ink-600">
                                {b.due_date
                                  ? `กำหนดชำระ ${formatThaiDate(b.due_date)}`
                                  : 'ไม่ได้ตั้งกำหนดชำระ'}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${pill.cls}`}
                                >
                                  {pill.label}
                                </span>
                                {b.is_overdue && (
                                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-600">
                                    เลยกำหนด {b.days_overdue} วัน
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <p
                                className={`text-sm font-medium text-ink-900 ${
                                  cancelled ? 'line-through' : ''
                                }`}
                              >
                                {formatMoney(b.total_amount)}
                              </p>
                              {!cancelled && (
                                <p
                                  className={`text-xs ${
                                    b.remaining > 0 ? 'text-red-600' : 'text-ink-600'
                                  }`}
                                >
                                  {b.remaining > 0
                                    ? `ค้าง ${formatMoney(b.remaining)}`
                                    : 'ไม่มียอดค้าง'}
                                </p>
                              )}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="space-y-2 bg-surface/50 px-3 pb-3 pt-1 text-sm">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-left text-ink-600">
                                    <th className="py-1 font-medium">สินค้า</th>
                                    <th className="py-1 text-right font-medium">จำนวน</th>
                                    <th className="py-1 text-right font-medium">ราคา</th>
                                    <th className="py-1 text-right font-medium">รวม</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {b.items.map((item, i) => (
                                    <tr key={i} className="border-t border-black/5">
                                      <td className="py-1 text-ink-900">
                                        {item.product_name}
                                      </td>
                                      <td className="py-1 text-right">{item.quantity}</td>
                                      <td className="py-1 text-right">
                                        {formatMoney(item.unit_price)}
                                      </td>
                                      <td className="py-1 text-right">
                                        {formatMoney(item.subtotal)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="flex justify-between text-xs text-ink-600">
                                <span>จ่ายแล้ว</span>
                                <span className="text-ink-900">
                                  {formatMoney(b.paid_amount)} บาท
                                </span>
                              </div>
                              {b.settled_at && (
                                <div className="flex justify-between text-xs text-ink-600">
                                  <span>ชำระครบเมื่อ</span>
                                  <span className="text-ink-900">
                                    {fmtDate(b.settled_at)}
                                  </span>
                                </div>
                              )}
                              {b.credit_note && (
                                <p className="rounded-md bg-white px-2 py-1.5 text-xs text-ink-600">
                                  หมายเหตุ: {b.credit_note}
                                </p>
                              )}
                            </div>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}

                {/* Totals (ตามตัวกรอง ไม่นับบิลยกเลิก) */}
                <div className="mt-3 rounded-lg bg-surface px-3 py-2.5 text-sm">
                  <div className="flex justify-between text-ink-600">
                    <span>ยอดบิลรวม</span>
                    <span className="text-ink-900">{formatMoney(totals.total)} บาท</span>
                  </div>
                  <div className="flex justify-between text-ink-600">
                    <span>จ่ายแล้ว</span>
                    <span className="text-ink-900">{formatMoney(totals.paid)} บาท</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-black/5 pt-1 font-semibold text-brand-900">
                    <span>ค้างชำระรวม</span>
                    <span>{formatMoney(totals.remaining)} บาท</span>
                  </div>
                </div>
              </section>

              {/* Payments */}
              <section>
                <h3 className="mb-2 text-sm font-semibold text-brand-900">
                  ประวัติรับชำระ
                </h3>
                {data.payments.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-black/10 py-6 text-center text-sm text-ink-600/70">
                    ยังไม่มีการรับชำระ
                  </p>
                ) : (
                  <ul className="divide-y divide-black/5 rounded-lg border border-black/5">
                    {data.payments.map((p) => {
                      const voided = p.status === 'VOIDED'
                      return (
                        <li
                          key={p.id}
                          className={`flex items-start justify-between gap-3 px-3 py-2.5 ${
                            voided ? 'opacity-60' : ''
                          }`}
                        >
                          <div className="min-w-0 text-sm">
                            <p className="text-ink-900">
                              {fmtDate(p.paid_at)} ·{' '}
                              {METHOD_LABEL[p.method] ?? p.method}
                            </p>
                            <p className="text-xs text-ink-600">
                              {p.received_by_name
                                ? `รับโดย ${p.received_by_name}`
                                : 'ไม่ทราบผู้รับ'}
                              {p.note ? ` · ${p.note}` : ''}
                            </p>
                            {voided && (
                              <p className="mt-0.5 text-xs text-red-600">
                                ยกเลิกแล้ว: {p.void_reason ?? '-'}
                              </p>
                            )}
                          </div>
                          <p
                            className={`shrink-0 text-sm font-medium text-ink-900 ${
                              voided ? 'line-through' : ''
                            }`}
                          >
                            {formatMoney(p.amount)}
                          </p>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}