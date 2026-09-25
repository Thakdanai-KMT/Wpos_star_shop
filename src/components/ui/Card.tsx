import type { HTMLAttributes } from 'react'

export default function Card({
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-white rounded-lg border border-black/5 ${className}`}
      {...props}
    />
  )
}