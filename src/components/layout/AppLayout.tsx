import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  MANAGER: 'ผู้จัดการ',
  CASHIER: 'พนักงานขาย',
  VIEWER: 'ผู้เข้าดูข้อมูล',
}

const ROLE_BADGE_CLASS: Record<string, string> = {
  ADMIN: 'bg-gold-500/15 text-gold-600',
  MANAGER: 'bg-brand-600/10 text-brand-700',
  CASHIER: 'bg-emerald-500/10 text-emerald-700',
  VIEWER: 'bg-gray-200 text-ink-600',
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

export default function AppLayout() {
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const displayName = user?.full_name ?? user?.email ?? ''

  return (
    <div className="flex">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()} className="h-full">
            <Sidebar onNavigate={() => setIsMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 min-h-screen bg-surface">
        <header className="flex justify-between items-center gap-3 px-4 md:px-6 h-16 border-b border-black/5 bg-white sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden text-brand-900 shrink-0"
              aria-label="เปิดเมนู"
            >
              <MenuIcon />
            </button>

            {user && (
              <>
                <div className="w-9 h-9 rounded-full bg-brand-900 text-gold-500 text-xs font-semibold flex items-center justify-center shrink-0">
                  {getInitials(displayName)}
                </div>
                <div className="min-w-0 hidden sm:block">
                  <p className="text-sm text-ink-900 font-medium truncate">
                    {displayName}
                  </p>
                  <span
                    className={`inline-block text-[11px] px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE_CLASS[user.role]}`}
                  >
                    {ROLE_LABEL[user.role] ?? user.role}
                  </span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => supabase.auth.signOut()}
            className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-red-600 transition-colors shrink-0"
          >
            <LogoutIcon />
            <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}