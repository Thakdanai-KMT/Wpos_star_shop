import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Input } from '../components/ui/Input'

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a20.3 20.3 0 0 1 4.22-5.06M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 11 7 11 7a20.3 20.3 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [forgotNote, setForgotNote] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    setIsLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsLoading(false)

    if (error) {
      setErrorMessage(
        error.message === 'Invalid login credentials'
          ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
          : error.message
      )
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    navigate('/')
  }

  return (
    <div className="min-h-[100dvh] relative flex items-center justify-center bg-surface px-4 py-8 overflow-hidden animate-login-fade-in">
      {/* Decoration พื้นหลังบางๆ — opacity ต่ำมาก ไม่รบกวนสายตา */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gold-400 blur-3xl pointer-events-none"
        style={{ opacity: 0.06 }}
      />
      <div
        className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-brand-600 blur-3xl pointer-events-none"
        style={{ opacity: 0.05 }}
      />

      <Card
        className={`relative w-full max-w-[420px] p-6 sm:p-9 animate-login-card-in ${
          shake ? 'animate-login-shake' : ''
        }`}
      >
        {/* Brand */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-11 h-11 rounded-xl bg-brand-900 flex items-center justify-center mb-3">
            <span className="text-gold-500 text-lg font-bold">★</span>
          </div>
          <p className="text-gold-600 text-xs font-semibold tracking-wide">
            WPOS STAR SHOP
          </p>
        </div>

        <h1 className="text-2xl font-semibold text-brand-900 text-center mb-1">
          เข้าสู่ระบบ
        </h1>
        <p className="text-sm text-ink-600 text-center mb-7">
          เข้าสู่ระบบเพื่อจัดการร้านค้า
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            id="email"
            label="อีเมล"
            type="email"
            icon={<MailIcon />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            error={!!errorMessage}
            required
          />

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="password" className="text-sm text-ink-600">
                รหัสผ่าน
              </label>
              <button
                type="button"
                onClick={() => setForgotNote((v) => !v)}
                className="text-xs text-gold-600 hover:underline"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/50 pointer-events-none">
                <LockIcon />
              </span>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className={`w-full border rounded-lg py-2.5 pl-10 pr-10 text-sm text-ink-900 bg-surface transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent ${
                  errorMessage ? 'border-red-400' : 'border-brand-100'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600/60 hover:text-brand-900"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {forgotNote && (
              <p className="text-xs text-ink-600 mt-1.5">
                กรุณาติดต่อผู้ดูแลระบบ (ADMIN) เพื่อรีเซ็ตรหัสผ่าน
              </p>
            )}
          </div>

          {errorMessage && (
            <p className="text-sm text-red-500 flex items-center gap-1.5" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
              {errorMessage}
            </p>
          )}

          <Button type="submit" disabled={isLoading} className="w-full mt-2">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeOpacity="0.25"
                  />
                  <path
                    d="M22 12a10 10 0 0 0-10-10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                กำลังเข้าสู่ระบบ...
              </span>
            ) : (
              'เข้าสู่ระบบ'
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-ink-600/70 mt-6">
          ระบบใช้งานภายในร้านเท่านั้น · Internal Use Only
        </p>
      </Card>

      <p className="absolute bottom-4 text-center text-xs text-ink-600/50">
        © Wpos Star Shop
      </p>
    </div>
  )
}