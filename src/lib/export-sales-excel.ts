import type { Row, Worksheet } from 'exceljs'
import type { SalesSummary, ShopInfo } from '../types/sales-summary'
import { formatThaiDate, formatThaiDateTime } from './thai-date'
import { paymentLabel } from './report-format'

const NAVY = 'FF1F2A44'
const GOLD = 'FFC9A227'
const ZEBRA = 'FFF4F5F9'
const LINE = 'FFE1E4EC'
const TOTAL_BG = 'FFFBF3D5'
const MONEY = '#,##0.00'
const INT = '#,##0'
const FONT = 'Tahoma'

const solid = (argb: string) => ({
  type: 'pattern' as const,
  pattern: 'solid' as const,
  fgColor: { argb },
})

function headerRow(ws: Worksheet, rowNumber: number, labels: string[]) {
  const row = ws.getRow(rowNumber)
  labels.forEach((label, i) => {
    row.getCell(i + 1).value = label
  })
  row.height = 24
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = solid(NAVY)
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
    cell.border = { bottom: { style: 'medium', color: { argb: GOLD } } }
  })
}

function bodyRow(row: Row, columns: number, index: number) {
  for (let c = 1; c <= columns; c++) {
    const cell = row.getCell(c)
    if (index % 2 === 1) cell.fill = solid(ZEBRA)
    cell.border = { bottom: { style: 'thin', color: { argb: LINE } } }
  }
}

function totalRow(row: Row, columns: number) {
  for (let c = 1; c <= columns; c++) {
    const cell = row.getCell(c)
    cell.font = { bold: true }
    cell.fill = solid(TOTAL_BG)
    cell.border = { top: { style: 'medium', color: { argb: NAVY } } }
  }
}

function emptyNote(ws: Worksheet, rowNumber: number, columns: number) {
  ws.mergeCells(rowNumber, 1, rowNumber, columns)
  const cell = ws.getCell(rowNumber, 1)
  cell.value = 'ไม่มีข้อมูลในช่วงวันที่นี้'
  cell.alignment = { horizontal: 'center' }
  cell.font = { italic: true, color: { argb: 'FF7A8294' } }
}

function sheetTitle(ws: Worksheet, title: string, summary: SalesSummary, columns: number) {
  ws.mergeCells(1, 1, 1, columns)
  const t = ws.getCell(1, 1)
  t.value = title
  t.font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
  t.fill = solid(NAVY)
  t.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  ws.getRow(1).height = 28

  ws.mergeCells(2, 1, 2, columns)
  const p = ws.getCell(2, 1)
  p.value = `ช่วงวันที่ ${formatThaiDate(summary.from)} – ${formatThaiDate(summary.to)}`
  p.font = { size: 10, color: { argb: 'FF5B6475' } }
  p.alignment = { horizontal: 'left', indent: 1 }
}

function applyFont(ws: Worksheet) {
  ws.eachRow({ includeEmpty: false }, (row) => {
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.font = { ...cell.font, name: FONT }
    })
  })
}

function setupPage(ws: Worksheet) {
  ws.pageSetup = {
    paperSize: 9,
    orientation: 'portrait',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
  }
}

