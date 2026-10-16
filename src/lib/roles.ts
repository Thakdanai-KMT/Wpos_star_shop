import type { UserRole } from '../types/auth'

// VIEWER = โหมดดูตัวอย่าง: เห็นและกดได้เหมือน ADMIN
// แต่ backend ไม่อนุญาตให้บันทึก (ตอบ 403) จึงปลอดภัย
export function isDemoUser(role?: UserRole): boolean {
  return role === 'VIEWER'
}

// เห็นปุ่มเพิ่ม/แก้/ลบ/ยกเลิกบิล (เดิม: ADMIN หรือ MANAGER)
export function canManageData(role?: UserRole): boolean {
  return role === 'ADMIN' || role === 'MANAGER' || role === 'VIEWER'
}

// เห็นฟอร์มแก้ไขตั้งค่า (เดิม: ADMIN เท่านั้น)
export function canEditSettings(role?: UserRole): boolean {
  return role === 'ADMIN' || role === 'VIEWER'
}

// ผู้ที่เห็นการแจ้งเตือนสต็อกใกล้หมด (CASHIER ไม่เห็น)
export function canSeeStockAlerts(role?: UserRole): boolean {
  return role === 'ADMIN' || role === 'MANAGER' || role === 'VIEWER'
}
// ผู้ที่เห็นตัวเลือกขายเชื่อและยอดค้างของลูกค้า (VIEWER เห็นเพื่อดูตัวอย่าง บันทึกไม่ได้)
export function canUseCredit(role?: UserRole): boolean {
  return role === 'ADMIN' || role === 'MANAGER' || role === 'VIEWER'
}