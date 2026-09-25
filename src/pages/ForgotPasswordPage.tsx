import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { getApiErrorMessage } from '@/services/api'
import { fieldClass } from '@/components/ui'

const emailSchema = z.object({
  email: z.string().email('Enter a valid email'),
})

const otpSchema = z.object({
  otp: z.string().min(4, 'Enter the OTP'),
})

const passwordSchema = z
  .object({
    newPassword: z.string().min(6, 'Min 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type Step = 1 | 2 | 3

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>(1)
  const [email, setEmail] = useState('')
  const [uatOtp, setUatOtp] = useState<string | null>(null)

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })
  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  })
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const sendOtp = async (values: z.infer<typeof emailSchema>) => {
    try {
      const res = await authService.forgotPassword(values.email)
      setEmail(values.email)
      setUatOtp(res.data?.otp ?? null)
      toast.success(res.message || 'OTP sent')
      setStep(2)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const verifyOtp = async (values: z.infer<typeof otpSchema>) => {
    try {
      await authService.verifyForgotOtp(email, values.otp)
      toast.success('OTP verified')
      setStep(3)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const setPassword = async (values: z.infer<typeof passwordSchema>) => {
    try {
      await authService.setForgotPassword({
        email,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      })
      toast.success('Password updated. Please sign in.')
      window.location.href = '/login'
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-semibold">Forgot password</h2>
        <p className="text-sm text-[var(--haze-muted)]">
          Step {step} of 3 — {step === 1 ? 'Email' : step === 2 ? 'Verify OTP' : 'New password'}
        </p>
      </div>

      {step === 1 && (
        <form onSubmit={emailForm.handleSubmit(sendOtp)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-[var(--haze-muted)]">Email</label>
            <input
              type="email"
              className={fieldClass(Boolean(emailForm.formState.errors.email))}
              placeholder="admin@haze.app"
              {...emailForm.register('email')}
            />
            {emailForm.formState.errors.email && (
              <p className="text-xs text-red-400">{emailForm.formState.errors.email.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={emailForm.formState.isSubmitting}
            className="w-full rounded-xl bg-[var(--haze-accent)] text-[#102012] font-semibold py-2.5 disabled:opacity-60"
          >
            Send OTP
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
          {uatOtp && (
            <div className="rounded-xl border border-[var(--haze-accent-2)]/40 bg-[var(--haze-accent-2)]/10 px-3 py-2 text-xs text-[var(--haze-accent-2)]">
              UAT OTP helper: <strong>{uatOtp}</strong>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-sm text-[var(--haze-muted)]">OTP</label>
            <input
              className={fieldClass(Boolean(otpForm.formState.errors.otp))}
              placeholder="123456"
              {...otpForm.register('otp')}
            />
            {otpForm.formState.errors.otp && (
              <p className="text-xs text-red-400">{otpForm.formState.errors.otp.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={otpForm.formState.isSubmitting}
            className="w-full rounded-xl bg-[var(--haze-accent)] text-[#102012] font-semibold py-2.5 disabled:opacity-60"
          >
            Verify OTP
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={passwordForm.handleSubmit(setPassword)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-[var(--haze-muted)]">New password</label>
            <input
              type="password"
              className={fieldClass(Boolean(passwordForm.formState.errors.newPassword))}
              {...passwordForm.register('newPassword')}
            />
            {passwordForm.formState.errors.newPassword && (
              <p className="text-xs text-red-400">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-[var(--haze-muted)]">Confirm password</label>
            <input
              type="password"
              className={fieldClass(Boolean(passwordForm.formState.errors.confirmPassword))}
              {...passwordForm.register('confirmPassword')}
            />
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-xs text-red-400">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={passwordForm.formState.isSubmitting}
            className="w-full rounded-xl bg-[var(--haze-accent)] text-[#102012] font-semibold py-2.5 disabled:opacity-60"
          >
            Set new password
          </button>
        </form>
      )}

      <p className="text-center text-sm text-[var(--haze-muted)]">
        Remembered it?{' '}
        <Link to="/login" className="text-[var(--haze-accent)] hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
