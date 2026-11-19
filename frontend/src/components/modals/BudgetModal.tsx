import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/common/Modal'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { Button } from '@/components/common/Button'
import { financeService } from '@/services/financeService'
import { Category, BudgetStatusItem } from '@/types'

const budgetSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be greater than 0',
  }),
  month: z.string().min(1),
  year: z.string().min(1),
  category_id: z.string().optional(),
  alert_threshold: z.string().refine((val) => Number(val) >= 10 && Number(val) <= 100, {
    message: 'Threshold must be between 10% and 100%',
  }),
})

type BudgetFormData = z.infer<typeof budgetSchema>

interface BudgetModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  currentMonth: number
  currentYear: number
  budgetToEdit?: BudgetStatusItem | null
}

const MONTHS = [
  { label: 'January', value: '1' },
  { label: 'February', value: '2' },
  { label: 'March', value: '3' },
  { label: 'April', value: '4' },
  { label: 'May', value: '5' },
  { label: 'June', value: '6' },
  { label: 'July', value: '7' },
  { label: 'August', value: '8' },
  { label: 'September', value: '9' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
]

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentMonth,
  currentYear,
  budgetToEdit,
}) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: '',
      month: String(currentMonth),
      year: String(currentYear),
      category_id: '',
      alert_threshold: '80',
    },
  })

  useEffect(() => {
    if (isOpen) {
      setServerError(null)
      financeService.getCategories('expense').then(setCategories).catch(console.error)

      if (budgetToEdit) {
        setValue('amount', String(budgetToEdit.budget_amount))
        setValue('category_id', budgetToEdit.category_id ? String(budgetToEdit.category_id) : '')
        setValue('alert_threshold', String(budgetToEdit.alert_threshold))
        setValue('month', String(currentMonth))
        setValue('year', String(currentYear))
      } else {
        reset({
          amount: '',
          month: String(currentMonth),
          year: String(currentYear),
          category_id: '',
          alert_threshold: '80',
        })
      }
    }
  }, [isOpen, budgetToEdit, currentMonth, currentYear, setValue, reset])

  const onSubmit = async (data: BudgetFormData) => {
    setIsSubmitting(true)
    setServerError(null)
    try {
      await financeService.setBudget({
        amount: data.amount,
        month: Number(data.month),
        year: Number(data.year),
        category_id: data.category_id ? Number(data.category_id) : null,
        alert_threshold: Number(data.alert_threshold),
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Failed to save budget.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryOptions = [
    { label: '🌟 Overall Monthly Budget', value: '' },
    ...categories.map((c) => ({ label: `📁 ${c.name}`, value: String(c.id) })),
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={budgetToEdit ? 'Modify Budget' : 'Configure Budget'}
      description="Set overall or category limits to control monthly expenditures."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {serverError && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            {serverError}
          </div>
        )}

        <Select
          label="Budget Scope *"
          options={categoryOptions}
          error={errors.category_id?.message}
          {...register('category_id')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Budget Amount *"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Warning Alert Threshold (%)"
            type="number"
            min="10"
            max="100"
            helperText="Notifies you when spending reaches this % (default: 80%)"
            error={errors.alert_threshold?.message}
            {...register('alert_threshold')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Month" options={MONTHS} error={errors.month?.message} {...register('month')} />
          <Input label="Year" type="number" error={errors.year?.message} {...register('year')} />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Save Budget
          </Button>
        </div>
      </form>
    </Modal>
  )
}
