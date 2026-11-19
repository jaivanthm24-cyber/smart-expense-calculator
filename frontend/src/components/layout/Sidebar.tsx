import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  ArrowDownLeft,
  PiggyBank,
  Target,
  BarChart3,
  Lightbulb,
  FileSpreadsheet,
  User,
  LogOut,
  X,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { cn } from '@/utils/cn'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth()

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Income', path: '/income', icon: ArrowDownLeft },
    { name: 'Smart Budgets', path: '/budgets', icon: PiggyBank },
    { name: 'Savings Goals', path: '/savings', icon: Target },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Smart Insights', path: '/insights', icon: Lightbulb },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          'light:border-zinc-200 light:bg-white light:text-zinc-900',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-800 light:border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white light:text-zinc-900">
                Smart Expense
              </span>
              <span className="block text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
                Finance Pro
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 lg:hidden light:hover:bg-zinc-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 light:text-zinc-600 light:hover:bg-zinc-100 light:hover:text-zinc-900'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </div>

        {/* User Profile & Logout */}
        <div className="border-t border-zinc-800 light:border-zinc-200 p-4">
          <NavLink
            to="/profile"
            onClick={() => onClose()}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium mb-1 transition-colors',
                isActive
                  ? 'bg-zinc-800 text-white light:bg-zinc-100 light:text-zinc-900'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 light:text-zinc-600 light:hover:bg-zinc-100'
              )
            }
          >
            <User className="h-4 w-4 shrink-0" />
            <div className="flex-1 truncate">
              <p className="truncate font-medium">{user?.full_name || 'My Profile'}</p>
              <p className="truncate text-[10px] text-zinc-400">{user?.email}</p>
            </div>
          </NavLink>
          <button
            onClick={() => logout()}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
