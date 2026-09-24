import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../types/auth'

interface NavItem {
  label: string
  path: string
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'ขายสินค้า', path: '/pos', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { label: 'สินค้า', path: '/products', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'หมวดหมู่', path: '/categories', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'สต็อก', path: '/inventory', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'ประวัติการขาย', path: '/sales', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'ลูกค้า', path: '/customers', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'โปรโมชั่น', path: '/promotions', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
  { label: 'รายงาน', path: '/reports', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Audit Logs', path: '/audit-logs', roles: ['ADMIN'] },
  { label: 'ตั้งค่า', path: '/settings', roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'] },
]

interface SidebarProps {
  onNavigate?: () => void
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const { user } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <aside className="w-64 bg-brand-900 text-white/90 min-h-screen flex flex-col">
      <div className="px-5 py-6 border-b border-white/10">
        <p className="text-gold-500 text-xs font-semibold tracking-wide">
          WPOS STAR SHOP
        </p>
        <p className="text-white text-sm mt-0.5">ระบบจัดการร้านค้า</p>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 p-3">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-gold-500 text-brand-900 font-medium'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}