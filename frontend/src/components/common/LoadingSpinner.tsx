import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

export const LoadingSpinner: React.FC<{ message?: string; className?: string }> = ({
  message = 'Loading financial data...',
  className,
}) => (
  <div className={cn('flex flex-col items-center justify-center p-12 space-y-3', className)}>
    <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    <p className="text-xs text-zinc-400 light:text-zinc-500 font-medium">{message}</p>
  </div>
)
