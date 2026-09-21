import generatePayload from 'promptpay-qr'

// เบอร์พร้อมเพย์ของร้าน — ใส่เบอร์จริงตรงนี้ (รูปแบบ 10 หลัก เช่น '0812345678')
export const SHOP_PROMPTPAY_ID = '0803424460'

export function getPromptPayPayload(amount: number): string {
  return generatePayload(SHOP_PROMPTPAY_ID, { amount })
}