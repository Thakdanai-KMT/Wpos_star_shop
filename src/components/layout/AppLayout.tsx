import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function AppLayout() {
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

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

      <div className="flex-1 min-w-0">
        <header className="flex justify-between items-center px-4 md:px-6 py-3.5 border-b border-black/5 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(true)}
              className="md:hidden text-2xl leading-none text-brand-900"
              aria-label="เปิดเมนู"
            >
              ☰
            </button>
            <div className="text-sm truncate">
              <span className="text-ink-900 font-medium">
                {user?.full_name ?? user?.email}
              </span>
              <span className="text-ink-600 ml-1.5">({user?.role})</span>
            </div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-ink-600 hover:text-brand-900 transition-colors shrink-0"
          >
            ออกจากระบบ
          </button>
        </header>
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}