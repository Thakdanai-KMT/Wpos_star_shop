import { useState } from 'react'
import { useAuditLogs } from '../hooks/useAuditLogs'
import { useUsers } from '../hooks/useUsers'

const RESOURCE_TYPES = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'product', label: 'สินค้า' },
  { value: 'category', label: 'หมวดหมู่' },
  { value: 'promotion', label: 'โปรโมชั่น' },
  { value: 'customer', label: 'ลูกค้า' },
]

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'สร้าง',
  UPDATE: 'แก้ไข',
  DELETE: 'ลบ',
}

const ACTION_COLOR: Record<string, string> = {
  CREATE: 'text-green-600',
  UPDATE: 'text-blue-600',
  DELETE: 'text-red-600',
}

// แปลง object เป็นรายการ "field: value" อ่านง่าย แทนการดัมป์ JSON ดิบ
function formatValue(value: unknown): { field: string; text: string }[] {
  if (value === null || value === undefined) return []
  if (typeof value !== 'object') return [{ field: '-', text: String(value) }]

  return Object.entries(value as Record<string, unknown>).map(([field, val]) => ({
    field,
    text:
      val === null || val === undefined
        ? '-'
        : typeof val === 'object'
          ? JSON.stringify(val)
          : String(val),
  }))
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
      <h1 className="text-2xl font-bold mb-4">Audit Logs</h1>

      <div className="mb-4">
        <label className="block text-sm mb-1">ประเภทข้อมูล</label>
        <select
          value={resourceType}
          onChange={(e) => setResourceType(e.target.value)}
          className="border rounded px-2 py-1"
        >
          {RESOURCE_TYPES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>กำลังโหลด...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && (
        <table className="w-full bg-white rounded shadow">
          <thead>
            <tr className="border-b text-left text-sm text-gray-500">
              <th className="p-3">วันที่</th>
              <th className="p-3">ผู้ทำรายการ</th>
              <th className="p-3">การกระทำ</th>
              <th className="p-3">ประเภท</th>
              <th className="p-3">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => {
              const oldFields = formatValue(log.old_value)
              const newFields = formatValue(log.new_value)

              return (
                <>
                  <tr key={log.id} className="border-b text-sm">
                    <td className="p-3">
                      {new Date(log.created_at).toLocaleString('th-TH')}
                    </td>
                    <td className="p-3">{getUserName(log.actor_id)}</td>
                    <td className={`p-3 font-medium ${ACTION_COLOR[log.action]}`}>
                      {ACTION_LABEL[log.action]}
                    </td>
                    <td className="p-3">{log.resource_type}</td>
                    <td className="p-3">
                      <button
                        onClick={() =>
                          setExpandedId(expandedId === log.id ? null : log.id)
                        }
                        className="text-blue-600 hover:underline text-xs"
                      >
                        {expandedId === log.id ? 'ซ่อน' : 'ดูข้อมูล'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === log.id && (
                    <tr className="border-b bg-gray-50">
                      <td colSpan={5} className="p-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium mb-1 text-gray-600">
                              ข้อมูลเดิม
                            </p>
                            {oldFields.length === 0 ? (
                              <p className="text-gray-400">-</p>
                            ) : (
                              <table className="w-full bg-white rounded">
                                <tbody>
                                  {oldFields.map((f) => (
                                    <tr key={f.field} className="border-b last:border-0">
                                      <td className="p-2 text-gray-500 w-1/3">
                                        {f.field}
                                      </td>
                                      <td className="p-2">{f.text}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                          <div>
                            <p className="font-medium mb-1 text-gray-600">
                              ข้อมูลใหม่
                            </p>
                            {newFields.length === 0 ? (
                              <p className="text-gray-400">-</p>
                            ) : (
                              <table className="w-full bg-white rounded">
                                <tbody>
                                  {newFields.map((f) => (
                                    <tr key={f.field} className="border-b last:border-0">
                                      <td className="p-2 text-gray-500 w-1/3">
                                        {f.field}
                                      </td>
                                      <td className="p-2">{f.text}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="p-3 text-center text-gray-400">
                  ไม่มี log
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}