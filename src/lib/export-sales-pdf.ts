import type {
  Content,
  CustomTableLayout,
  TableCell,
  TDocumentDefinitions,
} from 'pdfmake/interfaces'
import type { SalesSummary, ShopInfo } from '../types/sales-summary'
import { formatThaiDate, formatThaiDateTime } from './thai-date'
import { formatInt, formatMoney, paymentLabel } from './report-format'

const NAVY = '#1f2a44'
const GOLD = '#c9a227'
const ZEBRA = '#f5f6fa'
const TOTAL_BG = '#fbf3d5'
const LINE = '#e1e4ec'

const FONT_REGULAR = 'Sarabun-Regular.ttf'
const FONT_BOLD = 'Sarabun-Bold.ttf'

let fontCache: Promise<Record<string, string>> | null = null

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function loadFont(name: string): Promise<string> {
  const res = await fetch(`/fonts/${name}`)
  const type = res.headers.get('content-type') ?? ''
  // ถ้าไม่มีไฟล์ Vite จะตอบหน้าเว็บ (html) กลับมาแทน ต้องจับให้ได้
  if (!res.ok || type.includes('text/html')) {
    throw new Error('FONT_MISSING')
  }
  return toBase64(await res.arrayBuffer())
}

function loadFonts(): Promise<Record<string, string>> {
  if (!fontCache) {
    fontCache = Promise.all([loadFont(FONT_REGULAR), loadFont(FONT_BOLD)])
      .then(([regular, bold]) => ({ [FONT_REGULAR]: regular, [FONT_BOLD]: bold }))
      .catch((err) => {
        fontCache = null
        throw err
      })
  }
  return fontCache
}

function dataLayout(hasTotal: boolean): CustomTableLayout {
  return {
    hLineWidth: () => 0.5,
    vLineWidth: () => 0,
    hLineColor: () => LINE,
    paddingLeft: () => 6,
    paddingRight: () => 6,
    paddingTop: () => 4,
    paddingBottom: () => 4,
    fillColor: (rowIndex, node) => {
      if (rowIndex === 0) return NAVY
      if (hasTotal && rowIndex === node.table.body.length - 1) return TOTAL_BG
      return rowIndex % 2 === 0 ? ZEBRA : null
    },
  }
}

const th = (text: string, align: 'left' | 'right' | 'center' = 'left'): TableCell => ({
  text,
  bold: true,
  color: '#ffffff',
  fontSize: 9.5,
  alignment: align,
})

const td = (
  text: string,
  align: 'left' | 'right' | 'center' = 'left',
  bold = false
): TableCell => ({ text, alignment: align, bold })

function section(
  title: string,
  widths: (string | number)[],
  head: TableCell[],
  rows: TableCell[][],
  hasTotal: boolean
): Content[] {
  return [
    { text: title, bold: true, fontSize: 12, color: NAVY, margin: [0, 14, 0, 6] },
    {
      table: { headerRows: 1, dontBreakRows: true, widths, body: [head, ...rows] },
      layout: dataLayout(hasTotal),
    },
  ]
}

function kpi(label: string, value: string): TableCell {
  return {
    stack: [
      { text: label, fontSize: 8.5, color: '#5b6475' },
      { text: value, fontSize: 14, bold: true, color: NAVY, margin: [0, 2, 0, 0] },
    ],
    margin: [6, 6, 6, 6],
  }
}

