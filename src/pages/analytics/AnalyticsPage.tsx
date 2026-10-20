import { useEffect, useState } from 'react'
import {
  Building2,
  DollarSign,
  FileWarning,
  GraduationCap,
  Megaphone,
  ShoppingBag,
  Users,
  IdCard,
} from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Card, PageHeader, inputClass, Button } from '@/components/ui'

type Overview = Record<string, number>
type Finance = {
  periodDays?: number
  totals?: {
    gmv?: number
    platformCommission?: number
    paidOrders?: number
    stockRequestRevenue?: number
    stockRequestsPaid?: number
  }
  revenueByDay?: { date: string; revenue: number; commission: number; orders: number }[]
  orderStatusBreakdown?: { status: string; count: number }[]
  pendingIdVerifications?: number
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Overview | null>(null)
  const [finance, setFinance] = useState<Finance | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [overview, fin] = await Promise.all([
        adminApi.getAnalyticsOverview(),
        adminApi.getFinanceReport(days),
      ])
      setData(overview)
      setFinance(fin as Finance)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  const cards = [
    { label: 'Users', value: data?.users, icon: Users },
    { label: 'Businesses', value: data?.businesses, icon: Building2 },
    { label: 'Orders', value: data?.orders, icon: ShoppingBag },
    { label: 'Completed orders', value: data?.completedOrders, icon: ShoppingBag },
    {
      label: 'Revenue (paid)',
      value: data?.revenue != null ? `$${Number(data.revenue).toFixed(2)}` : undefined,
      icon: DollarSign,
    },
    { label: 'Pending businesses', value: data?.pendingBusinesses, icon: Building2 },
    { label: 'Pending blogs', value: data?.pendingBlogs, icon: FileWarning },
    { label: 'Pending ads', value: data?.pendingAds, icon: Megaphone },
    { label: 'Pending reports', value: data?.pendingReports, icon: FileWarning },
    { label: 'Pending contributions', value: data?.pendingContributions, icon: GraduationCap },
    {
      label: 'Pending ID checks',
      value: finance?.pendingIdVerifications,
      icon: IdCard,
    },
  ]

  const totals = finance?.totals

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        title="Analytics"
        description="Platform overview, GMV, commission, and order finance."
        actions={
          <div className="flex items-center gap-2">
            <select
              className={inputClass}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
            <Button type="button" variant="secondary" onClick={() => void load()}>
              Refresh
            </Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading analytics…</p>
      ) : (
        <>
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

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <p className="text-sm text-[var(--haze-muted)]">GMV (all time paid)</p>
              <p className="mt-2 text-2xl font-semibold">
                ${Number(totals?.gmv || 0).toFixed(2)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-[var(--haze-muted)]">Platform commission</p>
              <p className="mt-2 text-2xl font-semibold">
                ${Number(totals?.platformCommission || 0).toFixed(2)}
              </p>
            </Card>
            <Card>
              <p className="text-sm text-[var(--haze-muted)]">Paid orders</p>
              <p className="mt-2 text-2xl font-semibold">{totals?.paidOrders ?? 0}</p>
            </Card>
            <Card>
              <p className="text-sm text-[var(--haze-muted)]">Stock B2B revenue</p>
              <p className="mt-2 text-2xl font-semibold">
                ${Number(totals?.stockRequestRevenue || 0).toFixed(2)}
              </p>
            </Card>
          </div>

          <Card>
            <h2 className="text-lg font-semibold">Revenue by day (last {days}d)</h2>
            <div className="mt-4 max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--haze-muted)]">
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Orders</th>
                    <th className="pb-2">Revenue</th>
                    <th className="pb-2">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {(finance?.revenueByDay || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-2 text-[var(--haze-muted)]">
                        No paid orders in this period
                      </td>
                    </tr>
                  ) : (
                    (finance?.revenueByDay || []).map((r) => (
                      <tr key={r.date} className="border-t border-white/5">
                        <td className="py-2">{r.date}</td>
                        <td className="py-2">{r.orders}</td>
                        <td className="py-2">${Number(r.revenue).toFixed(2)}</td>
                        <td className="py-2">${Number(r.commission).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
