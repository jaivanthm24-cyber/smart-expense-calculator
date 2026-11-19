import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User as UserIcon, Lock, Globe, Shield, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/services/api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/common/Card'
import { Input } from '@/components/common/Input'
import { Select } from '@/components/common/Select'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { formatDate } from '@/utils/formatters'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  currency: z.string().min(1),
})

type ProfileFormData = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_new_password: z.string().min(8, 'Confirm new password is required'),
  })
  .refine((d) => d.new_password === d.confirm_new_password, {
    message: 'New passwords do not match',
    path: ['confirm_new_password'],
  })

type PasswordFormData = z.infer<typeof passwordSchema>

const CURRENCIES = [
  { label: 'USD ($) - US Dollar', value: 'USD' },
  { label: 'EUR (€) - Euro', value: 'EUR' },
  { label: 'GBP (£) - British Pound', value: 'GBP' },
  { label: 'CAD ($) - Canadian Dollar', value: 'CAD' },
  { label: 'AUD ($) - Australian Dollar', value: 'AUD' },
  { label: 'INR (₹) - Indian Rupee', value: 'INR' },
  { label: 'JPY (¥) - Japanese Yen', value: 'JPY' },
]

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth()
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )
  const [passwordMsg, setPasswordMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      currency: user?.currency || 'USD',
    },
  })

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const onUpdateProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true)
    setProfileMsg(null)
    try {
      const res = await api.put('/auth/me', data)
      updateUser(res.data)
      setProfileMsg({ type: 'success', text: 'Profile preferences updated successfully.' })
    } catch (err: any) {
      setProfileMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to update profile.',
      })
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const onUpdatePassword = async (data: PasswordFormData) => {
    setIsUpdatingPassword(true)
    setPasswordMsg(null)
    try {
      await api.put('/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
      })
      setPasswordMsg({ type: 'success', text: 'Your password has been changed.' })
      resetPasswordForm()
    } catch (err: any) {
      setPasswordMsg({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to change password. Check current password.',
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-100 light:text-zinc-900">
          Account Profile & Security
        </h1>
        <p className="text-xs text-zinc-400 light:text-zinc-500 mt-0.5">
          Manage your personal details, preferred reporting currency, and security credentials.
        </p>
      </div>

      {/* Account Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Account Overview</CardTitle>
          <p className="text-xs text-zinc-400">Account status and isolation metadata</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="rounded-lg bg-zinc-800/40 p-3 border border-zinc-700/50 light:bg-zinc-100">
              <span className="text-zinc-400 block mb-1">Email Address</span>
              <span className="font-semibold text-zinc-100 light:text-zinc-900">{user?.email}</span>
            </div>
            <div className="rounded-lg bg-zinc-800/40 p-3 border border-zinc-700/50 light:bg-zinc-100">
              <span className="text-zinc-400 block mb-1">Account Status</span>
              <Badge variant="success">Active & Verified</Badge>
            </div>
            <div className="rounded-lg bg-zinc-800/40 p-3 border border-zinc-700/50 light:bg-zinc-100">
              <span className="text-zinc-400 block mb-1">Member Since</span>
              <span className="font-semibold text-zinc-100 light:text-zinc-900">
                {formatDate(user?.created_at?.slice(0, 10))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Settings Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <p className="text-xs text-zinc-400">Update display name and currency format</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
              {profileMsg && (
                <div
                  className={`rounded-lg p-3 text-xs border ${
                    profileMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  {profileMsg.text}
                </div>
              )}

              <Input
                label="Full Name"
                placeholder="Alex Johnson"
                error={profileErrors.full_name?.message}
                {...regProfile('full_name')}
              />

              <Select
                label="Preferred Currency"
                options={CURRENCIES}
                error={profileErrors.currency?.message}
                {...regProfile('currency')}
              />

              <Button type="submit" size="sm" isLoading={isUpdatingProfile}>
                Save Profile Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Form */}
        <Card>
          <CardHeader>
            <CardTitle>Security & Password</CardTitle>
            <p className="text-xs text-zinc-400">Update Argon2 protected password</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit(onUpdatePassword)} className="space-y-4">
              {passwordMsg && (
                <div
                  className={`rounded-lg p-3 text-xs border ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                error={passwordErrors.current_password?.message}
                {...regPassword('current_password')}
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                error={passwordErrors.new_password?.message}
                {...regPassword('new_password')}
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                error={passwordErrors.confirm_new_password?.message}
                {...regPassword('confirm_new_password')}
              />

              <Button type="submit" variant="secondary" size="sm" isLoading={isUpdatingPassword}>
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
