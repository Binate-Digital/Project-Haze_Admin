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

export default function EducationPage() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [topic, setTopic] = useState('')
  const [lessonsJson, setLessonsJson] = useState(
    '[{"order":1,"name":"Intro","content":"Welcome lesson"}]',
  )
  const [cover, setCover] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPendingContributions()
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

  const createCourse = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const form = new FormData()
      form.append('title', title.trim())
      form.append('description', description)
      form.append('topic', topic)
      form.append('isPublished', 'true')
      form.append('isTrending', 'false')
      form.append('lessons', lessonsJson)
      if (cover) form.append('cover', cover)
      await adminApi.createCourse(form)
      toast.success('Course published')
      setTitle('')
      setDescription('')
      setTopic('')
      setCover(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  const review = async (id: string, action: 'approve' | 'reject') => {
    try {
      await adminApi.reviewContribution(id, action)
      toast.success(`Contribution ${action}d`)
      await load()
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Education CMS"
        description="TRD 3.4 — publish courses and review business contributions."
        actions={<Button onClick={() => void load()}>Refresh</Button>}
      />

      <Card className="space-y-4">
        <h2 className="text-lg font-medium">Create course</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Topic">
            <input className={inputClass} value={topic} onChange={(e) => setTopic(e.target.value)} />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            className={textareaClass}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Lessons JSON">
          <textarea
            className={textareaClass}
            value={lessonsJson}
            onChange={(e) => setLessonsJson(e.target.value)}
          />
        </Field>
        <Field label="Cover image">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] || null)}
          />
        </Field>
        <Button disabled={saving} onClick={() => void createCourse()}>
          {saving ? 'Publishing…' : 'Publish course'}
        </Button>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-medium">Pending contributions</h2>
        {loading ? (
          <p className="text-sm text-[var(--haze-muted)]">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState message="No pending contributions." />
        ) : (
          <div className="space-y-3">
            {rows.map((row) => {
              const id = String(row._id)
              const biz = row.businessUserId as Record<string, unknown> | undefined
              return (
                <Card key={id} className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{String(row.title)}</h3>
                      <Badge tone="warn">{String(row.type)}</Badge>
                    </div>
                    <p className="text-sm text-[var(--haze-muted)]">
                      {String(biz?.businessName || biz?.email || '')} — {String(row.description || '')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => void review(id, 'approve')}>Approve</Button>
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
    </div>
  )
}
