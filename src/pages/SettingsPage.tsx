import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'

export default function SettingsPage() {
  const { settings, isLoading, error, updateSettings } = useSettings()
  const { user } = useAuth()
  const canEdit = user?.role === 'ADMIN'

  const [lowStockThreshold, setLowStockThreshold] = useState('')
  const [vatRate, setVatRate] = useState('')
  const [extraText, setExtraText] = useState('{}')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // พอโหลดข้อมูลจาก Backend สำเร็จ ให้ใส่ค่าเริ่มต้นในฟอร์ม
  useEffect(() => {
    if (settings) {
      setLowStockThreshold(String(settings.low_stock_threshold))
      setVatRate(String(settings.vat_rate))
      setExtraText(JSON.stringify(settings.extra ?? {}, null, 2))
    }
  }, [settings])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSaveSuccess(false)

    let parsedExtra: Record<string, unknown>
    try {
      parsedExtra = JSON.parse(extraText)
    } catch {
      setFormError('รูปแบบ JSON ของ "ข้อมูลเพิ่มเติม" ไม่ถูกต้อง')
      return
    }

    setIsSubmitting(true)
    try {
      await updateSettings({
        low_stock_threshold: Number(lowStockThreshold),
        vat_rate: Number(vatRate),
        extra: parsedExtra,
      })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : 'บันทึกการตั้งค่าไม่สำเร็จ'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">ตั้งค่าระบบ</h1>

      {isLoading && <p>กำลังโหลด...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!isLoading && !error && settings && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow max-w-md flex flex-col gap-4"
        >
          <div>
            <label className="block text-sm mb-1">
              จำนวนสต็อกขั้นต่ำ (แจ้งเตือนเมื่อต่ำกว่านี้)
            </label>
            <input
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              disabled={!canEdit}
              required
              className="border rounded px-2 py-1 w-full disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">อัตราภาษี VAT (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={vatRate}
              onChange={(e) => setVatRate(e.target.value)}
              disabled={!canEdit}
              required
              className="border rounded px-2 py-1 w-full disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">
              ข้อมูลเพิ่มเติม (JSON)
            </label>
            <textarea
              value={extraText}
              onChange={(e) => setExtraText(e.target.value)}
              disabled={!canEdit}
              rows={6}
              className="border rounded px-2 py-1 w-full font-mono text-sm disabled:bg-gray-100"
            />
          </div>

          {canEdit && (
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
            </button>
          )}

          {!canEdit && (
            <p className="text-sm text-gray-400">
              เฉพาะ ADMIN เท่านั้นที่แก้ไขการตั้งค่าได้
            </p>
          )}

          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          {saveSuccess && (
            <p className="text-green-600 text-sm">บันทึกสำเร็จ! ✓</p>
          )}
        </form>
      )}
    </div>
  )
}