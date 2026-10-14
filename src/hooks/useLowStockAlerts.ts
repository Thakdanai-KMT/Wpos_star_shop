import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiClient } from '../lib/api-client'
import type { Product } from '../types/product'
import type { AppSettings } from '../types/settings'

const POLL_MS = 60_000

export interface StockAlert {
  id: string
  name: string
  stock: number
  level: 'OUT' | 'LOW'
}

export function useLowStockAlerts() {
  const [products, setProducts] = useState<Product[]>([])
  const [threshold, setThreshold] = useState<number | null>(null)
  const inFlight = useRef(false)

  const refresh = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const [productsRes, settingsRes] = await Promise.all([
        apiClient.get<{ data: Product[] }>('/products'),
        apiClient.get<{ data: AppSettings }>('/settings'),
      ])
      setProducts(productsRes.data)
      setThreshold(settingsRes.data.low_stock_threshold)
    } catch {
      // เงียบไว้ ไม่รบกวนผู้ใช้ จะลองใหม่ในรอบถัดไป
    } finally {
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    refresh()

    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh()
    }, POLL_MS)

    function onVisible() {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  const alerts = useMemo<StockAlert[]>(() => {
    if (threshold === null) return []
    return products
      // เฉพาะสินค้าที่เปิดใช้งาน และไม่ใช่แพ็ก (สต็อกแพ็กคำนวณจากสินค้าฐาน จะได้ไม่เตือนซ้ำ)
      .filter(
        (p) =>
          p.is_active && !p.bundle_of_product_id && p.stock_quantity <= threshold
      )
      .map((p) => ({
        id: p.id,
        name: p.product_name,
        stock: p.stock_quantity,
        level: (p.stock_quantity <= 0 ? 'OUT' : 'LOW') as StockAlert['level'],
      }))
      .sort((a, b) => a.stock - b.stock)
  }, [products, threshold])

  const outCount = alerts.filter((a) => a.level === 'OUT').length

  return { alerts, outCount, refresh }
}