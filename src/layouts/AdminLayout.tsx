import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  FileText,
  GraduationCap,
  Megaphone,
  Package,
  Scale,
  LogOut,
  Leaf,
  UserRound,
  KeyRound,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { getApiErrorMessage } from '@/services/api'
import { NAV_ITEMS, ROUTES } from '@/config'

const ICONS: Record<string, typeof LayoutDashboard> = {
  [ROUTES.DASHBOARD]: LayoutDashboard,
  [ROUTES.BUSINESSES]: Building2,
  [ROUTES.BLOGS]: FileText,
  [ROUTES.EDUCATION]: GraduationCap,
  [ROUTES.ADS]: Megaphone,
  [ROUTES.PACKAGES]: Package,
  [ROUTES.LEGAL]: Scale,
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logoutStore = useAuthStore((s) => s.logout)

  const displayName = user?.fullName || 'Haze Admin'
  const displayEmail = user?.email || 'Admin'
  const avatarUrl = typeof user?.userImg === 'string' ? user.userImg : null

  const onLogout = async () => {
    try {
      await authService.logout()
      logoutStore()
      toast.success('Logged out')
      navigate('/login')
    } catch (error) {
      logoutStore()
      toast.error(getApiErrorMessage(error, 'Logged out locally'))
      navigate('/login')
    }
  }

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname === to || location.pathname.startsWith(`${to}/`)
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-[var(--haze-border)] bg-[var(--haze-panel)] p-5 flex flex-col">
        <div className="mb-10 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--haze-accent)]/20">
            <Leaf className="h-8 w-8 text-[var(--haze-accent)]" />
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.to] || LayoutDashboard
            const active = isActive(item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? 'bg-[var(--haze-accent)]/15 text-[var(--haze-accent)]'
                    : 'text-[var(--haze-muted)] hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-end border-b border-[var(--haze-border)] bg-[var(--haze-panel)]/90 px-6 py-3 backdrop-blur">
          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl border border-[var(--haze-border)] bg-[var(--haze-bg)]/60 px-3 py-2 transition hover:border-[var(--haze-accent)]/40"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover border border-[var(--haze-border)]"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--haze-accent)]/20">
                  <Leaf className="h-4 w-4 text-[var(--haze-accent)]" />
                </div>
              )}
              <div className="hidden text-left sm:block max-w-[180px]">
                <p className="truncate text-sm font-medium">{displayName}</p>
                <p className="truncate text-xs text-[var(--haze-muted)]">{displayEmail}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-[var(--haze-muted)]" />
            </button>

            <div className="invisible absolute right-0 top-full z-30 mt-2 w-56 origin-top-right scale-95 opacity-0 transition group-hover:visible group-hover:scale-100 group-hover:opacity-100 group-focus-within:visible group-focus-within:scale-100 group-focus-within:opacity-100">
              <div className="overflow-hidden rounded-xl border border-[var(--haze-border)] bg-[var(--haze-panel)] shadow-xl">
                <div className="border-b border-[var(--haze-border)] px-3 py-2.5 sm:hidden">
                  <p className="truncate text-sm font-medium">{displayName}</p>
                  <p className="truncate text-xs text-[var(--haze-muted)]">{displayEmail}</p>
                </div>
                <Link
                  to={ROUTES.PROFILE}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--haze-muted)] hover:bg-white/5 hover:text-white"
                >
                  <UserRound className="h-4 w-4" />
                  Profile
                </Link>
                <Link
                  to={ROUTES.UPDATE_PASSWORD}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--haze-muted)] hover:bg-white/5 hover:text-white"
                >
                  <KeyRound className="h-4 w-4" />
                  Update password
                </Link>
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="flex w-full items-center gap-2.5 border-t border-[var(--haze-border)] px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
