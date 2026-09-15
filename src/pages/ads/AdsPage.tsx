import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui'

export default function AdsPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPendingAds()
      setRows(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const review = async (id: string, action: 'approve' | 'reject' | 'pause') => {
    try {
      await adminApi.reviewAd(id, action)
      toast.success(`Ad ${action}d`)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title="Ads moderation"
        description="Review business ad campaigns before they go live."
        actions={<Button onClick={() => void load()}>Refresh</Button>}
      />

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No pending ads." />
      ) : (
        <div className="space-y-3">
          {rows.map((ad) => {
            const id = String(ad._id)
            return (
              <Card key={id} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{String(ad.title)}</h3>
                    <Badge tone="warn">{String(ad.placement || 'explore')}</Badge>
                  </div>
                  <p className="text-sm text-[var(--haze-muted)]">
                    Budget: {String(ad.weeklyBudget || 0)} {String(ad.currency || 'USD')} / week
                  </p>
                  <p className="text-sm text-[var(--haze-muted)]">{String(ad.description || '')}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => void review(id, 'approve')}>Approve</Button>
                  <Button variant="secondary" onClick={() => void review(id, 'pause')}>
                    Pause
                  </Button>
                  <Button variant="danger" onClick={() => void review(id, 'reject')}>
                    Reject
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
