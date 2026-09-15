import { Link, Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/login" className="inline-block">
            <p className="text-xs uppercase tracking-[0.25em] text-[var(--haze-accent-2)]">
              Binate Digital
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Haze Admin</h1>
          </Link>
          <p className="mt-2 text-sm text-[var(--haze-muted)]">
            Cannabis marketplace control panel
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--haze-border)] bg-[var(--haze-panel)]/90 p-6 shadow-2xl backdrop-blur">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
