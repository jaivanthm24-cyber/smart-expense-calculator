import React, { useEffect, useState, useCallback } from 'react'
import {
  Target,
  Plus,
  Coins,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Edit2,
  PiggyBank,
} from 'lucide-react'
import { financeService } from '@/services/financeService'
import { SavingsGoal } from '@/types'
import { formatCurrency, formatPercentage, formatDate } from '@/utils/formatters'
import { Card, CardContent } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { EmptyState } from '@/components/common/EmptyState'
import { SavingsGoalModal } from '@/components/modals/SavingsGoalModal'
import { ContributionModal } from '@/components/modals/ContributionModal'
import { useAuth } from '@/context/AuthContext'

export const SavingsPage: React.FC = () => {
  const { user } = useAuth()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null)
  const [isContribModalOpen, setIsContribModalOpen] = useState(false)
  const [selectedGoalForContrib, setSelectedGoalForContrib] = useState<SavingsGoal | null>(null)

  const fetchGoals = useCallback(async () => {
    setLoading(true)
    try {
      const res = await financeService.getSavingsGoals()
      setGoals(res)
    } catch (err) {
      console.error('Failed to fetch savings goals:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this savings goal and all associated records?')) return
    try {
      await financeService.deleteSavingsGoal(id)
      fetchGoals()
    } catch (err) {
      console.error('Failed to delete goal:', err)
    }
  }

  const handleOpenContrib = (goal: SavingsGoal) => {
    setSelectedGoalForContrib(goal)
    setIsContribModalOpen(true)
  }

  const handleEdit = (goal: SavingsGoal) => {
    setGoalToEdit(goal)
    setIsGoalModalOpen(true)
  }

  const handleCreate = () => {
    setGoalToEdit(null)
    setIsGoalModalOpen(true)
  }

  const currency = user?.currency || 'USD'
  const totalSaved = goals.reduce((acc, g) => acc + parseFloat(g.current_amount), 0)
  const totalTarget = goals.reduce((acc, g) => acc + parseFloat(g.target_amount), 0)

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
            Savings Goals & Emergency Reserves
          </h1>
          <p className="text-xs text-zinc-400 light:text-zinc-500 mt-0.5">
            Track milestones, automate monthly targets, and deposit savings towards high-priority goals.
          </p>
        </div>

        <Button size="sm" onClick={handleCreate} icon={<Plus className="w-4 h-4" />}>
          New Savings Goal
        </Button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-medium text-zinc-400">Total Capital Saved</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {formatCurrency(totalSaved, currency)}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">Across all active funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-medium text-zinc-400">Cumulative Target</span>
            <p className="text-2xl font-bold text-zinc-100 light:text-zinc-900 mt-1">
              {formatCurrency(totalTarget, currency)}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">Financial milestones value</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <span className="text-xs font-medium text-zinc-400">Overall Progress</span>
            <p className="text-2xl font-bold text-blue-400 mt-1">
              {totalTarget > 0 ? formatPercentage((totalSaved / totalTarget) * 100) : '0%'}
            </p>
            <p className="text-[11px] text-zinc-400 mt-1">
              {goals.filter((g) => g.status === 'completed').length} completed goals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <LoadingSpinner message="Loading savings milestones..." />
      ) : goals.length === 0 ? (
        <EmptyState
          title="No savings goals yet"
          description="Create your first savings target, like an Emergency Reserve, Vacation, or New Laptop."
          actionLabel="Create First Goal"
          onAction={handleCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const isCompleted = goal.status === 'completed'
            return (
              <Card
                key={goal.id}
                className={`hover:border-zinc-700 transition-all flex flex-col justify-between ${
                  isCompleted ? 'border-emerald-500/30' : ''
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-400 border border-emerald-500/20">
                          <Target className="w-4 h-4" />
                        </span>
                        <div>
                          <h3 className="font-semibold text-sm text-zinc-100 light:text-zinc-900">
                            {goal.name}
                          </h3>
                          <span className="text-[11px] text-zinc-400">{goal.category}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={isCompleted ? 'success' : 'info'}>
                      {isCompleted ? 'Completed' : `${goal.progress_percentage}%`}
                    </Badge>
                  </div>

                  {/* Amounts */}
                  <div className="mt-5 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-zinc-400">Saved:</span>
                      <p className="text-xl font-bold text-emerald-400">
                        {formatCurrency(goal.current_amount, currency)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-zinc-400">Target:</span>
                      <p className="text-base font-semibold text-zinc-200 light:text-zinc-800">
                        {formatCurrency(goal.target_amount, currency)}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 space-y-1.5">
                    <div className="h-2.5 w-full rounded-full bg-zinc-800 light:bg-zinc-200 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, goal.progress_percentage)}%` }}
                      />
                    </div>
                  </div>

                  {/* Days remaining and needed monthly contribution */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs border-t border-zinc-800/60 light:border-zinc-200 pt-3 text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      <span>
                        {goal.days_remaining > 0
                          ? `${goal.days_remaining} days left`
                          : 'Target date reached'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span>Target: {formatCurrency(goal.monthly_target_needed, currency)}/mo</span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="mt-5 flex items-center justify-between border-t border-zinc-800/60 light:border-zinc-200 pt-3">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenContrib(goal)}
                      icon={<Coins className="w-3.5 h-3.5" />}
                      className="text-xs"
                    >
                      Deposit Savings
                    </Button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(goal)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Goal Modal */}
      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSuccess={fetchGoals}
        goalToEdit={goalToEdit}
      />

      {/* Contribution Modal */}
      <ContributionModal
        isOpen={isContribModalOpen}
        onClose={() => setIsContribModalOpen(false)}
        onSuccess={fetchGoals}
        goal={selectedGoalForContrib}
      />
    </div>
  )
}
