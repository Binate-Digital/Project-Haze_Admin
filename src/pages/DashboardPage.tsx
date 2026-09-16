import { useEffect, useState } from 'react'
import { Building2, FileText, Megaphone, GraduationCap } from 'lucide-react'
import { api, getApiErrorMessage } from '@/services/api'
import { useAuthStore } from '@/store/auth.store'
import type { ApiEnvelope } from '@/types/auth'
import { toast } from 'sonner'

type StatCard = {
  label: string
  value: string | number
  hint: string
  icon: typeof Building2
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [pendingBusinesses, setPendingBusinesses] = useState<number | null>(null)
  const [pendingBlogs, setPendingBlogs] = useState<number | null>(null)
  const [pendingAds, setPendingAds] = useState<number | null>(null)
  const [pendingContributions, setPendingContributions] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [biz, blogs, ads, contrib] = await Promise.allSettled([
          api.get<ApiEnvelope<unknown[]>>('/admin/get-pending-businesses'),
          api.get<ApiEnvelope<unknown[]>>('/admin/blogs/pending'),
          api.get<ApiEnvelope<unknown[]>>('/admin/ads/pending'),
          api.get<ApiEnvelope<unknown[]>>('/admin/education/contributions/pending'),
        ])

        if (!alive) return

        if (biz.status === 'fulfilled' && biz.value.data.status) {
          const list = biz.value.data.data
          setPendingBusinesses(Array.isArray(list) ? list.length : 0)
        }
        if (blogs.status === 'fulfilled' && blogs.value.data.status) {
          const list = blogs.value.data.data
          setPendingBlogs(Array.isArray(list) ? list.length : 0)
        }
        if (ads.status === 'fulfilled' && ads.value.data.status) {
          const list = ads.value.data.data
          setPendingAds(Array.isArray(list) ? list.length : 0)
        }
        if (contrib.status === 'fulfilled' && contrib.value.data.status) {
          const list = contrib.value.data.data
          setPendingContributions(Array.isArray(list) ? list.length : 0)
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Could not load dashboard stats'))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const cards: StatCard[] = [
    {
      label: 'Pending businesses',
      value: pendingBusinesses ?? '—',
      hint: 'Awaiting verification',
      icon: Building2,
    },
    {
      label: 'Pending blogs',
      value: pendingBlogs ?? '—',
      hint: 'Need approval',
      icon: FileText,
    },
    {
      label: 'Pending ads',
      value: pendingAds ?? '—',
      hint: 'Campaign review',
      icon: Megaphone,
    },
    {
      label: 'Education contributions',
      value: pendingContributions ?? '—',
      hint: 'Business submissions',
      icon: GraduationCap,
    },
  ]

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-[var(--haze-muted)]">
          Welcome{user?.fullName ? `, ${user.fullName}` : user?.email ? `, ${user.email}` : ''}.
          Here&apos;s what needs attention.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading overview…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.label}
                className="rounded-2xl border border-[var(--haze-border)] bg-[var(--haze-panel)] p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[var(--haze-muted)]">{card.label}</p>
                    <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                    <p className="mt-1 text-xs text-[var(--haze-muted)]">{card.hint}</p>
                  </div>
                  <div className="rounded-xl bg-[var(--haze-accent)]/15 p-2">
                    <Icon className="h-5 w-5 text-[var(--haze-accent)]" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
