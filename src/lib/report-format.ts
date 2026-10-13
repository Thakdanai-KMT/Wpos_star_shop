// ถ้า payment_method ในระบบคุณใช้ชื่ออื่น ให้แก้ตารางนี้ (ค่าที่ไม่รู้จักจะแสดงตามเดิม)
const PAYMENT_LABEL: Record<string, string> = {
  CASH: 'เงินสด',
  TRANSFER: 'โอนเงิน',
  PROMPTPAY: 'พร้อมเพย์',
  QR: 'QR Code',
  CARD: 'บัตร',
}

export function paymentLabel(method: string): string {
  return PAYMENT_LABEL[method] ?? method
}

export function formatMoney(n: number): string {
  return n.toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatInt(n: number): string {
  return n.toLocaleString('th-TH')
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}