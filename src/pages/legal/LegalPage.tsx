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

const TYPES = ['terms_conditions', 'privacy_policy'] as const

export default function LegalPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [type, setType] = useState<(typeof TYPES)[number]>('terms_conditions')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getLegalContent()
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

  const resetForm = () => {
    setEditingId(null)
    setType('terms_conditions')
    setTitle('')
    setContent('')
  }

  const save = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required')
      return
    }
    setSaving(true)
    try {
      if (editingId) {
        await adminApi.updateLegalContent({
          id: editingId,
          title: title.trim(),
          type,
          content: content.trim(),
        })
        toast.success('Legal content updated')
      } else {
        await adminApi.createLegalContent({
          type,
          title: title.trim(),
          content: content.trim(),
        })
        toast.success('Legal content created')
      }
      resetForm()
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('Delete this legal document?')) return
    try {
      await adminApi.deleteLegalContent(id)
      toast.success('Deleted')
      if (editingId === id) resetForm()
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  const fillFrom = (row: Record<string, unknown>) => {
    setEditingId(String(row._id))
    setType(
      row.type === 'privacy_policy' ? 'privacy_policy' : 'terms_conditions',
    )
    setTitle(String(row.title || ''))
    setContent(String(row.content || ''))
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Legal content"
        description="Manage terms & conditions and privacy policy."
        actions={<Button onClick={() => void load()}>Refresh</Button>}
      />

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">
          {editingId ? 'Update document' : 'Create document'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Type">
            <select
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value as (typeof TYPES)[number])}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Title">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
        <Field label="Content">
          <textarea
            className={textareaClass}
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </Field>
        <div className="flex gap-2">
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
          </Button>
          {editingId ? (
            <Button variant="ghost" onClick={resetForm}>
              Cancel
            </Button>
          ) : null}
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState message="No legal documents yet." />
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card
              key={String(row._id)}
              className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{String(row.title)}</h3>
                  <Badge>{String(row.type)}</Badge>
                </div>
                <p className="mt-2 line-clamp-3 text-sm text-[var(--haze-muted)]">
                  {String(row.content || '')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => fillFrom(row)}>
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
