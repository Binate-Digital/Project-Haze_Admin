import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, Field, PageHeader, fieldClass, textareaFieldClass } from '@/components/ui'
import { ROUTES } from '@/config'

const emptyForm = {
  title: '',
  description: '',
  pointsRequired: '100',
  discountType: 'fixed' as 'fixed' | 'percent',
  discountValue: '10',
  minOrderAmount: '0',
  maxDiscountAmount: '',
  isActive: true,
  startsAt: '',
  expiresAt: '',
  usageLimitPerUser: '1',
  usageLimit: '',
}

function toLocalInput(value: unknown): string {
  if (!value) return ''
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function LoyaltyCouponFormPage() {
  const { couponId } = useParams()
  const isEdit = Boolean(couponId)
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [errors, setErrors] = useState<{
    title?: string
    pointsRequired?: string
    discountValue?: string
  }>({})

  useEffect(() => {
    if (!couponId) return
    let alive = true
    ;(async () => {
      try {
        const list = await adminApi.listLoyaltyCoupons()
        const row = (Array.isArray(list) ? list : []).find((c) => String(c._id) === couponId)
        if (!row) {
          toast.error('Coupon not found')
          navigate(ROUTES.LOYALTY_COUPONS)
          return
        }
        if (!alive) return
        setForm({
          title: String(row.title || ''),
          description: String(row.description || ''),
          pointsRequired: String(row.pointsRequired ?? 100),
          discountType: row.discountType === 'percent' ? 'percent' : 'fixed',
          discountValue: String(row.discountValue ?? 0),
          minOrderAmount: String(row.minOrderAmount ?? 0),
          maxDiscountAmount:
            row.maxDiscountAmount != null ? String(row.maxDiscountAmount) : '',
          isActive: Boolean(row.isActive !== false),
          startsAt: toLocalInput(row.startsAt),
          expiresAt: toLocalInput(row.expiresAt),
          usageLimitPerUser: String(row.usageLimitPerUser ?? 1),
          usageLimit: row.usageLimit != null ? String(row.usageLimit) : '',
        })
      } catch (error) {
        toast.error(getApiErrorMessage(error))
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [couponId, navigate])

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const save = async () => {
    const next: typeof errors = {}
    if (!form.title.trim()) next.title = 'Title is required'
    const pointsRequired = Number(form.pointsRequired)
    const discountValue = Number(form.discountValue)
    if (!Number.isFinite(pointsRequired) || pointsRequired < 1) {
      next.pointsRequired = 'Points required must be at least 1'
    }
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      next.discountValue = 'Discount value is invalid'
    }
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields')
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      pointsRequired,
      discountType: form.discountType,
      discountValue,
      minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscountAmount: form.maxDiscountAmount.trim()
        ? Number(form.maxDiscountAmount)
        : null,
      isActive: form.isActive,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      usageLimitPerUser: Number(form.usageLimitPerUser) || 1,
      usageLimit: form.usageLimit.trim() ? Number(form.usageLimit) : null,
    }

    setSaving(true)
    try {
      if (isEdit && couponId) {
        await adminApi.updateLoyaltyCoupon(couponId, payload)
        toast.success('Coupon updated')
      } else {
        await adminApi.createLoyaltyCoupon(payload)
        toast.success('Coupon created')
      }
      navigate(ROUTES.LOYALTY_COUPONS)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-[var(--haze-muted)]">Loading…</p>

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title={isEdit ? 'Edit loyalty coupon' : 'Create loyalty coupon'}
        actions={
          <Link to={ROUTES.LOYALTY_COUPONS}>
            <Button variant="ghost">Back</Button>
          </Link>
        }
      />
      <Card className="space-y-4">
        <Field label="Title" error={errors.title}>
          <input
            className={fieldClass(Boolean(errors.title))}
            value={form.title}
            onChange={(e) => {
              set('title', e.target.value)
              if (errors.title) setErrors((p) => ({ ...p, title: undefined }))
            }}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={textareaFieldClass()}
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Points required" error={errors.pointsRequired}>
            <input
              className={fieldClass(Boolean(errors.pointsRequired))}
              type="number"
              min={1}
              value={form.pointsRequired}
              onChange={(e) => {
                set('pointsRequired', e.target.value)
                if (errors.pointsRequired) setErrors((p) => ({ ...p, pointsRequired: undefined }))
              }}
            />
          </Field>
          <Field label="Discount type">
            <select
              className={fieldClass()}
              value={form.discountType}
              onChange={(e) => set('discountType', e.target.value as 'fixed' | 'percent')}
            >
              <option value="fixed">Fixed ($)</option>
              <option value="percent">Percent (%)</option>
            </select>
          </Field>
          <Field label="Discount value" error={errors.discountValue}>
            <input
              className={fieldClass(Boolean(errors.discountValue))}
              type="number"
              min={0}
              step={0.01}
              value={form.discountValue}
              onChange={(e) => {
                set('discountValue', e.target.value)
                if (errors.discountValue) setErrors((p) => ({ ...p, discountValue: undefined }))
              }}
            />
          </Field>
          <Field label="Min order amount ($)">
            <input
              className={fieldClass()}
              type="number"
              min={0}
              step={0.01}
              value={form.minOrderAmount}
              onChange={(e) => set('minOrderAmount', e.target.value)}
            />
          </Field>
          <Field label="Max discount ($, optional)">
            <input
              className={fieldClass()}
              type="number"
              min={0}
              step={0.01}
              value={form.maxDiscountAmount}
              onChange={(e) => set('maxDiscountAmount', e.target.value)}
              placeholder="Leave empty for no cap"
            />
          </Field>
          <Field label="Usage limit per user">
            <input
              className={fieldClass()}
              type="number"
              min={1}
              value={form.usageLimitPerUser}
              onChange={(e) => set('usageLimitPerUser', e.target.value)}
            />
          </Field>
          <Field label="Global usage limit (optional)">
            <input
              className={fieldClass()}
              type="number"
              min={1}
              value={form.usageLimit}
              onChange={(e) => set('usageLimit', e.target.value)}
              placeholder="Unlimited if empty"
            />
          </Field>
          <Field label="Active">
            <select
              className={fieldClass()}
              value={form.isActive ? 'yes' : 'no'}
              onChange={(e) => set('isActive', e.target.value === 'yes')}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </Field>
          <Field label="Starts at (optional)">
            <input
              className={fieldClass()}
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => set('startsAt', e.target.value)}
            />
          </Field>
          <Field label="Expires at (optional)">
            <input
              className={fieldClass()}
              type="datetime-local"
              value={form.expiresAt}
              onChange={(e) => set('expiresAt', e.target.value)}
            />
          </Field>
        </div>
        <Button disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : isEdit ? 'Update' : 'Create'}
        </Button>
      </Card>
    </div>
  )
}
