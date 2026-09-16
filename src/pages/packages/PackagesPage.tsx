import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/admin.service'
import { getApiErrorMessage } from '@/services/api'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  PageHeader,
  inputClass,
  textareaClass,
} from '@/components/ui'

const emptyForm = {
  packageName: '',
  description: '',
  price: '',
  durationInDays: '30',
  features: '',
  packageType: 'store' as 'store' | 'ads',
  isActive: true,
}

export default function PackagesPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPackages()
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

  const parseFeatures = (raw: string) =>
    raw
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)

  const save = async () => {
    if (!form.packageName.trim()) {
      toast.error('Package name is required')
      return
    }
    const features = parseFeatures(form.features)
    if (!features.length) {
      toast.error('Add at least one feature (one per line)')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await adminApi.updatePackage(editingId, {
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
      setForm(emptyForm)
      setEditingId(null)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (packageId: string) => {
    if (!window.confirm('Delete this package?')) return
    try {
      await adminApi.deletePackage(packageId)
      toast.success('Package deleted')
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const startEdit = (row: Record<string, unknown>) => {
    setEditingId(String(row._id))
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
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Subscription packages"
        description="Manage store and ads subscription plans."
        actions={<Button onClick={() => void load()}>Refresh</Button>}
      />

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">{editingId ? 'Edit package' : 'Create package'}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Package name">
            <input
              className={inputClass}
              value={form.packageName}
              onChange={(e) => setForm((f) => ({ ...f, packageName: e.target.value }))}
            />
          </Field>
          <Field label="Type">
            <select
              className={inputClass}
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
              className={inputClass}
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </Field>
          <Field label="Duration (days)">
            <input
              className={inputClass}
              type="number"
              value={form.durationInDays}
              onChange={(e) => setForm((f) => ({ ...f, durationInDays: e.target.value }))}
            />
          </Field>
        </div>
        <Field label="Description">
          <input
            className={inputClass}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>
        <Field label="Features (one per line)">
          <textarea
            className={textareaClass}
            value={form.features}
            onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))}
          />
        </Field>
        {editingId ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            Active
          </label>
        ) : null}
        <div className="flex gap-2">
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </Button>
          {editingId ? (
            <Button
              variant="ghost"
              onClick={() => {
                setEditingId(null)
                setForm(emptyForm)
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No packages yet." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card
              key={String(row._id)}
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{String(row.packageName || row.name)}</h3>
                  <Badge tone={row.isActive !== false ? 'ok' : 'neutral'}>
                    {row.isActive !== false ? 'active' : 'inactive'}
                  </Badge>
                  <Badge>{String(row.packageType || 'store')}</Badge>
                </div>
                <p className="text-sm text-[var(--haze-muted)]">
                  {String(row.price)} · {String(row.durationInDays || 30)} days
                </p>
                <p className="text-sm text-[var(--haze-muted)]">{String(row.description || '')}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => startEdit(row)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => void remove(String(row._id))}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
