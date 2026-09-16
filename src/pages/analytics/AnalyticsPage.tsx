import { useEffect, useState } from 'react'
import {
  Building2,
  DollarSign,
  FileWarning,
  GraduationCap,
  Megaphone,
  ShoppingBag,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Card, PageHeader } from '@/components/ui'

export default function AnalyticsPage() {
  const [data, setData] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const overview = await adminApi.getAnalyticsOverview()
        if (alive) setData(overview)
      } catch (error) {
        toast.error(getApiErrorMessage(error))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const cards = [
    { label: 'Users', value: data?.users, icon: Users },
    { label: 'Businesses', value: data?.businesses, icon: Building2 },
    { label: 'Orders', value: data?.orders, icon: ShoppingBag },
    { label: 'Completed orders', value: data?.completedOrders, icon: ShoppingBag },
    { label: 'Revenue (paid)', value: data?.revenue != null ? `$${data.revenue}` : undefined, icon: DollarSign },
    { label: 'Pending businesses', value: data?.pendingBusinesses, icon: Building2 },
    { label: 'Pending blogs', value: data?.pendingBlogs, icon: FileWarning },
    { label: 'Pending ads', value: data?.pendingAds, icon: Megaphone },
    { label: 'Pending reports', value: data?.pendingReports, icon: FileWarning },
    { label: 'Pending contributions', value: data?.pendingContributions, icon: GraduationCap },
  ]

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Analytics"
        description="Platform overview for users, orders, revenue, and moderation queues."
      />

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading analytics…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-[var(--haze-muted)]">{card.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{card.value ?? '—'}</p>
                </div>
                <div className="rounded-xl bg-[var(--haze-accent)]/15 p-2">
                  <Icon className="h-5 w-5 text-[var(--haze-accent)]" />
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
