import { useEffect, useState } from 'react'
import { apiClient } from '../lib/api-client'
import type { AppUser } from '../types/user'

export function useUsers() {
  const [users, setUsers] = useState<AppUser[]>([])

  useEffect(() => {
    apiClient
      .get<{ data: AppUser[] }>('/users')
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]))
  }, [])

  return { users }
}