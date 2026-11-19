import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wallet, Lock, Mail, User, DollarSign } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { getErrorMessage } from '@/utils/errorHandler'

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Name must be at least 2 characters').max(150),
    email: z.string().email('Please enter a valid email address'),
    currency: z.string().min(1, 'Please select your currency'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(8, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

const CURRENCIES = [
  { label: 'USD ($) - US Dollar', value: 'USD' },
  { label: 'EUR (€) - Euro', value: 'EUR' },
  { label: 'GBP (£) - British Pound', value: 'GBP' },
  { label: 'CAD ($) - Canadian Dollar', value: 'CAD' },
  { label: 'AUD ($) - Australian Dollar', value: 'AUD' },
  { label: 'INR (₹) - Indian Rupee', value: 'INR' },
  { label: 'JPY (¥) - Japanese Yen', value: 'JPY' },
]

export const RegisterPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      currency: 'USD',
    },
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    setServerError(null)
    try {
      const res = await api.post('/auth/register', {
        email: data.email.toLowerCase(),
        full_name: data.full_name,
        currency: data.currency,
        password: data.password,
      })
      login(res.data)
      navigate('/')
    } catch (err: any) {
      setServerError(getErrorMessage(err, 'Registration failed. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950 text-zinc-100 light:bg-zinc-50 light:text-zinc-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
            Create Your Account
          </h1>
          <p className="text-xs text-zinc-400 light:text-zinc-500">
            Smart budgeting, expense tracking, and automated insights
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/90 light:border-zinc-200 light:bg-white p-6 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                {serverError}
              </div>
            )}

            <Input
              label="Full Name *"
              placeholder="Alex Johnson"
              leftIcon={<User className="w-4 h-4" />}
              error={errors.full_name?.message}
              {...register('full_name')}
            />

            <Input
              label="Email Address *"
              type="email"
              placeholder="alex@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Select
              label="Preferred Currency *"
              options={CURRENCIES}
              error={errors.currency?.message}
              {...register('currency')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Password *"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
              <Input
                label="Confirm Password *"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />
            </div>

            <Button type="submit" size="md" className="w-full mt-2" isLoading={isLoading}>
              Register & Start Budgeting
            </Button>
          </form>

          <div className="mt-6 border-t border-zinc-800/80 light:border-zinc-200 pt-4 text-center text-xs text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
