import React from 'react'
import { cn } from '@/utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', children, ...props }) => {
  const variants = {
    default: 'bg-zinc-800 text-zinc-300 border-zinc-700 light:bg-zinc-100 light:text-zinc-800 light:border-zinc-200',
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60 light:bg-emerald-50 light:text-emerald-700 light:border-emerald-200',
    warning: 'bg-amber-950/60 text-amber-400 border-amber-800/60 light:bg-amber-50 light:text-amber-700 light:border-amber-200',
    danger: 'bg-rose-950/60 text-rose-400 border-rose-800/60 light:bg-rose-50 light:text-rose-700 light:border-rose-200',
    info: 'bg-blue-950/60 text-blue-400 border-blue-800/60 light:bg-blue-50 light:text-blue-700 light:border-blue-200',
    outline: 'border border-zinc-700 text-zinc-300 light:border-zinc-300 light:text-zinc-700',
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