export async function exportSalesPdf(
  summary: SalesSummary,
  shop: ShopInfo,
  preparedBy: string
): Promise<void> {
  const [mod, vfs] = await Promise.all([
    import('pdfmake/build/pdfmake'),
    loadFonts(),
  ])
  const pdfMake = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod

  const fonts = {
    Sarabun: {
      normal: FONT_REGULAR,
      bold: FONT_BOLD,
      italics: FONT_REGULAR,
      bolditalics: FONT_BOLD,
    },
  }

  const avg = summary.total_bills > 0 ? summary.total_sales / summary.total_bills : 0
  const dailyBills = summary.daily.reduce((a, x) => a + x.bills, 0)
  const dailySales = summary.daily.reduce((a, x) => a + x.sales, 0)
  const payBills = summary.payments.reduce((a, x) => a + x.bills, 0)
  const payAmount = summary.payments.reduce((a, x) => a + x.amount, 0)

  const contact = [
    shop.address,
    shop.phone ? `โทร ${shop.phone}` : '',
    shop.taxId ? `เลขประจำตัวผู้เสียภาษี ${shop.taxId}` : '',
  ].filter(Boolean)

  const dailyRows: TableCell[][] = summary.daily.map((d) => [
    td(formatThaiDate(d.day)),
    td(formatInt(d.bills), 'right'),
    td(formatMoney(d.sales), 'right'),
  ])
  dailyRows.push([
    td('รวม', 'left', true),
    td(formatInt(dailyBills), 'right', true),
    td(formatMoney(dailySales), 'right', true),
  ])

  const payRows: TableCell[][] =
    summary.payments.length === 0
      ? [[{ text: 'ไม่มีข้อมูลในช่วงวันที่นี้', colSpan: 3, alignment: 'center', italics: true, color: '#7a8294' }, {}, {}]]
      : [
          ...summary.payments.map((p): TableCell[] => [
            td(paymentLabel(p.payment_method)),
            td(formatInt(p.bills), 'right'),
            td(formatMoney(p.amount), 'right'),
          ]),
          [
            td('รวม', 'left', true),
            td(formatInt(payBills), 'right', true),
            td(formatMoney(payAmount), 'right', true),
          ],
        ]

  const topRows: TableCell[][] =
    summary.top_products.length === 0
      ? [[{ text: 'ไม่มีข้อมูลในช่วงวันที่นี้', colSpan: 4, alignment: 'center', italics: true, color: '#7a8294' }, {}, {}, {}]]
      : summary.top_products.map((p, i): TableCell[] => [
          td(String(i + 1), 'center'),
          td(p.product_name),
          td(formatInt(p.quantity_sold), 'right'),
          td(formatMoney(p.revenue), 'right'),
        ])

  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [28, 28, 28, 40],
    defaultStyle: { font: 'Sarabun', fontSize: 10, color: '#1b1f2a' },
    info: {
      title: `รายงานสรุปยอดขาย ${summary.from} ถึง ${summary.to}`,
      author: shop.name || 'WPOS Star Shop',
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `ออกโดยระบบ WPOS Star Shop${shop.name ? ` · ${shop.name}` : ''}` },
        { text: `หน้า ${currentPage} / ${pageCount}`, alignment: 'right' },
      ],
      margin: [28, 0, 28, 0],
      fontSize: 8,
      color: '#7a8294',
    }),
    content: [
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                fillColor: NAVY,
                margin: [12, 12, 12, 12],
                stack: [
                  {
                    text: shop.name || 'รายงานสรุปยอดขาย',
                    fontSize: 18,
                    bold: true,
                    color: '#ffffff',
                  },
                  ...contact.map((c) => ({ text: c, fontSize: 9, color: '#dfe3ee', margin: [0, 2, 0, 0] as [number, number, number, number] })),
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: (i, node) => (i === node.table.body.length ? 3 : 0),
          vLineWidth: () => 0,
          hLineColor: () => GOLD,
        },
      },
      { text: 'รายงานสรุปยอดขาย', fontSize: 15, bold: true, color: NAVY, margin: [0, 14, 0, 2] },
      {
        text: `ช่วงวันที่ ${formatThaiDate(summary.from)} – ${formatThaiDate(summary.to)}`,
        fontSize: 9.5,
        color: '#5b6475',
      },
      {
        text: `ออกรายงานเมื่อ ${formatThaiDateTime(new Date())}${preparedBy ? ` โดย ${preparedBy}` : ''}`,
        fontSize: 9.5,
        color: '#5b6475',
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          widths: ['*', '*', '*', '*'],
          body: [
            [
              kpi('ยอดขายสุทธิ (บาท)', formatMoney(summary.total_sales)),
              kpi('จำนวนบิลที่ขายสำเร็จ', formatInt(summary.total_bills)),
              kpi('ยอดเฉลี่ยต่อบิล (บาท)', formatMoney(avg)),
              kpi('บิลที่ยกเลิก', formatInt(summary.cancelled_bills)),
            ],
          ],
        },
        layout: {
          hLineWidth: (i) => (i === 0 ? 2 : 0.5),
          hLineColor: (i) => (i === 0 ? GOLD : LINE),
          vLineWidth: () => 0.5,
          vLineColor: () => LINE,
        },
      },
      ...section(
        'ยอดขายรายวัน',
        ['*', 80, 110],
        [th('วันที่'), th('จำนวนบิล', 'right'), th('ยอดขาย (บาท)', 'right')],
        dailyRows,
        true
      ),
      ...section(
        'สรุปตามวิธีชำระเงิน',
        ['*', 80, 110],
        [th('วิธีชำระเงิน'), th('จำนวนบิล', 'right'), th('ยอดเงิน (บาท)', 'right')],
        payRows,
        summary.payments.length > 0
      ),
      ...section(
        'สินค้าขายดี 10 อันดับ',
        [24, '*', 70, 100],
        [th('#', 'center'), th('สินค้า'), th('จำนวนที่ขาย', 'right'), th('รายได้ (บาท)', 'right')],
        topRows,
        false
      ),
      {
        text: `ยอดขายสุทธิไม่รวมบิลที่ยกเลิก (มูลค่าบิลที่ยกเลิกในช่วงนี้ ${formatMoney(summary.cancelled_amount)} บาท)`,
        fontSize: 8.5,
        color: '#5b6475',
        margin: [0, 12, 0, 0],
      },
    ],
  }
  // รองรับทั้ง pdfmake 0.2 (createPdf 4 อาร์กิวเมนต์) และ 0.3 (addFonts + addVirtualFileSystem)
  const pm = pdfMake as unknown as {
    addFonts?: (fonts: unknown) => void
    addVirtualFileSystem?: (vfs: Record<string, string>) => void
    createPdf: (
      doc: TDocumentDefinitions,
      ...rest: unknown[]
    ) => { download: (name?: string) => unknown }
  }
  const filename = `sales-summary_${summary.from}_${summary.to}.pdf`

  if (pm.addFonts && pm.addVirtualFileSystem) {
    pm.addVirtualFileSystem(vfs)
    pm.addFonts(fonts)
    await pm.createPdf(docDefinition).download(filename)
  } else {
    await pm.createPdf(docDefinition, undefined, fonts, vfs).download(filename)
  }
}