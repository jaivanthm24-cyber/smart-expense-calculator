import React, { useEffect, useState, useCallback } from 'react'
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Trash2,
  Calendar,
  Wallet,
} from 'lucide-react'
import { financeService } from '@/services/financeService'
import { BudgetOverviewResponse, BudgetStatusItem } from '@/types'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { BudgetModal } from '@/components/modals/BudgetModal'
import { useAuth } from '@/context/AuthContext'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const BudgetsPage: React.FC = () => {
  const { user } = useAuth()
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(today.getFullYear())
  const [overview, setOverview] = useState<BudgetOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [budgetToEdit, setBudgetToEdit] = useState<BudgetStatusItem | null>(null)

  const fetchBudgets = useCallback(async () => {
    setLoading(true)
    try {
      const res = await financeService.getBudgetsOverview(selectedMonth, selectedYear)
      setOverview(res)
    } catch (err) {
      console.error('Failed to fetch budgets:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, selectedYear])

  useEffect(() => {
    fetchBudgets()
  }, [fetchBudgets])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this budget limit?')) return
    try {
      await financeService.deleteBudget(id)
      fetchBudgets()
    } catch (err) {
      console.error('Failed to delete budget:', err)
    }
  }

  const handleEdit = (b: BudgetStatusItem) => {
    setBudgetToEdit(b)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setBudgetToEdit(null)
    setIsModalOpen(true)
  }

  const currency = user?.currency || 'USD'
  const overallBudget = overview?.budgets.find((b) => b.is_overall)
  const categoryBudgets = overview?.budgets.filter((b) => !b.is_overall) || []

  return (
    <div className="space-y-6">
      {/* Top Header & Month Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
            Smart Budget Management
          </h1>
          <p className="text-xs text-zinc-400 light:text-zinc-500 mt-0.5">
            Set overall & category spending caps with automated 80% and 100% threshold alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Month & Year Selectors */}
          <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 light:border-zinc-200 light:bg-zinc-100 text-xs">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-zinc-100 font-medium px-2 py-1 focus:outline-none cursor-pointer light:text-zinc-900"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1} className="bg-zinc-900 text-white light:bg-white light:text-zinc-900">
                  {m}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-zinc-100 font-medium px-2 py-1 focus:outline-none cursor-pointer light:text-zinc-900 border-l border-zinc-700/60 light:border-zinc-300"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="bg-zinc-900 text-white light:bg-white light:text-zinc-900">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <Button size="sm" onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
            Set Budget
          </Button>
        </div>
      </div>

      {loading && !overview ? (
        <LoadingSpinner message="Evaluating budget utilization and warnings..." />
      ) : (
        <>
          {/* Overall Monthly Budget Hero Card */}
          <Card className="border-emerald-500/20 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 light:from-white light:to-zinc-50">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">
                      Overall Monthly Allocation
                    </span>
                    {overview?.is_overall_exceeded ? (
                      <Badge variant="danger">Exceeded</Badge>
                    ) : overview?.is_overall_warning ? (
                      <Badge variant="warning">80% Warning</Badge>
                    ) : (
                      <Badge variant="success">On Track</Badge>
                    )}
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-100 light:text-zinc-900 mt-2">
                    {formatCurrency(overview?.total_budget, currency)}{' '}
                    <span className="text-xs font-normal text-zinc-400">
                      budget for {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
                    </span>
                  </h2>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-xs text-zinc-400">Total Spent</span>
                    <p className="text-lg font-bold text-rose-400">
                      {formatCurrency(overview?.total_spent, currency)}
                    </p>
                  </div>
                  <div className="border-l border-zinc-800 light:border-zinc-200 pl-6">
                    <span className="text-xs text-zinc-400">Remaining</span>
                    <p
                      className={`text-lg font-bold ${
                        Number(overview?.total_remaining || 0) < 0
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {formatCurrency(overview?.total_remaining, currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Utilization: {overview?.overall_utilization_pct || 0}%</span>
                  <span>
                    Allowance remaining:{' '}
                    <strong className="text-zinc-200 light:text-zinc-800">
                      {formatCurrency(overview?.total_remaining, currency)}
                    </strong>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-zinc-800 light:bg-zinc-200 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (overview?.overall_utilization_pct || 0) > 100
                        ? 'bg-rose-500'
                        : (overview?.overall_utilization_pct || 0) >= 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${Math.min(100, overview?.overall_utilization_pct || 0)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Budgets Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-100 light:text-zinc-900">
                Category Spending Budgets
              </h3>
              <span className="text-xs text-zinc-400">
                {categoryBudgets.length} configured categories
              </span>
            </div>

            {categoryBudgets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 light:border-zinc-300 p-8 text-center text-xs text-zinc-400">
                No category-specific budgets set for this month. Click "Set Budget" above to assign
                targets for Food, Rent, Travel, etc.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryBudgets.map((b) => (
                  <Card key={b.id} className="hover:border-zinc-700 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: b.category_color || '#3b82f6' }}
                            />
                            <h4 className="text-sm font-semibold text-zinc-100 light:text-zinc-900">
                              {b.category_name}
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-400 mt-1">
                            Budget: <strong>{formatCurrency(b.budget_amount, currency)}</strong>
                          </p>
                        </div>

                        <Badge
                          variant={
                            b.status === 'exceeded'
                              ? 'danger'
                              : b.status === 'warning'
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {b.utilization_percentage}%
                        </Badge>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-4 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400">
                          <span>Spent: {formatCurrency(b.spent_amount, currency)}</span>
                          <span
                            className={
                              Number(b.remaining_amount) < 0 ? 'text-rose-400 font-semibold' : ''
                            }
                          >
                            Left: {formatCurrency(b.remaining_amount, currency)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800 light:bg-zinc-200 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              b.status === 'exceeded'
                                ? 'bg-rose-500'
                                : b.status === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, b.utilization_percentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* Month over Month change if available */}
                      <div className="mt-4 flex items-center justify-between border-t border-zinc-800/60 light:border-zinc-200 pt-3 text-[11px] text-zinc-400">
                        {b.month_over_month_change_pct !== null &&
                        b.month_over_month_change_pct !== undefined ? (
                          <div className="flex items-center gap-1">
                            {b.month_over_month_change_pct > 0 ? (
                              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <span
                              className={
                                b.month_over_month_change_pct > 0
                                  ? 'text-rose-400 font-medium'
                                  : 'text-emerald-400 font-medium'
                              }
                            >
                              {b.month_over_month_change_pct > 0 ? '+' : ''}
                              {b.month_over_month_change_pct}% vs last mo
                            </span>
                          </div>
                        ) : (
                          <span>No previous data</span>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(b)}
                            className="text-zinc-400 hover:text-zinc-100 text-xs px-2 py-0.5 rounded hover:bg-zinc-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(b.id)}
                            className="text-zinc-400 hover:text-rose-400 text-xs px-2 py-0.5 rounded hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBudgets}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
        budgetToEdit={budgetToEdit}
      />
    </div>
  )
}
