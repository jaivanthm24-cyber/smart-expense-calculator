import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/common/Modal'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { financeService } from '@/services/financeService'
import { SavingsGoal } from '@/types'
import { formatCurrency } from '@/utils/formatters'

const contributionSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Deposit amount must be greater than 0',
  }),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
})

type ContributionFormData = z.infer<typeof contributionSchema>

interface ContributionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  goal: SavingsGoal | null
}

export const ContributionModal: React.FC<ContributionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  goal,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContributionFormData>({
    resolver: zodResolver(contributionSchema),
    defaultValues: {
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  })

  if (!goal) return null

  const onSubmit = async (data: ContributionFormData) => {
    setIsSubmitting(true)
    setServerError(null)
    try {
      await financeService.addSavingsContribution(goal.id, {
        amount: data.amount,
        date: data.date,
        notes: data.notes || undefined,
      })
      reset()
      onSuccess()
      onClose()
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Failed to deposit savings.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Savings to "${goal.name}"`}
      description={`Remaining to reach target: ${formatCurrency(goal.remaining_amount)}`}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {serverError && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            {serverError}
          </div>
        )}

        <div className="rounded-xl bg-zinc-800/40 p-3 border border-zinc-700/50 light:bg-zinc-100 light:border-zinc-200 flex justify-between text-xs">
          <div>
            <p className="text-zinc-400">Current Saved</p>
            <p className="font-semibold text-emerald-400 text-sm">
              {formatCurrency(goal.current_amount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-zinc-400">Target Goal</p>
            <p className="font-semibold text-zinc-200 light:text-zinc-800 text-sm">
              {formatCurrency(goal.target_amount)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Contribution Amount *"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Contribution Date *"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
        </div>

        <Input
          label="Deposit Notes"
          placeholder="e.g. End of month allocation, bonus check"
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Confirm Deposit
          </Button>
        </div>
      </form>
    </Modal>
  )
}
