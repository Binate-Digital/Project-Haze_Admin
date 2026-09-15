import { Link, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Leaf } from 'lucide-react'
import { toast } from 'sonner'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { getApiErrorMessage } from '@/services/api'

export function AdminLayout() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logoutStore = useAuthStore((s) => s.logout)

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

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-[var(--haze-border)] bg-[var(--haze-panel)] p-5 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 rounded-xl bg-[var(--haze-accent)]/20 flex items-center justify-center">
            <Leaf className="h-5 w-5 text-[var(--haze-accent)]" />
          </div>
          <div>
            <p className="text-sm font-semibold">Haze Admin</p>
            <p className="text-xs text-[var(--haze-muted)]">Project HAZE</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm bg-[var(--haze-accent)]/15 text-[var(--haze-accent)]"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
        </nav>

        <div className="border-t border-[var(--haze-border)] pt-4 mt-4">
          <p className="text-xs text-[var(--haze-muted)] truncate mb-3">
            {user?.email || user?.fullName || 'Admin'}
          </p>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 hover:bg-red-500/10 transition"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
