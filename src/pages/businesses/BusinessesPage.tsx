import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, Card, EmptyState, PageHeader } from '@/components/ui'

function businessUserIdOf(row: Record<string, unknown>) {
  const user = row.businessUserId as { _id?: string } | string | undefined
  if (typeof user === 'string') return user
  if (user?._id) return user._id
  return ''
}

export default function BusinessesPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPendingBusinesses()
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

  const approve = async (businessUserId: string) => {
    try {
      await adminApi.approveBusiness(businessUserId)
      toast.success('Business approved')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const reject = async (businessUserId: string) => {
    const reason = window.prompt('Rejection reason') || ''
    if (!reason.trim()) return
    try {
      await adminApi.rejectBusiness(businessUserId, reason.trim())
      toast.success('Business rejected')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title="Business verification"
        description="Review pending store registrations and documents."
        actions={<Button onClick={() => void load()}>Refresh</Button>}
      />

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No pending businesses." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => {
            const bizUser = row.businessUserId as Record<string, unknown> | undefined
            const storeId = String(row._id || '')
            const businessUserId = businessUserIdOf(row)
            return (
              <Card
                key={storeId}
                className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{String(row.storeName || 'Untitled store')}</h3>
                    <Badge tone="warn">pending</Badge>
                  </div>
                  <p className="text-sm text-[var(--haze-muted)]">
                    {String(bizUser?.businessName || bizUser?.email || '—')} ·{' '}
                    {String((row.address as { city?: string } | undefined)?.city || 'No city')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/businesses/${storeId}`}>
                    <Button variant="ghost">Details</Button>
                  </Link>
                  <Button
                    disabled={!businessUserId}
                    onClick={() => void approve(businessUserId)}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    disabled={!businessUserId}
                    onClick={() => void reject(businessUserId)}
                  >
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
