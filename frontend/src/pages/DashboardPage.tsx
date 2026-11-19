import React, { useEffect, useState, useCallback } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  AlertTriangle,
  Receipt,
  Plus,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { financeService } from '@/services/financeService'
import { DashboardSummaryResponse } from '@/types'
import { formatCurrency, formatPercentage, formatDate } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/context/AuthContext'
import { Link } from 'react-router-dom'

const PRESET_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
]

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b']

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardSummaryResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [preset, setPreset] = useState<string>('this_month')
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const [isCustomDate, setIsCustomDate] = useState<boolean>(false)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    try {
      const res = await financeService.getDashboardSummary(
        isCustomDate ? 'custom' : preset,
        isCustomDate ? customStart : undefined,
        isCustomDate ? customEnd : undefined
      )
      setData(res)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [preset, isCustomDate, customStart, customEnd])

  useEffect(() => {
    fetchDashboard()

    const handleUpdate = () => fetchDashboard()
    window.addEventListener('finance_data_updated', handleUpdate)
    return () => window.removeEventListener('finance_data_updated', handleUpdate)
  }, [fetchDashboard])

  if (loading && !data) {
    return <LoadingSpinner message="Calculating your real-time finances..." />
  }

  const currency = user?.currency || 'USD'

  // Prepare Pie Chart data with safe numbers
  const pieData =
    data?.expense_category_breakdown.map((item, idx) => ({
      name: item.category_name,
      value: parseFloat(item.total_amount),
      color: item.color || PIE_COLORS[idx % PIE_COLORS.length],
    })) || []

  // Prepare Area Chart data
  const chartData =
    data?.income_vs_expense_chart.map((item) => ({
      month: item.month,
      Income: parseFloat(item.income),
      Expenses: parseFloat(item.expenses),
      Savings: parseFloat(item.savings),
    })) || []

  return (
    <div className="space-y-6">
      {/* Top Welcome & Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Investor'} 👋
          </h1>
          <p className="text-xs text-zinc-400 light:text-zinc-500 mt-0.5">
            Real-time audit of your income, expenses, budgets, and savings goals.
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 light:border-zinc-200 light:bg-zinc-100">
          {PRESET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setIsCustomDate(false)
                setPreset(opt.value)
              }}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                !isCustomDate && preset === opt.value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-100 light:text-zinc-600 light:hover:text-zinc-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setIsCustomDate(!isCustomDate)}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
              isCustomDate
                ? 'bg-emerald-600 text-white'
                : 'text-zinc-400 hover:text-zinc-100 light:text-zinc-600'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Custom</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Picker Dropdown */}
      {isCustomDate && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 light:border-zinc-200 light:bg-white">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">From:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 light:border-zinc-300 light:bg-white light:text-zinc-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">To:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 light:border-zinc-300 light:bg-white light:text-zinc-900"
            />
          </div>
          <Button size="sm" onClick={fetchDashboard} disabled={!customStart || !customEnd}>
            Apply Range
          </Button>
        </div>
      )}

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <Card className="hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Total Income</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
                {formatCurrency(data?.total_income, currency)}
              </span>
              <p className="text-[11px] text-zinc-400 mt-1">In selected timeframe</p>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card className="hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Total Expenses</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                <ArrowDownRight className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
                {formatCurrency(data?.total_expenses, currency)}
              </span>
              <p className="text-[11px] text-zinc-400 mt-1">In selected timeframe</p>
            </div>
          </CardContent>
        </Card>

        {/* Current Net Balance */}
        <Card className="hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Net Balance</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
                {formatCurrency(data?.current_balance, currency)}
              </span>
              <Badge variant={Number(data?.current_balance || 0) >= 0 ? 'success' : 'danger'}>
                {formatPercentage(data?.savings_rate_pct)} saved
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Savings Accumulated */}
        <Card className="hover:border-zinc-700 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Total Savings Goals</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                <PiggyBank className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
                {formatCurrency(data?.total_savings, currency)}
              </span>
              <p className="text-[11px] text-zinc-400 mt-1">Active goal balances</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Monthly Spending & Budget Utilization */}
        <Card className="md:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-medium text-zinc-400">Monthly Budget Utilization</span>
                <p className="text-lg font-bold text-zinc-100 light:text-zinc-900 mt-0.5">
                  {formatCurrency(data?.monthly_spending, currency)}{' '}
                  <span className="text-xs font-normal text-zinc-400">spent this month</span>
                </p>
              </div>
              <Badge
                variant={
                  (data?.monthly_budget_utilization_pct || 0) > 100
                    ? 'danger'
                    : (data?.monthly_budget_utilization_pct || 0) >= 80
                    ? 'warning'
                    : 'success'
                }
              >
                {data?.monthly_budget_utilization_pct || 0}% used
              </Badge>
            </div>
            {/* Progress Bar */}
            <div className="h-2 w-full rounded-full bg-zinc-800 light:bg-zinc-200 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  (data?.monthly_budget_utilization_pct || 0) > 100
                    ? 'bg-rose-500'
                    : (data?.monthly_budget_utilization_pct || 0) >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, data?.monthly_budget_utilization_pct || 0)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-400">
              <span>0%</span>
              <span>80% Alert Threshold</span>
              <span>100% Target</span>
            </div>
          </CardContent>
        </Card>

        {/* Highest Spending Category */}
        <Card>
          <CardContent className="p-5 flex flex-col justify-between h-full">
            <div>
              <span className="text-xs font-medium text-zinc-400">Top Expense Category</span>
              <p className="text-lg font-bold text-zinc-100 light:text-zinc-900 mt-1 truncate">
                {data?.highest_spending_category || 'No expenses logged'}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-zinc-800 light:border-zinc-200 pt-3">
              <span className="text-xs text-zinc-400">Total in Category:</span>
              <span className="text-sm font-semibold text-rose-400">
                {formatCurrency(data?.highest_spending_amount, currency)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses Trend Area Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Income vs Expenses Trend</CardTitle>
            <p className="text-xs text-zinc-400">6-Month historical financial trajectory</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                      }}
                      formatter={(val: any) => [`$${Number(val).toFixed(2)}`, '']}
                    />
                    <Area
                      type="monotone"
                      dataKey="Income"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#incomeGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="Expenses"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#expenseGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                  No monthly trend records yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Expense Category Breakdown Donut */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Distribution</CardTitle>
            <p className="text-xs text-zinc-400">Spending by category</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-72 w-full flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#18181b',
                        borderColor: '#27272a',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                      }}
                      formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Spent']}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '0.70rem', paddingTop: '10px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-xs text-zinc-500">
                  No expenses recorded in this period.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Transactions</CardTitle>
            <p className="text-xs text-zinc-400">Audited financial entries</p>
          </div>
          <Link to="/expenses">
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data?.recent_transactions && data.recent_transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 light:border-zinc-200 text-zinc-400 pb-2">
                    <th className="py-2.5 font-medium">Description</th>
                    <th className="py-2.5 font-medium">Category</th>
                    <th className="py-2.5 font-medium">Method</th>
                    <th className="py-2.5 font-medium">Date</th>
                    <th className="py-2.5 font-medium text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 light:divide-zinc-200">
                  {data.recent_transactions.map((txn) => {
                    const isIncome = txn.type === 'income'
                    return (
                      <tr key={`${txn.type}-${txn.id}`} className="hover:bg-zinc-800/30 light:hover:bg-zinc-100 transition-colors">
                        <td className="py-3 font-medium text-zinc-100 light:text-zinc-900">
                          {txn.title}
                        </td>
                        <td className="py-3">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                            style={{
                              backgroundColor: `${txn.category_color}18`,
                              color: txn.category_color,
                            }}
                          >
                            {txn.category_name}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-400">{txn.payment_method}</td>
                        <td className="py-3 text-zinc-400">{formatDate(txn.date)}</td>
                        <td
                          className={`py-3 text-right font-semibold ${
                            isIncome ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {formatCurrency(txn.amount, currency)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-500">
              No transactions recorded yet. Click '+ Add Expense' or 'Income' above to start tracking.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
