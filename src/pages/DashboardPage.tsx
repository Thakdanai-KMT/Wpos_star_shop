import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useSales } from '../hooks/useSales'
import { useTopProducts } from '../hooks/useTopProducts'
import { useAuth } from '../contexts/AuthContext'
import Card from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import type { Sale } from '../types/sale'

// =========================================================
// Helpers — วันที่ใช้เวลาท้องถิ่นเสมอ (ไม่ใช้ toISOString เพราะเป็น UTC
// จะทำให้บิลช่วงเที่ยงคืน–7 โมงเช้าไทยตกไปอยู่ผิดวัน)
// =========================================================

const MAX_DAYS = 366

function toDateKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(key: string, days: number) {
  const d = parseKey(key)
  d.setDate(d.getDate() + days)
  return toDateKey(d)
}

function daysBetween(from: string, to: string) {
  return (
    Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / 86400000) +
    1
  )
}

function shortDate(key: string) {
  return parseKey(key).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
  })
}

function fullDate(key: string) {
  return parseKey(key).toLocaleDateString('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function fmt(n: number) {
  return n.toLocaleString('th-TH', { maximumFractionDigits: 2 })
}

function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

// =========================================================
// Types & constants
// =========================================================

interface DayStat {
  revenue: number
  bills: number
  cancelled: number
}

interface DayPoint {
  key: string
  label: string
  revenue: number
  bills: number
}

const PAYMENT_META = [
  { key: 'CASH', label: 'เงินสด', color: '#E8A33D' },
  { key: 'TRANSFER', label: 'โอนเงิน', color: '#2A3563' },
  { key: 'CARD', label: 'บัตร', color: '#8A96BD' },
] as const

// =========================================================
// Small components
// =========================================================

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: DayPoint }[]
}) {
  if (!active || !payload || payload.length === 0) return null
  const p = payload[0].payload
  return (
    <div className="bg-brand-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-white/70 mb-1">{fullDate(p.key)}</p>
      <p className="text-sm font-semibold text-gold-400">
        {fmt(p.revenue)} บาท
      </p>
      <p className="text-white/70">{p.bills} บิล</p>
    </div>
  )
}

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return (
      <span className="text-xs text-ink-600/60">ไม่มีข้อมูลช่วงก่อนหน้า</span>
    )
  }
  const pct = ((current - previous) / previous) * 100
  const up = pct >= 0
  return (
    <span
      className={`text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-600'}`}
    >
      {up ? '▲' : '▼'} {Math.abs(pct).toFixed(1)}%
      <span className="text-ink-600/60 font-normal ml-1">
        เทียบช่วงก่อนหน้า
      </span>
    </span>
  )
}

function KpiCard({
  label,
  value,
  unit,
  footer,
}: {
  label: string
  value: string
  unit: string
  footer: ReactNode
}) {
  return (
    <Card className="p-4 sm:p-5 min-w-0">
      <p className="text-sm text-ink-600 mb-1">{label}</p>
      <p className="text-2xl sm:text-3xl font-semibold text-brand-900 truncate">
        {value}
        <span className="text-sm font-normal text-ink-600 ml-1.5">{unit}</span>
      </p>
      <div className="mt-2 min-h-4">{footer}</div>
    </Card>
  )
}

// =========================================================
// Page
// =========================================================

