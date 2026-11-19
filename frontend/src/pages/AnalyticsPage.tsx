import React, { useEffect, useState, useCallback } from 'react'
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  PieChart as PieIcon,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import { financeService } from '@/services/financeService'
import { AnalyticsOverviewResponse } from '@/types'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/context/AuthContext'

const PRESETS = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
]

export const AnalyticsPage: React.FC = () => {
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState('this_month')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const res = await financeService.getAnalyticsOverview(preset)
      setData(res)
    } catch (err) {
      console.error('Failed to load analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [preset])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const currency = user?.currency || 'USD'

  // Weekly patterns chart data
  const weeklyChartData =
    data?.weekly_spending_patterns.map((item) => ({
      day: item.day_of_week.slice(0, 3),
      Spending: parseFloat(item.total_amount),
      Average: parseFloat(item.average_amount),
    })) || []

  // Monthly trends chart data
  const trendsChartData =
    data?.monthly_trends.map((item) => ({
      month: item.month,
      Income: parseFloat(item.income),
      Expenses: parseFloat(item.expenses),
      SavingsRate: item.net_savings_rate,
    })) || []

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
            Financial Analytics & Patterns
          </h1>
          <p className="text-xs text-zinc-400 light:text-zinc-500 mt-0.5">
            Deep dive into weekly spending habits, daily averages, and period-over-period delta.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 light:border-zinc-200 light:bg-zinc-100">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                preset === p.value
                  ? 'bg-emerald-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-100 light:text-zinc-600'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !data ? (
        <LoadingSpinner message="Crunching analytical patterns and trends..." />
      ) : (
        <>
          {/* Top 4 Insight Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-zinc-400 font-medium">Average Daily Spending</span>
                <p className="text-2xl font-bold text-zinc-100 light:text-zinc-900 mt-2">
                  {formatCurrency(data?.average_daily_spending, currency)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Based on days in period</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-zinc-400 font-medium">Savings Percentage</span>
                <p className="text-2xl font-bold text-emerald-400 mt-2">
                  {formatPercentage(data?.savings_rate_pct)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Income retained after expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-zinc-400 font-medium">Highest Spending Day</span>
                <p className="text-xl font-bold text-rose-400 mt-2">
                  {data?.highest_expense_day?.day_name || 'None'}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {data?.highest_expense_day?.amount
                    ? formatCurrency(data.highest_expense_day.amount, currency)
                    : '$0.00'}{' '}
                  peak spend
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-zinc-400 font-medium">Top Category Volume</span>
                <p className="text-xl font-bold text-zinc-100 light:text-zinc-900 mt-2 truncate">
                  {data?.highest_expense_category || 'Uncategorized'}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Largest financial outflow</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekly Spending Patterns Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Spending Patterns</CardTitle>
                <p className="text-xs text-zinc-400">Total spending distributed by day of week</p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="day" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                        }}
                        formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Spending']}
                      />
                      <Bar dataKey="Spending" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Savings Rate Trends Line Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Historical Savings Rate Trend</CardTitle>
                <p className="text-xs text-zinc-400">Net savings efficiency trajectory (%)</p>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendsChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="month" stroke="#71717a" fontSize={11} tickLine={false} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} unit="%" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#18181b',
                          borderColor: '#27272a',
                          borderRadius: '0.5rem',
                          fontSize: '0.75rem',
                        }}
                        formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Savings Rate']}
                      />
                      <Line
                        type="monotone"
                        dataKey="SavingsRate"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Period-Over-Period Comparisons Table */}
          <Card>
            <CardHeader>
              <CardTitle>Period-Over-Period Comparison</CardTitle>
              <p className="text-xs text-zinc-400">
                Performance deltas compared against previous timeframe
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 light:border-zinc-200">
                      <th className="py-2.5 font-medium">Metric</th>
                      <th className="py-2.5 font-medium text-right">Current Period</th>
                      <th className="py-2.5 font-medium text-right">Previous Period</th>
                      <th className="py-2.5 font-medium text-right">Change ($)</th>
                      <th className="py-2.5 font-medium text-right">Trend (% Delta)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 light:divide-zinc-200">
                    {data?.comparisons.map((c) => {
                      const isUp = c.trend === 'up'
                      const isExpense = c.metric === 'Total Expenses'
                      const positiveForUser = isExpense ? !isUp : isUp
                      return (
                        <tr key={c.metric} className="hover:bg-zinc-800/20 light:hover:bg-zinc-50">
                          <td className="py-3 font-semibold text-zinc-100 light:text-zinc-900">
                            {c.metric}
                          </td>
                          <td className="py-3 text-right font-medium">
                            {formatCurrency(c.current_period, currency)}
                          </td>
                          <td className="py-3 text-right text-zinc-400">
                            {formatCurrency(c.previous_period, currency)}
                          </td>
                          <td
                            className={`py-3 text-right font-semibold ${
                              positiveForUser ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {Number(c.change_amount) > 0 ? '+' : ''}
                            {formatCurrency(c.change_amount, currency)}
                          </td>
                          <td className="py-3 text-right">
                            <span
                              className={`inline-flex items-center gap-1 font-semibold ${
                                positiveForUser ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {isUp ? (
                                <TrendingUp className="w-3.5 h-3.5" />
                              ) : (
                                <TrendingDown className="w-3.5 h-3.5" />
                              )}
                              {c.change_percentage > 0 ? '+' : ''}
                              {c.change_percentage}%
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
