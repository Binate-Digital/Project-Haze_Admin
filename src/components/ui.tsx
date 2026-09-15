import type { ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-[var(--haze-muted)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2 flex-wrap">{actions}</div> : null}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-[var(--haze-border)] bg-[var(--haze-panel)] p-5 ${className}`}
    >
      {children}
    </div>
  )
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'ghost' | 'danger' | 'secondary'
  disabled?: boolean
  className?: string
}) {
  const styles = {
    primary: 'bg-[var(--haze-accent)] text-[#102012] hover:opacity-90',
    secondary: 'bg-[var(--haze-accent-2)]/20 text-[var(--haze-accent-2)] hover:bg-[var(--haze-accent-2)]/30',
    ghost: 'border border-[var(--haze-border)] hover:bg-white/5',
    danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
  }[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-3.5 py-2 text-sm font-medium transition disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'ok' | 'warn' | 'bad' }) {
  const map = {
    neutral: 'bg-white/10 text-[var(--haze-muted)]',
    ok: 'bg-[var(--haze-accent)]/15 text-[var(--haze-accent)]',
    warn: 'bg-[var(--haze-accent-2)]/15 text-[var(--haze-accent-2)]',
    bad: 'bg-red-500/15 text-red-300',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>
      {children}
    </span>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--haze-border)] p-10 text-center text-sm text-[var(--haze-muted)]">
      {message}
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-[var(--haze-muted)]">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-xl border border-[var(--haze-border)] bg-[var(--haze-bg)] px-3 py-2.5 text-sm outline-none focus:border-[var(--haze-accent)]'

export const textareaClass = `${inputClass} min-h-28 resize-y`
