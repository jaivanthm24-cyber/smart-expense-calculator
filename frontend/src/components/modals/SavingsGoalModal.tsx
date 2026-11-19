import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/common/Modal'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { Button } from '@/components/common/Button'
import { financeService } from '@/services/financeService'
import { SavingsGoal } from '@/types'

const savingsGoalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(200),
  target_amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Target amount must be greater than 0',
  }),
  current_amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: 'Current amount must be 0 or more',
  }),
  target_date: z.string().min(1, 'Target date is required'),
  category: z.string().min(1, 'Category is required'),
  notes: z.string().optional(),
})

type SavingsGoalFormData = z.infer<typeof savingsGoalSchema>

interface SavingsGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  goalToEdit?: SavingsGoal | null
}

const CATEGORIES = [
  { label: 'Emergency Fund', value: 'Emergency' },
  { label: 'Tech & Gadgets', value: 'Tech' },
  { label: 'Vacation & Travel', value: 'Travel' },
  { label: 'Vehicle / Car', value: 'Vehicle' },
  { label: 'Real Estate / Home', value: 'Home' },
  { label: 'Education & Career', value: 'Education' },
  { label: 'Retirement / Investment', value: 'Retirement' },
  { label: 'Other', value: 'Other' },
]

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  goalToEdit,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Default target date: 6 months from now
  const defaultTargetDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SavingsGoalFormData>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name: '',
      target_amount: '',
      current_amount: '0.00',
      target_date: defaultTargetDate,
      category: 'Emergency',
      notes: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      setServerError(null)
      if (goalToEdit) {
        setValue('name', goalToEdit.name)
        setValue('target_amount', String(goalToEdit.target_amount))
        setValue('current_amount', String(goalToEdit.current_amount))
        setValue('target_date', goalToEdit.target_date)
        setValue('category', goalToEdit.category || 'Emergency')
        setValue('notes', goalToEdit.notes || '')
      } else {
        reset({
          name: '',
          target_amount: '',
          current_amount: '0.00',
          target_date: defaultTargetDate,
          category: 'Emergency',
          notes: '',
        })
      }
    }
  }, [isOpen, goalToEdit, defaultTargetDate, setValue, reset])

  const onSubmit = async (data: SavingsGoalFormData) => {
    setIsSubmitting(true)
    setServerError(null)
    try {
      const payload = {
        name: data.name,
        target_amount: data.target_amount,
        current_amount: data.current_amount,
        target_date: data.target_date,
        category: data.category,
        notes: data.notes || undefined,
      }

      if (goalToEdit) {
        await financeService.updateSavingsGoal(goalToEdit.id, payload)
      } else {
        await financeService.createSavingsGoal(payload)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Failed to save savings goal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goalToEdit ? 'Edit Savings Goal' : 'Create Savings Goal'}
      description="Plan for purchases, vacations, or financial security reserves."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {serverError && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            {serverError}
          </div>
        )}

        <Input
          label="Goal Name *"
          placeholder="e.g. New M4 MacBook Pro, Emergency Reserve, Japan Trip"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Target Amount *"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.target_amount?.message}
            {...register('target_amount')}
          />
          <Input
            label="Currently Saved"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.current_amount?.message}
            {...register('current_amount')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Target Date *"
            type="date"
            error={errors.target_date?.message}
            {...register('target_date')}
          />
          <Select
            label="Category"
            options={CATEGORIES}
            error={errors.category?.message}
            {...register('category')}
          />
        </div>

        <Input
          label="Motivation / Notes"
          placeholder="Why are you saving for this?"
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {goalToEdit ? 'Save Changes' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
