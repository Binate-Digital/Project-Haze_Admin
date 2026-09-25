import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import { Button, Card, Field, PageHeader, fieldClass, textareaFieldClass } from '@/components/ui'
import { ROUTES } from '@/config'

const emptyForm = {
  packageName: '',
  description: '',
  price: '',
  durationInDays: '30',
  features: '',
  packageType: 'store' as 'store' | 'ads',
  isActive: true,
}

export default function PackageFormPage() {
  const { packageId } = useParams()
  const isEdit = Boolean(packageId)
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [errors, setErrors] = useState<{ packageName?: string; features?: string }>({})

  useEffect(() => {
    if (!packageId) return
    let alive = true
    ;(async () => {
      try {
        const list = await adminApi.getPackages()
        const row = (Array.isArray(list) ? list : []).find((p) => String(p._id) === packageId)
        if (!row) {
          toast.error('Package not found')
          navigate(ROUTES.PACKAGES)
          return
        }
        if (!alive) return
        const features = Array.isArray(row.features) ? row.features.map(String) : []
        setForm({
          packageName: String(row.packageName || row.name || ''),
          description: String(row.description || ''),
          price: String(row.price ?? ''),
          durationInDays: String(row.durationInDays ?? 30),
          features: features.join('\n'),
          packageType: row.packageType === 'ads' ? 'ads' : 'store',
          isActive: Boolean(row.isActive !== false),
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
  }, [packageId, navigate])

  const save = async () => {
    const features = form.features
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const next: typeof errors = {}
    if (!form.packageName.trim()) next.packageName = 'Package name is required'
    if (!features.length) next.features = 'Add at least one feature'
    setErrors(next)
    if (Object.keys(next).length) {
      toast.error('Please fix the highlighted fields')
      return
    }

    setSaving(true)
    try {
      if (isEdit && packageId) {
        await adminApi.updatePackage(packageId, {
          packageName: form.packageName.trim(),
          description: form.description.trim(),
          price: Number(form.price) || 0,
          durationInDays: Number(form.durationInDays) || 30,
          features,
          isActive: form.isActive,
          packageType: form.packageType,
        })
        toast.success('Package updated')
      } else {
        await adminApi.createPackage({
          packageName: form.packageName.trim(),
          description: form.description.trim(),
          price: Number(form.price) || 0,
          durationInDays: Number(form.durationInDays) || 30,
          features,
          packageType: form.packageType,
        })
        toast.success('Package created')
      }
      navigate(ROUTES.PACKAGES)
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
        title={isEdit ? 'Edit package' : 'Create package'}
        actions={
          <Link to={ROUTES.PACKAGES}>
            <Button variant="ghost">Back</Button>
          </Link>
        }
      />
      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Package name" error={errors.packageName}>
            <input
              className={fieldClass(Boolean(errors.packageName))}
              value={form.packageName}
              onChange={(e) => {
                setForm((f) => ({ ...f, packageName: e.target.value }))
                if (errors.packageName) setErrors((p) => ({ ...p, packageName: undefined }))
              }}
            />
          </Field>
          <Field label="Type">
            <select
              className={fieldClass()}
              value={form.packageType}
              onChange={(e) =>
                setForm((f) => ({ ...f, packageType: e.target.value as 'store' | 'ads' }))
              }
            >
              <option value="store">store</option>
              <option value="ads">ads</option>
            </select>
          </Field>
          <Field label="Price">
            <input
              className={fieldClass()}
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </Field>
          <Field label="Duration (days)">
            <input
              className={fieldClass()}
              type="number"
              value={form.durationInDays}
              onChange={(e) => setForm((f) => ({ ...f, durationInDays: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Description">
          <input
            className={fieldClass()}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>
        <Field label="Features (one per line)" error={errors.features}>
          <textarea
            className={textareaFieldClass(Boolean(errors.features))}
            value={form.features}
            onChange={(e) => {
              setForm((f) => ({ ...f, features: e.target.value }))
              if (errors.features) setErrors((p) => ({ ...p, features: undefined }))
            }}
          />
        </Field>
        {isEdit ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Active
          </label>
        ) : null}
        <Button disabled={saving} onClick={() => void save()}>
          {saving ? 'Saving…' : isEdit ? 'Update package' : 'Create package'}
        </Button>
      </Card>
    </div>
  )
}
