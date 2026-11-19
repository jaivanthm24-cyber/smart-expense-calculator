import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { api } from '@/services/api'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'

const resetSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(8, 'Please confirm your password'),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type ResetFormData = z.infer<typeof resetSchema>

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tokenFromUrl = searchParams.get('token') || ''
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: tokenFromUrl,
    },
  })

  const onSubmit = async (data: ResetFormData) => {
    setIsLoading(true)
    setServerError(null)
    try {
      await api.post('/auth/reset-password', {
        token: data.token,
        new_password: data.new_password,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: any) {
      setServerError(err.response?.data?.detail || 'Failed to reset password. Link may be expired.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950 text-zinc-100 light:bg-zinc-50 light:text-zinc-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
            Set New Password
          </h1>
          <p className="text-xs text-zinc-400 light:text-zinc-500">
            Choose a strong password with at least 8 characters.
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/90 light:border-zinc-200 light:bg-white p-6 shadow-xl">
          {success ? (
            <div className="text-center space-y-3 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="font-semibold text-base text-zinc-100 light:text-zinc-900">
                Password Successfully Reset!
              </h3>
              <p className="text-xs text-zinc-400">
                Redirecting you to the sign-in screen in a moment...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {serverError && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400">
                  {serverError}
                </div>
              )}

              <Input
                label="Reset Verification Token *"
                placeholder="Paste reset token here"
                error={errors.token?.message}
                {...register('token')}
              />

              <Input
                label="New Password *"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.new_password?.message}
                {...register('new_password')}
              />

              <Input
                label="Confirm New Password *"
                type="password"
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                error={errors.confirm_password?.message}
                {...register('confirm_password')}
              />

              <Button type="submit" size="md" className="w-full mt-2" isLoading={isLoading}>
                Update Password
              </Button>
            </form>
          )}

          <div className="mt-6 border-t border-zinc-800/80 light:border-zinc-200 pt-4 text-center text-xs text-zinc-400">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
