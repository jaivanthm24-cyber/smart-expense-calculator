import React from 'react'
import { Menu, Sun, Moon, Plus, ArrowDownLeft, Receipt } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/common/Button'

interface HeaderProps {
  onOpenSidebar: () => void
  onQuickAddExpense?: () => void
  onQuickAddIncome?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSidebar,
  onQuickAddExpense,
  onQuickAddIncome,
}) => {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 sm:px-6 backdrop-blur-md light:border-zinc-200 light:bg-white/80 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 lg:hidden light:hover:bg-zinc-100 light:hover:text-zinc-900"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
            {user?.currency || 'USD'}
          </span>
          <span className="text-xs text-zinc-400">Personal Account</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {onQuickAddIncome && (
          <Button
            variant="outline"
            size="sm"
            onClick={onQuickAddIncome}
            icon={<ArrowDownLeft className="h-3.5 w-3.5 text-emerald-400" />}
            className="hidden sm:inline-flex"
          >
            Income
          </Button>
        )}
        {onQuickAddExpense && (
          <Button
            variant="primary"
            size="sm"
            onClick={onQuickAddExpense}
            icon={<Plus className="h-3.5 w-3.5" />}
          >
            Add Expense
          </Button>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white light:border-zinc-200 light:bg-zinc-100 light:text-zinc-700 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User avatar badge */}
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-xs font-semibold text-white shadow-sm">
          {getInitials(user?.full_name)}
        </div>
      </div>
    </header>
  )
}
