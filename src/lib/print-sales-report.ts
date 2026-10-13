import type { SalesSummary, ShopInfo } from '../types/sales-summary'
import { formatThaiDate, formatThaiDateTime } from './thai-date'
import { escapeHtml, formatInt, formatMoney, paymentLabel } from './report-format'

// สีธีมของรายงาน (แก้ตรงนี้ถ้าอยากให้ตรงกับสีแบรนด์ของร้านเป๊ะ)
const NAVY = '#1f2a44'
const GOLD = '#c9a227'

export function printSalesReport(
  summary: SalesSummary,
  shop: ShopInfo,
  preparedBy: string
): boolean {
  const w = window.open('', '_blank')
  if (!w) return false

  w.document.open()
  w.document.write(buildHtml(summary, shop, preparedBy))
  w.document.close()

  const go = () => {
    w.focus()
    w.print()
  }
  // รอให้ฟอนต์โหลดก่อนสั่งพิมพ์
  const fonts = w.document.fonts
  if (fonts && fonts.ready) fonts.ready.then(() => setTimeout(go, 200))
  else setTimeout(go, 600)

  return true
}

function buildHtml(summary: SalesSummary, shop: ShopInfo, preparedBy: string): string {
  const e = escapeHtml
  const avg = summary.total_bills > 0 ? summary.total_sales / summary.total_bills : 0
  const maxRevenue = Math.max(...summary.top_products.map((p) => p.revenue), 1)
  const dailyBills = summary.daily.reduce((a, x) => a + x.bills, 0)
  const dailySales = summary.daily.reduce((a, x) => a + x.sales, 0)
  const payBills = summary.payments.reduce((a, x) => a + x.bills, 0)
  const payAmount = summary.payments.reduce((a, x) => a + x.amount, 0)
  const title = `รายงานสรุปยอดขาย_${summary.from}_${summary.to}`

  const contact = [
    shop.address,
    shop.phone ? `โทร ${shop.phone}` : '',
    shop.taxId ? `เลขประจำตัวผู้เสียภาษี ${shop.taxId}` : '',
  ].filter(Boolean)

  const dailyRows = summary.daily
    .map(
      (d) =>
        `<tr><td>${e(formatThaiDate(d.day))}</td><td class="num">${formatInt(d.bills)}</td><td class="num">${formatMoney(d.sales)}</td></tr>`
    )
    .join('')

  const payRows =
    summary.payments.length === 0
      ? `<tr><td colspan="3" class="empty">ไม่มีข้อมูลในช่วงวันที่นี้</td></tr>`
      : summary.payments
          .map(
            (p) =>
              `<tr><td>${e(paymentLabel(p.payment_method))}</td><td class="num">${formatInt(p.bills)}</td><td class="num">${formatMoney(p.amount)}</td></tr>`
          )
          .join('') +
        `<tr class="total"><td>รวม</td><td class="num">${formatInt(payBills)}</td><td class="num">${formatMoney(payAmount)}</td></tr>`

  const topRows =
    summary.top_products.length === 0
      ? `<tr><td colspan="4" class="empty">ไม่มีข้อมูลในช่วงวันที่นี้</td></tr>`
      : summary.top_products
          .map(
            (p, i) =>
              `<tr><td>${i + 1}</td><td>${e(p.product_name)}</td><td class="num">${formatInt(p.quantity_sold)}</td><td class="num">${formatMoney(p.revenue)}<div class="bar"><i style="width:${(p.revenue / maxRevenue) * 100}%"></i></div></td></tr>`
          )
          .join('')

  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>${e(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
<style>
@page { size: A4; margin: 14mm 12mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: 'Sarabun','Noto Sans Thai','Leelawadee UI','Tahoma',sans-serif; color: #1b1f2a; font-size: 12px; line-height: 1.5; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.band { background: ${NAVY}; color: #fff; padding: 14px 18px; border-bottom: 4px solid ${GOLD}; border-radius: 6px 6px 0 0; }
.band h1 { margin: 0; font-size: 22px; }
.band p { margin: 2px 0 0; font-size: 11px; opacity: .85; }
.title { margin: 16px 0 2px; font-size: 16px; font-weight: 700; color: ${NAVY}; }
.meta { color: #5b6475; font-size: 11px; margin: 0; }
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 14px 0 6px; }
.kpi { border: 1px solid #dfe3ec; border-top: 3px solid ${GOLD}; border-radius: 6px; padding: 8px 10px; }
.kpi .l { color: #5b6475; font-size: 10.5px; }
.kpi .v { font-size: 16px; font-weight: 700; color: ${NAVY}; }
h2 { font-size: 13px; color: ${NAVY}; margin: 18px 0 6px; border-bottom: 1px solid #dfe3ec; padding-bottom: 3px; }
table { width: 100%; border-collapse: collapse; }
thead { display: table-header-group; }
th { background: ${NAVY}; color: #fff; text-align: left; padding: 6px 8px; font-size: 11px; }
th.num { text-align: right; }
td { padding: 5px 8px; border-bottom: 1px solid #e8ebf2; font-size: 11.5px; }
tbody tr:nth-child(even) td { background: #f5f6fa; }
tr { break-inside: avoid; }
.num { text-align: right; font-variant-numeric: tabular-nums; }
tr.total td { font-weight: 700; background: #fbf3d5 !important; border-top: 2px solid ${NAVY}; }
.empty { text-align: center; color: #7a8294; font-style: italic; }
.bar { height: 4px; background: #e8ebf2; border-radius: 2px; margin-top: 3px; }
.bar i { display: block; height: 4px; background: ${GOLD}; border-radius: 2px; }
.note { color: #5b6475; font-size: 10.5px; margin-top: 12px; }
.foot { margin-top: 16px; padding-top: 6px; border-top: 1px solid #dfe3ec; font-size: 10px; color: #7a8294; display: flex; justify-content: space-between; }
</style>
</head>
<body>
<div class="band">
  <h1>${e(shop.name || 'รายงานสรุปยอดขาย')}</h1>
  ${contact.map((c) => `<p>${e(c)}</p>`).join('')}
</div>
<div class="title">รายงานสรุปยอดขาย</div>
<p class="meta">ช่วงวันที่ ${e(formatThaiDate(summary.from))} – ${e(formatThaiDate(summary.to))}</p>
<p class="meta">ออกรายงานเมื่อ ${e(formatThaiDateTime(new Date()))}${preparedBy ? ` โดย ${e(preparedBy)}` : ''}</p>

<div class="kpis">
  <div class="kpi"><div class="l">ยอดขายสุทธิ (บาท)</div><div class="v">${formatMoney(summary.total_sales)}</div></div>
  <div class="kpi"><div class="l">จำนวนบิลที่ขายสำเร็จ</div><div class="v">${formatInt(summary.total_bills)}</div></div>
  <div class="kpi"><div class="l">ยอดเฉลี่ยต่อบิล (บาท)</div><div class="v">${formatMoney(avg)}</div></div>
  <div class="kpi"><div class="l">บิลที่ยกเลิก</div><div class="v">${formatInt(summary.cancelled_bills)}</div></div>
</div>

<h2>ยอดขายรายวัน</h2>
<table>
  <thead><tr><th>วันที่</th><th class="num">จำนวนบิล</th><th class="num">ยอดขาย (บาท)</th></tr></thead>
  <tbody>
    ${dailyRows}
    <tr class="total"><td>รวม</td><td class="num">${formatInt(dailyBills)}</td><td class="num">${formatMoney(dailySales)}</td></tr>
  </tbody>
</table>

<h2>สรุปตามวิธีชำระเงิน</h2>
<table>
  <thead><tr><th>วิธีชำระเงิน</th><th class="num">จำนวนบิล</th><th class="num">ยอดเงิน (บาท)</th></tr></thead>
  <tbody>${payRows}</tbody>
</table>

<h2>สินค้าขายดี 10 อันดับ</h2>
<table>
  <thead><tr><th style="width:36px">#</th><th>สินค้า</th><th class="num">จำนวนที่ขาย</th><th class="num">รายได้ (บาท)</th></tr></thead>
  <tbody>${topRows}</tbody>
</table>

<p class="note">ยอดขายสุทธิไม่รวมบิลที่ยกเลิก (มูลค่าบิลที่ยกเลิกในช่วงนี้ ${formatMoney(summary.cancelled_amount)} บาท)</p>
<div class="foot"><span>ออกโดยระบบ WPOS Star Shop</span><span>${e(shop.name)}</span></div>
</body>
</html>`
}