import React, { useEffect, useState } from 'react'
import {
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react'
import { financeService } from '@/services/financeService'
import { InsightsResponse, InsightItem } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Link } from 'react-router-dom'

export const InsightsPage: React.FC = () => {
  const [data, setData] = useState<InsightsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    financeService
      .getInsights()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading && !data) {
    return <LoadingSpinner message="Auditing transactions for financial insights..." />
  }

  const score = data?.health_score || 75
  const getScoreColor = () => {
    if (score >= 85) return 'text-emerald-400'
    if (score >= 70) return 'text-blue-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-rose-400'
  }

  const getScoreLabel = () => {
    if (score >= 85) return 'Excellent Health'
    if (score >= 70) return 'Solid Standing'
    if (score >= 50) return 'Needs Attention'
    return 'Under Financial Strain'
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
          Smart Financial Insights Engine
        </h1>
        <p className="text-xs text-zinc-400 light:text-zinc-500 mt-0.5">
          Automated rule-based financial advice derived strictly from your real transaction ledger.
        </p>
      </div>

      {/* Health Score Hero Card */}
      <Card className="border-emerald-500/20 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 light:from-white light:to-zinc-50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Financial Health Index
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-zinc-100 light:text-zinc-900">
                {getScoreLabel()}
              </h2>
              <p className="text-xs text-zinc-300 light:text-zinc-600 leading-relaxed">
                {data?.summary_sentence}
              </p>
            </div>

            {/* Score Ring / Display */}
            <div className="flex items-center gap-4 bg-zinc-800/40 p-4 rounded-2xl border border-zinc-700/50 light:bg-zinc-100 light:border-zinc-200">
              <div className="text-center">
                <span className={`text-4xl sm:text-5xl font-black ${getScoreColor()}`}>
                  {score}
                </span>
                <span className="text-xs text-zinc-400 block font-medium">/ 100 PTS</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Cards List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-zinc-100 light:text-zinc-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Active Financial Observations ({data?.insights.length || 0})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.insights.map((item) => {
            const isCritical = item.type === 'critical'
            const isWarning = item.type === 'warning'
            const isPositive = item.type === 'positive'

            const badgeVariant = isCritical
              ? 'danger'
              : isWarning
              ? 'warning'
              : isPositive
              ? 'success'
              : 'info'

            const Icon = isCritical
              ? AlertCircle
              : isWarning
              ? AlertTriangle
              : isPositive
              ? CheckCircle2
              : Lightbulb

            return (
              <Card
                key={item.id}
                className={`hover:border-zinc-700 transition-colors ${
                  isCritical ? 'border-rose-500/30' : isWarning ? 'border-amber-500/30' : ''
                }`}
              >
                <CardContent className="p-5 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isCritical
                              ? 'bg-rose-500/10 text-rose-400'
                              : isWarning
                              ? 'bg-amber-500/10 text-amber-400'
                              : isPositive
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-blue-500/10 text-blue-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <h4 className="font-semibold text-sm text-zinc-100 light:text-zinc-900">
                          {item.title}
                        </h4>
                      </div>
                      <Badge variant={badgeVariant}>{item.category.toUpperCase()}</Badge>
                    </div>

                    <p className="text-xs text-zinc-300 light:text-zinc-600 mt-3 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {item.action_suggestion && (
                    <div className="mt-4 rounded-lg bg-zinc-800/40 p-3 border border-zinc-700/40 light:bg-zinc-100 light:border-zinc-200 text-xs">
                      <span className="font-semibold text-emerald-400 block mb-0.5">
                        Recommendation:
                      </span>
                      <p className="text-zinc-400 light:text-zinc-600">{item.action_suggestion}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
