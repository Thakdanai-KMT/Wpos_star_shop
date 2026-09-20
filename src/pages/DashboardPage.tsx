import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
      <p>สวัสดี {user?.full_name ?? user?.email}</p>
      <p>Role: {user?.role}</p>
      <button
        onClick={() => supabase.auth.signOut()}
        className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  )
}