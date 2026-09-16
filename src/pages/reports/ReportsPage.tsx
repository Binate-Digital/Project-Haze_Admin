import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui'

export default function ReportsPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.listReports(status === 'all' ? undefined : status)
      setRows(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const review = async (
    id: string,
    next: 'reviewed' | 'dismissed',
    blockUser = false,
  ) => {
    try {
      await adminApi.reviewReport(id, { status: next, blockUser })
      toast.success(blockUser ? 'Reviewed and user blocked' : `Report ${next}`)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Review user/post reports from chat and explore."
        actions={
          <>
            <select
              className="rounded-xl border border-[var(--haze-border)] bg-[var(--haze-bg)] px-3 py-2 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">pending</option>
              <option value="reviewed">reviewed</option>
              <option value="dismissed">dismissed</option>
              <option value="all">all</option>
            </select>
            <Button onClick={() => void load()}>Refresh</Button>
          </>
        }
      />

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No reports." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const id = String(row._id)
            const reporter = row.reporterId as Record<string, unknown> | undefined
            const reported = row.reportedUserId as Record<string, unknown> | undefined
            return (
              <Card key={id} className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="warn">{String(row.status)}</Badge>
                  <Badge>{String(row.targetType || 'user')}</Badge>
                </div>
                <p className="text-sm font-medium">{String(row.reason)}</p>
                {row.details ? (
                  <p className="text-sm text-[var(--haze-muted)]">{String(row.details)}</p>
                ) : null}
                <p className="text-xs text-[var(--haze-muted)]">
                  Reporter: {String(reporter?.email || reporter?.fullName || '—')} · Reported:{' '}
                  {String(reported?.email || reported?.fullName || '—')}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => void review(id, 'reviewed')}>Mark reviewed</Button>
                  <Button variant="danger" onClick={() => void review(id, 'reviewed', true)}>
                    Review + block user
                  </Button>
                  <Button variant="ghost" onClick={() => void review(id, 'dismissed')}>
                    Dismiss
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
