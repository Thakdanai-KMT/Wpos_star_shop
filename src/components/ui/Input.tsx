
import type {
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: ReactNode
  error?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: boolean
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: boolean
}

const SELECT_ARROW: CSSProperties = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  backgroundSize: '1rem',
}

export function Input({
  label,
  className = '',
  id,
  icon,
  error = false,
  ...props
}: InputProps) {
  const errorId = id ? `${id}-error` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm text-ink-600">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/50">
            {icon}
          </span>
        )}

        <input
          {...props}
          id={id}
          aria-invalid={error || undefined}
          aria-describedby={error ? errorId : props['aria-describedby']}
          className={`w-full rounded-lg border bg-surface py-2.5 text-sm text-ink-900 transition-colors duration-150 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gold-400 disabled:bg-gray-50 disabled:text-ink-600 ${
            error ? 'border-red-400' : 'border-brand-100'
          } ${icon ? 'pl-10 pr-3' : 'px-3'} ${className}`}
        />

        {error && (
          <p id={errorId} className="mt-1 text-xs text-red-600">
            กรุณาตรวจสอบข้อมูลนี้
          </p>
        )}
      </div>
    </div>
  )
}

export function Select({
  label,
  className = '',
  id,
  children,
  error = false,
  ...props
}: SelectProps) {
  const errorId = id ? `${id}-error` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm text-ink-600">
          {label}
        </label>
      )}

      <select
        {...props}
        id={id}
        style={{ ...SELECT_ARROW, ...props.style }}
        aria-invalid={error || undefined}
        aria-describedby={error ? errorId : props['aria-describedby']}
        className={`w-full appearance-none rounded-lg border bg-surface px-3 py-2.5 pr-10 text-sm text-ink-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gold-400 disabled:bg-gray-50 disabled:text-ink-600 ${
          error ? 'border-red-400' : 'border-brand-100'
        } ${className}`}
      >
        {children}
      </select>

      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          กรุณาเลือกข้อมูล
        </p>
      )}
    </div>
  )
}

export function Textarea({
  label,
  className = '',
  id,
  error = false,
  ...props
}: TextareaProps) {
  const errorId = id ? `${id}-error` : undefined

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm text-ink-600">
          {label}
        </label>
      )}

      <textarea
        {...props}
        id={id}
        aria-invalid={error || undefined}
        aria-describedby={error ? errorId : props['aria-describedby']}
        className={`w-full rounded-lg border bg-surface px-3 py-2 text-sm text-ink-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-gold-400 disabled:bg-gray-50 disabled:text-ink-600 ${
          error ? 'border-red-400' : 'border-brand-100'
        } ${className}`}
      />

      {error && (
        <p id={errorId} className="mt-1 text-xs text-red-600">
          กรุณาตรวจสอบข้อมูลนี้
        </p>
      )}
    </div>
  )
}
