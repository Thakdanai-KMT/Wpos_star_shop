const TZ = 'Asia/Bangkok'

// วันที่ปัจจุบันตามเวลาไทย รูปแบบ YYYY-MM-DD
export function todayInThailand(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

// ช่วงวันที่ของเดือน: offset 0 = เดือนนี้, -1 = เดือนที่แล้ว
export function monthRange(offset: number): { from: string; to: string } {
  const [y, m] = todayInThailand().split('-').map(Number)
  const first = new Date(Date.UTC(y, m - 1 + offset, 1))
  const last = new Date(Date.UTC(y, m + offset, 0))
  return {
    from: first.toISOString().slice(0, 10),
    to: last.toISOString().slice(0, 10),
  }
}

// แสดงเป็น พ.ศ. เช่น 11 ตุลาคม 2569
export function formatThaiDate(iso: string): string {
  return new Date(`${iso}T00:00:00+07:00`).toLocaleDateString('th-TH', {
    timeZone: TZ,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatThaiDateTime(date: Date): string {
  return (
    date.toLocaleString('th-TH', {
      timeZone: TZ,
      dateStyle: 'long',
      timeStyle: 'short',
    }) + ' น.'
  )
}
// วันที่ในอนาคตตามเวลาไทย (n วันนับจากวันนี้) รูปแบบ YYYY-MM-DD
export function addDaysThai(days: number): string {
  const d = new Date(`${todayInThailand()}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}