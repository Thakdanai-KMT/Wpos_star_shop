import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api-client'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input, Textarea } from '../components/ui/Input'

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
      <h1 className="text-2xl font-semibold text-brand-900 mb-1">
        ตั้งค่าระบบ
      </h1>
      <p className="text-sm text-ink-600 mb-6">
        กำหนดค่าพื้นฐานของร้านค้า เช่น เกณฑ์สต็อกต่ำและอัตราภาษี
      </p>

      {isLoading && <p className="text-ink-600 text-sm">กำลังโหลด...</p>}
      {error && <p className="text-red-600 text-sm">{error}</p>}

      {!isLoading && !error && settings && (
        <form onSubmit={handleSubmit} className="max-w-xl">
          {!canEdit && (
            <div className="bg-gold-500/10 text-gold-600 text-sm rounded-lg px-4 py-3 mb-4">
              คุณดูการตั้งค่าได้อย่างเดียว เฉพาะผู้ดูแลระบบ (ADMIN) เท่านั้นที่แก้ไขได้
            </div>
          )}

          <Card className="p-6 mb-4">
            <h2 className="text-sm font-semibold text-brand-900 mb-4">
              การตั้งค่าทั่วไป
            </h2>

            <div className="flex flex-col gap-5">
              <div>
                <Input
                  id="low_stock_threshold"
                  label="จำนวนสต็อกขั้นต่ำ"
                  type="number"
                  min={0}
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  disabled={!canEdit}
                  required
                  className="w-full sm:w-48"
                />
                <p className="text-xs text-ink-600/70 mt-1.5">
                  แจ้งเตือนเมื่อสินค้าเหลือน้อยกว่าหรือเท่ากับจำนวนนี้
                </p>
              </div>

              <div>
                <Input
                  id="vat_rate"
                  label="อัตราภาษีมูลค่าเพิ่ม VAT (%)"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  disabled={!canEdit}
                  required
                  className="w-full sm:w-48"
                />
                <p className="text-xs text-ink-600/70 mt-1.5">
                  ใส่ค่าระหว่าง 0 – 100
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 mb-4">
            <h2 className="text-sm font-semibold text-brand-900 mb-1">
              ข้อมูลเพิ่มเติม
            </h2>
            <p className="text-xs text-ink-600/70 mb-4">
              รูปแบบ JSON สำหรับค่าตั้งค่าอื่นๆ ที่ยืดหยุ่น
              ค่าที่ระบุจะถูกรวมเข้ากับของเดิม ไม่ทับทั้งหมด
            </p>
            <Textarea
              id="extra"
              value={extraText}
              onChange={(e) => setExtraText(e.target.value)}
              disabled={!canEdit}
              rows={7}
              spellCheck={false}
              className="font-mono text-xs"
            />
          </Card>

          {formError && (
            <p className="text-red-600 text-sm mb-3" role="alert">
              {formError}
            </p>
          )}

          {canEdit && (
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </Button>
              {saveSuccess && (
                <span className="text-emerald-600 text-sm">
                  บันทึกสำเร็จ ✓
                </span>
              )}
            </div>
          )}
        </form>
      )}
    </div>
  )
}