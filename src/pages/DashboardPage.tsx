import { useAuth } from '../contexts/AuthContext'
import Card from '../components/ui/Card'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-900 mb-1">
        สวัสดี, {user?.full_name ?? user?.email}
      </h1>
      <p className="text-ink-600 mb-6">บทบาท: {user?.role}</p>

      <Card className="p-6">
        <p className="text-sm text-ink-600">
          เลือกเมนูด้านซ้ายเพื่อเริ่มใช้งานระบบ
        </p>
      </Card>
    </div>
  )
}