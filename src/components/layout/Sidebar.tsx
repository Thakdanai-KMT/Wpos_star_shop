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

export default function Sidebar() {
  const { user } = useAuth()

  const visibleItems = NAV_ITEMS.filter(
    (item) => user && item.roles.includes(user.role)
  )

  return (
    <aside className="w-56 bg-gray-900 text-gray-100 min-h-screen p-4">
      <h2 className="text-lg font-bold mb-6">Wpos Star Shop</h2>
      <nav className="flex flex-col gap-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-3 py-2 rounded text-sm ${
                isActive ? 'bg-blue-600' : 'hover:bg-gray-800'
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