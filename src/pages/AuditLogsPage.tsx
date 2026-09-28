import { Fragment, useState } from 'react'
import { useAuditLogs } from '../hooks/useAuditLogs'
import { useUsers } from '../hooks/useUsers'
import Card from '../components/ui/Card'
import { Select } from '../components/ui/Input'

const RESOURCE_TYPES = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'product', label: 'สินค้า' },
  { value: 'category', label: 'หมวดหมู่' },
  { value: 'promotion', label: 'โปรโมชั่น' },
  { value: 'customer', label: 'ลูกค้า' },
  { value: 'settings', label: 'ตั้งค่าระบบ' },
]

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'สร้าง',
  UPDATE: 'แก้ไข',
  DELETE: 'ลบ',
}

const ACTION_BADGE: Record<string, string> = {
  CREATE: 'bg-emerald-50 text-emerald-700',
  UPDATE: 'bg-gold-500/15 text-gold-600',
  DELETE: 'bg-red-50 text-red-600',
}

// แปลง object เป็นรายการ "field: value" อ่านง่าย แทนการดัมป์ JSON ดิบ
function formatValue(value: unknown): { field: string; text: string }[] {
  if (value === null || value === undefined) return []
  if (typeof value !== 'object') return [{ field: '-', text: String(value) }]

  return Object.entries(value as Record<string, unknown>).map(
    ([field, val]) => ({
      field,
      text:
        val === null || val === undefined
          ? '-'
          : typeof val === 'object'
            ? JSON.stringify(val)
            : String(val),
    })
  )
}

function ValueTable({
  title,
  fields,
}: {
  title: string
  fields: { field: string; text: string }[]
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-600 mb-2">{title}</p>
      {fields.length === 0 ? (
        <p className="text-sm text-ink-600/60">-</p>
      ) : (
        <div className="bg-white rounded-lg border border-black/5 overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              {fields.map((f) => (
                <tr key={f.field} className="border-b border-black/5 last:border-0">
                  <td className="p-2 text-ink-600 w-2/5 align-top">
                    {f.field}
                  </td>
                  <td className="p-2 text-ink-900 break-all">{f.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function AuditLogsPage() {
  const [resourceType, setResourceType] = useState('')
  const { logs, isLoading, error } = useAuditLogs(resourceType)
  const { users } = useUsers()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function getUserName(actorId: string) {
    const user = users.find((u) => u.id === actorId)
    return user ? user.full_name : actorId.slice(0, 8) + '...'
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-900 mb-1">Audit Logs</h1>
      <p className="text-sm text-ink-600 mb-6">
        ประวัติการสร้าง แก้ไข และลบข้อมูลในระบบ (เฉพาะผู้ดูแลระบบ)
      </p>

      <Card className="p-5 mb-6">
        <Select
          id="resource_type"
          label="ประเภทข้อมูล"
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          className="w-full sm:w-56"
        >
          {RESOURCE_TYPES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </Select>
      </Card>

      {isLoading && <p className="text-ink-600 text-sm">กำลังโหลด...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!isLoading && !error && (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-ink-600 bg-surface">
                <th className="p-3 font-medium">วันที่</th>
                <th className="p-3 font-medium">ผู้ทำรายการ</th>
                <th className="p-3 font-medium">การกระทำ</th>
                <th className="p-3 font-medium">ประเภท</th>
                <th className="p-3 font-medium">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <tr className="border-t border-black/5">
                    <td className="p-3 text-ink-900">
                      {new Date(log.created_at).toLocaleString('th-TH')}
                    </td>
                    <td className="p-3 text-ink-900">
                      {getUserName(log.actor_id)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${ACTION_BADGE[log.action]}`}
                      >
                        {ACTION_LABEL[log.action]}
                      </span>
                    </td>
                    <td className="p-3 text-ink-600">{log.resource_type}</td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === log.id ? null : log.id)
                        }
                        className="text-gold-600 hover:underline"
                      >
                        {expandedId === log.id ? 'ซ่อน' : 'ดูข้อมูล'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr className="bg-surface">
                      <td colSpan={5} className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <ValueTable
                            title="ข้อมูลเดิม"
                            fields={formatValue(log.old_value)}
                          />
                          <ValueTable
                            title="ข้อมูลใหม่"
                            fields={formatValue(log.new_value)}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-ink-600/60">
                    ไม่มี log
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