import React from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  title: string
  description: string
  icon?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-xl border border-dashed border-zinc-800 light:border-zinc-300 my-4">
      <div className="p-3 bg-zinc-800/60 light:bg-zinc-100 rounded-full text-zinc-400 light:text-zinc-600 mb-3">
        {icon || <FolderOpen className="w-8 h-8" />}
      </div>
      <h4 className="text-base font-semibold text-zinc-200 light:text-zinc-800 mb-1">{title}</h4>
      <p className="text-xs text-zinc-400 light:text-zinc-500 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
