import { useAuth } from '../../contexts/AuthContext'
import { isDemoUser } from '../../lib/roles'

export default function DemoBanner() {
  const { user } = useAuth()
  if (!isDemoUser(user?.role)) return null

  return (
    <div className="bg-gold-500/15 border-b border-gold-500/30 px-4 py-2 text-center text-sm text-brand-900">
      โหมดดูตัวอย่าง: ดูข้อมูลและลองใช้งานได้ทุกหน้า แต่ระบบจะไม่บันทึกการเปลี่ยนแปลง
    </div>
  )
}