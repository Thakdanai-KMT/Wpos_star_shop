import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function AppLayout() {
  const { user } = useAuth()

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <header className="flex justify-between items-center px-6 py-3 border-b bg-white">
          <span className="text-sm text-gray-600">
            {user?.full_name ?? user?.email} ({user?.role})
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-red-600 hover:underline"
          >
            Logout
          </button>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}