import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/common/Modal'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { Button } from '@/components/common/Button'
import { financeService } from '@/services/financeService'
import { Category, Income } from '@/types'

const incomeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  category_id: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  payment_method: z.string().min(1, 'Payment method is required'),
  description: z.string().optional(),
})

type IncomeFormData = z.infer<typeof incomeSchema>

interface IncomeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  incomeToEdit?: Income | null
}

const PAYMENT_METHODS = [
  { label: 'Bank Transfer', value: 'Bank Transfer' },
  { label: 'Direct Deposit', value: 'Direct Deposit' },
  { label: 'Cash', value: 'Cash' },
  { label: 'PayPal', value: 'PayPal' },
  { label: 'Credit / Debit Card', value: 'Card' },
  { label: 'Other', value: 'Other' },
]

export const IncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  incomeToEdit,
}) => {
  const [categories, setCategories] = useState<Category[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      title: '',
      amount: '',
      category_id: '',
      date: new Date().toISOString().slice(0, 10),
      payment_method: 'Direct Deposit',
      description: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      setServerError(null)
      financeService.getCategories('income').then(setCategories).catch(console.error)

      if (incomeToEdit) {
        setValue('title', incomeToEdit.title)
        setValue('amount', String(incomeToEdit.amount))
        setValue('category_id', incomeToEdit.category_id ? String(incomeToEdit.category_id) : '')
        setValue('date', incomeToEdit.date)
        setValue('payment_method', incomeToEdit.payment_method)
        setValue('description', incomeToEdit.description || '')
      } else {
        reset({
          title: '',
          amount: '',
          category_id: '',
          date: new Date().toISOString().slice(0, 10),
          payment_method: 'Direct Deposit',
          description: '',
        })
      }
    }
  }, [isOpen, incomeToEdit, setValue, reset])

  const onSubmit = async (data: IncomeFormData) => {
    setIsSubmitting(true)
    setServerError(null)
    try {
      const payload = {
        title: data.title,
        amount: data.amount,
        category_id: data.category_id ? Number(data.category_id) : null,
        date: data.date,
        payment_method: data.payment_method,
        description: data.description || undefined,
      }

      if (incomeToEdit) {
        await financeService.updateIncome(incomeToEdit.id, payload)
      } else {
        await financeService.createIncome(payload)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Failed to save income. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryOptions = [
    { label: 'Select Source Category', value: '' },
    ...categories.map((c) => ({ label: c.name, value: String(c.id) })),
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={incomeToEdit ? 'Edit Income' : 'Add New Income'}
      description="Record income sources, salary, or freelancing revenues."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {serverError && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            {serverError}
          </div>
        )}

        <Input
          label="Income Source / Title *"
          placeholder="e.g. Monthly Salary, Freelance Web App, Dividend"
          error={errors.title?.message}
          {...register('title')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Amount *"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Input
            label="Date Received *"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Category"
            options={categoryOptions}
            error={errors.category_id?.message}
            {...register('category_id')}
          />
          <Select
            label="Payment Method *"
            options={PAYMENT_METHODS}
            error={errors.payment_method?.message}
            {...register('payment_method')}
          />
        </div>

        <Input
          label="Description"
          placeholder="Optional notes or reference numbers"
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {incomeToEdit ? 'Save Changes' : 'Record Income'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
