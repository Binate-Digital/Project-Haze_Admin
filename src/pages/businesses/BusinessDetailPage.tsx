import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, Card, PageHeader } from '@/components/ui'

export default function BusinessDetailPage() {
  const { businessId = '' } = useParams()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const details = await adminApi.getBusinessDetails(businessId)
      setData(details)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId])

  const resolveBusinessUserId = () => {
    if (!data) return ''
    const nested = data.businessUserId as { _id?: string } | string | undefined
    if (typeof nested === 'string') return nested
    if (nested?._id) return nested._id
    const user = data.user as { _id?: string } | undefined
    if (user?._id) return user._id
    return ''
  }

  const approve = async () => {
    const id = resolveBusinessUserId()
    if (!id) {
      toast.error('Business user id missing')
      return
    }
    try {
      await adminApi.approveBusiness(id)
      toast.success('Approved')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const reject = async () => {
    const id = resolveBusinessUserId()
    if (!id) {
      toast.error('Business user id missing')
      return
    }
    const reason = window.prompt('Rejection reason') || ''
    if (!reason.trim()) return
    try {
      await adminApi.rejectBusiness(id, reason.trim())
      toast.success('Rejected')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  if (loading) return <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
  if (!data) return <p className="text-sm text-red-300">Business not found.</p>

  const store = (data.store || data) as Record<string, unknown>
  const user = (data.user || data.businessUserId || {}) as Record<string, unknown>

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={String(store.storeName || 'Business details')}
        description="Review legal documents and registration details."
        actions={
          <>
            <Link to="/businesses">
              <Button variant="ghost">Back</Button>
            </Link>
            <Button onClick={() => void approve()}>Approve</Button>
            <Button variant="danger" onClick={() => void reject()}>
              Reject
            </Button>
          </>
        }
      />

      <Card className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge tone="warn">{String(store.verificationStatus || 'unknown')}</Badge>
          <span className="text-sm text-[var(--haze-muted)]">
            {String(user.email || user.businessName || user.fullName || '')}
          </span>
        </div>
        <p className="text-sm whitespace-pre-wrap">{String(store.description || 'No description')}</p>
        <pre className="overflow-auto rounded-xl bg-black/30 p-3 text-xs text-[var(--haze-muted)]">
          {JSON.stringify(
            {
              address: store.address,
              documents: {
                retailLicenseImg: store.retailLicenseImg,
                businessRegistrationCertificate: store.businessRegistrationCertificate,
                permit: store.permit,
                anyOtherRequiredQualifications: store.anyOtherRequiredQualifications,
              },
              subscriptionStatus: store.subscriptionStatus,
            },
            null,
            2,
          )}
        </pre>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            'retailLicenseImg',
            'businessRegistrationCertificate',
            'permit',
            'anyOtherRequiredQualifications',
          ]
            .map((key) => {
              const url = store[key]
              if (!url || typeof url !== 'string') return null
              return (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-[var(--haze-border)] px-3 py-2 text-sm text-[var(--haze-accent)] hover:bg-white/5"
                >
                  Open {key}
                </a>
              )
            })
            .filter(Boolean)}
        </div>
      </Card>
    </div>
  )
}
