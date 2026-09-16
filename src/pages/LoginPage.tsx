import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { getApiErrorMessage } from '@/services/api'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', rememberMe: true },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await authService.login(values)
      login(result.user, result.token)
      toast.success('Welcome back')
      navigate('/')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Invalid email or password'))
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-semibold">Sign in</h2>
        <p className="text-sm text-[var(--haze-muted)]">
          Use your admin email and password
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm text-[var(--haze-muted)]">Email</label>
          <input
            type="email"
            autoComplete="email"
            className="w-full rounded-xl border border-[var(--haze-border)] bg-[var(--haze-bg)] px-3 py-2.5 outline-none focus:border-[var(--haze-accent)]"
            placeholder="admin@haze.app"
            {...form.register('email')}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-400">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm text-[var(--haze-muted)]">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-[var(--haze-border)] bg-[var(--haze-bg)] px-3 py-2.5 outline-none focus:border-[var(--haze-accent)]"
            placeholder="••••••••"
            {...form.register('password')}
          />
          {form.formState.errors.password && (
            <p className="text-xs text-red-400">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="accent-[var(--haze-accent)]"
              {...form.register('rememberMe')}
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-[var(--haze-neon)] hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full rounded-xl bg-[var(--haze-neon)] text-[#06200a] font-semibold py-2.5 shadow-[0_0_24px_rgba(57,255,20,0.35)] hover:bg-[var(--haze-neon-soft)] disabled:opacity-60"
        >
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
