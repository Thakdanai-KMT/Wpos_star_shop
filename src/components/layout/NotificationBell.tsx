import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLowStockAlerts } from '../../hooks/useLowStockAlerts'

function BellIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

export default function NotificationBell() {
  const { alerts, outCount } = useLowStockAlerts()
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // ปิดกล่องเมื่อคลิกข้างนอก หรือกด Esc
  useEffect(() => {
    if (!isOpen) return

    function onPointerDown(e: Event) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  const count = alerts.length
  const badgeText = count > 9 ? '9+' : String(count)

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="relative text-ink-600 hover:text-brand-900 transition-colors"
        aria-label={count > 0 ? `การแจ้งเตือน ${count} รายการ` : 'การแจ้งเตือน'}
        aria-expanded={isOpen}
      >
        <BellIcon />
        {count > 0 && (
          <span
            className={`absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center ${
              outCount > 0 ? 'bg-red-500 text-white' : 'bg-gold-500 text-brand-900'
            }`}
          >
            {badgeText}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed right-3 top-16 w-[calc(100vw-1.5rem)] sm:absolute sm:right-0 sm:top-auto sm:mt-3 sm:w-80 rounded-xl bg-white shadow-xl border border-black/5 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
            <p className="text-sm font-semibold text-brand-900">การแจ้งเตือน</p>
            {count > 0 && (
              <span className="text-xs text-ink-600">{count} รายการ</span>
            )}
          </div>

          {count === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-600/70">
              ไม่มีการแจ้งเตือน สต็อกสินค้าปกติ
            </p>
          ) : (
            <ul className="max-h-80 overflow-y-auto">
              {alerts.map((a) => (
                <li key={a.id} className="border-t border-black/5 first:border-t-0">
                  <Link
                    to="/inventory"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm text-ink-900 truncate">{a.name}</p>
                      <p className="text-xs text-ink-600">
                        {a.level === 'OUT' ? 'สินค้าหมด ควรเติมสต็อก' : 'สต็อกใกล้หมด'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                        a.level === 'OUT'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-gold-500/15 text-gold-600'
                      }`}
                    >
                      {a.level === 'OUT' ? 'หมด' : `เหลือ ${a.stock}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}