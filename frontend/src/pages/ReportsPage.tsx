import React, { useEffect, useState, useCallback } from 'react'
import {
  FileSpreadsheet,
  Download,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  CheckCircle,
} from 'lucide-react'
import { financeService } from '@/services/financeService'
import { FinancialPeriodReport } from '@/types'
import { formatCurrency, formatPercentage } from '@/utils/formatters'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/context/AuthContext'

const PRESET_OPTIONS = [
  { label: 'This Month', value: 'this_month' },
  { label: 'Last Month', value: 'last_month' },
  { label: 'This Year', value: 'this_year' },
]

export const ReportsPage: React.FC = () => {
  const { user } = useAuth()
  const [report, setReport] = useState<FinancialPeriodReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState('this_month')
  const [isExportingCSV, setIsExportingCSV] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await financeService.getPeriodReport(preset)
      setReport(res)
    } catch (err) {
      console.error('Failed to load report:', err)
    } finally {
      setLoading(false)
    }
  }, [preset])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleDownloadCSV = async () => {
    setIsExportingCSV(true)
    try {
      await financeService.downloadCSV(preset)
    } catch (err) {
      console.error('Failed to export CSV:', err)
    } finally {
      setIsExportingCSV(false)
    }
  }

  const handleDownloadPDF = async () => {
    setIsExportingPDF(true)
    try {
      await financeService.downloadPDF(preset)
    } catch (err) {
      console.error('Failed to export PDF:', err)
    } finally {
      setIsExportingPDF(false)
    }
  }

  const currency = user?.currency || 'USD'

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
            Financial Statements & Report Export
          </h1>
          <p className="text-xs text-zinc-400 light:text-zinc-500 mt-0.5">
            Audit-ready periodic summaries with 1-click CSV spreadsheets and PDF reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 light:border-zinc-200 light:bg-zinc-100 text-xs">
            {PRESET_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPreset(opt.value)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  preset === opt.value
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-100 light:text-zinc-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCSV}
            isLoading={isExportingCSV}
            icon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
          >
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadPDF}
            isLoading={isExportingPDF}
            icon={<FileText className="w-4 h-4" />}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {loading && !report ? (
        <LoadingSpinner message="Assembling periodic statements..." />
      ) : (
        <>
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-zinc-400 font-medium">Income in Period</span>
                <p className="text-2xl font-bold text-emerald-400 mt-1">
                  {formatCurrency(report?.total_income, currency)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {report?.top_incomes.length || 0} active revenue streams
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-zinc-400 font-medium">Expenses in Period</span>
                <p className="text-2xl font-bold text-rose-400 mt-1">
                  {formatCurrency(report?.total_expenses, currency)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Across {report?.top_expenses.length || 0} categories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-zinc-400 font-medium">Net Savings Balance</span>
                <p className="text-2xl font-bold text-blue-400 mt-1">
                  {formatCurrency(report?.net_savings, currency)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">Retained surplus</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <span className="text-xs text-zinc-400 font-medium">Savings Margin</span>
                <p className="text-2xl font-bold text-zinc-100 light:text-zinc-900 mt-1">
                  {formatPercentage(report?.savings_rate_pct)}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  {report?.total_transactions_count} audited transactions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Report by Category</CardTitle>
                <p className="text-xs text-zinc-400">Total volume and percentage contribution</p>
              </CardHeader>
              <CardContent>
                {report?.top_expenses && report.top_expenses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 light:border-zinc-200">
                          <th className="py-2.5 font-medium">Category</th>
                          <th className="py-2.5 font-medium text-center">Txns</th>
                          <th className="py-2.5 font-medium text-right">Total Spent</th>
                          <th className="py-2.5 font-medium text-right">Share (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 light:divide-zinc-200">
                        {report.top_expenses.map((exp) => (
                          <tr key={exp.category_name} className="hover:bg-zinc-800/20">
                            <td className="py-2.5 font-medium text-zinc-100 light:text-zinc-900">
                              {exp.category_name}
                            </td>
                            <td className="py-2.5 text-center text-zinc-400">
                              {exp.transaction_count}
                            </td>
                            <td className="py-2.5 text-right font-semibold text-rose-400">
                              {formatCurrency(exp.total_amount, currency)}
                            </td>
                            <td className="py-2.5 text-right text-zinc-400">
                              {exp.percentage_of_total}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    No expense data in this statement window.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Income Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Income Report by Source</CardTitle>
                <p className="text-xs text-zinc-400">Revenue distribution and receipt frequency</p>
              </CardHeader>
              <CardContent>
                {report?.top_incomes && report.top_incomes.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-zinc-800 text-zinc-400 light:border-zinc-200">
                          <th className="py-2.5 font-medium">Source / Stream</th>
                          <th className="py-2.5 font-medium text-center">Txns</th>
                          <th className="py-2.5 font-medium text-right">Total Revenue</th>
                          <th className="py-2.5 font-medium text-right">Share (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 light:divide-zinc-200">
                        {report.top_incomes.map((inc) => (
                          <tr key={inc.category_name} className="hover:bg-zinc-800/20">
                            <td className="py-2.5 font-medium text-zinc-100 light:text-zinc-900">
                              {inc.category_name}
                            </td>
                            <td className="py-2.5 text-center text-zinc-400">
                              {inc.transaction_count}
                            </td>
                            <td className="py-2.5 text-right font-semibold text-emerald-400">
                              {formatCurrency(inc.total_amount, currency)}
                            </td>
                            <td className="py-2.5 text-right text-zinc-400">
                              {inc.percentage_of_total}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    No income entries recorded in this window.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