export default function DashboardPage() {
  const { user } = useAuth()
  const { sales, isLoading, error } = useSales()

  const today = toDateKey(new Date())
  const [from, setFrom] = useState(addDays(today, -6))
  const [to, setTo] = useState(today)

  const { products: topProducts, isLoading: isLoadingTop } = useTopProducts(
    from,
    to,
    5
  )

  // รวมยอดรายวันครั้งเดียว (บิลที่ยกเลิกไม่นับเป็นยอดขาย)
  const { byDay, completed } = useMemo(() => {
    const byDay = new Map<string, DayStat>()
    const completed: { key: string; sale: Sale }[] = []
    for (const s of sales) {
      const key = toDateKey(new Date(s.created_at))
      const stat = byDay.get(key) ?? { revenue: 0, bills: 0, cancelled: 0 }
      if (s.status === 'CANCELLED') {
        stat.cancelled += 1
      } else {
        stat.revenue += s.total_amount
        stat.bills += 1
        completed.push({ key, sale: s })
      }
      byDay.set(key, stat)
    }
    return { byDay, completed }
  }, [sales])

  const isValidRange = Boolean(from) && Boolean(to) && from <= to
  const dayCount = isValidRange ? daysBetween(from, to) : 0
  const tooLong = dayCount > MAX_DAYS
  const ready = isValidRange && !tooLong

  const view = useMemo(() => {
    if (!ready) return null

    const points: DayPoint[] = []
    let revenue = 0
    let bills = 0
    let cancelled = 0
    for (let i = 0; i < dayCount; i++) {
      const key = addDays(from, i)
      const stat = byDay.get(key)
      const r = stat?.revenue ?? 0
      const b = stat?.bills ?? 0
      revenue += r
      bills += b
      cancelled += stat?.cancelled ?? 0
      points.push({ key, label: shortDate(key), revenue: r, bills: b })
    }

    // ช่วงก่อนหน้า ยาวเท่ากับช่วงที่เลือก (ไว้เทียบเปอร์เซ็นต์)
    const prevTo = addDays(from, -1)
    const prevFrom = addDays(prevTo, -(dayCount - 1))
    let prevRevenue = 0
    let prevBills = 0
    for (let i = 0; i < dayCount; i++) {
      const stat = byDay.get(addDays(prevFrom, i))
      prevRevenue += stat?.revenue ?? 0
      prevBills += stat?.bills ?? 0
    }

    const pay: Record<string, number> = { CASH: 0, TRANSFER: 0, CARD: 0 }
    for (const { key, sale } of completed) {
      if (key >= from && key <= to) {
        pay[sale.payment_method] += sale.total_amount
      }
    }

    return { points, revenue, bills, cancelled, prevRevenue, prevBills, pay }
  }, [ready, from, to, dayCount, byDay, completed])

  const payData = view
    ? PAYMENT_META.map((m) => ({
        name: m.label,
        value: view.pay[m.key],
        color: m.color,
      }))
    : []
  const payTotal = payData.reduce((sum, p) => sum + p.value, 0)

  const now = new Date()
  const presets = [
    { label: 'วันนี้', from: today, to: today },
    { label: '7 วันล่าสุด', from: addDays(today, -6), to: today },
    { label: '30 วันล่าสุด', from: addDays(today, -29), to: today },
    {
      label: 'เดือนนี้',
      from: toDateKey(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: today,
    },
  ]

  const hasData = view !== null && (view.revenue > 0 || view.bills > 0)
  const maxTopRevenue = topProducts[0]?.revenue || 1

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-900 mb-1">แดชบอร์ด</h1>
      <p className="text-sm text-ink-600 mb-6">
        สวัสดี {user?.full_name ?? user?.email} · ภาพรวมยอดขายของร้าน
      </p>

      {/* ตัวเลือกช่วงเวลา */}
      <Card className="p-4 sm:p-5 mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map((p) => {
            const active = p.from === from && p.to === to
            return (
              <button
                key={p.label}
                onClick={() => {
                  setFrom(p.from)
                  setTo(p.to)
                }}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  active
                    ? 'bg-brand-900 text-white'
                    : 'bg-white border border-brand-100 text-ink-600 hover:bg-brand-50'
                }`}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="w-full sm:w-44">
            <Input
              id="range_from"
              label="ตั้งแต่วันที่"
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Input
              id="range_to"
              label="ถึงวันที่"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          {ready && (
            <p className="text-sm text-ink-600 pb-2.5">
              ช่วงที่เลือก {dayCount} วัน
            </p>
          )}
        </div>

        {!isValidRange && (
          <p className="text-red-600 text-sm mt-3" role="alert">
            วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด
          </p>
        )}
        {tooLong && (
          <p className="text-red-600 text-sm mt-3" role="alert">
            เลือกช่วงเวลาได้ไม่เกิน {MAX_DAYS} วัน
          </p>
        )}
      </Card>

      {isLoading && <p className="text-ink-600 text-sm">กำลังโหลดข้อมูล...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!isLoading && !error && view && (
        <>
          {/* การ์ดตัวเลขสรุป */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <KpiCard
              label="ยอดขายรวม"
              value={fmt(view.revenue)}
              unit="บาท"
              footer={
                <Delta current={view.revenue} previous={view.prevRevenue} />
              }
            />
            <KpiCard
              label="จำนวนบิล"
              value={String(view.bills)}
              unit="บิล"
              footer={<Delta current={view.bills} previous={view.prevBills} />}
            />
            <KpiCard
              label="เฉลี่ยต่อบิล"
              value={fmt(view.bills > 0 ? view.revenue / view.bills : 0)}
              unit="บาท"
              footer={
                <span className="text-xs text-ink-600/60">
                  ยอดขายรวม ÷ จำนวนบิล
                </span>
              }
            />
            <KpiCard
              label="บิลที่ยกเลิก"
              value={String(view.cancelled)}
              unit="บิล"
              footer={
                <span className="text-xs text-ink-600/60">
                  ไม่นับรวมในยอดขาย
                </span>
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* กราฟยอดขายรายวัน */}
            <Card className="p-4 sm:p-5 lg:col-span-2 min-w-0">
              <h2 className="text-sm font-semibold text-brand-900">
                ยอดขายรายวัน
              </h2>
              <p className="text-xs text-ink-600 mb-4">
                {shortDate(from)} – {shortDate(to)}
              </p>

              {hasData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart
                    data={view.points}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="revenueFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#E8A33D" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#E8A33D" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#E5E7EF"
                    />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: '#545A72' }}
                      minTickGap={24}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      width={44}
                      tick={{ fontSize: 12, fill: '#545A72' }}
                      tickFormatter={compact}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: '#E8A33D', strokeDasharray: '4 4' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#E8A33D"
                      strokeWidth={2.5}
                      fill="url(#revenueFill)"
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#C9862A' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-sm text-ink-600/60">
                  ไม่มีข้อมูลการขายในช่วงเวลานี้
                </div>
              )}
            </Card>

            {/* สัดส่วนช่องทางชำระเงิน */}
            <Card className="p-4 sm:p-5 min-w-0">
              <h2 className="text-sm font-semibold text-brand-900">
                ช่องทางชำระเงิน
              </h2>
              <p className="text-xs text-ink-600 mb-2">สัดส่วนตามยอดเงิน</p>

              {payTotal > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie
                        data={payData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {payData.map((p) => (
                          <Cell key={p.name} fill={p.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <ul className="mt-2 space-y-2">
                    {payData.map((p) => (
                      <li
                        key={p.name}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="flex items-center gap-2 text-ink-900">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.name}
                        </span>
                        <span className="text-ink-600">
                          {fmt(p.value)} บาท ·{' '}
                          {((p.value / payTotal) * 100).toFixed(0)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-sm text-ink-600/60">
                  ไม่มีข้อมูลการขาย
                </div>
              )}
            </Card>
          </div>

          {/* สินค้าขายดี 5 อันดับแรก */}
          <Card className="p-4 sm:p-5 mt-4">
            <h2 className="text-sm font-semibold text-brand-900">
              สินค้าขายดี 5 อันดับแรก
            </h2>
            <p className="text-xs text-ink-600 mb-4">
              {shortDate(from)} – {shortDate(to)} · เรียงตามยอดขาย
            </p>

            {isLoadingTop && (
              <p className="text-sm text-ink-600">กำลังโหลด...</p>
            )}

            {!isLoadingTop && topProducts.length === 0 && (
              <div className="h-24 flex items-center justify-center text-sm text-ink-600/60">
                ไม่มีข้อมูลการขายในช่วงเวลานี้
              </div>
            )}

            {!isLoadingTop && topProducts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="text-left text-ink-600 bg-surface">
                      <th className="p-3 font-medium w-10">#</th>
                      <th className="p-3 font-medium">สินค้า</th>
                      <th className="p-3 font-medium">จำนวนที่ขาย</th>
                      <th className="p-3 font-medium">ยอดขาย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={p.product_id} className="border-t border-black/5">
                        <td className="p-3 text-ink-600">{i + 1}</td>
                        <td className="p-3 text-ink-900">{p.product_name}</td>
                        <td className="p-3 text-ink-900">{p.quantity_sold}</td>
                        <td className="p-3">
                          <p className="text-ink-900 font-medium">
                            {fmt(p.revenue)} บาท
                          </p>
                          <div className="h-1 bg-surface rounded-full mt-1.5 w-full max-w-[140px]">
                            <div
                              className="h-1 bg-gold-500 rounded-full"
                              style={{
                                width: `${(p.revenue / maxTopRevenue) * 100}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}