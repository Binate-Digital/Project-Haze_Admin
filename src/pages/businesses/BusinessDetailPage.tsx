import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Badge, Button, Card, MediaPreviewCard, PageHeader } from '@/components/ui'

const DOC_FIELDS = [
  { key: 'retailLicenseImg', label: 'Retail license' },
  { key: 'businessRegistrationCertificate', label: 'Business registration' },
  { key: 'permit', label: 'Permit' },
  { key: 'anyOtherRequiredQualifications', label: 'Other qualifications' },
] as const

function formatAddress(address: unknown) {
  if (!address || typeof address !== 'object') return null
  const a = address as Record<string, unknown>
  const parts = [
    a.streetAddress,
    a.aptSuite || a.apartmentSuiteFloor,
    a.floor,
    a.city,
    a.state,
    a.zipCode,
  ]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
  return parts.length ? parts.join(', ') : null
}

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
  const addressText = formatAddress(store.address)
  const documents = DOC_FIELDS.map((doc) => ({
    ...doc,
    url: typeof store[doc.key] === 'string' ? String(store[doc.key]) : '',
  })).filter((doc) => doc.url)

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title={String(store.storeName || 'Business details')}
        description="Review store info and uploaded documents."
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

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warn">{String(store.verificationStatus || 'unknown')}</Badge>
          <span className="text-sm text-[var(--haze-muted)]">
            {String(user.email || user.businessName || user.fullName || '')}
          </span>
        </div>

        <p className="text-sm whitespace-pre-wrap">
          {String(store.description || 'No description')}
        </p>

        <div className="grid gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-xl border border-[var(--haze-border)] px-3 py-2.5">
            <p className="text-xs text-[var(--haze-muted)]">Address</p>
            <p className="mt-1">{addressText || 'Not provided'}</p>
          </div>
          <div className="rounded-xl border border-[var(--haze-border)] px-3 py-2.5">
            <p className="text-xs text-[var(--haze-muted)]">Subscription</p>
            <p className="mt-1 capitalize">{String(store.subscriptionStatus || 'none')}</p>
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">Documents</h2>
        {documents.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--haze-muted)]">No documents uploaded.</p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {documents.map((doc) => (
              <MediaPreviewCard key={doc.key} label={doc.label} url={doc.url} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