export async function exportSalesExcel(
  summary: SalesSummary,
  shop: ShopInfo,
  preparedBy: string
): Promise<void> {
  const mod = await import('exceljs')
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod

  const wb = new ExcelJS.Workbook()
  wb.creator = shop.name || 'WPOS Star Shop'
  wb.created = new Date()

  // ---------- ชีต 1: สรุป ----------
  const s = wb.addWorksheet('สรุป', { views: [{ showGridLines: false }] })
  s.columns = [{ width: 36 }, { width: 24 }, { width: 18 }, { width: 18 }]

  s.mergeCells('A1:D1')
  const head = s.getCell('A1')
  head.value = shop.name || 'รายงานสรุปยอดขาย'
  head.font = { size: 18, bold: true, color: { argb: 'FFFFFFFF' } }
  head.fill = solid(NAVY)
  head.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }
  s.getRow(1).height = 36

  const contact = [
    shop.address,
    shop.phone ? `โทร ${shop.phone}` : '',
    shop.taxId ? `เลขประจำตัวผู้เสียภาษี ${shop.taxId}` : '',
  ].filter(Boolean)
  contact.forEach((text, i) => {
    const r = 2 + i
    s.mergeCells(`A${r}:D${r}`)
    const c = s.getCell(`A${r}`)
    c.value = text
    c.font = { size: 10, color: { argb: 'FFFFFFFF' } }
    c.fill = solid(NAVY)
    c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true }
    if (i === 0) s.getRow(r).height = 28
  })

  let r = 2 + contact.length + 1
  s.getCell(`A${r}`).value = 'รายงานสรุปยอดขาย'
  s.getCell(`A${r}`).font = { size: 14, bold: true, color: { argb: NAVY } }
  r++
  s.getCell(`A${r}`).value = `ช่วงวันที่ ${formatThaiDate(summary.from)} – ${formatThaiDate(summary.to)}`
  r++
  s.getCell(`A${r}`).value = `ออกรายงานเมื่อ ${formatThaiDateTime(new Date())}${
    preparedBy ? ` โดย ${preparedBy}` : ''
  }`
  s.getCell(`A${r}`).font = { size: 10, color: { argb: 'FF5B6475' } }
  r += 2

  headerRow(s, r, ['รายการ', 'ผลรวม'])
  const avg = summary.total_bills > 0 ? summary.total_sales / summary.total_bills : 0
  const kpis: [string, number, string][] = [
    ['ยอดขายสุทธิ (บาท)', summary.total_sales, MONEY],
    ['จำนวนบิลที่ขายสำเร็จ (บิล)', summary.total_bills, INT],
    ['ยอดเฉลี่ยต่อบิล (บาท)', avg, MONEY],
    ['จำนวนบิลที่ยกเลิก (บิล)', summary.cancelled_bills, INT],
    ['มูลค่าบิลที่ยกเลิก (บาท)', summary.cancelled_amount, MONEY],
  ]
  kpis.forEach(([label, value, fmt], i) => {
    const row = s.getRow(r + 1 + i)
    row.getCell(1).value = label
    const cell = row.getCell(2)
    cell.value = value
    cell.numFmt = fmt
    cell.alignment = { horizontal: 'right' }
    bodyRow(row, 2, i)
  })
  r += kpis.length + 2
  s.getCell(`A${r}`).value = 'หมายเหตุ: ยอดขายสุทธิไม่รวมบิลที่ยกเลิก ข้อมูลจากระบบ WPOS Star Shop'
  s.getCell(`A${r}`).font = { size: 9, italic: true, color: { argb: 'FF7A8294' } }

  // ---------- ชีต 2: รายวัน ----------
  const d = wb.addWorksheet('รายวัน', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
  })
  d.columns = [{ width: 18 }, { width: 16 }, { width: 22 }]
  sheetTitle(d, 'ยอดขายรายวัน', summary, 3)
  headerRow(d, 4, ['วันที่', 'จำนวนบิล', 'ยอดขาย (บาท)'])

  summary.daily.forEach((day, i) => {
    const row = d.getRow(5 + i)
    const [y, m, dd] = day.day.split('-').map(Number)
    const dateCell = row.getCell(1)
    dateCell.value = new Date(Date.UTC(y, m - 1, dd))
    dateCell.numFmt = 'dd/mm/yyyy'
    dateCell.alignment = { horizontal: 'center' }
    row.getCell(2).value = day.bills
    row.getCell(2).numFmt = INT
    row.getCell(3).value = day.sales
    row.getCell(3).numFmt = MONEY
    bodyRow(row, 3, i)
  })

  if (summary.daily.length > 0) {
    const first = 5
    const last = 4 + summary.daily.length
    const t = d.getRow(last + 1)
    t.getCell(1).value = 'รวม'
    t.getCell(1).alignment = { horizontal: 'center' }
    t.getCell(2).value = {
      formula: `SUM(B${first}:B${last})`,
      result: summary.daily.reduce((a, x) => a + x.bills, 0),
    }
    t.getCell(2).numFmt = INT
    t.getCell(3).value = {
      formula: `SUM(C${first}:C${last})`,
      result: summary.daily.reduce((a, x) => a + x.sales, 0),
    }
    t.getCell(3).numFmt = MONEY
    totalRow(t, 3)
  }

  // ---------- ชีต 3: วิธีชำระเงิน ----------
  const p = wb.addWorksheet('วิธีชำระเงิน', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
  })
  p.columns = [{ width: 26 }, { width: 16 }, { width: 22 }]
  sheetTitle(p, 'สรุปตามวิธีชำระเงิน', summary, 3)
  headerRow(p, 4, ['วิธีชำระเงิน', 'จำนวนบิล', 'ยอดเงิน (บาท)'])

  if (summary.payments.length === 0) {
    emptyNote(p, 5, 3)
  } else {
    summary.payments.forEach((pay, i) => {
      const row = p.getRow(5 + i)
      row.getCell(1).value = paymentLabel(pay.payment_method)
      row.getCell(2).value = pay.bills
      row.getCell(2).numFmt = INT
      row.getCell(3).value = pay.amount
      row.getCell(3).numFmt = MONEY
      bodyRow(row, 3, i)
    })
    const last = 4 + summary.payments.length
    const t = p.getRow(last + 1)
    t.getCell(1).value = 'รวม'
    t.getCell(2).value = {
      formula: `SUM(B5:B${last})`,
      result: summary.payments.reduce((a, x) => a + x.bills, 0),
    }
    t.getCell(2).numFmt = INT
    t.getCell(3).value = {
      formula: `SUM(C5:C${last})`,
      result: summary.payments.reduce((a, x) => a + x.amount, 0),
    }
    t.getCell(3).numFmt = MONEY
    totalRow(t, 3)
  }

  // ---------- ชีต 4: สินค้าขายดี ----------
  const t4 = wb.addWorksheet('สินค้าขายดี', {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false }],
  })
  t4.columns = [{ width: 6 }, { width: 40 }, { width: 16 }, { width: 22 }]
  sheetTitle(t4, 'สินค้าขายดี 10 อันดับ (เรียงตามรายได้)', summary, 4)
  headerRow(t4, 4, ['#', 'สินค้า', 'จำนวนที่ขาย', 'รายได้ (บาท)'])

  if (summary.top_products.length === 0) {
    emptyNote(t4, 5, 4)
  } else {
    summary.top_products.forEach((item, i) => {
      const row = t4.getRow(5 + i)
      row.getCell(1).value = i + 1
      row.getCell(1).alignment = { horizontal: 'center' }
      row.getCell(2).value = item.product_name
      row.getCell(3).value = item.quantity_sold
      row.getCell(3).numFmt = INT
      row.getCell(4).value = item.revenue
      row.getCell(4).numFmt = MONEY
      bodyRow(row, 4, i)
    })
  }

  wb.worksheets.forEach((ws) => {
    setupPage(ws)
    applyFont(ws)
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `sales-summary_${summary.from}_${summary.to}.xlsx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}   