import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  icon?: ReactNode
  error?: boolean
}

export function Input({
  label,
  className = '',
  id,
  icon,
  error,
  ...props
}: InputProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm text-ink-600 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/50 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={id}
          className={`w-full border rounded-lg py-2.5 text-sm text-ink-900 bg-surface transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent disabled:bg-gray-50 disabled:text-ink-600 ${
            error ? 'border-red-400' : 'border-brand-100'
          } ${icon ? 'pl-10 pr-3' : 'px-3'} ${className}`}
          {...props}
        />
      </div>
    </div>
  )
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export function Select({
  label,
  className = '',
  id,
  children,
  ...props
}: SelectProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm text-ink-600 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`border border-brand-100 rounded-lg px-3 py-2 text-sm text-ink-900 focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-transparent disabled:bg-gray-50 ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  )
}