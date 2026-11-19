import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wallet, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { Card, CardContent } from '@/components/common/Card'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setServerError(null)
    try {
      const res = await api.post('/auth/login', {
        email: data.email.toLowerCase(),
        password: data.password,
      })
      login(res.data)
      navigate('/')
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Invalid email or password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoFill = () => {
    setValue('email', 'testuser@example.com')
    setValue('password', 'Password123!')
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950 text-zinc-100 light:bg-zinc-50 light:text-zinc-900">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <Wallet className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
            Smart Expense Calculator
          </h1>
          <p className="text-xs text-zinc-400 light:text-zinc-500">
            Sign in to access your real-time financial control center
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-zinc-800 bg-zinc-900/90 light:border-zinc-200 light:bg-white p-6 shadow-xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                {serverError}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-zinc-300 light:text-zinc-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <Button type="submit" size="md" className="w-full mt-2" isLoading={isLoading}>
              Sign In to Dashboard
            </Button>

            {/* Quick Demo Fill button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleDemoFill}
                className="text-xs text-zinc-400 hover:text-emerald-400 transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Fill sample test account credentials</span>
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-zinc-800/80 light:border-zinc-200 pt-4 text-center text-xs text-zinc-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-emerald-400 hover:text-emerald-300">
              Create an Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
