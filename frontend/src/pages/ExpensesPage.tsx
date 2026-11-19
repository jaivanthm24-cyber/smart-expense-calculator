import React, { useEffect, useState, useCallback } from 'react'
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Download,
} from 'lucide-react'
import { financeService } from '@/services/financeService'
import { Expense, Category } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { ExpenseModal } from '@/components/modals/ExpenseModal'
import { useAuth } from '@/context/AuthContext'

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [totalAmount, setTotalAmount] = useState('0.00')
  const [totalCount, setTotalCount] = useState(0)

  // Query filters
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [page, setPage] = useState(1)
  const pageSize = 15

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  const fetchExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const res = await financeService.getExpenses({
        search: search || undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
        payment_method: paymentMethod || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page,
        page_size: pageSize,
      })
      setExpenses(res.items)
      setTotalCount(res.total)
      setTotalAmount(res.total_amount)
    } catch (err) {
      console.error('Failed to fetch expenses:', err)
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, paymentMethod, startDate, endDate, sortBy, sortOrder, page])

  useEffect(() => {
    financeService.getCategories('expense').then(setCategories).catch(console.error)
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense record?')) return
    try {
      await financeService.deleteExpense(id)
      fetchExpenses()
    } catch (err) {
      console.error('Failed to delete expense:', err)
    }
  }

  const handleEdit = (exp: Expense) => {
    setSelectedExpense(exp)
    setIsModalOpen(true)
  }

  const handleCreateNew = () => {
    setSelectedExpense(null)
    setIsModalOpen(true)
  }

  const currency = user?.currency || 'USD'
  const totalPages = Math.ceil(totalCount / pageSize) || 1

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
            Expense Management
          </h1>
          <p className="text-xs text-zinc-400 light:text-zinc-500 mt-0.5">
            Log, filter, and audit every expenditure with category breakdowns.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleCreateNew}
            icon={<Plus className="h-4 w-4" />}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Input
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              leftIcon={<Search className="w-4 h-4" />}
            />

            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <Select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value)
                setPage(1)
              }}
            >
              <option value="">All Payment Methods</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="UPI">UPI / Online</option>
              <option value="Other">Other</option>
            </Select>

            <div className="flex items-center gap-2">
              <Select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSortBy(field)
                  setSortOrder(order)
                }}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="amount-desc">Highest Amount</option>
                <option value="amount-asc">Lowest Amount</option>
                <option value="title-asc">Title (A-Z)</option>
              </Select>
            </div>
          </div>

          {/* Date range filters */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-800/60 light:border-zinc-200 text-xs text-zinc-400">
            <span>Filter Dates:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100 light:border-zinc-300 light:bg-white light:text-zinc-900"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setPage(1)
              }}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100 light:border-zinc-300 light:bg-white light:text-zinc-900"
            />
            {(search || categoryId || paymentMethod || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setCategoryId('')
                  setPaymentMethod('')
                  setStartDate('')
                  setEndDate('')
                  setPage(1)
                }}
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Expense Summary Header */}
      <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
        <span>
          Showing <strong className="text-zinc-200 light:text-zinc-800">{expenses.length}</strong> of{' '}
          <strong className="text-zinc-200 light:text-zinc-800">{totalCount}</strong> items
        </span>
        <span>
          Total Filtered Spending:{' '}
          <strong className="text-base font-bold text-rose-400">
            {formatCurrency(totalAmount, currency)}
          </strong>
        </span>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <LoadingSpinner message="Loading expense ledger..." />
          ) : expenses.length === 0 ? (
            <EmptyState
              title="No expenses found"
              description="No expense records match your active query. Record a new expense to update your ledger."
              actionLabel="Add Expense"
              onAction={handleCreateNew}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 light:border-zinc-200 light:bg-zinc-100/60">
                    <th className="py-3 px-4 font-medium">Expense Title</th>
                    <th className="py-3 px-4 font-medium">Category</th>
                    <th className="py-3 px-4 font-medium">Method</th>
                    <th className="py-3 px-4 font-medium">Date</th>
                    <th className="py-3 px-4 font-medium text-right">Amount</th>
                    <th className="py-3 px-4 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50 light:divide-zinc-200">
                  {expenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="hover:bg-zinc-800/30 light:hover:bg-zinc-50 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-zinc-100 light:text-zinc-900">
                        <div>{exp.title}</div>
                        {exp.description && (
                          <div className="text-[11px] text-zinc-400 truncate max-w-xs">
                            {exp.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                          style={{
                            backgroundColor: `${exp.category?.color || '#ef4444'}18`,
                            color: exp.category?.color || '#ef4444',
                          }}
                        >
                          {exp.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-400">{exp.payment_method}</td>
                      <td className="py-3 px-4 text-zinc-400">{formatDate(exp.date)}</td>
                      <td className="py-3 px-4 text-right font-semibold text-rose-400">
                        -{formatCurrency(exp.amount, currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(exp)}
                            className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 light:hover:bg-zinc-200"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-zinc-800 p-4 text-xs text-zinc-400 light:border-zinc-200">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExpenses}
        expenseToEdit={selectedExpense}
      />
    </div>
  )
}
