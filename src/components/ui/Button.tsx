import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary:
    'bg-gold-500 text-brand-900 hover:bg-gold-400 font-medium',
  secondary:
    'bg-white text-brand-900 border border-brand-100 hover:bg-brand-50',
  danger:
    'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  ghost: 'text-ink-600 hover:text-brand-900',
}

export default function Button({
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
          className={`px-4 py-2 rounded-lg text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0 ${
        variant === 'primary' ? 'hover:-translate-y-0.5 hover:shadow-md' : ''
      } ${VARIANT_CLASS[variant]} ${className}`}
      {...props}
    />
  )
}