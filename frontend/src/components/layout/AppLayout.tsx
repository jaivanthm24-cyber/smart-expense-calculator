import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { ExpenseModal } from '@/components/modals/ExpenseModal'
import { IncomeModal } from '@/components/modals/IncomeModal'

export const AppLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)

  const handleGlobalRefresh = () => {
    // Dispatch custom event so active pages re-fetch immediately
    window.dispatchEvent(new CustomEvent('finance_data_updated'))
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 light:bg-zinc-50 light:text-zinc-900 transition-colors">
      {/* Sidebar navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main content body */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onQuickAddExpense={() => setIsExpenseModalOpen(true)}
          onQuickAddIncome={() => setIsIncomeModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Global Quick Add Modals */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSuccess={handleGlobalRefresh}
      />

      <IncomeModal
        isOpen={isIncomeModalOpen}
        onClose={() => setIsIncomeModalOpen(false)}
        onSuccess={handleGlobalRefresh}
      />
    </div>
  )
}
