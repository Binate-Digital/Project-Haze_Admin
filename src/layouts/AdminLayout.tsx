import { useEffect, useRef, useState } from 'react'
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
  Users,
  Bell,
  Flag,
  ShoppingBag,
  BarChart3,
} from 'lucide-react'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { getApiErrorMessage } from '@/services/api'
import { NAV_ITEMS, ROUTES } from '@/config'
import logo from '@/assets/logo.png'
import bg1 from '@/assets/bg1.png'

const ICONS: Record<string, typeof LayoutDashboard> = {
  [ROUTES.DASHBOARD]: LayoutDashboard,
  [ROUTES.ANALYTICS]: BarChart3,
  [ROUTES.BUSINESSES]: Building2,
  [ROUTES.USERS]: Users,
  [ROUTES.BLOGS]: FileText,
  [ROUTES.EDUCATION]: GraduationCap,
  [ROUTES.ADS]: Megaphone,
  [ROUTES.ORDERS]: ShoppingBag,
  [ROUTES.PACKAGES]: Package,
  [ROUTES.NOTIFICATIONS]: Bell,
  [ROUTES.REPORTS]: Flag,
  [ROUTES.LEGAL]: Scale,
}

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const logoutStore = useAuthStore((s) => s.logout)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = user?.fullName || 'Haze Admin'
  const displayEmail = user?.email || 'Admin'
  const avatarUrl = typeof user?.userImg === 'string' ? user.userImg : null

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const onLogout = async () => {
    setMenuOpen(false)
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
      <aside className="relative w-64 shrink-0 overflow-hidden rounded-r-3xl border-r border-white/10 shadow-[8px_0_30px_rgba(0,0,0,0.35)]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${bg1})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.58) saturate(0.85)',
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0c1210]/45 to-black/50"
          aria-hidden
        />

        <div className="relative z-10 flex h-full min-h-screen flex-col p-5">
          <div className="mb-8 flex items-center justify-center">
            <img
              src={logo}
              alt="Haze"
              className="h-28 w-auto object-contain drop-shadow-[0_6px_18px_rgba(0,0,0,0.55)]"
            />
          </div>

          <nav className="space-y-1 flex-1 overflow-y-auto pr-1">
            {NAV_ITEMS.map((item) => {
              const Icon = ICONS[item.to] || LayoutDashboard
              const active = isActive(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-white/10 text-[#39ff14] shadow-[0_0_16px_rgba(57,255,20,0.18)]'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      active
                        ? 'text-[#39ff14]'
                        : 'text-white/70 group-hover:text-[#39ff14]'
                    }`}
                  />
                  <span
                    className={`transition-colors ${
                      active ? 'text-[#39ff14]' : 'text-inherit group-hover:text-[#39ff14]'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="relative sticky top-0 z-20 flex min-h-[64px] items-center justify-end overflow-hidden border-b border-white/10 px-6 py-3">
          {/* Rotate tall bg1 so purple→green runs left→right (same look as sidebar) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                width: '100vh',
                height: '100vw',
                minWidth: '100%',
                minHeight: '100%',
                transform: 'translate(-50%, -50%) rotate(-90deg)',
                backgroundImage: `url(${bg1})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(0.58) saturate(0.85)',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-[#0c1210]/45 to-black/50" />
          </div>

          <div className="relative z-10" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-3 rounded-xl border border-white/15 bg-black/25 px-3 py-2 backdrop-blur-sm transition hover:border-[#39ff14]/50"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover border border-white/20"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#39ff14]/15">
                  <Leaf className="h-4 w-4 text-[#39ff14]" />
                </div>
              )}
              <div className="hidden text-left sm:block max-w-[180px]">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-xs text-white/70">{displayEmail}</p>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-white/70 transition ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-full z-30 mt-2 w-56" role="menu">
                <div className="overflow-hidden rounded-xl border border-white/15 bg-[#141c18]/95 shadow-xl backdrop-blur-md">
                  <div className="border-b border-white/10 px-3 py-2.5 sm:hidden">
                    <p className="truncate text-sm font-medium">{displayName}</p>
                    <p className="truncate text-xs text-[var(--haze-muted)]">{displayEmail}</p>
                  </div>
                  <Link
                    to={ROUTES.PROFILE}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-[#39ff14]"
                  >
                    <UserRound className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    to={ROUTES.UPDATE_PASSWORD}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-white/75 hover:bg-white/5 hover:text-[#39ff14]"
                  >
                    <KeyRound className="h-4 w-4" />
                    Update password
                  </Link>
                  <button
                    type="button"
                    onClick={() => void onLogout()}
                    className="flex w-full items-center gap-2.5 border-t border-white/10 px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
