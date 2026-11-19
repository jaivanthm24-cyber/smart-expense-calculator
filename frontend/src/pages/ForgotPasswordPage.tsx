import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wallet, Mail, KeyRound, ArrowLeft } from 'lucide-react'
import { api } from '@/services/api'
import { Input } from '@/components/common/Input'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'

const forgotSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotFormData = z.infer<typeof forgotSchema>

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotFormData) => {
    setIsSubmitting(true)
    try {
      const res = await api.post('/auth/forgot-password', { email: data.email })
      setMessage(res.data.message)
      if (res.data.reset_token) {
        setGeneratedToken(res.data.reset_token)
      }
    } catch (err: any) {
      setMessage('If your account exists, password recovery details have been prepared.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950 text-zinc-100 light:bg-zinc-50 light:text-zinc-900">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
            Reset Password
          </h1>
          <p className="text-xs text-zinc-400 light:text-zinc-500">
            Enter your registered email to receive a password reset code.
          </p>
        </div>

        <Card className="border-zinc-800 bg-zinc-900/90 light:border-zinc-200 light:bg-white p-6 shadow-xl">
          {generatedToken ? (
            <div className="space-y-4">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs text-emerald-400">
                <p className="font-semibold text-sm mb-1">Reset Key Generated</p>
                <p className="break-all font-mono text-[11px] bg-zinc-950 p-2 rounded border border-emerald-500/30 text-emerald-300 mt-2">
                  {generatedToken}
                </p>
              </div>

              <Button
                size="md"
                className="w-full"
                onClick={() => navigate(`/reset-password?token=${encodeURIComponent(generatedToken)}`)}
              >
                Proceed to Enter New Password
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {message && (
                <div className="rounded-lg bg-zinc-800 p-3 text-xs text-zinc-300">{message}</div>
              )}

              <Input
                label="Registered Email Address"
                type="email"
                placeholder="you@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                {...register('email')}
              />

              <Button type="submit" size="md" className="w-full" isLoading={isSubmitting}>
                Request Reset Token
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
