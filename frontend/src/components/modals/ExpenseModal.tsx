import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/common/Modal'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { Button } from '@/components/common/Button'
import { financeService } from '@/services/financeService'
import { Category, Expense } from '@/types'

const expenseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  category_id: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  payment_method: z.string().min(1, 'Payment method is required'),
  description: z.string().optional(),
  notes: z.string().optional(),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  expenseToEdit?: Expense | null
}

const PAYMENT_METHODS = [
  { label: 'Credit Card', value: 'Credit Card' },
  { label: 'Debit Card', value: 'Debit Card' },
  { label: 'Cash', value: 'Cash' },
  { label: 'Bank Transfer', value: 'Bank Transfer' },
  { label: 'UPI / Online', value: 'UPI' },
  { label: 'Other', value: 'Other' },
]

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  expenseToEdit,
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
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: '',
      category_id: '',
      date: new Date().toISOString().slice(0, 10),
      payment_method: 'Credit Card',
      description: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (isOpen) {
      setServerError(null)
      financeService.getCategories('expense').then(setCategories).catch(console.error)

      if (expenseToEdit) {
        setValue('title', expenseToEdit.title)
        setValue('amount', String(expenseToEdit.amount))
        setValue('category_id', expenseToEdit.category_id ? String(expenseToEdit.category_id) : '')
        setValue('date', expenseToEdit.date)
        setValue('payment_method', expenseToEdit.payment_method)
        setValue('description', expenseToEdit.description || '')
        setValue('notes', expenseToEdit.notes || '')
      } else {
        reset({
          title: '',
          amount: '',
          category_id: '',
          date: new Date().toISOString().slice(0, 10),
          payment_method: 'Credit Card',
          description: '',
          notes: '',
        })
      }
    }
  }, [isOpen, expenseToEdit, setValue, reset])

  const onSubmit = async (data: ExpenseFormData) => {
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
        notes: data.notes || undefined,
      }

      if (expenseToEdit) {
        await financeService.updateExpense(expenseToEdit.id, payload)
      } else {
        await financeService.createExpense(payload)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Failed to save expense. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const categoryOptions = [
    { label: 'Select Category (Optional)', value: '' },
    ...categories.map((c) => ({ label: c.name, value: String(c.id) })),
  ]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={expenseToEdit ? 'Edit Expense' : 'Add New Expense'}
      description="Record an expenditure to track your budget accurately."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        {serverError && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
            {serverError}
          </div>
        )}

        <Input
          label="Expense Title *"
          placeholder="e.g. Grocery Store, Uber Ride, Electricity Bill"
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
            label="Date *"
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
          placeholder="Brief details about this transaction"
          error={errors.description?.message}
          {...register('description')}
        />

        <Input
          label="Optional Notes"
          placeholder="Any extra tags or remarks"
          error={errors.notes?.message}
          {...register('notes')}
        />

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            {expenseToEdit ? 'Save Changes' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
