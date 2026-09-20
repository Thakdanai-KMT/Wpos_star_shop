import { supabase } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export class ApiError extends Error {
  statusCode: number
  error: string

  constructor(statusCode: number, message: string, error: string) {
    super(message)
    this.statusCode = statusCode
    this.error = error
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token

  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    await supabase.auth.signOut()
    window.location.href = '/login'
    throw new ApiError(401, 'Session expired', 'Unauthorized')
  }

  const body = await response.json()

  if (!response.ok) {
    throw new ApiError(
      body.statusCode ?? response.status,
      body.message ?? 'Something went wrong',
      body.error ?? 'Error'
    )
  }

  return body as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}